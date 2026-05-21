import { randomUUID } from 'node:crypto';
import type { ImageUploadFile, ImageAssetStoragePort } from '@/application/image/ports/image-asset-storage.port';
import type { ImageAssetRepository } from '@/domain/image/repositories/image-asset.repository';

export type CreateImageAssetInput = {
  title: string;
  file: ImageUploadFile;
};

export class CreateImageAssetUseCase {
  constructor(
    private readonly imageAssetRepository: ImageAssetRepository,
    private readonly imageAssetStorage: ImageAssetStoragePort,
  ) {}

  async execute(input: CreateImageAssetInput) {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Image title is required.');
    }
    if (!input.file?.buffer?.length) {
      throw new Error('Image file is required.');
    }

    const id = randomUUID();
    const stored = await this.imageAssetStorage.saveWebp({
      id,
      title,
      file: input.file,
    });

    try {
      return await this.imageAssetRepository.create({
        id,
        title,
        originalFileName: input.file.originalName,
        sourceMimeType: input.file.mimeType,
        sourceSizeBytes: input.file.size,
        width: stored.width,
        height: stored.height,
        webpFileName: stored.webpFileName,
        webpPath: stored.webpPath,
        webpUrl: stored.webpUrl,
      });
    } catch (error) {
      await this.imageAssetStorage.deleteWebp(stored.webpFileName);
      throw error;
    }
  }
}
