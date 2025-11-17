from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
from rembg import remove
import os
from PIL import ImageColor, Image, ImageDraw, ImageFilter, ImageEnhance
import io
import re

app = FastAPI()

# Allow all origins for CORS (for development purposes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories to store uploaded and processed images
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Image Background Remover API"}

def hex_to_rgb_tuple(hex_color):
    """Converts a hex color string to an RGBA tuple (R, G, B, A)."""
    if hex_color.startswith('#'):
        hex_color = hex_color[1:]
    
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])

    rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return rgb + (255,) # Add full opacity

def generate_gradient_image(size, gradient_value):
    """Generates a linear gradient image using PIL."""
    width, height = size
    img = Image.new('RGB', (width, height), color = 'red') # Default to red if parsing fails

    # Attempt to parse gradient_value (e.g., "linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)")
    match = re.match(r'linear-gradient\((\d+)deg,\s*(.+?)\s*\d*%,\s*(.+?)\s*\d*%\)', gradient_value)
    if match:
        angle = int(match.group(1))
        color1_str = match.group(2).strip()
        color2_str = match.group(3).strip()

        try:
            color1 = ImageColor.getrgb(color1_str)
            color2 = ImageColor.getrgb(color2_str)
        except ValueError:
            print(f"Warning: Could not parse gradient colors: {color1_str}, {color2_str}")
            return img # Return default red image

        # Simple linear interpolation for now, ignoring angle for initial implementation
        # This will create a vertical gradient
        for y in range(height):
            r = int(color1[0] + (color2[0] - color1[0]) * y / height)
            g = int(color1[1] + (color2[1] - color1[1]) * y / height)
            b = int(color1[2] + (color2[2] - color1[2]) * y / height)
            for x in range(width):
                img.putpixel((x, y), (r, g, b))
    else:
        print(f"Warning: Could not parse gradient string: {gradient_value}. Returning solid red.")

    return img

def apply_shadow(image: Image.Image, blur: int, offset_x: int, offset_y: int, color: str) -> Image.Image:
    """Applies a drop shadow to an RGBA image."""
    if blur == 0 and offset_x == 0 and offset_y == 0:
        return image # No shadow to apply

    # Create a transparent base image for the shadow
    shadow_base = Image.new('RGBA', image.size, (0, 0, 0, 0))
    
    # Extract the alpha channel of the original image
    alpha = image.split()[-1]
    
    # Create a solid color image for the shadow using the alpha mask
    shadow_color_rgb = ImageColor.getrgb(color)
    shadow_color_rgba = shadow_color_rgb + (255,) # Full opacity for the shadow color itself
    
    shadow_mask = Image.new('RGBA', image.size, shadow_color_rgba)
    shadow_mask.putalpha(alpha) # Apply the alpha of the original image to the shadow color

    # Apply blur
    if blur > 0:
        shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(blur))

    # Create a canvas large enough to hold the image and its shadow
    # Max possible size needed for shadow offset
    max_offset = max(abs(offset_x), abs(offset_y), blur) * 2 # Rough estimate for canvas expansion
    canvas_size = (image.width + max_offset * 2, image.height + max_offset * 2)
    
    # Create a new transparent image for the final output
    shadowed_image = Image.new('RGBA', canvas_size, (0, 0, 0, 0))

    # Calculate paste positions
    # Center the original image on the canvas
    img_paste_x = (canvas_size[0] - image.width) // 2
    img_paste_y = (canvas_size[1] - image.height) // 2

    # Paste the shadow
    shadow_paste_x = img_paste_x + offset_x
    shadow_paste_y = img_paste_y + offset_y
    shadowed_image.paste(shadow_mask, (shadow_paste_x, shadow_paste_y), shadow_mask)

    # Paste the original image on top
    shadowed_image.paste(image, (img_paste_x, img_paste_y), image)

    return shadowed_image

