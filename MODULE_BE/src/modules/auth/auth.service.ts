import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { BcryptService } from '../../utils/bcrypt.util';
import { AuthSessionService } from './auth-session.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly configService: ConfigService,
    private readonly authSessionService: AuthSessionService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingPhone = await this.usersService.findByPhone(registerDto.phone);
    if (existingPhone) {
      throw new ConflictException('Phone number already in use');
    }

    const hashedPassword = await this.bcryptService.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      password: hashedPassword,
      role: 'user', // Default to 'user' role to strictly prevent privilege escalation
    });

    return {
      message: 'User registered successfully',
      nextAction: 'login' as const,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const rawIdentifier = (loginDto.identifier || loginDto.phoneOrEmail)?.trim();
    if (!rawIdentifier) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.usersService.findByEmailOrPhone(rawIdentifier, true);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.bcryptService.comparePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isContributor: user.isContributor,
        contributorStatus: user.contributorStatus,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.bcryptService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign({
      payload: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      type: 'ACCESS_TOKEN',
    });
    return { accessToken };
  }

  private async signTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenExpiresIn = this.configService.get<string>('jwt.accessTokenExpiresIn') ?? '15m';
    const refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshTokenExpiresIn') ?? '7d';

    const accessToken = await this.jwtService.signAsync(
      { payload, type: 'ACCESS_TOKEN' },
      { expiresIn: accessTokenExpiresIn as any },
    );
    const refreshToken = await this.jwtService.signAsync(
      { payload, type: 'REFRESH_TOKEN' },
      { expiresIn: refreshTokenExpiresIn as any },
    );

    return { accessToken, refreshToken };
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.signTokens(user);
    await this.authSessionService.createSession(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.type !== 'REFRESH_TOKEN') {
        throw new UnauthorizedException('Token is not a valid refresh token');
      }

      const user = await this.usersService.findById(payload.payload?.userId || payload.userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const newTokens = await this.signTokens(user);

      // Atomic rotation via AuthSession with 30-second Grace Window
      const rotation = await this.authSessionService.validateAndRotate(token, newTokens.refreshToken);
      if (rotation.isGraceWindow) {
        // Idempotent recovery for concurrent requests: return fresh access token with presented refresh token
        return {
          accessToken: newTokens.accessToken,
          refreshToken: token,
        };
      }
      return newTokens;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(token?: string | null): Promise<{ message: string }> {
    if (token) {
      try {
        const hash = this.authSessionService.hashToken(token);
        const session = await this.prisma.authSession.findFirst({
          where: {
            OR: [{ refreshTokenHash: hash }, { previousTokenHash: hash }],
          },
        });
        if (session) {
          await this.authSessionService.revokeSession(session.id);
        }
      } catch {}
      const user = await this.usersService.findByRefreshToken(token);
      if (user) {
        await this.usersService.updateRefreshToken(user.id, null);
      }
    }
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.password) {
      throw new BadRequestException('Tài khoản không có mật khẩu cục bộ hoặc chưa được thiết lập');
    }

    const isCurrentValid = await this.bcryptService.comparePassword(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const hashedNewPassword = await this.bcryptService.hashPassword(dto.newPassword);
    await this.usersService.update(userId, {
      password: hashedNewPassword,
    });

    await this.authSessionService.revokeAllUserSessions(userId);

    return { message: 'Đổi mật khẩu thành công' };
  }
}
