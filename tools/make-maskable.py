from PIL import Image
src = Image.open('icons/icon-512.png').convert('RGBA')
bg = Image.new('RGBA', (512, 512), (158, 43, 22, 255))
inner = src.resize((388, 388), Image.LANCZOS)
bg.paste(inner, (62, 62), inner)
bg.convert('RGB').save('icons/icon-maskable-512.png')
print('ok')