def apply_adjustments(image: Image.Image, brightness: float, contrast: float, saturation: float) -> Image.Image:
    """Applies brightness, contrast, and saturation adjustments to an RGBA image."""
    if brightness == 1.0 and contrast == 1.0 and saturation == 1.0:
        return image # No adjustments needed

    adjusted_image = image
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(adjusted_image)
        adjusted_image = enhancer.enhance(brightness)
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(adjusted_image)
        adjusted_image = enhancer.enhance(contrast)
    if saturation != 1.0:
        enhancer = ImageEnhance.Color(adjusted_image) # ImageEnhance.Color is for saturation
        adjusted_image = enhancer.enhance(saturation)
    
    return adjusted_image


@app.post("/api/remove-background")
async def remove_background_api(
    file: UploadFile = File(...),
    background_type: str = Form('color'),
    background_value: str = Form('transparent'),
    custom_background_image: UploadFile = File(None),
    shadow_blur: int = Form(0),
    shadow_offset_x: int = Form(0),
    shadow_offset_y: int = Form(0),
    shadow_color: str = Form('#000000'),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
    saturation: float = Form(1.0)
):
    # Save the uploaded file
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())

    # Generate a name for the output file
    base_filename = os.path.splitext(os.path.basename(file.filename))[0]
    output_filename = f"{base_filename}_nobg.png"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    
    # Read the input file and remove the background
    with open(input_path, "rb") as i:
        input_data = i.read()
        
        # Remove background to transparent first
        output_data_no_bg = remove(input_data)
        
        # Convert output_data_no_bg to PIL Image
        img_no_bg = Image.open(io.BytesIO(output_data_no_bg)).convert("RGBA")
        
        # Apply shadow if parameters are provided
        if shadow_blur > 0 or shadow_offset_x != 0 or shadow_offset_y != 0:
            img_no_bg = apply_shadow(img_no_bg, shadow_blur, shadow_offset_x, shadow_offset_y, shadow_color)

        # Apply adjustments
        if brightness != 1.0 or contrast != 1.0 or saturation != 1.0:
            img_no_bg = apply_adjustments(img_no_bg, brightness, contrast, saturation)

        final_img = None

        if background_type == 'color' and background_value != 'transparent':
            try:
                rgb_color = ImageColor.getrgb(background_value)
                background_img = Image.new("RGBA", img_no_bg.size, rgb_color + (255,))
                final_img = Image.alpha_composite(background_img, img_no_bg)
            except ValueError:
                print(f"Warning: Invalid background color format received: {background_value}. Falling back to transparent.")
                final_img = img_no_bg # Keep transparent
        elif background_type == 'gradient':
            print(f"Generating gradient background: {background_value}")
            gradient_bg = generate_gradient_image(img_no_bg.size, background_value)
            # Convert gradient_bg to RGBA before compositing
            gradient_bg_rgba = gradient_bg.convert("RGBA")
            final_img = Image.alpha_composite(gradient_bg_rgba, img_no_bg)
        elif background_type == 'image' and custom_background_image:
            try:
                bg_image_data = await custom_background_image.read()
                custom_bg_img = Image.open(io.BytesIO(bg_image_data)).convert("RGBA")
                
                # Resize custom background to match foreground image size
                custom_bg_img = custom_bg_img.resize(img_no_bg.size, Image.LANCZOS)
                
                final_img = Image.alpha_composite(custom_bg_img, img_no_bg)
            except Exception as e:
                print(f"Error processing custom background image: {e}. Falling back to transparent.")
                final_img = img_no_bg # Fallback to transparent
        else: # Default to transparent if no specific background or invalid type
            final_img = img_no_bg

        # Save the final processed image
        with open(output_path, "wb") as o:
            if final_img:
                final_img.save(o, format="PNG")
            else:
                o.write(output_data_no_bg) # Fallback if no final_img was created

    return FileResponse(output_path, media_type="image/png", filename=output_filename)

if __name__ == "__main__":
    print("Starting backend server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
