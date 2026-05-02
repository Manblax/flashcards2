import { DictionaryService } from './dictionary.service';
import type { InternalDictionaryLookupResult } from './dictionary.types';

const lookupPayload: InternalDictionaryLookupResult = {
  word: 'run',
  normalizedWord: 'run',
  suggestedDefinition: 'to move fast on foot',
  definitions: [
    {
      text: 'to move fast on foot',
      examples: [],
      source: 'cambridge',
    },
  ],
  ipa: { uk: '/rʌn/' },
  audio: { uk: 'https://example.com/run.mp3' },
  sources: {
    definitions: 'cambridge',
    ipa: 'cambridge',
    audio: 'cambridge',
  },
};

describe('DictionaryService', () => {
  let prisma: any;
  let service: DictionaryService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    prisma = {
      dictionaryEntry: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      dictionaryAudio: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new DictionaryService(prisma);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('returns fresh cache without calling dictionary-service', async () => {
    prisma.dictionaryEntry.findUnique.mockResolvedValue({
      payload: { ...lookupPayload, audio: { uk: '/dictionary/audio/cached' } },
      expiresAt: new Date(Date.now() + 1000),
    });

    const result = await service.lookup('run');

    expect(result.cached).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls dictionary-service on cache miss and stores the normalized payload', async () => {
    prisma.dictionaryEntry.findUnique.mockResolvedValue(null);
    prisma.dictionaryAudio.upsert.mockResolvedValue({});
    prisma.dictionaryEntry.upsert.mockResolvedValue({});
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(lookupPayload),
    });

    const result = await service.lookup('run');

    expect(result.cached).toBe(false);
    expect(result.audio.uk).toMatch(/^\/dictionary\/audio\//);
    expect(prisma.dictionaryAudio.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceUrl: 'https://example.com/run.mp3',
          variant: 'uk',
        }),
      }),
    );
    expect(prisma.dictionaryEntry.upsert).toHaveBeenCalled();
  });
});
