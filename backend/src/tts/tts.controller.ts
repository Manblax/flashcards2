import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TtsService } from './tts.service';

@ApiTags('Speech')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tts')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Post()
  @ApiOperation({
    summary: 'Synthesize English text or reuse cached MP3 audio',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text', 'variant'],
      properties: {
        text: {
          type: 'string',
          description: 'Plain text, 1–4000 UTF-8 bytes after trimming',
        },
        variant: { type: 'string', enum: ['uk', 'us'] },
      },
    },
  })
  @ApiProduces('audio/mpeg')
  @ApiResponse({ status: 200, description: 'MP3 audio' })
  @ApiResponse({ status: 400, description: 'Invalid text or variant' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 429,
    description: '60 requests per user per minute exceeded',
  })
  @ApiResponse({ status: 502, description: 'Speech provider unavailable' })
  async synthesize(
    @CurrentUser('userId') userId: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const audio = await this.tts.synthesize(userId, body);
    res
      .status(200)
      .set({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store',
      })
      .send(audio);
  }
}
