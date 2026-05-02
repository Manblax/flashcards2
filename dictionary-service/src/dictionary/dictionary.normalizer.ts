import { Injectable } from '@nestjs/common';
import type {
  DictionaryLookupResult,
  ProviderLookupResult,
} from './dictionary.types';
import { normalizeWord } from './dictionary.utils';

@Injectable()
export class DictionaryNormalizer {
  normalize(
    word: string,
    cambridge?: ProviderLookupResult,
    oxford?: ProviderLookupResult,
  ): DictionaryLookupResult {
    const definitionProvider =
      cambridge?.definitions.length ? cambridge : oxford?.definitions.length ? oxford : undefined;
    const definitions = definitionProvider?.definitions || [];
    const ipa = {
      uk: cambridge?.ipa.uk || oxford?.ipa.uk,
      us: cambridge?.ipa.us || oxford?.ipa.us,
    };
    const audio = {
      uk: cambridge?.audio.uk || oxford?.audio.uk,
      us: cambridge?.audio.us || oxford?.audio.us,
    };

    return {
      word,
      normalizedWord:
        cambridge?.normalizedWord || oxford?.normalizedWord || normalizeWord(word),
      suggestedDefinition: definitions[0]?.text || null,
      definitions,
      ipa,
      audio,
      sources: {
        definitions: definitionProvider?.source,
        ipa: ipa.uk || ipa.us ? (cambridge?.ipa.uk || cambridge?.ipa.us ? 'cambridge' : 'oxford') : undefined,
        audio:
          audio.uk || audio.us
            ? cambridge?.audio.uk || cambridge?.audio.us
              ? 'cambridge'
              : 'oxford'
            : undefined,
      },
    };
  }
}
