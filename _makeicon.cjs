const sharp = require('sharp');
const fs = require('fs');

// 背景：橙色渐变
const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffab3d"/><stop offset="1" stop-color="#ff7d12"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
</svg>`;

// 前景：白色锅 + 锅铲（居中，留出自适应图标安全区）
const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g fill="#ffffff">
    <!-- 锅铲：斜靠右侧 -->
    <g transform="rotate(35 640 470)">
      <rect x="626" y="300" width="30" height="210" rx="15"/>
      <rect x="602" y="252" width="78" height="82" rx="22"/>
    </g>
    <!-- 锅盖 -->
    <ellipse cx="470" cy="452" rx="196" ry="44"/>
    <rect x="456" y="398" width="28" height="42" rx="10"/>
    <circle cx="470" cy="392" r="29"/>
    <!-- 锅耳 -->
    <rect x="250" y="486" width="58" height="34" rx="17"/>
    <rect x="632" y="486" width="58" height="34" rx="17"/>
    <!-- 锅体 -->
    <path d="M286 470 L654 470 L636 646 A62 62 0 0 1 574 706 L366 706 A62 62 0 0 1 304 646 Z"/>
  </g>
</svg>`;

(async () => {
  const bgBuf = await sharp(Buffer.from(bg)).resize(1024, 1024).png().toBuffer();
  const fgBuf = await sharp(Buffer.from(fg)).resize(1024, 1024).png().toBuffer();
  await sharp(bgBuf).png().toFile('assets/icon-background.png');
  await sharp(fgBuf).png().toFile('assets/icon-foreground.png');
  const combined = await sharp(bgBuf).composite([{ input: fgBuf }]).png().toBuffer();
  await sharp(combined).toFile('assets/icon-only.png');
  // 预览（缩小）
  await sharp(combined).resize(256, 256).png().toFile('/tmp/icon-preview.png');
  // 圆形预览（模拟桌面圆形遮罩）
  const circle = Buffer.from(`<svg><circle cx="512" cy="512" r="512" fill="#fff"/></svg>`);
  await sharp(combined).composite([{ input: circle, blend: 'dest-in' }]).resize(256,256).png().toFile('/tmp/icon-preview-round.png');
  console.log('生成完成');
})();
