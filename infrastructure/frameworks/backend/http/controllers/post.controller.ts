import { Body, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SIGNER_PORT } from '@/application/auth/ports/di-tokens';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { CheckPostDuplicateUseCase } from '@/application/post/use-cases/check-post-duplicate.use-case';
import { CreatePostUseCase } from '@/application/post/use-cases/create-post.use-case';
import { DeletePostUseCase } from '@/application/post/use-cases/delete-post.use-case';
import { GetPostByIdUseCase } from '@/application/post/use-cases/get-post-by-id.use-case';
import { ListPostsUseCase } from '@/application/post/use-cases/list-posts.use-case';
import { UpdatePostUseCase } from '@/application/post/use-cases/update-post.use-case';
import { getRoleFromRequest } from '@/infrastructure/frameworks/backend/http/auth/access-token-role.util';
import { toHttpError } from '@/infrastructure/frameworks/backend/http/errors';
import { toPostListItemHttp } from '@/infrastructure/frameworks/backend/http/mappers';
import { parsePage, parsePerPage, toPagination } from '@/infrastructure/frameworks/backend/http/pagination';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';

@Controller('post')
export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly checkPostDuplicateUseCase: CheckPostDuplicateUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    @Inject(TOKEN_SIGNER_PORT)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  private assertAdmin(req: Request): void {
    if (getRoleFromRequest(this.tokenSigner, req) !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can mutate data.');
    }
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body()
    body: {
      cityId: string;
      name: string;
      slug?: string;
      description?: string | null;
      content?: string | null;
      latitude: number;
      longitude: number;
    },
  ) {
    this.assertAdmin(req);
    try {
      const post = await this.createPostUseCase.execute(body);
      return success({
        id: post.id,
        item: toPostListItemHttp(post),
      });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Get()
  async list(
    @Query('activate') activate?: string,
    @Query('inactive_only') inactiveOnly?: string,
    @Query('city_id') cityIdRaw?: string,
    @Query('country_id') countryIdRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
  ) {
    const mode: 'active' | 'inactive' | 'all' =
      inactiveOnly === 'true'
        ? 'inactive'
        : activate === 'false'
          ? 'all'
          : 'active';
    const page = parsePage(pageRaw);
    const perPage = parsePerPage(perPageRaw);

    const cityId = cityIdRaw?.trim();
    const countryId = countryIdRaw?.trim();

    const items = await this.listPostsUseCase.execute({
      activeOnly: mode === 'active',
      ...(cityId
        ? { cityId }
        : countryId
          ? { countryId }
          : {}),
    });
    const filteredItems =
      mode === 'inactive'
        ? items.filter((post) => post.deactivatedAt !== null)
        : items;
    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const payload = filteredItems
      .slice(start, start + perPage)
      .map((post) => toPostListItemHttp(post));
    return success({
      items: payload,
      pagination: toPagination(safePage, perPage, total),
    });
  }

  @Get('exists')
  exists(
    @Query('city_id') cityId?: string,
    @Query('name') name?: string,
    @Query('slug') slug?: string,
    @Query('exclude_post_id') excludePostId?: string,
  ) {
    return this.checkPostDuplicateUseCase
      .execute({
        cityId: cityId ?? '',
        name: name ?? '',
        slug,
        excludePostId: excludePostId?.trim() || undefined,
      })
      .then((result) => success(result));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const post = await this.getPostByIdUseCase.execute(id);
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    return success({ item: toPostListItemHttp(post) });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      cityId?: string;
      name?: string;
      slug?: string;
      description?: string | null;
      latitude?: number;
      longitude?: number;
      deactivatedAt?: string | null;
    },
  ) {
    this.assertAdmin(req);
    try {
      const post = await this.updatePostUseCase.execute({
        id,
        cityId: body.cityId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        content: body.content,
        latitude: body.latitude,
        longitude: body.longitude,
        deactivatedAt: body.deactivatedAt,
      });
      return success({ item: toPostListItemHttp(post) });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    this.assertAdmin(req);
    try {
      await this.deletePostUseCase.execute(id);
      return success({ id });
    } catch (error) {
      toHttpError(error);
    }
  }
}
