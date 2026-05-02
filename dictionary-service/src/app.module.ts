import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary/dictionary.controller';
import { DictionaryService } from './dictionary/dictionary.service';
import { CambridgeProvider } from './dictionary/providers/cambridge.provider';
import { OxfordProvider } from './dictionary/providers/oxford.provider';
import { DictionaryNormalizer } from './dictionary/dictionary.normalizer';

@Module({
  controllers: [DictionaryController],
  providers: [
    DictionaryService,
    CambridgeProvider,
    OxfordProvider,
    DictionaryNormalizer,
  ],
})
export class AppModule {}
