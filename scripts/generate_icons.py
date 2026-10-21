import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = os.path.join(os.path.dirname(__file__), '..', 'extension', 'public', 'icons')
os.makedirs(icons_dir, exist_ok=True)

sizes = [16, 32, 48, 128]

for size in sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rect or circle in Primary Lagoon (#0E5A64)
    padding = max(1, size // 16)
    radius = size // 4
    draw.rounded_rectangle(
        [(padding, padding), (size - 1 - padding, size - 1 - padding)],
        radius=radius,
        fill=(14, 90, 100, 255),  # #0E5A64
        outline=(0, 65, 73, 255), # #004149
        width=max(1, size // 32)
    )

    # Inner decorative badge / text
    if size >= 32:
        # Subtle inner highlight circle/ring
        draw.ellipse(
            [(padding + 2, padding + 2), (size - 1 - padding - 2, size - 1 - padding - 2)],
            outline=(143, 207, 219, 100), # #8FCFDB with opacity
            width=max(1, size // 32)
        )

    # Try standard system font or draw stylized "FA"
    # For small icons (16, 32, 48, 128) let's draw clean geometric "FA" or form glyph
    # Let's draw an open document / shield glyph
    # Center lines for form paper:
    cx, cy = size / 2, size / 2
    w = size * 0.44
    h = size * 0.52
    left = cx - w / 2
    top = cy - h / 2
    right = cx + w / 2
    bottom = cy + h / 2

    # White document sheet
    doc_r = max(2, int(size * 0.06))
    draw.rounded_rectangle(
        [(left, top), (right, bottom)],
        radius=doc_r,
        fill=(255, 255, 255, 250)
    )

    # 3 lines on the document in Lagoon
    line_x1 = left + w * 0.22
    line_x2 = right - w * 0.22
    line_w = max(1, int(size * 0.05))
    
    # line 1 (header)
    y1 = top + h * 0.26
    draw.line([(line_x1, y1), (right - w * 0.35, y1)], fill=(14, 90, 100, 255), width=line_w)

    # line 2 (field 1)
    y2 = top + h * 0.48
    draw.line([(line_x1, y2), (line_x2, y2)], fill=(74, 91, 102, 230), width=line_w)

    # line 3 (field 2)
    y3 = top + h * 0.70
    draw.line([(line_x1, y3), (line_x2 - w * 0.2, y3)], fill=(74, 91, 102, 230), width=line_w)

    # Marigold badge dot at top right
    dot_r = max(2, int(size * 0.12))
    dot_x = right - dot_r * 0.3
    dot_y = top + dot_r * 0.3
    draw.ellipse(
        [(dot_x - dot_r, dot_y - dot_r), (dot_x + dot_r, dot_y + dot_r)],
        fill=(242, 169, 59, 255), # #F2A93B Marigold
        outline=(255, 255, 255, 255),
        width=max(1, int(size * 0.03))
    )

    out_path = os.path.join(icons_dir, f'icon-{size}.png')
    img.save(out_path, 'PNG')
    print(f'Generated {out_path}')

print('All icons generated successfully!')
