import { AuthController } from '@/infrastructure/frameworks/backend/http/controllers/auth.controller';
import { CityController } from '@/infrastructure/frameworks/backend/http/controllers/city.controller';
import { PostController } from '@/infrastructure/frameworks/backend/http/controllers/post.controller';
import { ContinentController } from '@/infrastructure/frameworks/backend/http/controllers/continent.controller';
import { CountryController } from '@/infrastructure/frameworks/backend/http/controllers/country.controller';
import { HealthController } from '@/infrastructure/frameworks/backend/http/controllers/health.controller';
import { UserController } from '@/infrastructure/frameworks/backend/http/controllers/user.controller';

export const API_CONTROLLERS = [
  HealthController,
  CityController,
  PostController,
  ContinentController,
  CountryController,
  UserController,
  AuthController,
];
