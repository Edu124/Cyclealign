// Generates CycleAlign placeholder PNG assets (icon, splash, adaptive, favicon).
// Pure Node (zlib) PNG encoder — no native deps. Draws the brand gradient ring.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS = path.join(__dirname, '..', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

// Brand colors (earthy wellness palette)
const BG = [247, 244, 239]; // #F7F4EF cream
const STOPS = [
  [95, 125, 75], // sage deep   #5F7D4B
  [192, 106, 69], // terracotta #C06A45
  [224, 160, 106], // amber      #E0A06A
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function gradientAt(t) {
  // t in [0,1] across 3 stops
  const seg = t * 2;
  const i = Math.min(1, Math.floor(seg));
  const f = seg - i;
  const c0 = STOPS[i];
  const c1 = STOPS[i + 1];
  return [
    Math.round(lerp(c0[0], c1[0], f)),
    Math.round(lerp(c0[1], c1[1], f)),
    Math.round(lerp(c0[2], c1[2], f)),
  ];
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rest 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(
      raw,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      y * width * 4 + width * 4,
    );
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawIcon(size, { transparentBg = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.3;
  const thickness = size * 0.1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;
      // angle 0..1 starting at top, clockwise
      let ang = Math.atan2(dx, -dy) / (Math.PI * 2);
      if (ang < 0) ang += 1;

      const ringDist = Math.abs(dist - ringR);
      const inRing = ringDist <= thickness / 2;
      // marker blob near the top
      const mx = cx;
      const my = cy - ringR;
      const md = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      const inMarker = md <= thickness * 0.62;

      if (inMarker) {
        rgba[i] = 255;
        rgba[i + 1] = 255;
        rgba[i + 2] = 255;
        rgba[i + 3] = 255;
      } else if (inRing) {
        const edge = 1 - Math.min(1, ringDist / (thickness / 2));
        const c = gradientAt(ang);
        const alpha = Math.round(255 * Math.min(1, edge * 3));
        rgba[i] = c[0];
        rgba[i + 1] = c[1];
        rgba[i + 2] = c[2];
        rgba[i + 3] = alpha < 60 ? 255 : 255;
      } else if (transparentBg) {
        rgba[i + 3] = 0;
      } else {
        rgba[i] = BG[0];
        rgba[i + 1] = BG[1];
        rgba[i + 2] = BG[2];
        rgba[i + 3] = 255;
      }
    }
  }
  return rgba;
}

function write(name, size, opts) {
  const rgba = drawIcon(size, opts);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(ASSETS, name), png);
  console.log('wrote', name, `${size}x${size}`, png.length, 'bytes');
}

write('icon.png', 1024);
write('adaptive-icon.png', 1024, { transparentBg: true });
write('splash.png', 1024);
write('favicon.png', 64);
console.log('done');
