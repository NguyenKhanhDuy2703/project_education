import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { User } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions;
  private readonly refreshCookieOptions;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const isProd =
      this.configService.get<string>('app.env') === 'production' ||
      process.env.NODE_ENV === 'production';

    this.cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      // Access token expiry read from config (default 15 min → ms)
      maxAge: this.parseDurationMs(
        this.configService.get<string>('jwt.accessTokenExpiresIn') ?? '15m',
      ),
    };

    this.refreshCookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      // Refresh token expiry read from config (default 7 days → ms)
      maxAge: this.parseDurationMs(
        this.configService.get<string>('jwt.refreshTokenExpiresIn') ?? '7d',
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
    // Store tokens in HttpOnly Cookies
    res.cookie('accessToken', result.accessToken, this.cookieOptions);
    res.cookie('refreshToken', result.refreshToken, this.refreshCookieOptions);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = refreshTokenDto?.refreshToken || (req as any).cookies?.refreshToken;
    const result = await this.authService.refreshToken(token);
    res.cookie('accessToken', result.accessToken, this.cookieOptions);
    res.cookie('refreshToken', result.refreshToken, this.refreshCookieOptions);
    return result;
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (alias)' })
  async refreshTokenAlias(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.refresh(refreshTokenDto, req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = refreshTokenDto?.refreshToken || (req as any).cookies?.refreshToken;
    const result = await this.authService.logout(token);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return result;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current logged in user profile' })
  async getProfile(@Req() req: Request & { user: any }) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  googleLogin() {
    // Passport redirect — empty body
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback — issues JWT and redirects to FE' })
  async googleCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    try {
      const tokens = await this.authService.generateTokens(req.user);
      res.cookie('accessToken', tokens.accessToken, this.cookieOptions);
      res.cookie('refreshToken', tokens.refreshToken, this.refreshCookieOptions);

      // Determine target frontend URL dynamically based on request host
      const host = (req.headers.host || '').toLowerCase();
      let frontendUrl = 'http://localhost:5173';

      if (host.includes('onrender.com')) {
        frontendUrl = 'https://project-education-red.vercel.app';
      } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
        frontendUrl = 'http://localhost:5173';
      } else {
        const rawFrontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        let candidate = rawFrontendUrl.split(',')[0].trim().replace(/\/$/, '');
        if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
          candidate = `https://${candidate}`;
        }
        frontendUrl = candidate;
      }

      const redirectUrl = new URL('/auth/callback', frontendUrl);
      redirectUrl.searchParams.set('token', tokens.accessToken);
      redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('[AuthController] googleCallback failed:', error);
      const fallbackUrl = 'https://project-education-red.vercel.app/login?error=oauth_failed';
      return res.redirect(fallbackUrl);
    }
  }
}
