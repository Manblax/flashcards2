import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

    if (!clientId) {
      throw new InternalServerErrorException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID.',
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('prompt', 'select_account');

    return res.redirect(authUrl.toString());
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successRedirect = new URL('/auth/callback', frontendUrl);
    const errorRedirect = new URL('/login', frontendUrl);

    if (!code) {
      errorRedirect.searchParams.set('error', 'google_code_missing');
      return res.redirect(errorRedirect.toString());
    }

    try {
      const authResult = await this.authService.loginWithGoogleCode(code);

      successRedirect.searchParams.set('access_token', authResult.access_token);
      successRedirect.searchParams.set('id', authResult.user.id);
      successRedirect.searchParams.set('username', authResult.user.username);
      successRedirect.searchParams.set('email', authResult.user.email);

      return res.redirect(successRedirect.toString());
    } catch {
      errorRedirect.searchParams.set('error', 'google_auth_failed');
      return res.redirect(errorRedirect.toString());
    }
  }
}
