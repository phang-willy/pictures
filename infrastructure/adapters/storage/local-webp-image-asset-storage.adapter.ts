import { rename, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { slugify } from "@/domain/utils/slugify";
import type {
  ImageAssetStoragePort,
  ImageUploadFile,
  StoredImageAssetFile,
} from "@/application/image/ports/image-asset-storage.port";
import {
  ensureUploadsDirectory,
  uploadsPublicUrl,
  uploadsRelativePath,
} from "@/infrastructure/adapters/storage/uploads-directory";

const WEBP_QUALITY = 68;
const WEBP_ALPHA_QUALITY = 80;

function fileNameFor(id: string, title: string): string {
  const safeTitle = slugify(title) || "image";
  return `${id}-${safeTitle}.webp`;
}

export class LocalWebpImageAssetStorageAdapter implements ImageAssetStoragePort {
  async saveWebp(input: {
    id: string;
    title: string;
    file: ImageUploadFile;
  }): Promise<StoredImageAssetFile> {
    const dir = await ensureUploadsDirectory();
    const webpFileName = fileNameFor(input.id, input.title);
    const targetPath = path.join(dir, webpFileName);

    const image = sharp(input.file.buffer, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image file.");
    }

    const output = await image
      .toColorspace("srgb")
      .webp({
        quality: WEBP_QUALITY,
        alphaQuality: WEBP_ALPHA_QUALITY,
        effort: 6,
        lossless: false,
        nearLossless: false,
        preset: "photo",
        smartDeblock: true,
        smartSubsample: true,
      })
      .toFile(targetPath);

    return {
      width: output.width ?? metadata.width,
      height: output.height ?? metadata.height,
      webpFileName,
      webpPath: uploadsRelativePath(webpFileName),
      webpUrl: uploadsPublicUrl(webpFileName),
    };
  }

  async renameWebp(input: {
    id: string;
    title: string;
    currentFileName: string;
  }): Promise<
    Pick<StoredImageAssetFile, "webpFileName" | "webpPath" | "webpUrl">
  > {
    const webpFileName = fileNameFor(input.id, input.title);
    if (webpFileName !== input.currentFileName) {
      await this.renameWebpFile({
        currentFileName: input.currentFileName,
        nextFileName: webpFileName,
      });
    }
    return {
      webpFileName,
      webpPath: uploadsRelativePath(webpFileName),
      webpUrl: uploadsPublicUrl(webpFileName),
    };
  }

  async renameWebpFile(input: {
    currentFileName: string;
    nextFileName: string;
  }): Promise<void> {
    if (input.currentFileName === input.nextFileName) {
      return;
    }
    const dir = await ensureUploadsDirectory();
    await rename(
      path.join(dir, path.basename(input.currentFileName)),
      path.join(dir, path.basename(input.nextFileName)),
    );
  }

  async deleteWebp(fileName: string): Promise<void> {
    const dir = await ensureUploadsDirectory();
    await rm(path.join(dir, fileName), { force: true });
  }
}
