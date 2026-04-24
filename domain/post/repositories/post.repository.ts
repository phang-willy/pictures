import { PostEntity } from '@/domain/post/entities/post.entity';

export interface PostRepository {
  create(post: PostEntity): Promise<PostEntity>;
  update(post: PostEntity): Promise<PostEntity>;
  findById(id: string): Promise<PostEntity | null>;
  list(activeOnly: boolean): Promise<PostEntity[]>;
  findByCityId(cityId: string, activeOnly: boolean): Promise<PostEntity[]>;
  findByNameInsensitive(cityId: string, name: string): Promise<PostEntity | null>;
  findBySlug(cityId: string, slug: string): Promise<PostEntity | null>;
  deleteById(id: string): Promise<void>;
}
