import { ImageAssetEntity } from '@/domain/image/entities/image-asset.entity';

export type CreateImageAssetRepositoryInput = {
  id: string;
  title: string;
  originalFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: number;
  width: number;
  height: number;
  webpFileName: string;
  webpPath: string;
  webpUrl: string;
};

export type UpdateImageAssetRepositoryInput = {
  id: string;
  title: string;
  webpFileName: string;
  webpPath: string;
  webpUrl: string;
};

export interface ImageAssetRepository {
  create(input: CreateImageAssetRepositoryInput): Promise<ImageAssetEntity>;
  findById(id: string): Promise<ImageAssetEntity | null>;
  list(): Promise<ImageAssetEntity[]>;
  update(input: UpdateImageAssetRepositoryInput): Promise<ImageAssetEntity>;
  delete(id: string): Promise<void>;
}
