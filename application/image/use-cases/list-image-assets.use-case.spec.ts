import { describe, expect, it, vi } from "vitest";

import { ImageAssetEntity } from "@/domain/image/entities/image-asset.entity";
import { ListImageAssetsUseCase } from "./list-image-assets.use-case";

function makeImageAsset(
  id: string,
  overrides: Partial<ReturnType<ImageAssetEntity["toPrimitives"]>> = {},
) {
  return new ImageAssetEntity({
    id,
    title: `Image ${id}`,
    originalFileName: `${id}.jpg`,
    sourceMimeType: "image/jpeg",
    sourceSizeBytes: 123_456,
    width: 800,
    height: 600,
    webpFileName: `${id}.webp`,
    webpPath: `uploads/${id}.webp`,
    webpUrl: `/uploads/${id}.webp`,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  });
}

describe("ListImageAssetsUseCase", () => {
  it("filters images by title, original file name, WebP file name or MIME type", async () => {
    const matching = makeImageAsset("image-1", {
      title: "Sunset in Paris",
      originalFileName: "eiffel.jpg",
    });
    const other = makeImageAsset("image-2", {
      title: "Mountain trail",
      originalFileName: "alps.jpg",
    });
    const imageAssetRepository = {
      list: vi.fn(async () => [matching, other]),
    };
    const useCase = new ListImageAssetsUseCase(imageAssetRepository as any);

    const result = await useCase.execute("paris");

    expect(result).toEqual([matching]);
  });
});
