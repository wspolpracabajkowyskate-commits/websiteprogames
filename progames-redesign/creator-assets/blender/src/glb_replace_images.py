"""
glb_replace_images.py - swap embedded images of a GLB in place (no geometry rebuild).

usage: python3 glb_replace_images.py model.glb name=path.webp [name=path.webp ...]
`name` is the glTF image name (e.g. champion_zone_front).  Buffer views are re-packed, everything
else (nodes, materials, accessors) is kept byte for byte.
"""
import sys, json, struct


def read_glb(path):
    b = open(path, 'rb').read()
    magic, ver, total = struct.unpack('<4sII', b[:12])
    assert magic == b'glTF' and ver == 2
    off, chunks = 12, []
    while off < total:
        ln, typ = struct.unpack('<I4s', b[off:off + 8])
        chunks.append((typ, b[off + 8:off + 8 + ln]))
        off += 8 + ln
    js = json.loads(chunks[0][1].decode('utf-8'))
    bin_ = chunks[1][1] if len(chunks) > 1 else b''
    return js, bin_


def write_glb(path, js, bin_):
    j = json.dumps(js, separators=(',', ':')).encode('utf-8')
    j += b' ' * ((4 - len(j) % 4) % 4)
    bin_ += b'\0' * ((4 - len(bin_) % 4) % 4)
    total = 12 + 8 + len(j) + 8 + len(bin_)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<I4s', len(j), b'JSON')); f.write(j)
        f.write(struct.pack('<I4s', len(bin_), b'BIN\0')); f.write(bin_)


def replace(path, repl):
    js, bin_ = read_glb(path)
    names = {im.get('name'): i for i, im in enumerate(js['images'])}
    new_data = {}
    for name, file in repl.items():
        if name not in names:
            sys.exit(f'image {name!r} not in {path}: {sorted(names)}')
        im = js['images'][names[name]]
        new_data[im['bufferView']] = open(file, 'rb').read()
    out = bytearray()
    for i, bv in enumerate(js['bufferViews']):
        data = new_data.get(i)
        if data is None:
            s = bv.get('byteOffset', 0); data = bin_[s:s + bv['byteLength']]
        while len(out) % 4:
            out.append(0)
        bv['byteOffset'] = len(out); bv['byteLength'] = len(data)
        out += data
    js['buffers'][0]['byteLength'] = len(out)
    write_glb(path, js, bytes(out))


if __name__ == '__main__':
    replace(sys.argv[1], dict(a.split('=', 1) for a in sys.argv[2:]))
