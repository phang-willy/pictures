import { ApiProperty } from '@nestjs/swagger';

const PASSWORD_DOC =
  'Min. 12 caractères, max 255. Au moins une minuscule, une majuscule, un chiffre et un caractère spécial parmi : ( ) * - + . / \\ @ ! { } &';

/** POST /auth/register */
export class RegisterRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({
    description: PASSWORD_DOC,
    minLength: 12,
    maxLength: 255,
    example: 'MonMotDePasse!1',
  })
  password!: string;
}

/** POST /auth/login */
export class LoginRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({
    description: PASSWORD_DOC,
    minLength: 12,
    maxLength: 255,
    example: 'MonMotDePasse!1',
  })
  password!: string;
}

/** POST /auth/2fa/verify */
export class VerifyTwoFactorRequestBodyDto {
  @ApiProperty({
    description:
      'Jeton signé renvoyé par POST /auth/login après mot de passe valide (étape avant code email).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  twoFactorToken!: string;

  @ApiProperty({
    description: 'Code à 6 chiffres reçu par email',
    pattern: '^\\d{6}$',
    example: '123456',
  })
  code!: string;
}

/** POST /auth/2fa/resend */
export class ResendTwoFactorRequestBodyDto {
  @ApiProperty({
    description: 'Même jeton que pour /auth/2fa/verify',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  twoFactorToken!: string;
}

/** POST /auth/confirm */
export class ConfirmAccountRequestBodyDto {
  @ApiProperty({
    description: 'Type de confirmation',
    enum: ['account'],
    example: 'account',
  })
  type!: 'account';

  @ApiProperty({
    description: 'Valeur du paramètre `token` du lien reçu par email',
    example: 'a1b2c3d4e5f6...',
  })
  token!: string;
}

/** POST /auth/forgot-password/request */
export class ForgotPasswordRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;
}

/** POST /auth/forgot-password/reset */
export class ForgotPasswordResetRequestBodyDto {
  @ApiProperty({
    description: 'Jeton du lien de réinitialisation (query `token` côté front)',
    example: 'signed.token.from.email',
  })
  token!: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({
    description: PASSWORD_DOC,
    minLength: 12,
    maxLength: 255,
    example: 'NouveauMotDePasse!2',
  })
  password!: string;

  @ApiProperty({
    description: 'Doit être identique à `password`',
    example: 'NouveauMotDePasse!2',
  })
  confirmPassword!: string;
}

/** POST /auth/password/change — header `Authorization: Bearer <accessToken>` requis. */
export class ChangePasswordRequestBodyDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    minLength: 12,
    maxLength: 255,
    example: 'AncienMotDePasse!1',
  })
  oldPassword!: string;

  @ApiProperty({
    description: PASSWORD_DOC,
    minLength: 12,
    maxLength: 255,
    example: 'NouveauMotDePasse!3',
  })
  newPassword!: string;

  @ApiProperty({
    description: 'Doit être identique à `newPassword`',
    example: 'NouveauMotDePasse!3',
  })
  confirmPassword!: string;
}
