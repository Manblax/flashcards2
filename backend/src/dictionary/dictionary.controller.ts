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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DictionaryService } from './dictionary.service';
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
  @ApiResponse({ status: 400, description: 'Invalid word' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async lookup(@Query('word') word?: string) {
    const normalizedWord = validateLookupWord(word);

    if (!normalizedWord) {
      throw new BadRequestException('Invalid word');
    }

    return this.dictionaryService.lookup(normalizedWord);
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
