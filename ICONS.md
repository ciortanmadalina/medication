# Icon Setup

The current icon files are SVG placeholders. For production, you should replace them with actual PNG images.

## Option 1: Use an Icon Generator

Use a free PWA icon generator like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

Upload a 512x512 PNG image of a pill emoji or medication icon, and it will generate all required sizes.

## Option 2: Convert Emoji to PNG

### Using Windows Paint 3D:
1. Open Paint 3D
2. Create 512x512 canvas
3. Insert the 💊 emoji (large size)
4. Save as `icon-512.png`
5. Resize to 192x192 and save as `icon-192.png`
6. Resize to 72x72 and save as `badge-72.png`

### Using Online Tool:
1. Go to https://emojitopng.com/
2. Select the 💊 emoji
3. Download at sizes: 512px, 192px, 72px
4. Rename files appropriately

## Required Icon Files

- `public/icon-192.png` - 192x192 PNG
- `public/icon-512.png` - 512x512 PNG
- `public/badge-72.png` - 72x72 PNG (for notification badge)

## Current Status

The current SVG files will work for testing but should be replaced with proper PNG files before production deployment.
