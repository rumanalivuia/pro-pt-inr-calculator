#!/usr/bin/env python3
"""
Generate app icons for PT/INR Calculator Electron app.
Creates 512x512 PNG and ICO with multiple sizes.
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_base_icon(size=512):
    """Create the base icon design."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle with gradient-like effect
    margin = size // 16
    center = size // 2
    radius = center - margin

    # Medical teal gradient background
    bg_color = (0, 119, 255)  # Primary blue
    bg_color_dark = (0, 95, 200)

    # Draw background circle
    draw.ellipse([margin, margin, size - margin, size - margin], fill=bg_color)

    # Add subtle inner glow
    for i in range(3):
        r = radius - i * 2
        alpha = 40 - i * 10
        draw.ellipse([center - r, center - r, center + r, center + r],
                    outline=(255, 255, 255, alpha))

    # Draw ECG/heartbeat line (PT/INR monitoring symbol)
    line_color = (255, 255, 255)
    line_width = max(2, size // 100)

    # ECG waveform points
    points = []
    wave_width = radius * 1.6
    start_x = center - wave_width // 2
    y_center = center

    # Normal baseline segments
    for i in range(int(wave_width)):
        x = start_x + i
        # Create ECG-like pattern
        phase = (i / wave_width) * 4 * 3.14159

        if i < wave_width * 0.2:
            # Baseline
            y = y_center
        elif i < wave_width * 0.35:
            # P wave (small bump)
            t = (i - wave_width * 0.2) / (wave_width * 0.15)
            y = y_center - int(radius * 0.15 * (1 - (2*t - 1)**2))
        elif i < wave_width * 0.45:
            # PR segment
            y = y_center
        elif i < wave_width * 0.55:
            # QRS complex (sharp spike)
            t = (i - wave_width * 0.45) / (wave_width * 0.1)
            if t < 0.2:
                y = y_center + int(radius * 0.1 * t * 5)
            elif t < 0.5:
                y = y_center - int(radius * 0.6 * (1 - (t - 0.2) * 3.33))
            elif t < 0.7:
                y = y_center + int(radius * 0.15 * (t - 0.5) * 5)
            else:
                y = y_center
        elif i < wave_width * 0.7:
            # ST segment
            y = y_center
        elif i < wave_width * 0.85:
            # T wave
            t = (i - wave_width * 0.7) / (wave_width * 0.15)
            y = y_center - int(radius * 0.25 * (1 - (2*t - 1)**2))
        else:
            # Baseline
            y = y_center

        points.append((x, y))

    # Draw the ECG line
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=line_color, width=line_width)

    # Add "PT/INR" text at bottom
    try:
        font_size = size // 7
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "PT/INR"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = center - text_width // 2
    text_y = center + radius // 2 + margin // 2

    # Text shadow
    draw.text((text_x + 2, text_y + 2), text, font=font, fill=(0, 0, 0, 100))
    # Main text
    draw.text((text_x, text_y), text, font=font, fill=line_color)

    # Add small medical cross at top
    cross_size = size // 12
    cross_x = center
    cross_y = center - radius // 2 - cross_size // 2
    cross_color = (255, 255, 255)
    cross_width = max(2, size // 80)

    # Vertical line of cross
    draw.line([(cross_x, cross_y - cross_size//2), (cross_x, cross_y + cross_size//2)],
              fill=cross_color, width=cross_width)
    # Horizontal line of cross
    draw.line([(cross_x - cross_size//2, cross_y), (cross_x + cross_size//2, cross_y)],
              fill=cross_color, width=cross_width)

    return img

def main():
    output_dir = "build"
    os.makedirs(output_dir, exist_ok=True)

    # Generate 512x512 PNG for macOS/Linux
    print("Generating 512x512 PNG...")
    icon_512 = create_base_icon(512)
    icon_512.save(os.path.join(output_dir, "icon.png"), "PNG")
    print(f"Saved: {output_dir}/icon.png")

    # Generate ICO with multiple sizes for Windows
    print("Generating ICO with multiple sizes...")
    sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_images = []
    for size in sizes:
        img = create_base_icon(size)
        ico_images.append(img)

    ico_path = os.path.join(output_dir, "icon.ico")
    # Save all images in the ICO - PIL needs the list of images
    ico_images[0].save(ico_path, format='ICO', append_images=ico_images[1:])
    print(f"Saved: {output_dir}/icon.ico")

    # Also generate a few additional PNG sizes for good measure
    for size in [128, 256]:
        img = create_base_icon(size)
        img.save(os.path.join(output_dir, f"icon-{size}.png"), "PNG")
        print(f"Saved: {output_dir}/icon-{size}.png")

    print("\nAll icons generated successfully!")
    print(f"Files in {output_dir}/:")
    for f in sorted(os.listdir(output_dir)):
        path = os.path.join(output_dir, f)
        print(f"  {f} ({os.path.getsize(path)} bytes)")

if __name__ == "__main__":
    main()