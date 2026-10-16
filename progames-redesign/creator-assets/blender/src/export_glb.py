"""
Pure-python GLB writer for the Double Strike model (preview / fallback path).
The production path is build_double_strike_blend.py inside Blender, which uses the same
geometry (double_strike_model.py) and materials (materials.py).

usage: python3 export_glb.py <out.glb> <textures_dir>
"""
import json, struct, sys, os, math
import numpy as np
import importlib
import materials as _materials
MODEL = 'double_strike_model'
MATERIALS = _materials.MATERIALS


def pad4(b, fill=b'\x00'):
    return b + fill * ((4 - len(b) % 4) % 4)


class GLB:
    def __init__(self):
        self.bin = bytearray()
        self.j = dict(asset=dict(version='2.0', generator='PRO GAMES creator pipeline (meshlib)'),
                      scene=0, scenes=[dict(name='DoubleStrike', nodes=[0])], nodes=[], meshes=[], materials=[],
                      accessors=[], bufferViews=[], buffers=[], textures=[], images=[], samplers=[])
        self.ext_used = set()
        self.tex_cache = {}

    def view(self, data, target=None):
        off = len(self.bin)
        self.bin += pad4(bytes(data))
        bv = dict(buffer=0, byteOffset=off, byteLength=len(data))
        if target: bv['target'] = target
        self.j['bufferViews'].append(bv)
        return len(self.j['bufferViews']) - 1

    def accessor(self, arr, ctype, typ, target=None, minmax=False):
        arr = np.ascontiguousarray(arr)
        bv = self.view(arr.tobytes(), target)
        a = dict(bufferView=bv, componentType=ctype, count=int(arr.shape[0]), type=typ)
        if minmax:
            a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        self.j['accessors'].append(a)
        return len(self.j['accessors']) - 1

    def texture(self, path, repeat=False):
        key = (path, repeat)
        if key in self.tex_cache:
            return self.tex_cache[key]
        data = open(path, 'rb').read()
        mime = 'image/webp' if path.endswith('.webp') else ('image/jpeg' if path.endswith('.jpg') else 'image/png')
        if mime == 'image/png':  # ship PNG data maps as WebP (same as the Blender exporter does)
            import io
            from PIL import Image
            im = Image.open(io.BytesIO(data)); buf = io.BytesIO()
            im.convert('RGBA' if im.mode in ('RGBA', 'LA') else 'RGB').save(buf, 'WEBP', quality=90, method=6)
            data, mime = buf.getvalue(), 'image/webp'
        bv = self.view(data)
        self.j['images'].append(dict(bufferView=bv, mimeType=mime, name=os.path.basename(path).rsplit('.', 1)[0]))
        img = len(self.j['images']) - 1
        samp = dict(magFilter=9729, minFilter=9987, wrapS=10497 if repeat else 33071, wrapT=10497 if repeat else 33071)
        self.j['samplers'].append(samp)
        t = dict(sampler=len(self.j['samplers']) - 1)
        if mime == 'image/webp':
            t['extensions'] = {'EXT_texture_webp': {'source': img}}
            self.ext_used.add('EXT_texture_webp')
        else:
            t['source'] = img
        self.j['textures'].append(t)
        self.tex_cache[key] = len(self.j['textures']) - 1
        return self.tex_cache[key]


