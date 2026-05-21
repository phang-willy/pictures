import { Body, Controller, ForbiddenException, Get, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SIGNER_PORT } from '@/application/auth/ports/di-tokens';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { ChangeUserRoleUseCase } from '@/application/user/use-cases/change-user-role.use-case';
import { CreateUserUseCase } from '@/application/user/use-cases/create-user.use-case';
import { GetUserByIdUseCase } from '@/application/user/use-cases/get-user-by-id.use-case';
import { UpdateUserProfileUseCase } from '@/application/user/use-cases/update-user-profile.use-case';
import { getRoleFromRequest } from '@/infrastructure/frameworks/backend/http/auth/access-token-role.util';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';

@Controller(['user', 'users'])
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    @Inject(TOKEN_SIGNER_PORT)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { email: string; passwordHash: string; role?: 'ADMIN' | 'USER' },
  ) {
    this.assertAdmin(req);
    return this.createUserUseCase.execute(body).then((item) => success({ item }));
  }

  @Get(':id')
  findById(@Req() req: Request, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.getUserByIdUseCase.execute(id).then((item) => success({ item }));
  }

  @Patch(':id/profile')
  updateProfile(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { email?: string },
  ) {
    this.assertAdmin(req);
    return this.updateUserProfileUseCase
      .execute({ id, ...body })
      .then((item) => success({ item }));
  }

  @Patch(':id/role')
  changeRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { role: 'ADMIN' | 'USER' },
  ) {
    this.assertAdmin(req);
    return this.changeUserRoleUseCase
      .execute(id, body.role)
      .then((item) => success({ item }));
  }

  private assertAdmin(req: Request): void {
    if (getRoleFromRequest(this.tokenSigner, req) !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can access user administration.');
    }
  }
}
