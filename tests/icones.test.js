import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { encoderPNG, genererIcone, crc32 } from '../tools/icones.mjs';

function blocs(png) {
  const liste = [];
  for (let i = 8; i < png.length;) {
    const longueur = png.readUInt32BE(i);
    const type = png.toString('ascii', i + 4, i + 8);
    liste.push({
      type,
      donnees: png.subarray(i + 8, i + 8 + longueur),
      crc: png.readUInt32BE(i + 8 + longueur),
      brut: png.subarray(i + 4, i + 8 + longueur),
    });
    i += 12 + longueur;
  }
  return liste;
}

test('crc32 : valeur de référence', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xCBF43926);
});

test('PNG : signature, dimensions IHDR et CRC valides', () => {
  const png = genererIcone(192, 0.15);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const liste = blocs(png);
  assert.deepEqual(liste.map((b) => b.type), ['IHDR', 'IDAT', 'IEND']);
  assert.equal(liste[0].donnees.readUInt32BE(0), 192);
  assert.equal(liste[0].donnees.readUInt32BE(4), 192);
  for (const b of liste) assert.equal(b.crc, crc32(b.brut), `CRC de ${b.type}`);
});

test('PNG : les pixels décompressés correspondent à la fonction fournie', () => {
  const png = encoderPNG(3, 2, (x, y) => [x * 10, y * 20, 7]);
  const brut = inflateSync(blocs(png)[1].donnees);
  assert.equal(brut.length, 2 * (1 + 3 * 3));
  assert.deepEqual([...brut.subarray(1, 4)], [0, 0, 7]);
  assert.deepEqual([...brut.subarray(10 + 1 + 6, 10 + 1 + 9)], [20, 20, 7]);
});

test('icône : fond vert au coin, du blanc dans le dessin', () => {
  const brut = inflateSync(blocs(genererIcone(192, 0.15))[1].donnees);
  assert.deepEqual([...brut.subarray(1, 4)], [0x0B, 0x6E, 0x4F]);
  assert.ok(brut.includes(0xFF));
});
