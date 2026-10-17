"""
build_double_strike_blend.py - builds the PRO GAMES Double Strike model inside Blender,
saves the source .blend, renders control views and exports the web GLB.

Run (Blender 3.6 / 4.x):
    blender -b -P build_double_strike_blend.py -- --out /path/to/creator-assets
or from the Blender MCP / Text editor with OUT_DIR set below.

Output:
    <out>/blender/double-strike.blend
    <out>/models/double-strike.glb
    <out>/blender/renders/control_*.png
The geometry comes from double_strike_model.py (parametric reconstruction from the
reference photos), materials from materials.py, textures from <out>/textures.
"""
import sys, os, json, math
import bpy

HERE = os.environ.get('DS_SRC') or (os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd())
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import importlib
import meshlib, double_strike_model, materials
importlib.reload(meshlib); importlib.reload(double_strike_model); importlib.reload(materials)
# which machine to build: DS_MODEL=double_strike_model (default) | champion_model
MODEL_NAME = os.environ.get('DS_MODEL', 'double_strike_model')
_mod = importlib.reload(importlib.import_module(MODEL_NAME))
build_all, GROUPS, ZONES = _mod.build_all, _mod.GROUPS, _mod.ZONES
CHAMP = MODEL_NAME in ('champion_model', 'boxer_champion_model')
MONSTER = MODEL_NAME == 'monster_model'
MATERIALS = materials.CHAMPION_MATERIALS if CHAMP else (materials.MONSTER_MATERIALS if MONSTER else materials.MATERIALS)
SLUG = 'boxer-champion' if CHAMP else ('ultimate-monster' if MONSTER else 'double-strike')
ROOT_NAME = getattr(_mod, 'ROOT_NAME', 'BoxerChampion' if CHAMP else 'DoubleStrike')

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT_DIR = os.environ.get('DS_OUT', os.path.join(HERE, '..'))
RENDER = os.environ.get('DS_RENDER', '1') != '0'
for i, a in enumerate(argv):
    if a == '--out':
        OUT_DIR = argv[i + 1]
    if a == '--no-render':
        RENDER = False
TEX_DIR = os.path.join(OUT_DIR, 'textures')
BLEND_PATH = os.path.join(OUT_DIR, 'blender', SLUG + '.blend')
GLB_PATH = os.path.join(OUT_DIR, 'models', SLUG + '.glb')
os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)
os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
B4 = bpy.app.version >= (4, 0, 0)
B41 = bpy.app.version >= (4, 1, 0)


def to_blender(v):
    # glTF (x, y up, z front) -> Blender (x, -z, y)
    return (v[0], -v[2], v[1])


# ----------------------------------------------------------------------------- scene reset
def reset_scene():
    # clear data without read_factory_settings (keeps add-ons such as Blender MCP running)
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.lights, bpy.data.cameras, bpy.data.worlds):
        for d in list(coll):
            coll.remove(d)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


reset_scene()
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0


# ----------------------------------------------------------------------------- materials
def image(path, non_color=False):
    name = os.path.basename(path)
    img = bpy.data.images.get(name) or bpy.data.images.load(path)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    return img


def set_input(bsdf, names, value):
    for n in names:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = value
            return bsdf.inputs[n]
    return None


