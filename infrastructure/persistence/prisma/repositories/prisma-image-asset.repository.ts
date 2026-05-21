import { Injectable } from '@nestjs/common';
import { ImageAssetEntity } from '@/domain/image/entities/image-asset.entity';
import type {
  CreateImageAssetRepositoryInput,
  ImageAssetRepository,
  UpdateImageAssetRepositoryInput,
} from '@/domain/image/repositories/image-asset.repository';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';

type ImageAssetRow = {
  id: string;
  title: string;
  originalFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: bigint;
  width: number;
  height: number;
  webpFileName: string;
  webpPath: string;
  webpUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaImageAssetRepository implements ImageAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: ImageAssetRow): ImageAssetEntity {
    return new ImageAssetEntity({
      id: row.id,
      title: row.title,
      originalFileName: row.originalFileName,
      sourceMimeType: row.sourceMimeType,
      sourceSizeBytes: Number(row.sourceSizeBytes),
      width: row.width,
      height: row.height,
      webpFileName: row.webpFileName,
      webpPath: row.webpPath,
      webpUrl: row.webpUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(input: CreateImageAssetRepositoryInput): Promise<ImageAssetEntity> {
    const row = await this.prisma.imageAsset.create({
      data: {
        id: input.id,
        title: input.title,
        originalFileName: input.originalFileName,
        sourceMimeType: input.sourceMimeType,
        sourceSizeBytes: BigInt(input.sourceSizeBytes),
        width: input.width,
        height: input.height,
        webpFileName: input.webpFileName,
        webpPath: input.webpPath,
        webpUrl: input.webpUrl,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<ImageAssetEntity | null> {
    const row = await this.prisma.imageAsset.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async list(): Promise<ImageAssetEntity[]> {
    const rows = await this.prisma.imageAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async update(input: UpdateImageAssetRepositoryInput): Promise<ImageAssetEntity> {
    const row = await this.prisma.imageAsset.update({
      where: { id: input.id },
      data: {
        title: input.title,
        webpFileName: input.webpFileName,
        webpPath: input.webpPath,
        webpUrl: input.webpUrl,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.imageAsset.delete({ where: { id } });
  }
}
