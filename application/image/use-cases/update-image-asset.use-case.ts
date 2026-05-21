import type { ImageAssetStoragePort } from "@/application/image/ports/image-asset-storage.port";
import type { ImageAssetRepository } from "@/domain/image/repositories/image-asset.repository";

export type UpdateImageAssetInput = {
  id: string;
  title: string;
};

export class UpdateImageAssetUseCase {
  constructor(
    private readonly imageAssetRepository: ImageAssetRepository,
    private readonly imageAssetStorage: ImageAssetStoragePort,
  ) {}

  async execute(input: UpdateImageAssetInput) {
    const title = input.title.trim();
    if (!title) {
      throw new Error("Image title is required.");
    }

    const existing = await this.imageAssetRepository.findById(input.id);
    if (!existing) {
      throw new Error("Image asset not found.");
    }

    const renamed = await this.imageAssetStorage.renameWebp({
      id: existing.id,
      title,
      currentFileName: existing.webpFileName,
    });

    try {
      return await this.imageAssetRepository.update({
        id: existing.id,
        title,
        webpFileName: renamed.webpFileName,
        webpPath: renamed.webpPath,
        webpUrl: renamed.webpUrl,
      });
    } catch (error) {
      await this.imageAssetStorage.renameWebpFile({
        currentFileName: renamed.webpFileName,
        nextFileName: existing.webpFileName,
      });
      throw error;
    }
  }
}
