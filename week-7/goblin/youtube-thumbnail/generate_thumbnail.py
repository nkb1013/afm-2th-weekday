import base64
import os
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

API_KEY = os.environ.get("OPENAI_API_KEY", "")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORTRAIT_PATH = os.path.join(BASE_DIR, "한석준", "03_portrait.jpg")
CUTOUT_PATH = os.path.join(BASE_DIR, "한석준", "03_portrait_cutout.png")

REF_DIR = os.path.join(BASE_DIR, "reference")
ref_file = [f for f in os.listdir(REF_DIR) if f.endswith(".png")][0]
REFERENCE_PATH = os.path.join(REF_DIR, ref_file)

BG_PATH = os.path.join(BASE_DIR, "한석준", "thumbnail_bg.png")
OUTPUT_PATH = os.path.join(BASE_DIR, "한석준", "thumbnail_output.png")

FONT_PATH = "/Users/keumbinoh/Library/Fonts/NotoSansCJKkr-Black_1.otf"
FONT_BOLD = "/Users/keumbinoh/Library/Fonts/NotoSansCJKkr-Bold_0.otf"

BG_PROMPT = """Create a YouTube thumbnail BACKGROUND image. Absolutely NO person, face, or human figure.

STYLE REFERENCE: Match the provided reference image's Korean YouTube thumbnail style.

REQUIREMENTS:
- Landscape 16:9 ratio
- Background: Bold gradient from deep navy (#0a1628) to electric blue (#1a4fd4) with dramatic lighting effects, radial light glow, subtle light rays and bokeh
- Do NOT include ANY text at all
- Add subtle decorative elements: faint quotation marks, speech bubble outlines, or geometric shapes as background accents
- A warm radial glow on the right side (where a person will be placed)
- Overall mood: Professional, cinematic, high-contrast, dramatic lighting

CRITICAL:
- NO text, NO letters, NO words, NO characters of any kind
- NO person, face, or human figure
- Pure background/atmosphere only"""


def generate_background():
    cmd = [
        "curl", "-s", "-X", "POST",
        "https://api.openai.com/v1/images/edits",
        "-H", f"Authorization: Bearer {API_KEY}",
        "-F", f"image[]=@{REFERENCE_PATH}",
        "-F", f"prompt={BG_PROMPT}",
        "-F", "model=gpt-image-1",
        "-F", "n=1",
        "-F", "size=1536x1024",
        "-F", "quality=high",
    ]

    print("Step 1: Generating background (no text, no person)...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"Invalid JSON: {result.stdout[:500]}")
        return False

    if "error" in data:
        print(f"API Error: {json.dumps(data['error'], indent=2)}")
        return False

    if "data" in data and len(data["data"]) > 0:
        img_b64 = data["data"][0].get("b64_json")
        if img_b64:
            with open(BG_PATH, "wb") as f:
                f.write(base64.b64decode(img_b64))
            print(f"Background saved: {BG_PATH}")
            return True
    return False


def draw_text_with_outline(draw, pos, text, font, fill, outline_color, outline_width):
    x, y = pos
    # Draw outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
    # Draw main text
    draw.text((x, y), text, font=font, fill=fill)


def composite_thumbnail():
    print("Step 2: Compositing...")

    # Layer 1: Background
    bg = Image.open(BG_PATH).convert("RGBA")
    bg = bg.resize((1920, 1080), Image.LANCZOS)

    # Layer 2: Portrait cutout
    portrait = Image.open(CUTOUT_PATH).convert("RGBA")
    target_h = 1080
    aspect = portrait.width / portrait.height
    target_w = int(target_h * aspect)
    max_w = int(1920 * 0.42)
    if target_w > max_w:
        target_w = max_w
        target_h = int(target_w / aspect)
    portrait = portrait.resize((target_w, target_h), Image.LANCZOS)

    x_pos = 1920 - target_w
    y_pos = 1080 - target_h
    bg.paste(portrait, (x_pos, y_pos), portrait)

    # Layer 3: Text ON TOP of everything (including portrait body)
    font_main = ImageFont.truetype(FONT_PATH, 160)
    font_accent = ImageFont.truetype(FONT_PATH, 180)
    font_label = ImageFont.truetype(FONT_PATH, 48)

    draw = ImageDraw.Draw(bg)

    lines = [
        ("말 잘하는 사람은", font_main, (255, 255, 255)),
        ("절대 이렇게", font_main, (255, 255, 255)),
        ("말 안 합니다", font_accent, (255, 215, 0)),
    ]

    # Position text - big and bold, vertically centered
    start_y = 180
    left_margin = 80
    line_spacing = 30

    current_y = start_y
    for text, font, color in lines:
        draw_text_with_outline(
            draw, (left_margin, current_y), text, font,
            fill=color, outline_color=(0, 0, 0), outline_width=7
        )
        bbox = font.getbbox(text)
        text_h = bbox[3] - bbox[1]
        current_y += text_h + line_spacing

    # Orange accent bar under the yellow text
    bar_y = current_y
    draw.rectangle(
        [(left_margin, bar_y), (left_margin + 450, bar_y + 10)],
        fill=(255, 100, 30)
    )

    # "한석준 아나운서" label
    label_text = "한석준 아나운서"
    draw_text_with_outline(
        draw, (left_margin, current_y + 40), label_text, font_label,
        fill=(255, 255, 255), outline_color=(0, 0, 0), outline_width=4
    )

    # Save
    final = bg.convert("RGB")
    final.save(OUTPUT_PATH, "PNG")
    print(f"Final thumbnail saved: {OUTPUT_PATH}")
    print(f"Size: {final.size[0]}x{final.size[1]}")


if __name__ == "__main__":
    if generate_background():
        composite_thumbnail()
        subprocess.run(["open", OUTPUT_PATH])
    else:
        print("Failed to generate background.")
