"""
PBR material library for the Double Strike model.  Shared by the Blender builder and the
pure-python GLB writer so both produce identical material names / parameters.
Colours are linear-light floats converted from sRGB hex.
"""


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


TEX = '../textures/'

MATERIALS = {
    # car-paint like lacquer: base + glossy clear coat
    'BODY_PAINT': dict(base=srgb('#0052d6'), metallic=0.0, roughness=0.36, clearcoat=1.0, clearcoat_roughness=0.045, specular=0.5,
                       normal=TEX + 'paint_finish_normal.png', normal_scale=0.18, uv_scale=5.0),
    'BLACK_PLASTIC': dict(base=srgb('#0c0c0e'), metallic=0.0, roughness=0.5, specular=0.5,
                          normal=TEX + 'plastic_grain_normal.png', normal_scale=0.35, uv_scale=6.0),
    'RUBBER': dict(base=srgb('#121214'), metallic=0.0, roughness=0.62, clearcoat=0.4, clearcoat_roughness=0.25),
    'METAL': dict(base=srgb('#d6d8dc'), metallic=1.0, roughness=0.22),
    'DIAMOND_PLATE': dict(base=srgb('#aeb2b8'), metallic=1.0, roughness=1.0, normal=TEX + 'diamond_plate_normal.png',
                          roughness_tex=TEX + 'diamond_plate_orm.png', normal_scale=1.0,
                          emissive=[1, 1, 1], emissive_tex=TEX + 'diamond_plate_glow.webp', emissive_strength=1.0),
    'BOXING_BAG_RED': dict(base=srgb('#a8111a'), metallic=0.0, roughness=1.0, clearcoat=0.3, clearcoat_roughness=0.35,
                           normal=TEX + 'bag_leather_normal.png', normal_scale=0.9, roughness_tex=TEX + 'bag_leather_orm.png'),
    'BOXING_BAG_BLACK': dict(base=srgb('#121212'), metallic=0.0, roughness=1.0, clearcoat=0.3, clearcoat_roughness=0.35,
                             normal=TEX + 'bag_leather_normal.png', normal_scale=0.9, roughness_tex=TEX + 'bag_leather_orm.png'),
    'LEATHER_BLACK': dict(base=srgb('#101010'), metallic=0.0, roughness=0.45, clearcoat=0.25, clearcoat_roughness=0.35,
                          normal=TEX + 'leather_normal.png', normal_scale=0.8),
    'BALL': dict(base=[1, 1, 1], metallic=0.0, roughness=1.0, clearcoat=0.25, clearcoat_roughness=0.3,
                 base_tex=TEX + 'kicker_ball_basecolor.webp', normal=TEX + 'kicker_ball_normal.png', normal_scale=1.0,
                 roughness_tex=TEX + 'kicker_ball_orm.png'),
    'SCREEN': dict(base=srgb('#0b0101'), metallic=0.0, roughness=0.08, emissive=[1, 1, 1], emissive_tex=TEX + 'screen_digits.webp',
                   emissive_strength=2.2),
    'LED_RGB': dict(base=[1, 1, 1], metallic=0.0, roughness=0.25, emissive=[1, 1, 1], emissive_strength=1.6, vertex_color=True),
    'LED_WHITE': dict(base=[1, 1, 1], metallic=0.0, roughness=0.25, emissive=[1, 1, 1], emissive_strength=2.0),
    'LED_STRIP': dict(base=[1, 1, 1], metallic=0.0, roughness=0.3, emissive=[1, 1, 1], emissive_strength=1.6,
                      base_tex=TEX + 'led_strip_rgb.webp', emissive_tex=TEX + 'led_strip_rgb.webp'),
    'DECALS': dict(base=[1, 1, 1], metallic=0.0, roughness=0.32, clearcoat=0.6, clearcoat_roughness=0.12,
                   base_tex=TEX + 'decals_atlas.webp', alpha='BLEND'),
    # customer-replaceable graphics zones (factory artwork by default)
    'GFX_TOP_FRONT': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_top_front.webp', alpha='BLEND'),
    'GFX_SCORE': dict(base=[1, 1, 1], roughness=0.28, clearcoat=0.9, clearcoat_roughness=0.06, base_tex=TEX + 'zone_score.webp', alpha='BLEND'),
    'GFX_LEFT': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_side.webp', alpha='BLEND'),
    'GFX_RIGHT': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_side.webp', alpha='BLEND'),
    'GFX_LOWER_FRONT': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_lower_front.webp', alpha='BLEND'),
    'GFX_KICKER': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_kicker.webp', alpha='BLEND'),
    'GFX_TOP_SIDE': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_top_side.webp', alpha='BLEND'),
    'GFX_BACK': dict(base=[1, 1, 1], roughness=0.3, clearcoat=0.8, clearcoat_roughness=0.08, base_tex=TEX + 'zone_back.webp', alpha='BLEND'),
}


