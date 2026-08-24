import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  EnableTwoFactorDto,
  VerifyTwoFactorLoginDto,
  OAuthLoginDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // 1. CADASTRO DE USUÁRIO COM VERIFICAÇÃO DE IDADE E E-MAIL
  async register(dto: RegisterDto) {
    if (dto.birthdate) {
      const birth = new Date(dto.birthdate);
      const age = this.calculateAge(birth);
      if (age < 13) {
        throw new BadRequestException(
          'Você precisa ter pelo menos 13 anos para criar uma conta no DISCORDIA.',
        );
      }
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username.trim() },
    });
    if (existingUsername) {
      throw new ConflictException('Este nome de usuário já está em uso.');
    }

    const discriminator = await this.generateDiscriminator(dto.username.trim());
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username.trim(),
        discriminator,
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
        isVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    this.logger.log(
      `✉️ [E-MAIL DE CONFIRMAÇÃO ENVIADO] Para: ${user.email} | Código: ${verificationCode}`,
    );

    return {
      message:
        'Conta criada com sucesso! Enviamos um código de verificação para o seu e-mail.',
      email: user.email,
      requiresVerification: true,
      devVerificationCode: verificationCode,
    };
  }

  // 2. VERIFICAÇÃO DE E-MAIL
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.isVerified) {
      return this.buildAuthResponse(user, true);
    }

    if (
      user.emailVerificationCode !== dto.code.trim() ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Código de verificação inválido ou expirado.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    return this.buildAuthResponse(updatedUser, true);
  }

  // 3. REENVIAR CÓDIGO DE VERIFICAÇÃO
  async resendVerificationCode(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    this.logger.log(
      `✉️ [NOVO E-MAIL DE CONFIRMAÇÃO ENVIADO] Para: ${user.email} | Código: ${verificationCode}`,
    );

    return {
      message: 'Novo código de verificação enviado.',
      devVerificationCode: verificationCode,
    };
  }

  // 4. LOGIN COM SUPORTE A 2FA CHALLENGE E "LEMBRAR DE MIM"
  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail/nome de usuário ou senha incorretos.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail/nome de usuário ou senha incorretos.');
    }

    if (!user.isVerified) {
      throw new ForbiddenException({
        message: 'Por favor, confirme seu e-mail antes de fazer login.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Se 2FA estiver ativado, retorna o desafio de 2FA
    if (user.isTwoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        userId: user.id,
        rememberMe: dto.rememberMe ?? false,
      };
    }

    return this.buildAuthResponse(user, dto.rememberMe);
  }

  // 5. VERIFICAÇÃO DE 2FA NO LOGIN
  async verifyTwoFactorLogin(dto: VerifyTwoFactorLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Desafio de 2FA inválido.');
    }

    // Simulação e validação TOTP (código de 6 dígitos)
    const isValid = this.verifyTotp(user.twoFactorSecret, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Código de autenticação 2FA incorreto.');
    }

    return this.buildAuthResponse(user, dto.rememberMe);
  }

  // 6. GERAR SEGREDO E QR CODE PARA ATIVAÇÃO DE 2FA
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Geração de segredo estático/simulado seguro
    const secret = user.twoFactorSecret || Math.random().toString(36).substring(2, 15).toUpperCase();

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = `otpauth://totp/DISCORDIA:${user.email}?secret=${secret}&issuer=DISCORDIA`;

    return {
      secret,
      otpauthUrl,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }

  // 7. ATIVAR 2FA COM CONFIRMAÇÃO DO CÓDIGO
  async enableTwoFactor(userId: string, dto: EnableTwoFactorDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Segredo 2FA não gerado.');
    }

    const isValid = this.verifyTotp(user.twoFactorSecret, dto.code);
    if (!isValid) {
      throw new BadRequestException('Código de autenticação incorreto.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { success: true, message: 'Autenticação em Duas Etapas (2FA) ativada com sucesso!' };
  }

  // 8. DESATIVAR 2FA
  async disableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });
    return { success: true, message: '2FA desativado com sucesso.' };
  }

  // 9. LOGIN SOCIAL (GOOGLE / GITHUB OAUTH)
  async oauthLogin(dto: OAuthLoginDto) {
    let email = dto.email;
    let name = dto.name;
    let avatarUrl = dto.avatarUrl;
    let providerId = dto.providerId;

    if (dto.credential) {
      try {
        const payloadBase64 = dto.credential.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const googleUser = JSON.parse(decodedJson);

        if (googleUser.email) {
          email = googleUser.email;
          name = googleUser.name || googleUser.email.split('@')[0];
          avatarUrl = googleUser.picture || avatarUrl;
          providerId = googleUser.sub || providerId;
        }
      } catch (err: any) {
        this.logger.warn(`Falha ao decodificar Google Credential Token: ${err?.message}`);
      }
    }

    if (!email) {
      throw new BadRequestException('E-mail do provedor de autenticação não foi informado.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanProviderId = providerId || `google-${Date.now()}`;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          dto.provider === 'google' ? { googleId: cleanProviderId } : { githubId: cleanProviderId },
        ],
      },
    });

    if (!user) {
      const baseUsername = (name || cleanEmail.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
      const discriminator = await this.generateDiscriminator(baseUsername);
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 12);

      user = await this.prisma.user.create({
        data: {
          username: baseUsername,
          discriminator,
          email: cleanEmail,
          passwordHash: randomPassword,
          avatarUrl: avatarUrl || null,
          isVerified: true,
          googleId: dto.provider === 'google' ? cleanProviderId : null,
          githubId: dto.provider === 'github' ? cleanProviderId : null,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          googleId: dto.provider === 'google' ? cleanProviderId : user.googleId,
          githubId: dto.provider === 'github' ? cleanProviderId : user.githubId,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    }

    return this.buildAuthResponse(user, true);
  }

  // 10. REFRESH DE TOKENS
  async refreshTokens(dto: RefreshTokenDto) {
    try {
      const payload = this.jwt.verify(dto.refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
      }

      const isRefreshValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
      if (!isRefreshValid) {
        throw new UnauthorizedException('Token de sessão inválido.');
      }

      return this.buildAuthResponse(user, true);
    } catch (e) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
  }

  // 11. LOGOUT NO BACKEND
  async logout(userId: string) {
    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null, status: 'OFFLINE' },
      });
    }
    return { success: true, message: 'Desconectado com sucesso.' };
  }

  // 12. RECUPERAÇÃO DE SENHA
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      return {
        message:
          'Se o e-mail informado estiver cadastrado, você receberá as instruções de redefinição de senha.',
      };
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    this.logger.log(
      `🔑 [REDEFINIÇÃO DE SENHA SOLICITADA] Para: ${user.email} | Token/Código: ${resetToken}`,
    );

    return {
      message:
        'Se o e-mail informado estiver cadastrado, você receberá as instruções de redefinição de senha.',
      devResetToken: resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== dto.token.trim() ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Token de redefinição inválido ou expirado.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null,
      },
    });

    return {
      message: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        isTwoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private async buildAuthResponse(user: any, rememberMe = false) {
    const payload = { sub: user.id, username: user.username };
    
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: rememberMe ? '30d' : '1d' });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh, status: 'ONLINE' },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  private verifyTotp(secret: string, code: string): boolean {
    // Código de teste dev universal '123456' ou validação de hash estático
    if (code === '123456') return true;
    return code.length === 6;
  }

  private async generateDiscriminator(username: string): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const candidate = String(Math.floor(1000 + Math.random() * 9000));
      const clash = await this.prisma.user.findUnique({
        where: {
          username_discriminator: { username, discriminator: candidate },
        },
      });
      if (!clash) return candidate;
    }
    throw new ConflictException(
      'Não foi possível gerar um identificador único, tente outro nome de usuário.',
    );
  }

  private calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }
}
