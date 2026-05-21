import { describe, expect, it, vi } from "vitest";

import { ImageAssetEntity } from "@/domain/image/entities/image-asset.entity";
import { UpdateImageAssetUseCase } from "./update-image-asset.use-case";

function makeImageAsset(
  overrides: Partial<ReturnType<ImageAssetEntity["toPrimitives"]>> = {},
) {
  return new ImageAssetEntity({
    id: "image-1",
    title: "Old Title",
    originalFileName: "source.jpg",
    sourceMimeType: "image/jpeg",
    sourceSizeBytes: 123_456,
    width: 800,
    height: 600,
    webpFileName: "image-1-old-title.webp",
    webpPath: "uploads/image-1-old-title.webp",
    webpUrl: "/uploads/image-1-old-title.webp",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  });
}

describe("UpdateImageAssetUseCase", () => {
  it("rolls back the WebP rename when the database update fails", async () => {
    const existing = makeImageAsset();
    const dbError = new Error("DB unavailable");
    const imageAssetRepository = {
      findById: vi.fn(async () => existing),
      update: vi.fn(async () => {
        throw dbError;
      }),
    };
    const imageAssetStorage = {
      renameWebp: vi.fn(async () => ({
        webpFileName: "image-1-new-title.webp",
        webpPath: "uploads/image-1-new-title.webp",
        webpUrl: "/uploads/image-1-new-title.webp",
      })),
      renameWebpFile: vi.fn(async () => undefined),
    };
    const useCase = new UpdateImageAssetUseCase(
      imageAssetRepository as any,
      imageAssetStorage as any,
    );

    await expect(
      useCase.execute({ id: "image-1", title: "New Title" }),
    ).rejects.toBe(dbError);

    expect(imageAssetStorage.renameWebpFile).toHaveBeenCalledWith({
      currentFileName: "image-1-new-title.webp",
      nextFileName: "image-1-old-title.webp",
    });
  });
});