# ---------------------------------------------------------------- Boxer Champion
_CH = TEX + 'champion/'
CHAMPION_MATERIALS = {k: dict(v) for k, v in MATERIALS.items() if k in (
    'BLACK_PLASTIC', 'RUBBER', 'METAL', 'DIAMOND_PLATE', 'BOXING_BAG_RED', 'BOXING_BAG_BLACK', 'LEATHER_BLACK',
    'SCREEN', 'LED_RGB', 'LED_WHITE')}
CHAMPION_MATERIALS['BODY_PAINT'] = dict(base=srgb('#c40d1a'), metallic=0.0, roughness=0.34, clearcoat=1.0, clearcoat_roughness=0.04, specular=0.5,
                                        normal=TEX + 'paint_finish_normal.png', normal_scale=0.18, uv_scale=5.0)
CHAMPION_MATERIALS['DIAMOND_PLATE'] = dict(base=srgb('#b4b8be'), metallic=1.0, roughness=1.0, normal=_CH + 'tread_plate_normal.png', normal_scale=1.0,
                                          roughness_tex=_CH + 'tread_plate_orm.png')
CHAMPION_MATERIALS['BLACK_STEEL'] = dict(base=srgb('#0d0e10'), metallic=0.2, roughness=0.5, clearcoat=0.25, clearcoat_roughness=0.4, specular=0.5,
                                         normal=TEX + 'plastic_grain_normal.png', normal_scale=0.3, uv_scale=8.0)   # powder coat
CHAMPION_MATERIALS['LEATHER_BLACK'] = dict(MATERIALS['LEATHER_BLACK'], normal_scale=0.25, roughness=0.5)
CHAMPION_MATERIALS['GLASS'] = dict(base=srgb('#20242a'), metallic=0.0, roughness=0.03, alpha='BLEND', opacity=0.06, specular=0.5)
CHAMPION_MATERIALS['GAP_DARK'] = dict(base=srgb('#050506'), metallic=0.0, roughness=0.8)
CHAMPION_MATERIALS['CAVITY_DARK'] = dict(base=srgb('#060607'), metallic=0.0, roughness=0.9)
CHAMPION_MATERIALS['START_GLOW'] = dict(base=srgb('#ffd27a'), metallic=0.0, roughness=0.3, emissive=[1.0, 0.78, 0.38], emissive_strength=1.4)
CHAMPION_MATERIALS['BUTTON_RED'] = dict(base=srgb('#d21a1a'), metallic=0.0, roughness=0.35, clearcoat=0.5, clearcoat_roughness=0.15)
CHAMPION_MATERIALS['TYRE_GREY'] = dict(base=srgb('#6d7075'), metallic=0.0, roughness=0.6, specular=0.4)
CHAMPION_MATERIALS['SCREEN'] = dict(MATERIALS['SCREEN'], emissive_tex=_CH + 'champion_screen_digits.webp')
CHAMPION_MATERIALS['DECALS'] = dict(base=[1, 1, 1], metallic=0.0, roughness=0.3, clearcoat=0.6, clearcoat_roughness=0.1,
                                    base_tex=_CH + 'champion_atlas.webp', alpha='BLEND')
for _k, _f in (('GFX_FRONT', 'champion_zone_front.webp'), ('GFX_BAND', 'champion_zone_band.webp'),
               ('GFX_LEFT', 'champion_zone_left.webp'), ('GFX_RIGHT', 'champion_zone_right.webp')):
    CHAMPION_MATERIALS[_k] = dict(base=[1, 1, 1], roughness=0.26, clearcoat=0.9, clearcoat_roughness=0.06,
                                  base_tex=_CH + _f, alpha='BLEND')

