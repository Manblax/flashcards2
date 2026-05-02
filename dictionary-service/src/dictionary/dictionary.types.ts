export type DictionarySource = 'cambridge' | 'oxford';

export interface ProviderDefinition {
  text: string;
  partOfSpeech?: string;
  guideWord?: string;
  cefr?: string;
  examples: string[];
  source: DictionarySource;
}

export interface ProviderLookupResult {
  source: DictionarySource;
  word: string;
  normalizedWord: string;
  definitions: ProviderDefinition[];
  ipa: {
    uk?: string;
    us?: string;
  };
  audio: {
    uk?: string;
    us?: string;
  };
}

export interface DictionaryLookupResult {
  word: string;
  normalizedWord: string;
  suggestedDefinition: string | null;
  definitions: ProviderDefinition[];
  ipa: {
    uk?: string;
    us?: string;
  };
  audio: {
    uk?: string;
    us?: string;
  };
  sources: {
    definitions?: DictionarySource;
    ipa?: DictionarySource;
    audio?: DictionarySource;
  };
}
