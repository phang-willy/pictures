import type { ImageAssetRepository } from '@/domain/image/repositories/image-asset.repository';

export class GetImageAssetByIdUseCase {
  constructor(private readonly imageAssetRepository: ImageAssetRepository) {}

  execute(id: string) {
    return this.imageAssetRepository.findById(id);
  }
}
