import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './interfaces/jwt-user.interface';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and receive a JWT access token' })
  @ApiResponse({ status: 201, description: 'Authentication succeeded' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate the current authentication session' })
  @ApiResponse({ status: 200, description: 'Authentication is valid' })
  @ApiResponse({ status: 401, description: 'Authentication is invalid' })
  session(@CurrentUser() user: JwtUser) {
    return {
      authenticated: true,
      user,
    };
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  googleAuth(@Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/auth/google/callback';

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
  @ApiOperation({ summary: 'Complete Google OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to the frontend' })
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
