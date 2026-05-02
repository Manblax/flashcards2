import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { DictionaryService } from './dictionary.service';
import { validateLookupWord } from './dictionary.utils';

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('lookup')
  @UseGuards(AuthGuard('jwt'))
  async lookup(@Query('word') word?: string) {
    const normalizedWord = validateLookupWord(word);

    if (!normalizedWord) {
      throw new BadRequestException('Invalid word');
    }

    return this.dictionaryService.lookup(normalizedWord);
  }

  @Get('audio/:id')
  async audio(@Param('id') id: string, @Res() res: Response) {
    const audio = await this.dictionaryService.findAudio(id);

    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    const response = await this.dictionaryService.fetchAudio(audio.sourceUrl);

    if (!response.ok) {
      throw new BadGatewayException('Audio source failed');
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.send(buffer);
  }
}
