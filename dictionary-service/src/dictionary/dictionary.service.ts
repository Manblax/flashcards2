import { Injectable } from '@nestjs/common';
import type {
  DictionarySource,
  ProviderLookupResult,
} from './dictionary.types';
import { DictionaryNormalizer } from './dictionary.normalizer';
import { CambridgeProvider } from './providers/cambridge.provider';
import { OxfordProvider } from './providers/oxford.provider';

@Injectable()
export class DictionaryService {
  constructor(
    private readonly cambridgeProvider: CambridgeProvider,
    private readonly oxfordProvider: OxfordProvider,
    private readonly normalizer: DictionaryNormalizer,
  ) {}

  async lookup(word: string, source: DictionarySource = 'cambridge') {
    let cambridge: ProviderLookupResult | undefined;
    let oxford: ProviderLookupResult | undefined;

    if (source === 'cambridge') {
      try {
        cambridge = await this.cambridgeProvider.lookup(word);
      } catch {
        cambridge = undefined;
      }
    } else {
      try {
        oxford = await this.oxfordProvider.lookup(word);
      } catch {
        oxford = undefined;
      }
    }

    return this.normalizer.normalize(word, cambridge, oxford);
  }
}
