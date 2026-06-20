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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DictionaryService } from './dictionary.service';
import type {
  DictionaryPreferences,
  DictionarySource,
} from './dictionary.types';
import { validateLookupWord } from './dictionary.utils';

@ApiTags('Dictionary')
@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('lookup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Look up definitions, pronunciation, and audio for a word',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['cambridge', 'oxford'],
    description: 'Dictionary used for definitions, IPA, and audio',
  })
  @ApiResponse({ status: 400, description: 'Invalid word' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async lookup(@Query('word') word?: string, @Query('source') source?: string) {
    const normalizedWord = validateLookupWord(word);

    if (!normalizedWord) {
      throw new BadRequestException('Invalid word');
    }

    const preferences: DictionaryPreferences = {
      source: parseDictionarySource(source),
    };

    return this.dictionaryService.lookup(normalizedWord, preferences);
  }

  @Get('audio/:id')
  @ApiOperation({ summary: 'Stream cached dictionary pronunciation audio' })
  @ApiProduces('audio/mpeg')
  @ApiResponse({ status: 200, description: 'Audio stream' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  @ApiResponse({ status: 502, description: 'Upstream audio source failed' })
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

function parseDictionarySource(value?: string): DictionarySource {
  if (!value) {
    return 'cambridge';
  }

  if (value === 'cambridge' || value === 'oxford') {
    return value;
  }

  throw new BadRequestException('Invalid dictionary source');
}
