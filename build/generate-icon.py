import struct, zlib, sys, os

size = 512
cx, cy, r = size // 2, size // 2, size // 2 - 20

rows = []
for y in range(size):
    row = b'\x00'  # filter byte
    for x in range(size):
        dx, dy = x - cx, y - cy
        dist = (dx * dx + dy * dy) ** 0.5
        if dist < r:
            # Orbit purple accent #6750A4
            row += struct.pack('BBBB', 103, 80, 164, 255)
        elif dist < r + 2:
            # Anti-alias edge
            alpha = max(0, int(255 * (r + 2 - dist) / 2))
            row += struct.pack('BBBB', 103, 80, 164, alpha)
        else:
            row += struct.pack('BBBB', 0, 0, 0, 0)
    rows.append(row)

raw = b''.join(rows)
compressed = zlib.compress(raw)

def chunk(ctype, data):
    c = ctype + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
out = b'\x89PNG\r\n\x1a\n'
out += chunk(b'IHDR', ihdr)
out += chunk(b'IDAT', compressed)
out += chunk(b'IEND', b'')

outpath = os.path.join(os.path.dirname(__file__), 'icon.png')
with open(outpath, 'wb') as f:
    f.write(out)
print(f'Created {outpath} ({len(out)} bytes)')
