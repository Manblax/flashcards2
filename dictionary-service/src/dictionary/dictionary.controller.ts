import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import type { DictionarySource } from './dictionary.types';
import { validateLookupWord } from './dictionary.utils';

@Controller()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('internal/lookup')
  lookup(@Query('word') word?: string, @Query('source') source?: string) {
    const normalizedWord = validateLookupWord(word);

    if (!normalizedWord) {
      throw new BadRequestException('Invalid word');
    }

    return this.dictionaryService.lookup(
      normalizedWord,
      parseDictionarySource(source),
    );
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
