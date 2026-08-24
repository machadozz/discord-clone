import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsOptional,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Nome de usuário deve ter pelo menos 3 caracteres' })
  @MaxLength(32, { message: 'Nome de usuário deve ter no máximo 32 caracteres' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Nome de usuário só pode conter letras, números, ponto e underline',
  })
  username: string;

  @IsEmail({}, { message: 'Por favor, insira um e-mail válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'A senha deve conter pelo menos uma letra e um número',
  })
  password: string;

  @IsOptional()
  @IsString()
  birthdate?: string;
}

export class VerifyEmailDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'O código deve ter 6 dígitos' })
  @MaxLength(6, { message: 'O código deve ter 6 dígitos' })
  code: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class LoginDto {
  @IsString({ message: 'Informe o e-mail ou nome de usuário' })
  identifier: string;

  @IsString({ message: 'Informe a senha' })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token é obrigatório' })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString({ message: 'Token de recuperação é obrigatório' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'A nova senha deve conter pelo menos uma letra e um número',
  })
  newPassword: string;
}

export class EnableTwoFactorDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class VerifyTwoFactorLoginDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class OAuthLoginDto {
  @IsString()
  @IsIn(['google', 'github'])
  provider: 'google' | 'github';

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  credential?: string;
}
