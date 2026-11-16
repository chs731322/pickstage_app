"""로그인·회원가입 화면 위쪽의 핑크 그라데이션 + 물결선 배경 이미지를 만든다.
실행: python3 scripts/make-auth-background.py  →  assets/images/auth-header.png
(색이나 물결을 바꾸고 싶으면 아래 값을 고쳐서 다시 실행한다)
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1170, 900          # 폰 가로폭의 3배 기준
SS = 2                    # 선을 부드럽게 그리려고 2배로 그린 뒤 줄인다

# 배경 그라데이션: 우리 브랜드 핑크를 은은하게 푼 색 (위쪽은 선명한 핑크, 아래로 갈수록 연해진다)
stops = [
    (0.00, (255, 150, 214)),   # 핑크
    (0.50, (255, 196, 232)),   # 연핑크
    (1.00, (255, 238, 247)),   # 거의 흰빛 핑크
]
yy, xx = np.mgrid[0:H, 0:W]
# 대각선 방향(왼쪽 위 → 오른쪽 아래)으로 색이 흐르게 한다
t = np.clip((yy / H) * 0.8 + (xx / W) * 0.2, 0, 1)
img = np.zeros((H, W, 3), dtype=np.float32)
for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
    mask = (t >= t0) & (t <= t1)
    f = ((t - t0) / (t1 - t0))[mask][:, None]
    img[mask] = np.array(c0) * (1 - f) + np.array(c1) * f
base = Image.fromarray(img.astype('uint8')).convert('RGBA')

# 물결선: 같은 모양의 곡선을 조금씩 어긋나게 여러 겹으로 그려 등고선처럼 보이게 한다
lines = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(lines)
rng = np.random.default_rng(7)
for k in range(46):
    y0 = (60 + k * 13) * SS
    amp = (38 + 22 * np.sin(k / 7.0)) * SS
    wave = (520 + 40 * np.cos(k / 5.0)) * SS
    phase = k * 0.16 + 0.6
    pts = []
    for x in range(0, W * SS + 8, 6):
        y = y0 + amp * np.sin(2 * np.pi * x / wave + phase) + 0.35 * amp * np.sin(2 * np.pi * x / (wave * 0.43) + phase * 1.7)
        pts.append((x, y))
    # 번갈아 흰색과 진한 핑크 선, 위쪽일수록 진하게
    fade = max(0.0, 1 - k / 50)
    color = (255, 255, 255, int(130 * fade + 40)) if k % 2 == 0 else (255, 70, 185, int(80 * fade + 25))
    d.line(pts, fill=color, width=2 * SS)
lines = lines.resize((W, H), Image.LANCZOS)

# 아래쪽으로 갈수록 선이 사라지게 (흰 카드 아래로 자연스럽게 이어지도록)
alpha = np.array(lines.split()[3]).astype(np.float32)
fade_out = np.clip(1.0 - (yy / H) ** 1.6, 0, 1)
lines.putalpha(Image.fromarray((alpha * fade_out).astype('uint8')))

out = Image.alpha_composite(base, lines).filter(ImageFilter.GaussianBlur(0.4)).convert('RGB')
out.save('assets/images/auth-header.png', optimize=True)
print('saved', out.size)
