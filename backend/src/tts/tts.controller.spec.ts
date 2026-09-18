import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';

describe('TTS HTTP endpoint', () => {
  let app: INestApplication;
  const synthesize = jest.fn().mockResolvedValue(Buffer.from('mp3'));
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [TtsController],
      providers: [
        JwtStrategy,
        { provide: TtsService, useValue: { synthesize } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests before synthesis', async () => {
    await request(app.getHttpServer())
      .post('/tts')
      .send({ text: 'hello', variant: 'uk' })
      .expect(401);
    expect(synthesize).not.toHaveBeenCalled();
  });
  it('returns MP3 bytes to an authenticated user', async () => {
    const token = new JwtService({
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    }).sign({ sub: 'user-1', username: 'test' });
    await request(app.getHttpServer())
      .post('/tts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'hello', variant: 'uk' })
      .expect(200)
      .expect('Content-Type', 'audio/mpeg')
      .expect('Cache-Control', 'private, no-store');
    expect(synthesize).toHaveBeenCalledWith('user-1', {
      text: 'hello',
      variant: 'uk',
    });
  });
});
