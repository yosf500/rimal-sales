#!/usr/bin/env node
// Sanity check for index.html: the encrypted payload must be well-formed and the inline
// app script must compile. Nothing is executed. Usage: node scripts/check.mjs [file]
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const file = process.argv[2] ?? new URL('../index.html', import.meta.url).pathname;
const html = readFileSync(file, 'utf8');
let failed = false;

const payload = html.match(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/);
if (!payload) {
  console.error('✗ payload: <script id="payload"> not found');
  failed = true;
} else {
  // Encrypted blob: base64(salt[16] + iv[12] + AES-GCM ciphertext incl. 16-byte tag).
  const b64 = payload[1].trim();
  const bytes = Buffer.from(b64, 'base64');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || bytes.toString('base64') !== b64) {
    console.error('✗ payload: not valid base64');
    failed = true;
  } else if (bytes.length <= 16 + 12 + 16) {
    console.error(`✗ payload: too short to be salt+iv+ciphertext (${bytes.length} bytes)`);
    failed = true;
  } else {
    console.log(`✓ payload: base64 blob, ${bytes.length} bytes (salt+iv+ciphertext)`);
  }
}

const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!inline.length) {
  console.error('✗ app script: no inline <script> found');
  failed = true;
}
inline.forEach(([, src], i) => {
  try {
    new Script(src, { filename: `${file}#script${i}` });
    console.log(`✓ app script ${i}: compiles (${src.length} chars)`);
  } catch (e) {
    console.error(`✗ app script ${i}: ${e.message}`);
    failed = true;
  }
});

process.exit(failed ? 1 : 0);
