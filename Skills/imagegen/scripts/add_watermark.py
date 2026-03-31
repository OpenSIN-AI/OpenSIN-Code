import sys
import os
from PIL import Image


def watermark_image(input_path, output_path, logo_path):
    try:
        base_image = Image.open(input_path).convert("RGBA")
        logo = Image.open(logo_path).convert("RGBA")

        logo_width = int(base_image.width * 0.15)
        logo_ratio = logo_width / float(logo.width)
        logo_height = int(float(logo.height) * float(logo_ratio))
        logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

        alpha = logo.split()[3]
        alpha = alpha.point(lambda p: p * 0.7)
        logo.putalpha(alpha)

        transparent = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
        transparent.paste(base_image, (0, 0))

        padding = 20
        position = (
            base_image.width - logo_width - padding,
            base_image.height - logo_height - padding,
        )

        transparent.paste(logo, position, mask=logo)

        if input_path.lower().endswith(".jpg") or input_path.lower().endswith(".jpeg"):
            rgb_image = Image.new("RGB", transparent.size, (255, 255, 255))
            rgb_image.paste(transparent, mask=transparent.split()[3])
            rgb_image.save(output_path, "JPEG", quality=95)
        else:
            transparent.save(output_path, "PNG")

        print(f"Watermarked image saved to {output_path}")
    except Exception as e:
        print(f"Error applying watermark: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python add_watermark.py <input_image> <output_image> <logo_path>")
        sys.exit(1)

    watermark_image(sys.argv[1], sys.argv[2], sys.argv[3])
