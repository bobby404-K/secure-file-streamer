import assert from 'node:assert';
import crypto from 'crypto';
import test from 'node:test';
import { SecureFileStreamer } from '../dist/chunker.js';

test('SecureFileStreamer splits, encrypts and recovers original data intact', () => {
  const key = crypto.randomBytes(32);
  const rawData = Buffer.from('Testing secure chunking streaming protocol with rolling verification 2025');
  const { manifest, encryptedChunks } = SecureFileStreamer.chunkAndEncrypt(rawData, 16, key);
  const recovered = SecureFileStreamer.decryptAndAssemble(manifest, encryptedChunks, key);

  assert.strictEqual(recovered.toString(), rawData.toString());
});
