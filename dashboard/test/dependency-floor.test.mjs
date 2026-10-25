// Guards against re-introducing the dev-tool versions flagged in HOM-4829.
// Run with: npm test   (uses node:test, no extra packages)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));

// Minimum patched versions from the advisories:
// vite   GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv, GHSA-9jrq-w75r-8gcw,
//        GHSA-r825-w8mm-5pxw, GHSA-rq7h-c2jc-7f22, GHSA-vfpm-58rq-9qcg (fixed in 8.3.3)
// sharp  GHSA-wq5f-xc86-pv6w (fixed in 0.35.5)
// undici GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c (fixed in 7.30.1)
const floors = { vite: '8.3.3', sharp: '0.35.5', undici: '7.30.1' };

function cmp(a, b) {
  const pa = a.split(/[.+-]/).slice(0, 3).map(Number);
  const pb = b.split(/[.+-]/).slice(0, 3).map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

for (const [name, floor] of Object.entries(floors)) {
  test(`every locked copy of ${name} is >= ${floor}`, () => {
    const copies = Object.entries(lock.packages)
      .filter(([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`));
    assert.ok(copies.length > 0, `${name} not found in package-lock.json`);
    for (const [path, meta] of copies) {
      assert.ok(cmp(meta.version, floor) >= 0, `${path} is ${meta.version}, needs >= ${floor}`);
    }
  });
}
