import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { validateLookupWord } from './dictionary.utils';

@Controller()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('internal/lookup')
  lookup(@Query('word') word?: string) {
    const normalizedWord = validateLookupWord(word);

    if (!normalizedWord) {
      throw new BadRequestException('Invalid word');
    }

    return this.dictionaryService.lookup(normalizedWord);
  }
}
