import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { BcryptService } from '../../utils/bcrypt.util';
import { LoginDto, RegisterDto } from './auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingPhone = await this.usersService.findByPhone(registerDto.phone);
    if (existingPhone) {
      throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await this.bcryptService.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return {
      message: 'User registered successfully',
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
    const user = await this.usersService.findByEmailOrPhone(loginDto.identifier, true);
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
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'ACCESS_TOKEN',
    });
    return { accessToken };
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenExpiresIn = this.configService.get<string>('jwt.accessTokenExpiresIn') ?? '15m';
    const refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshTokenExpiresIn') ?? '7d';

    const accessToken = await this.jwtService.signAsync(
      { payload, type: 'ACCESS_TOKEN' },
      { expiresIn: accessTokenExpiresIn },
    );
    const refreshToken = await this.jwtService.signAsync(
      { payload, type: 'REFRESH_TOKEN' },
      { expiresIn: refreshTokenExpiresIn },
    );

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.payload?.userId || payload.userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const userWithToken = await this.usersService.findByRefreshToken(token);
      if (!userWithToken || userWithToken.id !== user.id) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByRefreshToken(token);
    if (user) {
      await this.usersService.updateRefreshToken(user.id, null);
    }
    return { message: 'Logged out successfully' };
  }
}