def build(out_path, tex_dir, model=None):
    global MATERIALS
    model = model or MODEL
    mod = importlib.import_module(model)
    MATERIALS = _materials.CHAMPION_MATERIALS if model in ('champion_model', 'boxer_champion_model') else _materials.MATERIALS
    nodes, leds = mod.build_all()
    GROUPS, ZONES = mod.GROUPS, mod.ZONES
    g = GLB()
    mat_index = {}

    def material(name):
        if name in mat_index:
            return mat_index[name]
        d = MATERIALS[name]
        pbr = dict(baseColorFactor=list(d.get('base', [1, 1, 1])) + [d.get('opacity', 1.0)], metallicFactor=d.get('metallic', 0.0),
                   roughnessFactor=d.get('roughness', 0.5))
        m = dict(name=name, pbrMetallicRoughness=pbr)
        ext = {}
        rep = name in ('DIAMOND_PLATE', 'BOXING_BAG_RED', 'BOXING_BAG_BLACK', 'LEATHER_BLACK') or 'uv_scale' in d
        xf = {'KHR_texture_transform': dict(scale=[d['uv_scale'], d['uv_scale']])} if 'uv_scale' in d else None
        if xf: g.ext_used.add('KHR_texture_transform')
        def tp(p):
            sub = 'champion' if '/champion/' in p else ''
            return os.path.join(tex_dir, sub, os.path.basename(p))
        if 'base_tex' in d:
            pbr['baseColorTexture'] = dict(index=g.texture(tp(d['base_tex']), rep))
        if 'roughness_tex' in d:
            pbr['metallicRoughnessTexture'] = dict(index=g.texture(tp(d['roughness_tex']), rep))
        if 'normal' in d:
            m['normalTexture'] = dict(index=g.texture(tp(d['normal']), rep), scale=d.get('normal_scale', 1.0))
            if xf: m['normalTexture']['extensions'] = xf
        if 'emissive' in d:
            m['emissiveFactor'] = d['emissive']
            if 'emissive_tex' in d:
                m['emissiveTexture'] = dict(index=g.texture(tp(d['emissive_tex']), rep))
            if d.get('emissive_strength', 1.0) != 1.0:
                ext['KHR_materials_emissive_strength'] = dict(emissiveStrength=d['emissive_strength'])
        if d.get('clearcoat'):
            ext['KHR_materials_clearcoat'] = dict(clearcoatFactor=d['clearcoat'], clearcoatRoughnessFactor=d.get('clearcoat_roughness', 0.05))
        if d.get('alpha') == 'BLEND':
            m['alphaMode'] = 'BLEND'
        if ext:
            m['extensions'] = ext
            g.ext_used.update(ext.keys())
        g.j['materials'].append(m)
        mat_index[name] = len(g.j['materials']) - 1
        return mat_index[name]

    root_name = getattr(mod, 'ROOT_NAME', 'DoubleStrike')
    g.j['scenes'][0]['name'] = root_name
    root = dict(name=root_name, children=[], extras=dict(
        product='boxer-champion' if 'champion' in model else model.replace('_model', '').replace('_', '-'), units='m', height_m=2.19,
        params={k: (v[0] if not isinstance(v[0], tuple) else list(v[0]), v[1]) for k, v in getattr(mod, 'PARAMS', {}).items()},
        zones={k: dict(v) for k, v in ZONES.items()},
        led_groups={k: v.count for k, v in leds.items()}))
    g.j['nodes'].append(root)
    group_idx = {}
    for gname in GROUPS:
        g.j['nodes'].append(dict(name=gname, children=[]))
        group_idx[gname] = len(g.j['nodes']) - 1
        root['children'].append(group_idx[gname])
    stats = {}
    total_tris = 0
    for (name, parent, mesh) in nodes:
        prims_data, _ = mesh.finalize()
        prims = []
        tris = 0
        is_led = name.startswith('led_')
        for mname, p in prims_data.items():
            attrs = dict(POSITION=g.accessor(p['positions'], 5126, 'VEC3', 34962, True),
                         NORMAL=g.accessor(p['normals'], 5126, 'VEC3', 34962),
                         TEXCOORD_0=g.accessor(p['uvs'], 5126, 'VEC2', 34962))
            if is_led:
                attrs['COLOR_0'] = g.accessor(p['colors'], 5126, 'VEC3', 34962)
                attrs['_LED'] = g.accessor(p['leds'], 5126, 'SCALAR', 34962)
            idx = p['indices']
            ctype = 5123 if idx.max() < 65535 else 5125
            ia = g.accessor(idx.astype(np.uint16 if ctype == 5123 else np.uint32), ctype, 'SCALAR', 34963)
            prims.append(dict(attributes=attrs, indices=ia, material=material(mname)))
            tris += len(idx) // 3
        g.j['meshes'].append(dict(name=name, primitives=prims))
        nd = dict(name=name, mesh=len(g.j['meshes']) - 1)
        meta = getattr(mod, 'META', {}).get(name)
        if meta:
            nd['extras'] = dict(source_ids=meta[0], confidence=meta[1], measurement_status=meta[2], detail_id=meta[3])
        g.j['nodes'].append(nd)
        g.j['nodes'][group_idx[parent]]['children'].append(len(g.j['nodes']) - 1)
        stats[name] = tris
        total_tris += tris
    if g.ext_used:
        g.j['extensionsUsed'] = sorted(g.ext_used)
    for k in ('textures', 'images', 'samplers'):
        if not g.j[k]:
            del g.j[k]
    g.j['buffers'] = [dict(byteLength=len(g.bin))]
    js = pad4(json.dumps(g.j, separators=(',', ':')).encode(), b' ')
    binb = pad4(bytes(g.bin))
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binb), 0x004E4942) + binb
    open(out_path, 'wb').write(out)
    return stats, total_tris


if __name__ == '__main__':
    stats, total = build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    for k, v in stats.items():
        print(f'{k:28s} {v:7d}')
    print('TOTAL triangles', total, 'size', os.path.getsize(sys.argv[1]))
