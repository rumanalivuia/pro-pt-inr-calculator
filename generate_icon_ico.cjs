// Generates build/icon.ico from build/icon.png by embedding the PNG
// directly (ICO format supports PNG-compressed entries for 256x256+).
// Requires a 512x512 source PNG — the build/icon.png is exactly that.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'build', 'icon.png');
const dst = path.join(__dirname, 'build', 'icon.ico');

const png = fs.readFileSync(src);

// ICO header
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // count: 1 image

// ICONDIRENTRY (16 bytes)
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);        // width (0 means 256)
entry.writeUInt8(0, 1);        // height (0 means 256)
entry.writeUInt8(0, 2);        // color count
entry.writeUInt8(0, 3);        // reserved
entry.writeUInt16LE(1, 4);     // planes
entry.writeUInt16LE(32, 6);    // bit count
entry.writeUInt32LE(png.length, 8); // bytes in resource
entry.writeUInt32LE(22, 12);   // offset of image data

fs.writeFileSync(dst, Buffer.concat([header, entry, png]));
console.log(`Wrote ${dst} (${fs.statSync(dst).size} bytes) from ${src}`);
