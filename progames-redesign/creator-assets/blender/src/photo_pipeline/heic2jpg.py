"""Minimal HEIC (iPhone grid image) -> JPEG: parse HEIF boxes, decode HEVC tiles with ffmpeg, stitch."""
import struct, sys, os, subprocess, tempfile, glob
import numpy as np
from PIL import Image

def boxes(buf, off, end):
    while off < end:
        size, typ = struct.unpack('>I4s', buf[off:off+8]); hdr = 8
        if size == 1: size = struct.unpack('>Q', buf[off+8:off+16])[0]; hdr = 16
        elif size == 0: size = end - off
        yield typ.decode('latin1'), off + hdr, off + size
        off += size

def full(buf, o): return buf[o], int.from_bytes(buf[o+1:o+4], 'big'), o + 4

def readn(buf, o, n):
    return (int.from_bytes(buf[o:o+n], 'big') if n else 0), o + n

def convert(path, out, maxside=None):
    b = open(path, 'rb').read()
    meta = next((s, e) for t, s, e in boxes(b, 0, len(b)) if t == 'meta')
    ms = meta[0] + 4
    idat = None
    items, iloc, props, assoc, refs, primary = {}, {}, [], {}, {}, None
    for t, s, e in boxes(b, ms, meta[1]):
        if t == 'pitm':
            v, f, o = full(b, s); primary = struct.unpack('>H' if v == 0 else '>I', b[o:o+(2 if v == 0 else 4)])[0]
        elif t == 'iinf':
            v, f, o = full(b, s); o += 2 if v == 0 else 4
            for t2, s2, e2 in boxes(b, o, e):
                v2, f2, o2 = full(b, s2)
                if v2 >= 2:
                    iid = struct.unpack('>H' if v2 == 2 else '>I', b[o2:o2+(2 if v2 == 2 else 4)])[0]; o2 += 2 if v2 == 2 else 4
                    o2 += 2; items[iid] = b[o2:o2+4].decode('latin1')
        elif t == 'iloc':
            v, f, o = full(b, s)
            a = b[o]; c = b[o+1]; o += 2
            osz, lsz, bsz, isz = a >> 4, a & 15, c >> 4, (c & 15 if v in (1, 2) else 0)
            if v < 2: n = struct.unpack('>H', b[o:o+2])[0]; o += 2
            else: n = struct.unpack('>I', b[o:o+4])[0]; o += 4
            for _ in range(n):
                if v < 2: iid = struct.unpack('>H', b[o:o+2])[0]; o += 2
                else: iid = struct.unpack('>I', b[o:o+4])[0]; o += 4
                cm = 0
                if v in (1, 2): cm = b[o+1] & 15; o += 2
                o += 2  # data ref idx
                base, o = readn(b, o, bsz)
                ne = struct.unpack('>H', b[o:o+2])[0]; o += 2
                ext = []
                for _ in range(ne):
                    if v in (1, 2) and isz: _, o = readn(b, o, isz)
                    eo, o = readn(b, o, osz); el, o = readn(b, o, lsz)
                    ext.append((base + eo, el))
                iloc[iid] = (cm, ext)
        elif t == 'idat':
            idat = (s, e)
        elif t == 'iref':
            v, f, o = full(b, s)
            for t2, s2, e2 in boxes(b, o, e):
                w = 2 if v == 0 else 4
                fr = int.from_bytes(b[s2:s2+w], 'big'); n = struct.unpack('>H', b[s2+w:s2+w+2])[0]
                to = [int.from_bytes(b[s2+w+2+i*w:s2+w+2+(i+1)*w], 'big') for i in range(n)]
                refs.setdefault((t2, fr), []).extend(to)
        elif t == 'iprp':
            for t2, s2, e2 in boxes(b, s, e):
                if t2 == 'ipco':
                    props = [(t3, s3, e3) for t3, s3, e3 in boxes(b, s2, e2)]
                elif t2 == 'ipma':
                    v, f, o = full(b, s2); n = struct.unpack('>I', b[o:o+4])[0]; o += 4
                    for _ in range(n):
                        if v < 1: iid = struct.unpack('>H', b[o:o+2])[0]; o += 2
                        else: iid = struct.unpack('>I', b[o:o+4])[0]; o += 4
                        k = b[o]; o += 1; L = []
                        for _ in range(k):
                            if f & 1: x = struct.unpack('>H', b[o:o+2])[0] & 0x7fff; o += 2
                            else: x = b[o] & 0x7f; o += 1
                            L.append(x)
                        assoc[iid] = L
    def data(iid):
        cm, ext = iloc[iid]
        base = idat[0] if cm == 1 else 0
        return b''.join(b[base+o:base+o+l] for o, l in ext)
    def prop(iid, name):
        for x in assoc.get(iid, []):
            if x and props[x-1][0] == name: return props[x-1]
    tiles = refs.get(('dimg', primary), [primary]) if items[primary] == 'grid' else [primary]
    # hvcC -> parameter sets
    _, s, e = prop(tiles[0], 'hvcC')
    h = b[s:e]; lsz = (h[21] & 3) + 1; na = h[22]; o = 23; ps = b''
    for _ in range(na):
        o += 1; nn = struct.unpack('>H', h[o:o+2])[0]; o += 2
        for _ in range(nn):
            l = struct.unpack('>H', h[o:o+2])[0]; o += 2; ps += b'\0\0\0\1' + h[o:o+l]; o += l
    stream = b''
    for t in tiles:
        d = data(t); o = 0; fr = ps
        while o < len(d):
            l = int.from_bytes(d[o:o+lsz], 'big'); o += lsz; fr += b'\0\0\0\1' + d[o:o+l]; o += l
        stream += fr
    tmp = tempfile.mkdtemp()
    open(f'{tmp}/s.hevc', 'wb').write(stream)
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'hevc', '-i', f'{tmp}/s.hevc', '-vsync', '0', f'{tmp}/t%04d.png'], check=True)
    fr = sorted(glob.glob(f'{tmp}/t*.png'))
    if items[primary] == 'grid':
        g = data(primary); flags = g[1]; rows, cols = g[2] + 1, g[3] + 1
        W, H = (struct.unpack('>II', g[4:12]) if flags & 1 else struct.unpack('>HH', g[4:8]))
        t0 = Image.open(fr[0]); tw, th = t0.size
        img = Image.new('RGB', (cols * tw, rows * th))
        for i, f in enumerate(fr[:rows*cols]): img.paste(Image.open(f).convert('RGB'), ((i % cols) * tw, (i // cols) * th))
        img = img.crop((0, 0, W, H))
    else:
        img = Image.open(fr[0]).convert('RGB')
    r = prop(primary, 'irot')
    if r: img = img.rotate(90 * (b[r[1]] & 3), expand=True)
    m = prop(primary, 'imir')
    if m: img = img.transpose(Image.FLIP_TOP_BOTTOM if (b[m[1]] & 1) == 0 else Image.FLIP_LEFT_RIGHT)
    if maxside: img.thumbnail((maxside, maxside), Image.LANCZOS)
    img.save(out, quality=93)
    subprocess.run(['rm', '-rf', tmp])
    return img.size

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.HEIC'))):
        n = os.path.basename(f).split('-')[-1].replace('.HEIC', '')
        print(n, convert(f, f'{dst}/{n}.jpg'))