# ---------------------------------------------------------------- Ultimate Monster 3in1
_MO = TEX + 'monster/'
MONSTER_MATERIALS = {k: dict(v) for k, v in CHAMPION_MATERIALS.items() if k in (
    'BODY_PAINT', 'BLACK_PLASTIC', 'BLACK_STEEL', 'RUBBER', 'METAL', 'DIAMOND_PLATE', 'BOXING_BAG_RED', 'BOXING_BAG_BLACK',
    'LEATHER_BLACK', 'GLASS', 'CAVITY_DARK', 'LED_WHITE')}
MONSTER_MATERIALS['BODY_PAINT'] = dict(CHAMPION_MATERIALS['BODY_PAINT'], base=srgb('#c8101c'))
MONSTER_MATERIALS['LEATHER_BLACK'] = dict(MATERIALS['LEATHER_BLACK'], normal_scale=0.5, roughness=0.5)
MONSTER_MATERIALS['MONITOR'] = dict(base=srgb('#050607'), metallic=0.0, roughness=0.06, clearcoat=1.0, clearcoat_roughness=0.02, specular=0.6)
MONSTER_MATERIALS['LAMP_DOME'] = dict(base=srgb('#f3f2ee'), metallic=0.0, roughness=0.22, clearcoat=0.8, clearcoat_roughness=0.08,
                                      emissive=[1.0, 0.98, 0.94], emissive_strength=0.18)
MONSTER_MATERIALS['LAMP_BASE'] = dict(base=srgb('#e9e8e4'), metallic=0.0, roughness=0.42, specular=0.5)
MONSTER_MATERIALS['HAMMER_RED'] = dict(base=srgb('#d0121c'), metallic=0.0, roughness=0.3, clearcoat=0.7, clearcoat_roughness=0.18,
                                       normal=TEX + 'plastic_grain_normal.png', normal_scale=0.25, uv_scale=4.0)
MONSTER_MATERIALS['PAD_RUBBER'] = dict(base=srgb('#16171a'), metallic=0.0, roughness=0.55, clearcoat=0.25, clearcoat_roughness=0.35,
                                       normal=TEX + 'plastic_grain_normal.png', normal_scale=0.6, uv_scale=3.0)
MONSTER_MATERIALS['GRIP_BLACK'] = dict(base=srgb('#0b0b0c'), metallic=0.0, roughness=0.7, normal=TEX + 'plastic_grain_normal.png', normal_scale=0.8, uv_scale=10.0)
MONSTER_MATERIALS['BALL_BLACK'] = dict(base=srgb('#111112'), metallic=0.0, roughness=0.5, clearcoat=0.35, clearcoat_roughness=0.3,
                                       normal=TEX + 'leather_normal.png', normal_scale=0.6, uv_scale=3.0)
MONSTER_MATERIALS['BALL_WHITE'] = dict(base=srgb('#e8e6e0'), metallic=0.0, roughness=0.5, clearcoat=0.35, clearcoat_roughness=0.3,
                                       normal=TEX + 'leather_normal.png', normal_scale=0.6, uv_scale=3.0)
MONSTER_MATERIALS['ROLLER_WHITE'] = dict(base=srgb('#ecebe7'), metallic=0.0, roughness=0.35)
MONSTER_MATERIALS['TYRE_YELLOW'] = dict(base=srgb('#e3a812'), metallic=0.0, roughness=0.45)
MONSTER_MATERIALS['METER'] = dict(base=[1, 1, 1], metallic=0.0, roughness=0.35, base_tex=_MO + 'monster_meter.webp')
MONSTER_MATERIALS['DECALS'] = dict(base=[1, 1, 1], metallic=0.0, roughness=0.28, clearcoat=0.7, clearcoat_roughness=0.08,
                                   base_tex=_MO + 'monster_atlas.webp', alpha='BLEND')
for _k, _f in (('GFX_FRONT', 'front'), ('GFX_BAND', 'band'), ('GFX_LEFT', 'left'), ('GFX_RIGHT', 'right'), ('GFX_TOWER', 'tower')):
    MONSTER_MATERIALS[_k] = dict(base=[1, 1, 1], roughness=0.26, clearcoat=0.9, clearcoat_roughness=0.06,
                                 base_tex=_MO + f'monster_zone_{_f}.webp', alpha='BLEND')
