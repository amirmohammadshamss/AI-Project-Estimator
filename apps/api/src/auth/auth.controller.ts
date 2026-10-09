import { messages } from '../content/auth-auth.controller';
import { runtimeEnvironment } from '../config/runtime-environment';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { RequestUser } from './types';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: runtimeEnvironment().secureCookies,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
      path: '/',
    });
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: runtimeEnvironment().secureCookies,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      path: '/',
      httpOnly: true,
      secure: runtimeEnvironment().secureCookies,
      sameSite: 'lax',
    });
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      path: '/',
      httpOnly: true,
      secure: runtimeEnvironment().secureCookies,
      sameSite: 'lax',
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto.email, dto.password, dto.name);
    this.setAuthCookies(res, tokens);
    return { success: true };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto.email, dto.password);
    this.setAuthCookies(res, tokens);
    return { success: true };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('cookieAuth')
  async logout(@CurrentUser() user: RequestUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.userId);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException(messages.missingRefreshToken);
    }

    try {
      const tokens = await this.authService.refresh(refreshToken);
      this.setAuthCookies(res, tokens);
      return { success: true };
    } catch (error) {
      if (error instanceof UnauthorizedException) this.clearAuthCookies(res);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('cookieAuth')
  async me(@CurrentUser() user: RequestUser) {
    const fullUser = await this.usersService.findById(user.userId);
    if (!fullUser) {
      throw new UnauthorizedException(messages.userNoLongerExists);
    }
    return fullUser;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('cookieAuth')
  async updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto.name);
  }
}
