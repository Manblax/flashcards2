import { DictionaryNormalizer } from './dictionary.normalizer';
import type { ProviderLookupResult } from './dictionary.types';

const cambridge: ProviderLookupResult = {
  source: 'cambridge',
  word: 'run',
  normalizedWord: 'run',
  definitions: [
    {
      text: 'to move fast on foot',
      examples: [],
      source: 'cambridge',
    },
  ],
  ipa: { uk: '/rʌn/' },
  audio: {},
};

const oxford: ProviderLookupResult = {
  source: 'oxford',
  word: 'run',
  normalizedWord: 'run',
  definitions: [
    {
      text: 'to move faster than a walk',
      examples: [],
      source: 'oxford',
    },
  ],
  ipa: { us: '/rʌn/' },
  audio: { uk: 'https://example.com/uk.mp3' },
};

describe('DictionaryNormalizer', () => {
  const normalizer = new DictionaryNormalizer();

  it('prefers Cambridge definitions and fills missing audio from Oxford', () => {
    const result = normalizer.normalize('run', cambridge, oxford);

    expect(result.suggestedDefinition).toBe('to move fast on foot');
    expect(result.definitions[0].source).toBe('cambridge');
    expect(result.ipa).toEqual({ uk: '/rʌn/', us: '/rʌn/' });
    expect(result.audio.uk).toBe('https://example.com/uk.mp3');
  });

  it('uses Oxford definitions when Cambridge has none', () => {
    const result = normalizer.normalize(
      'run',
      { ...cambridge, definitions: [] },
      oxford,
    );

    expect(result.suggestedDefinition).toBe('to move faster than a walk');
    expect(result.sources.definitions).toBe('oxford');
  });

  it('returns an empty result when providers have no data', () => {
    const result = normalizer.normalize('unknown');

    expect(result.suggestedDefinition).toBeNull();
    expect(result.definitions).toEqual([]);
    expect(result.normalizedWord).toBe('unknown');
  });
});
