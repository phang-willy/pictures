import type { ImageAssetStoragePort } from '@/application/image/ports/image-asset-storage.port';
import type { ImageAssetRepository } from '@/domain/image/repositories/image-asset.repository';

export class DeleteImageAssetUseCase {
  constructor(
    private readonly imageAssetRepository: ImageAssetRepository,
    private readonly imageAssetStorage: ImageAssetStoragePort,
  ) {}

  async execute(id: string): Promise<void> {
    const image = await this.imageAssetRepository.findById(id);
    if (!image) {
      throw new Error('Image asset not found.');
    }

    await this.imageAssetRepository.delete(id);
    await this.imageAssetStorage.deleteWebp(image.webpFileName);
  }
}
