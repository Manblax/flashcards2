import { DictionaryService } from './dictionary.service';

describe('DictionaryService', () => {
  const cambridgeProvider = { lookup: jest.fn() };
  const oxfordProvider = { lookup: jest.fn() };
  const normalizer = { normalize: jest.fn().mockReturnValue({}) };
  const service = new DictionaryService(
    cambridgeProvider as any,
    oxfordProvider as any,
    normalizer as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses only Cambridge when Cambridge is selected', async () => {
    cambridgeProvider.lookup.mockResolvedValue({ source: 'cambridge' });

    await service.lookup('run', 'cambridge');

    expect(cambridgeProvider.lookup).toHaveBeenCalledWith('run');
    expect(oxfordProvider.lookup).not.toHaveBeenCalled();
    expect(normalizer.normalize).toHaveBeenCalledWith(
      'run',
      { source: 'cambridge' },
      undefined,
    );
  });

  it('uses only Oxford when Oxford is selected', async () => {
    oxfordProvider.lookup.mockResolvedValue({ source: 'oxford' });

    await service.lookup('run', 'oxford');

    expect(oxfordProvider.lookup).toHaveBeenCalledWith('run');
    expect(cambridgeProvider.lookup).not.toHaveBeenCalled();
    expect(normalizer.normalize).toHaveBeenCalledWith('run', undefined, {
      source: 'oxford',
    });
  });
});
