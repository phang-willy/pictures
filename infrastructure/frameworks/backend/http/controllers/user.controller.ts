import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ChangeUserRoleUseCase } from '@/application/user/use-cases/change-user-role.use-case';
import { CreateUserUseCase } from '@/application/user/use-cases/create-user.use-case';
import { GetUserByIdUseCase } from '@/application/user/use-cases/get-user-by-id.use-case';
import { UpdateUserProfileUseCase } from '@/application/user/use-cases/update-user-profile.use-case';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';

@Controller(['user', 'users'])
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
  ) {}

  @Post()
  create(@Body() body: { email: string; passwordHash: string; role?: 'ADMIN' | 'USER' }) {
    return this.createUserUseCase.execute(body).then((item) => success({ item }));
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.getUserByIdUseCase.execute(id).then((item) => success({ item }));
  }

  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() body: { email?: string }) {
    return this.updateUserProfileUseCase
      .execute({ id, ...body })
      .then((item) => success({ item }));
  }

  @Patch(':id/role')
  changeRole(@Param('id') id: string, @Body() body: { role: 'ADMIN' | 'USER' }) {
    return this.changeUserRoleUseCase
      .execute(id, body.role)
      .then((item) => success({ item }));
  }
}
