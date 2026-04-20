import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@/infrastructure/database/config/prisma.module';
import { CreateCountryUseCase } from '@/application/country/use-cases/create-country.use-case';
import { GetCountryByIdUseCase } from '@/application/country/use-cases/get-country-by-id.use-case';
import { ListCountriesUseCase } from '@/application/country/use-cases/list-countries.use-case';
import { ListContinentsUseCase } from '@/application/country/use-cases/list-continents.use-case';
import { UpdateCountryUseCase } from '@/application/country/use-cases/update-country.use-case';
import { CheckCountryDuplicateUseCase } from '@/application/country/use-cases/check-country-duplicate.use-case';
import { CheckCityDuplicateUseCase } from '@/application/city/use-cases/check-city-duplicate.use-case';
import { CreateCityUseCase } from '@/application/city/use-cases/create-city.use-case';
import { GetCityByIdUseCase } from '@/application/city/use-cases/get-city-by-id.use-case';
import { ListCitiesUseCase } from '@/application/city/use-cases/list-cities.use-case';
import { UpdateCityUseCase } from '@/application/city/use-cases/update-city.use-case';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { LogoutUseCase } from '@/application/auth/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/application/auth/use-cases/refresh-session.use-case';
import { RequestPasswordResetUseCase } from '@/application/auth/use-cases/request-password-reset.use-case';
import { RequestTwoFactorUseCase } from '@/application/auth/use-cases/request-two-factor.use-case';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password.use-case';
import { VerifyTwoFactorUseCase } from '@/application/auth/use-cases/verify-two-factor.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { ConfirmAccountUseCase } from '@/application/auth/use-cases/confirm-account.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import { ChangeUserRoleUseCase } from '@/application/user/use-cases/change-user-role.use-case';
import { CreateUserUseCase } from '@/application/user/use-cases/create-user.use-case';
import { GetUserByIdUseCase } from '@/application/user/use-cases/get-user-by-id.use-case';
import { UpdateUserProfileUseCase } from '@/application/user/use-cases/update-user-profile.use-case';
import {
  CLIENT_LOCATION_PORT,
  CLOCK_PORT,
  MAIL_SENDER_PORT,
  OTP_GENERATOR_PORT,
  PASSWORD_HASHER_PORT,
  TOKEN_SIGNER_PORT,
  TWO_FACTOR_CODE_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
} from '@/application/auth/ports/di-tokens';
import { COUNTRY_REPOSITORY } from '@/application/country/ports/country.tokens';
import { CITY_REPOSITORY } from '@/application/city/ports/city.tokens';
import { USER_REPOSITORY } from '@/application/user/ports/user.tokens';
import { NodemailerMailSenderAdapter } from '@/infrastructure/adapters/mail/nodemailer-mail-sender.adapter';
import { BcryptPasswordHasherAdapter } from '@/infrastructure/adapters/security/bcrypt-password-hasher.adapter';
import { RandomOtpGeneratorAdapter } from '@/infrastructure/adapters/security/random-otp-generator.adapter';
import { SystemClockAdapter } from '@/infrastructure/adapters/time/system-clock.adapter';
import { IpApiClientLocationAdapter } from '@/infrastructure/adapters/geo/ip-api-client-location.adapter';
import { PrismaCountryRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-country.repository';
import { PrismaCityRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-city.repository';
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { PrismaTwoFactorCodeRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-two-factor-code.repository';
import { PrismaPasswordResetTokenRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-password-reset-token.repository';
import { InMemoryAuthSessionRepository } from '@/infrastructure/persistence/prisma/repositories/in-memory-auth-session.repository';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import type { CityRepository } from '@/domain/city/repositories/city.repository';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import type { PasswordResetTokenRepository } from '@/domain/auth/repositories/password-reset-token.repository';
import type { AuthSessionRepository } from '@/domain/auth/repositories/auth-session.repository';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { OtpGeneratorPort } from '@/application/auth/ports/otp-generator.port';
import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import { API_CONTROLLERS } from '@/infrastructure/frameworks/backend/http/http.controllers';
import { createThrottlerOptions } from '@/infrastructure/frameworks/backend/http/rate-limit/throttler-options.factory';
import { TokenSignerModule } from '@/infrastructure/frameworks/backend/token-signer.module';

@Module({
  imports: [
    PrismaModule,
    TokenSignerModule,
    ThrottlerModule.forRootAsync({
      imports: [TokenSignerModule],
      inject: [TOKEN_SIGNER_PORT],
      useFactory: (tokenSigner: TokenSignerPort) => createThrottlerOptions(tokenSigner),
    }),
  ],
  controllers: API_CONTROLLERS,
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: COUNTRY_REPOSITORY, useClass: PrismaCountryRepository },
    { provide: CITY_REPOSITORY, useClass: PrismaCityRepository },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasherAdapter },
    { provide: MAIL_SENDER_PORT, useClass: NodemailerMailSenderAdapter },
    { provide: CLIENT_LOCATION_PORT, useClass: IpApiClientLocationAdapter },
    { provide: OTP_GENERATOR_PORT, useClass: RandomOtpGeneratorAdapter },
    { provide: CLOCK_PORT, useClass: SystemClockAdapter },
    {
      provide: TWO_FACTOR_CODE_REPOSITORY,
      useClass: PrismaTwoFactorCodeRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: InMemoryAuthSessionRepository,
    },
    { provide: CreateCountryUseCase, inject: [COUNTRY_REPOSITORY], useFactory: (repository: CountryRepository) => new CreateCountryUseCase(repository) },
    { provide: CheckCountryDuplicateUseCase, inject: [COUNTRY_REPOSITORY], useFactory: (repository: CountryRepository) => new CheckCountryDuplicateUseCase(repository) },
    {
      provide: UpdateCountryUseCase,
      inject: [COUNTRY_REPOSITORY, CheckCountryDuplicateUseCase],
      useFactory: (repository: CountryRepository, checkDuplicate: CheckCountryDuplicateUseCase) =>
        new UpdateCountryUseCase(repository, checkDuplicate),
    },
    { provide: GetCountryByIdUseCase, inject: [COUNTRY_REPOSITORY], useFactory: (repository: CountryRepository) => new GetCountryByIdUseCase(repository) },
    { provide: ListCountriesUseCase, inject: [COUNTRY_REPOSITORY], useFactory: (repository: CountryRepository) => new ListCountriesUseCase(repository) },
    { provide: ListCitiesUseCase, inject: [CITY_REPOSITORY], useFactory: (repository: CityRepository) => new ListCitiesUseCase(repository) },
    { provide: GetCityByIdUseCase, inject: [CITY_REPOSITORY], useFactory: (repository: CityRepository) => new GetCityByIdUseCase(repository) },
    { provide: CheckCityDuplicateUseCase, inject: [CITY_REPOSITORY], useFactory: (repository: CityRepository) => new CheckCityDuplicateUseCase(repository) },
    {
      provide: CreateCityUseCase,
      inject: [CITY_REPOSITORY, COUNTRY_REPOSITORY, CheckCityDuplicateUseCase],
      useFactory: (
        cityRepository: CityRepository,
        countryRepository: CountryRepository,
        checkDuplicate: CheckCityDuplicateUseCase,
      ) => new CreateCityUseCase(cityRepository, countryRepository, checkDuplicate),
    },
    {
      provide: UpdateCityUseCase,
      inject: [CITY_REPOSITORY, COUNTRY_REPOSITORY, CheckCityDuplicateUseCase],
      useFactory: (
        cityRepository: CityRepository,
        countryRepository: CountryRepository,
        checkDuplicate: CheckCityDuplicateUseCase,
      ) => new UpdateCityUseCase(cityRepository, countryRepository, checkDuplicate),
    },
    { provide: ListContinentsUseCase, inject: [COUNTRY_REPOSITORY], useFactory: (repository: CountryRepository) => new ListContinentsUseCase(repository) },
    { provide: CreateUserUseCase, inject: [USER_REPOSITORY], useFactory: (repository: UserRepository) => new CreateUserUseCase(repository) },
    { provide: GetUserByIdUseCase, inject: [USER_REPOSITORY], useFactory: (repository: UserRepository) => new GetUserByIdUseCase(repository) },
    { provide: UpdateUserProfileUseCase, inject: [USER_REPOSITORY], useFactory: (repository: UserRepository) => new UpdateUserProfileUseCase(repository) },
    { provide: ChangeUserRoleUseCase, inject: [USER_REPOSITORY], useFactory: (repository: UserRepository) => new ChangeUserRoleUseCase(repository) },
    {
      provide: RegisterUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER_PORT, MAIL_SENDER_PORT, CLIENT_LOCATION_PORT],
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
      ) => new RegisterUseCase(userRepository, passwordHasher, mailSender, clientLocation),
    },
    {
      provide: LoginUseCase,
      inject: [
        TOKEN_SIGNER_PORT,
        OTP_GENERATOR_PORT,
        PASSWORD_HASHER_PORT,
        MAIL_SENDER_PORT,
        CLIENT_LOCATION_PORT,
        USER_REPOSITORY,
        TWO_FACTOR_CODE_REPOSITORY,
      ],
      useFactory: (
        tokenSigner: TokenSignerPort,
        otpGenerator: OtpGeneratorPort,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        twoFactorCodeRepository: TwoFactorCodeRepository,
      ) =>
        new LoginUseCase(
          tokenSigner,
          otpGenerator,
          passwordHasher,
          mailSender,
          clientLocation,
          userRepository,
          twoFactorCodeRepository,
        ),
    },
    {
      provide: RequestTwoFactorUseCase,
      inject: [
        TOKEN_SIGNER_PORT,
        OTP_GENERATOR_PORT,
        PASSWORD_HASHER_PORT,
        MAIL_SENDER_PORT,
        CLIENT_LOCATION_PORT,
        USER_REPOSITORY,
        TWO_FACTOR_CODE_REPOSITORY,
      ],
      useFactory: (
        tokenSigner: TokenSignerPort,
        otpGenerator: OtpGeneratorPort,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        twoFactorCodeRepository: TwoFactorCodeRepository,
      ) =>
        new RequestTwoFactorUseCase(
          tokenSigner,
          otpGenerator,
          passwordHasher,
          mailSender,
          clientLocation,
          userRepository,
          twoFactorCodeRepository,
        ),
    },
    {
      provide: VerifyTwoFactorUseCase,
      inject: [
        TOKEN_SIGNER_PORT,
        PASSWORD_HASHER_PORT,
        MAIL_SENDER_PORT,
        CLIENT_LOCATION_PORT,
        USER_REPOSITORY,
        TWO_FACTOR_CODE_REPOSITORY,
        AUTH_SESSION_REPOSITORY,
      ],
      useFactory: (
        tokenSigner: TokenSignerPort,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        twoFactorCodeRepository: TwoFactorCodeRepository,
        authSessionRepository: AuthSessionRepository,
      ) =>
        new VerifyTwoFactorUseCase(
          tokenSigner,
          passwordHasher,
          mailSender,
          clientLocation,
          userRepository,
          twoFactorCodeRepository,
          authSessionRepository,
        ),
    },
    {
      provide: RequestPasswordResetUseCase,
      inject: [TOKEN_SIGNER_PORT, MAIL_SENDER_PORT, CLIENT_LOCATION_PORT, USER_REPOSITORY, PASSWORD_RESET_TOKEN_REPOSITORY],
      useFactory: (
        tokenSigner: TokenSignerPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        passwordResetTokenRepository: PasswordResetTokenRepository,
      ) =>
        new RequestPasswordResetUseCase(tokenSigner, mailSender, clientLocation, userRepository, passwordResetTokenRepository),
    },
    {
      provide: ResetPasswordUseCase,
      inject: [
        TOKEN_SIGNER_PORT,
        PASSWORD_HASHER_PORT,
        MAIL_SENDER_PORT,
        CLIENT_LOCATION_PORT,
        USER_REPOSITORY,
        PASSWORD_RESET_TOKEN_REPOSITORY,
      ],
      useFactory: (
        tokenSigner: TokenSignerPort,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        passwordResetTokenRepository: PasswordResetTokenRepository,
      ) =>
        new ResetPasswordUseCase(
          tokenSigner,
          passwordHasher,
          mailSender,
          clientLocation,
          userRepository,
          passwordResetTokenRepository,
        ),
    },
    {
      provide: RefreshSessionUseCase,
      inject: [TOKEN_SIGNER_PORT, USER_REPOSITORY],
      useFactory: (tokenSigner: TokenSignerPort, userRepository: UserRepository) =>
        new RefreshSessionUseCase(tokenSigner, userRepository),
    },
    {
      provide: ConfirmAccountUseCase,
      inject: [USER_REPOSITORY, MAIL_SENDER_PORT, CLIENT_LOCATION_PORT],
      useFactory: (userRepository: UserRepository, mailSender: MailSenderPort, clientLocation: ClientLocationPort) =>
        new ConfirmAccountUseCase(userRepository, mailSender, clientLocation),
    },
    {
      provide: ChangePasswordUseCase,
      inject: [
        TOKEN_SIGNER_PORT,
        PASSWORD_HASHER_PORT,
        MAIL_SENDER_PORT,
        CLIENT_LOCATION_PORT,
        USER_REPOSITORY,
        TWO_FACTOR_CODE_REPOSITORY,
      ],
      useFactory: (
        tokenSigner: TokenSignerPort,
        passwordHasher: PasswordHasherPort,
        mailSender: MailSenderPort,
        clientLocation: ClientLocationPort,
        userRepository: UserRepository,
        twoFactorCodeRepository: TwoFactorCodeRepository,
      ) =>
        new ChangePasswordUseCase(
          tokenSigner,
          passwordHasher,
          mailSender,
          clientLocation,
          userRepository,
          twoFactorCodeRepository,
        ),
    },
    { provide: LogoutUseCase, useFactory: () => new LogoutUseCase() },
  ],
})
export class AppModule {}
