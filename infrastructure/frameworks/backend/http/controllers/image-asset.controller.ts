import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { TOKEN_SIGNER_PORT } from "@/application/auth/ports/di-tokens";
import type { TokenSignerPort } from "@/application/auth/ports/token-signer.port";
import { CreateImageAssetUseCase } from "@/application/image/use-cases/create-image-asset.use-case";
import { DeleteImageAssetUseCase } from "@/application/image/use-cases/delete-image-asset.use-case";
import { GetImageAssetByIdUseCase } from "@/application/image/use-cases/get-image-asset-by-id.use-case";
import { ListImageAssetsUseCase } from "@/application/image/use-cases/list-image-assets.use-case";
import { UpdateImageAssetUseCase } from "@/application/image/use-cases/update-image-asset.use-case";
import { getRoleFromRequest } from "@/infrastructure/frameworks/backend/http/auth/access-token-role.util";
import { toHttpError } from "@/infrastructure/frameworks/backend/http/errors";
import { toImageAssetHttp } from "@/infrastructure/frameworks/backend/http/mappers";
import {
  parsePage,
  parsePerPage,
  toPagination,
} from "@/infrastructure/frameworks/backend/http/pagination";
import { success } from "@/infrastructure/frameworks/backend/nest/response.presenter";

type UploadedImageFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

const IMAGE_UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024;

@Controller("image-assets")
export class ImageAssetController {
  constructor(
    private readonly createImageAssetUseCase: CreateImageAssetUseCase,
    private readonly getImageAssetByIdUseCase: GetImageAssetByIdUseCase,
    private readonly listImageAssetsUseCase: ListImageAssetsUseCase,
    private readonly updateImageAssetUseCase: UpdateImageAssetUseCase,
    private readonly deleteImageAssetUseCase: DeleteImageAssetUseCase,
    @Inject(TOKEN_SIGNER_PORT)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  private assertAdmin(req: Request): void {
    if (getRoleFromRequest(this.tokenSigner, req) !== "ADMIN") {
      throw new ForbiddenException("Only ADMIN can manage image assets.");
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: IMAGE_UPLOAD_LIMIT_BYTES, files: 1 },
    }),
  )
  async create(
    @Req() req: Request,
    @Body("title") title: string | undefined,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    this.assertAdmin(req);
    if (!file) {
      throw new BadRequestException("Image file is required.");
    }
    try {
      const image = await this.createImageAssetUseCase.execute({
        title: title ?? "",
        file: {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
      return success({ item: toImageAssetHttp(image) });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query("page") pageRaw?: string,
    @Query("per_page") perPageRaw?: string,
    @Query("q") q?: string,
  ) {
    this.assertAdmin(req);
    const page = parsePage(pageRaw);
    const perPage = parsePerPage(perPageRaw);
    const items = await this.listImageAssetsUseCase.execute(q);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    return success({
      items: items
        .slice(start, start + perPage)
        .map((image) => toImageAssetHttp(image)),
      pagination: toPagination(safePage, perPage, total),
    });
  }

  @Get(":id")
  async findById(@Req() req: Request, @Param("id") id: string) {
    this.assertAdmin(req);
    const image = await this.getImageAssetByIdUseCase.execute(id);
    if (!image) {
      throw new NotFoundException("Image asset not found.");
    }
    return success({ item: toImageAssetHttp(image) });
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { title?: string },
  ) {
    this.assertAdmin(req);
    try {
      const image = await this.updateImageAssetUseCase.execute({
        id,
        title: body.title ?? "",
      });
      return success({ item: toImageAssetHttp(image) });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Delete(":id")
  async delete(@Req() req: Request, @Param("id") id: string) {
    this.assertAdmin(req);
    try {
      await this.deleteImageAssetUseCase.execute(id);
      return success({ id });
    } catch (error) {
      toHttpError(error);
    }
  }
}
