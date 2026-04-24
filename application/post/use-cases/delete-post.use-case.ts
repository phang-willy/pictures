import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { PostRepository } from '@/domain/post/repositories/post.repository';

@Injectable()
export class DeletePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    await this.postRepository.deleteById(id);
    const stillExists = await this.postRepository.findById(id);
    if (stillExists) {
      throw new InternalServerErrorException('Post hard delete failed.');
    }
  }
}
