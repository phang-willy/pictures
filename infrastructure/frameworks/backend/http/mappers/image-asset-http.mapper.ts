import { statSync } from "node:fs";
import path from "node:path";
import type { ImageAssetEntity } from "@/domain/image/entities/image-asset.entity";
import { uploadsRootDirectory } from "@/infrastructure/adapters/storage/uploads-directory";

function readWebpSizeBytes(fileName: string): number {
  try {
    return statSync(path.join(uploadsRootDirectory(), path.basename(fileName)))
      .size;
  } catch {
    return 0;
  }
}

export function toImageAssetHttp(image: ImageAssetEntity) {
  const data = image.toPrimitives();
  const webpSizeBytes = readWebpSizeBytes(data.webpFileName);
  return {
    id: data.id,
    title: data.title,
    originalFileName: data.originalFileName,
    sourceMimeType: data.sourceMimeType,
    sourceSizeBytes: data.sourceSizeBytes,
    webpSizeBytes,
    width: data.width,
    height: data.height,
    webpFileName: data.webpFileName,
    webpPath: data.webpPath,
    webpUrl: data.webpUrl,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
