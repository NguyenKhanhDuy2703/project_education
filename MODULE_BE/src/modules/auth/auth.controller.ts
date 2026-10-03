import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { User } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('app.env') === 'production',
      sameSite: 'strict' as const,
      // Access token expiry read from config (default 15 min → ms)
      maxAge: this.parseDurationMs(
        this.configService.get<string>('jwt.accessTokenExpiresIn') ?? '15m',
      ),
    };
  }

  /** Converts simple duration strings like '15m', '1h', '7d' to milliseconds. */
  private parseDurationMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // fallback 15m
    const value = parseInt(match[1], 10);
    const unit: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (unit[match[2]] ?? 60000);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    // Lưu AccessToken vào HttpOnly Cookie
    res.cookie('accessToken', result.accessToken, this.cookieOptions);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    res.cookie('accessToken', result.accessToken, this.cookieOptions);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(refreshTokenDto.refreshToken);
    res.clearCookie('accessToken');
    return result;
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  googleLogin() {
    // Passport redirect — không có body
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback — issues JWT and redirects to FE' })
  async googleCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.generateTokens(req.user);
    res.cookie('accessToken', tokens.accessToken, this.cookieOptions);

    const rawFrontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const frontendUrl = rawFrontendUrl.split(',')[0].trim().replace(/\/$/, '');
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);
    return res.redirect(redirectUrl.toString());
  }
}
