import crypto from 'crypto';
import { ChunkMeta, StreamManifest } from './types.js';

export class SecureFileStreamer {
  static chunkAndEncrypt(data: Buffer, chunkSize = 64 * 1024, secretKey: Buffer): { manifest: StreamManifest; encryptedChunks: Buffer[] } {
    const fileId = crypto.randomUUID();
    const chunks: ChunkMeta[] = [];
    const encryptedChunks: Buffer[] = [];
    const overallHasher = crypto.createHash('sha256');
    overallHasher.update(data);

    let offset = 0;
    let index = 0;

    while (offset < data.length) {
      const slice = data.subarray(offset, Math.min(data.length, offset + chunkSize));
      const chunkHash = crypto.createHash('sha256').update(slice).digest('hex');
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(slice), cipher.final()]);
      const authTag = cipher.getAuthTag();

      chunks.push({
        index,
        offset,
        size: slice.length,
        sha256: chunkHash,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      });
      encryptedChunks.push(encrypted);

      offset += chunkSize;
      index++;
    }

    return {
      manifest: {
        fileId,
        totalSize: data.length,
        chunkSize,
        chunkCount: chunks.length,
        overallChecksum: overallHasher.digest('hex'),
        chunks
      },
      encryptedChunks
    };
  }

  static decryptAndAssemble(manifest: StreamManifest, encryptedChunks: Buffer[], secretKey: Buffer): Buffer {
    const buffers: Buffer[] = [];
    for (let i = 0; i < manifest.chunks.length; i++) {
      const meta = manifest.chunks[i];
      const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, Buffer.from(meta.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(meta.authTag, 'hex'));
      const decrypted = Buffer.concat([decipher.update(encryptedChunks[i]), decipher.final()]);
      
      const checksum = crypto.createHash('sha256').update(decrypted).digest('hex');
      if (checksum !== meta.sha256) throw new Error(`Chunk ${i} integrity mismatch`);
      buffers.push(decrypted);
    }
    return Buffer.concat(buffers);
  }
}
