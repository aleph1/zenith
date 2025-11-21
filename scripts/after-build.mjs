//import fs from 'fs';
//import { minify } from 'terser';
//import { compress } from 'brotli';
//
//// MINIFY
//const source = fs.readFileSync('./dist/zenith.js', 'utf8');
//const result = await minify(source, {});
//
//// SAVE MINIFIED CODE
//fs.writeFileSync('./dist/zenith.min.js', result.code, {
//  encoding: 'utf8'
//});
//
//// BROTLIFY CODE
//const brotlified = compress(Buffer.from(result.code, 'utf-8'), {
//  mode: 1,
//  quality: 11, // 0 - 11
//  lgwin: 20 // window size
//});
//
//// SAVE BROTLIFIED CODE
//fs.writeFileSync('./dist/zenith.min.js.br', brotlified, {
//  encoding: 'binary'
//});