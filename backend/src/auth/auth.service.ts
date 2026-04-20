import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

interface GoogleUserInfo {
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;

    // Проверка существования
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return {
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Ищем по email или username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username: username }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async loginWithGoogleCode(code: string) {
    const tokenData = await this.exchangeGoogleCodeForTokens(code);
    const googleUser = await this.fetchGoogleUserInfo(tokenData.access_token);

    if (!googleUser.email) {
      throw new UnauthorizedException('Google account email is not available');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      const baseUsername = this.buildBaseUsername(googleUser);
      const uniqueUsername = await this.generateUniqueUsername(baseUsername);
      const randomPasswordHash = await bcrypt.hash(randomUUID(), 10);

      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          username: uniqueUsername,
          password: randomPasswordHash,
        },
      });
    }

    return this.buildAuthResponse(user);
  }

  private async exchangeGoogleCodeForTokens(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange Google authorization code');
    }

    return response.json() as Promise<{ access_token: string }>;
  }

  private async fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Google user profile');
    }

    return response.json() as Promise<GoogleUserInfo>;
  }

  private buildBaseUsername(googleUser: GoogleUserInfo): string {
    const fromName =
      `${googleUser.given_name || ''}${googleUser.family_name || ''}` ||
      googleUser.name ||
      googleUser.email.split('@')[0];

    const normalized = fromName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);

    if (normalized.length >= 3) {
      return normalized;
    }

    return `user${googleUser.email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'google'}`;
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let candidate = baseUsername;
    let suffix = 1;

    while (true) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: candidate },
      });

      if (!existingUser) {
        return candidate;
      }

      candidate = `${baseUsername}${suffix}`;
      suffix += 1;
    }
  }

  private buildAuthResponse(user: { id: string; username: string; email: string }) {
    const payload = { sub: user.id, username: user.username };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, email: user.email },
    };
  }
}
