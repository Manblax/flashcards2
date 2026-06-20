export type DictionarySource = 'cambridge' | 'oxford';
export type DictionaryAudioVariant = 'uk' | 'us';

export interface DictionaryPreferences {
  source: DictionarySource;
}

export interface DictionaryDefinition {
  text: string;
  partOfSpeech?: string;
  guideWord?: string;
  cefr?: string;
  examples: string[];
  source: DictionarySource;
}

export interface InternalDictionaryLookupResult {
  word: string;
  normalizedWord: string;
  suggestedDefinition: string | null;
  definitions: DictionaryDefinition[];
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

export interface PublicDictionaryLookupResult extends InternalDictionaryLookupResult {
  cached: boolean;
}