def make_material(name, d):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
    if out is None:
        out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
    if bsdf is None:
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
    base = list(d.get('base', [1, 1, 1])) + [1.0]
    set_input(bsdf, ['Base Color'], base)
    set_input(bsdf, ['Metallic'], d.get('metallic', 0.0))
    set_input(bsdf, ['Roughness'], d.get('roughness', 0.5))
    if d.get('clearcoat'):
        set_input(bsdf, ['Coat Weight', 'Clearcoat'], d['clearcoat'])
        set_input(bsdf, ['Coat Roughness', 'Clearcoat Roughness'], d.get('clearcoat_roughness', 0.05))
    tex = lambda p: os.path.join(TEX_DIR, 'champion' if '/champion/' in p else ('monster' if '/monster/' in p else ''), os.path.basename(p))
    x = -600
    mapping = None
    if d.get('uv_scale'):
        tc = nt.nodes.new('ShaderNodeTexCoord'); tc.location = (x - 500, -200)
        mapping = nt.nodes.new('ShaderNodeMapping'); mapping.location = (x - 300, -200)
        mapping.inputs['Scale'].default_value = (d['uv_scale'], d['uv_scale'], 1.0)
        nt.links.new(tc.outputs['UV'], mapping.inputs['Vector'])

    def tiled(node):
        if mapping is not None:
            nt.links.new(mapping.outputs['Vector'], node.inputs['Vector'])
        return node
    if 'base_tex' in d:
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = image(tex(d['base_tex'])); n.location = (x, 300)
        nt.links.new(n.outputs['Color'], bsdf.inputs['Base Color'])
        if d.get('alpha') == 'BLEND':
            nt.links.new(n.outputs['Alpha'], bsdf.inputs['Alpha'])
            if hasattr(m, 'surface_render_method'):
                m.surface_render_method = 'BLENDED'
            if hasattr(m, 'blend_method'):
                try:
                    m.blend_method = 'BLEND'
                except Exception:
                    pass
            if hasattr(m, 'shadow_method'):
                m.shadow_method = 'HASHED'
            m.use_backface_culling = True
    if d.get('opacity', 1.0) < 1.0 and 'base_tex' not in d:
        set_input(bsdf, ['Alpha'], d['opacity'])
        for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            if hasattr(m, attr):
                try:
                    setattr(m, attr, val)
                except Exception:
                    pass
    if 'roughness_tex' in d:
        n = tiled(nt.nodes.new('ShaderNodeTexImage')); n.image = image(tex(d['roughness_tex']), True); n.location = (x, 0)
        sep = nt.nodes.new('ShaderNodeSeparateColor' if B4 or bpy.app.version >= (3, 3, 0) else 'ShaderNodeSeparateRGB'); sep.location = (x + 300, 0)
        nt.links.new(n.outputs['Color'], sep.inputs[0])
        nt.links.new(sep.outputs[1], bsdf.inputs['Roughness'])
        nt.links.new(sep.outputs[2], bsdf.inputs['Metallic'])
    if 'normal' in d:
        n = tiled(nt.nodes.new('ShaderNodeTexImage')); n.image = image(tex(d['normal']), True); n.location = (x, -300)
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.location = (x + 300, -300); nm.inputs['Strength'].default_value = d.get('normal_scale', 1.0)
        nt.links.new(n.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
        if name == 'BODY_PAINT':  # orange peel lives in the clear coat
            cn = bsdf.inputs.get('Coat Normal') or bsdf.inputs.get('Clearcoat Normal')
            if cn is not None:
                nt.links.new(nm.outputs['Normal'], cn)
    if 'emissive' in d:
        emis_in = bsdf.inputs.get('Emission Color') or bsdf.inputs.get('Emission')
        set_input(bsdf, ['Emission Strength'], d.get('emissive_strength', 1.0))
        if 'emissive_tex' in d:
            n = nt.nodes.new('ShaderNodeTexImage'); n.image = image(tex(d['emissive_tex'])); n.location = (x, -600)
            nt.links.new(n.outputs['Color'], emis_in)
        elif d.get('vertex_color'):
            vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; vc.location = (x, -600)
            nt.links.new(vc.outputs['Color'], emis_in)
            nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
        else:
            emis_in.default_value = list(d['emissive']) + [1.0]
    return m


MATS = {name: make_material(name, d) for name, d in MATERIALS.items()}

# ----------------------------------------------------------------------------- objects
nodes, leds = build_all()
root = bpy.data.objects.new(ROOT_NAME, None)
scene.collection.objects.link(root)
root['product'] = SLUG
root['zones'] = json.dumps(ZONES)
root['units'] = 'm'
for k, (v, status) in getattr(_mod, 'PARAMS', {}).items():
    root['param_' + k] = json.dumps({'value': v, 'status': status})
META = getattr(_mod, 'META', {})
coll_main = bpy.data.collections.new(ROOT_NAME); scene.collection.children.link(coll_main)
groups = {}
for gname in GROUPS:
    e = bpy.data.objects.new(gname, None)
    e.parent = root
    coll = bpy.data.collections.new(gname); coll_main.children.link(coll)
    coll.objects.link(e)
    groups[gname] = (e, coll)

stats = {}
for (name, parent, mesh) in nodes:
    _, topo = mesh.finalize()
    verts = [to_blender(v) for v in topo['verts']]
    faces = [tuple(int(i) for i in f) for f in topo['faces']]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    # materials
    for mn in topo['materials']:
        me.materials.append(MATS[mn])
    fm = topo['face_mat']
    for poly in me.polygons:
        poly.material_index = int(fm[poly.index])
        poly.use_smooth = True
    # UVs (glTF v -> Blender v flipped)
    uvl = me.uv_layers.new(name='UVMap')
    luv = topo['loop_uvs'].reshape(-1, 2)
    for li, loop in enumerate(me.loops):
        uvl.data[li].uv = (float(luv[li][0]), 1.0 - float(luv[li][1]))
    # custom split normals
    ln = topo['loop_normals'].reshape(-1, 3)
    if not B41:
        me.use_auto_smooth = True
    me.normals_split_custom_set([to_blender(n) for n in ln])
    if name.startswith('led_') or name in leds:
        col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER') if hasattr(me, 'color_attributes') else me.vertex_colors.new(name='Col')
        lc = topo['loop_colors'].reshape(-1, 3)
        for li in range(len(me.loops)):
            col.data[li].color = (float(lc[li][0]), float(lc[li][1]), float(lc[li][2]), 1.0)
        at = me.attributes.new('_LED', 'FLOAT', 'POINT')
        ll = topo['loop_leds'].reshape(-1)
        for li, loop in enumerate(me.loops):
            at.data[loop.vertex_index].value = float(ll[li])
    me.update()
    ob = bpy.data.objects.new(name, me)
    if name in META:
        src, conf, status, did = META[name]
        ob['source_ids'] = src; ob['confidence'] = conf; ob['measurement_status'] = status; ob['detail_id'] = did
    ob.parent = groups[parent][0]
    groups[parent][1].objects.link(ob)
    stats[name] = len(me.polygons)

# ----------------------------------------------------------------------------- calibrated source cameras
CAL_DIR = os.path.join(HERE, 'calib')
if CHAMP and os.path.isdir(CAL_DIR):
    from mathutils import Matrix
    cc = bpy.data.collections.new('SOURCE_CAMERAS'); coll_main.children.link(cc)
    photo_ids = {'0507': 'F01', '0508': 'F02', '0516': 'F10', '0571': 'F26'}
    for f in sorted(os.listdir(CAL_DIR)):
        if not (f.startswith('ba_') and f.endswith('.json')) or 'model' in f:
            continue
        c = json.load(open(os.path.join(CAL_DIR, f)))
        k = f[3:-5]
        R = Matrix([c['R'][0:3], c['R'][3:6], c['R'][6:9]]); t = c['t']
        # world(glTF) -> cam(OpenCV); camera to world (glTF), then glTF -> Blender axes, OpenCV -> Blender camera axes
        Rt = R.transposed()
        C = -(Rt @ __import__('mathutils').Vector(t))
        G2B = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
        CV2BL = Matrix(((1, 0, 0), (0, -1, 0), (0, 0, -1)))
        rot = G2B @ Rt @ CV2BL
        M = rot.to_4x4(); M.translation = G2B @ C
        cd = bpy.data.cameras.new(f'CAM_{photo_ids.get(k, k)}_IMG_{k}')
        cd.sensor_fit = 'HORIZONTAL'; cd.sensor_width = 36.0
        cd.lens = c['fx'] / c['W'] * 36.0
        co = bpy.data.objects.new(cd.name, cd); co.matrix_world = M
        co['source_photo'] = f'IMG_{k}'; co['resolution'] = f"{c['W']}x{c['H']} (working copy, aspect of the original)"
        cc.objects.link(co)
    unc = bpy.data.collections.new('UNCERTAIN'); coll_main.children.link(unc)
    note = bpy.data.objects.new('NOTE_roof_and_base_underside_not_documented', None); unc.objects.link(note)
    note['info'] = 'Q01: roof surface and base underside are not photographed - crown top and base underside are estimates.'

# ----------------------------------------------------------------------------- studio for control renders
def look_at(obj, target):
    from mathutils import Vector
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

world = bpy.data.worlds.new('Studio'); scene.world = world
world.use_nodes = True
_bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
if _bg is None:
    _bg = world.node_tree.nodes.new('ShaderNodeBackground')
    _wo = next((n for n in world.node_tree.nodes if n.type == 'OUTPUT_WORLD'), None) or world.node_tree.nodes.new('ShaderNodeOutputWorld')
    world.node_tree.links.new(_bg.outputs[0], _wo.inputs['Surface'])
_bg.inputs[0].default_value = (1, 1, 1, 1)
_bg.inputs[1].default_value = 0.45
studio = bpy.data.collections.new('_studio'); scene.collection.children.link(studio)
for nm, loc, energy, size in (('key', (2.6, -3.6, 4.2), 650, 2.5), ('fill', (-3.4, -2.6, 2.4), 180, 3.0), ('rim', (0.5, 3.5, 3.5), 380, 2.0)):
    L = bpy.data.lights.new(nm, 'AREA'); L.energy = energy; L.size = size
    o = bpy.data.objects.new(nm, L); o.location = loc; studio.objects.link(o); look_at(o, (0, 0, 1.1))
floor_me = bpy.data.meshes.new('_floor'); floor_me.from_pydata([(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [], [(0, 1, 2, 3)])
floor = bpy.data.objects.new('_floor', floor_me); studio.objects.link(floor)
fm_ = bpy.data.materials.new('_floor'); fm_.use_nodes = True
_fb = next((n for n in fm_.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
if _fb is None:
    _fb = fm_.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    _fo = next((n for n in fm_.node_tree.nodes if n.type == 'OUTPUT_MATERIAL'), None) or fm_.node_tree.nodes.new('ShaderNodeOutputMaterial')
    fm_.node_tree.links.new(_fb.outputs[0], _fo.inputs['Surface'])
_fb.inputs['Base Color'].default_value = (0.95, 0.95, 0.96, 1)
_fb.inputs['Roughness'].default_value = 0.6
floor_me.materials.append(fm_)
cam_data = bpy.data.cameras.new('_cam'); cam_data.lens = 70
cam = bpy.data.objects.new('_cam', cam_data); studio.objects.link(cam); scene.camera = cam
scene.render.resolution_x = 880; scene.render.resolution_y = 1120
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'CYCLES'):
    try:
        scene.render.engine = eng
        break
    except Exception:
        continue
try:
    scene.view_settings.view_transform = 'AgX' if B4 else 'Filmic'
    scene.view_settings.exposure = -0.35
    scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass

renders = {}
if RENDER:
    rdir = os.path.join(OUT_DIR, 'blender', 'renders'); os.makedirs(rdir, exist_ok=True)
    VIEWS = {'front': ((0, -6.2, 1.2), (0, 0, 1.1)), 'left': ((-6.2, -0.25, 1.3), (0, -0.25, 1.1)),
             'right': ((6.2, -0.25, 1.3), (0, -0.25, 1.1)), 'q34': ((3.4, -5.1, 1.9), (0, -0.15, 1.08)),
             'back': ((0, 6.2, 1.25), (0, 0, 1.1))}
    if CHAMP or MONSTER:
        VIEWS.update({'q34_front_left': ((-3.4, -5.1, 1.9), (0, -0.15, 1.08)), 'q34_back_right': ((3.4, 5.1, 1.9), (0, -0.15, 1.08)),
                      'q34_back_left': ((-3.4, 5.1, 1.9), (0, -0.15, 1.08))})
    only = [v for v in os.environ.get('DS_VIEWS', '').split(',') if v]
    for k, (loc, tgt) in VIEWS.items():
        if only and k not in only:
            continue
        cam.location = loc; look_at(cam, tgt)
        scene.render.filepath = os.path.join(rdir, (f'{SLUG}_' if SLUG != 'double-strike' else '') + f'control_{k}.png')
        bpy.ops.render.render(write_still=True)
        renders[k] = scene.render.filepath

    if (CHAMP or MONSTER) and os.environ.get('DS_ORTHO', '1') != '0':
        # orthographic projections with ONE common scale (2.6 m frame height)
        cam_data.type = 'ORTHO'; cam_data.ortho_scale = 2.6
        scene.render.resolution_x = 1300; scene.render.resolution_y = 1300
        ORTHO = {'front': ((0, -8, 1.1), (0, 0, 1.1)), 'back': ((0, 8, 1.1), (0, 0, 1.1)), 'left': ((-8, -0.35, 1.1), (0, -0.35, 1.1)),
                 'right': ((8, -0.35, 1.1), (0, -0.35, 1.1)), 'top': ((0, -0.35, 9), (0, -0.35, 0))}
        for k, (loc, tgt) in ORTHO.items():
            if only and ('ortho_' + k) not in only:
                continue
            cam.location = loc; look_at(cam, tgt)
            if k == 'top':
                cam.rotation_euler = (0, 0, 0)
            scene.render.filepath = os.path.join(rdir, f'{SLUG}_ortho_{k}.png')
            bpy.ops.render.render(write_still=True)
            renders['ortho_' + k] = scene.render.filepath
        cam_data.type = 'PERSP'

# ----------------------------------------------------------------------------- save + export
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
# export only the machine (not the studio helpers)
for o in bpy.data.objects:
    o.select_set(False)
for o in coll_main.all_objects:
    o.select_set(True)
root.select_set(True)
kw = dict(filepath=GLB_PATH, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
          export_extras=True, export_attributes=True, export_texcoords=True, export_normals=True,
          export_materials='EXPORT', export_cameras=False, export_lights=False, export_animations=False,
          export_image_format='WEBP', export_vertex_color='MATERIAL', export_all_vertex_colors=False,
          export_shared_accessors=True)
allowed = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in allowed})
result = dict(blend=BLEND_PATH, glb=GLB_PATH, glb_bytes=os.path.getsize(GLB_PATH), faces=sum(stats.values()),
              objects=len(stats), renders=renders, blender=bpy.app.version_string)
print(json.dumps(result, indent=1))
