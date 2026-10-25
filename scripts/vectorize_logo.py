import cv2, numpy as np, sys
src, out = sys.argv[1], sys.argv[2]
im = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.float32)
b, g, r = im[..., 0], im[..., 1], im[..., 2]
red = np.clip((r - (g + b) / 2) / 200.0, 0, 1)           # 0 = beyaz, 1 = saf kırmızı
S = 8
big = cv2.resize(red, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
big = cv2.GaussianBlur(big, (0, 0), S * 0.6)
mask = (big > 0.5).astype(np.uint8)
# en büyük bileşeni al (kenardaki çöp çizgileri at)
n, lab, st, _ = cv2.connectedComponentsWithStats(mask)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); mask = (lab == k).astype(np.uint8)
ys, xs = np.where(mask); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = 10 * S
mask = np.pad(mask[y0:y1 + 1, x0:x1 + 1], pad)
cv2.imwrite(out + '.mask.png', mask * 255)
cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
h, w = mask.shape
d = []
for c in cnts:
    if cv2.contourArea(c) < (S * S) * 3: continue          # küçük lekeleri at
    pts = c[:, 0, :].astype(np.float32)
    k = 15; n_ = len(pts)
    if n_ > 2 * k:
        ext = np.concatenate([pts[-k:], pts, pts[:k]])
        ker = np.ones(2 * k + 1) / (2 * k + 1)
        pts = np.stack([np.convolve(ext[:, i], ker, 'valid') for i in (0, 1)], 1)
    pts = cv2.approxPolyDP(pts.reshape(-1, 1, 2).astype(np.float32), 0.8, True)[:, 0, :].round(1)
    d.append('M' + ' L'.join(f'{x},{y}' for x, y in pts) + 'Z')
open(out, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="#E00020" fill-rule="evenodd" d="{" ".join(d)}"/></svg>')
print(w, h, len(d))
