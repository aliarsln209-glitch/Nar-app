const { chromium } = require('playwright'), fs = require('fs')
const svg = fs.readFileSync('brand/nar-logo.svg', 'utf8').replace('<svg ', '<svg width="100%" height="100%" ')
async function render(file, size, { bg = 'transparent', scale = 1, w = size, h = size } = {}) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.setContent(`<body style="margin:0;background:${bg};width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center"><div style="width:${size * scale}px;height:${size * scale}px">${svg}</div></body>`)
  await p.screenshot({ path: file, omitBackground: bg === 'transparent' }); await b.close()
}
;(async () => {
  await render('brand/nar-logo-1024.png', 1024, { scale: 0.9 })
  const dark = '#1a0b0f'
  await render('public/icons/icon-192.png', 192, { bg: dark, scale: 0.72 })
  await render('public/icons/icon-512.png', 512, { bg: dark, scale: 0.72 })
  await render('public/icons/icon-maskable-512.png', 512, { bg: dark, scale: 0.55 })
  await render('public/apple-touch-icon.png', 180, { bg: dark, scale: 0.72 })
  await render('brand/nar-logo-on-white-1024.png', 1024, { bg: '#ffffff', scale: 0.9 })
  await render('src/assets/logo.png', 256, { scale: 0.95 })
  fs.copyFileSync('brand/nar-logo.svg', 'public/favicon.svg')
})()
