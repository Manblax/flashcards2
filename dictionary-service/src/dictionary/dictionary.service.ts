import { Injectable } from '@nestjs/common';
import type { ProviderLookupResult } from './dictionary.types';
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

  async lookup(word: string) {
    let cambridge: ProviderLookupResult | undefined;
    let oxford: ProviderLookupResult | undefined;

    try {
      cambridge = await this.cambridgeProvider.lookup(word);
    } catch {
      cambridge = undefined;
    }

    if (this.shouldUseOxford(cambridge)) {
      try {
        oxford = await this.oxfordProvider.lookup(word);
      } catch {
        oxford = undefined;
      }
    }

    return this.normalizer.normalize(word, cambridge, oxford);
  }

  private shouldUseOxford(cambridge?: ProviderLookupResult) {
    if (!cambridge) {
      return true;
    }

    return (
      cambridge.definitions.length === 0 ||
      !cambridge.ipa.uk ||
      !cambridge.ipa.us ||
      !cambridge.audio.uk ||
      !cambridge.audio.us
    );
  }
}
