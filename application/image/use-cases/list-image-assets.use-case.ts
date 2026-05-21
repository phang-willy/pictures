import type { ImageAssetRepository } from "@/domain/image/repositories/image-asset.repository";

export class ListImageAssetsUseCase {
  constructor(private readonly imageAssetRepository: ImageAssetRepository) {}

  async execute(search?: string) {
    const items = await this.imageAssetRepository.list();
    const query = search?.trim().toLocaleLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((image) => {
      const data = image.toPrimitives();
      return [
        data.title,
        data.originalFileName,
        data.webpFileName,
        data.sourceMimeType,
      ].some((value) => value.toLocaleLowerCase().includes(query));
    });
  }
}
