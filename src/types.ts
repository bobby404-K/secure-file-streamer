export interface ChunkMeta {
  index: number;
  offset: number;
  size: number;
  sha256: string;
  iv: string;
  authTag: string;
}

export interface StreamManifest {
  fileId: string;
  totalSize: number;
  chunkSize: number;
  chunkCount: number;
  overallChecksum: string;
  chunks: ChunkMeta[];
}
