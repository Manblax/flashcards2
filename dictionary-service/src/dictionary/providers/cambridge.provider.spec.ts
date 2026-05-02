import { readFileSync } from 'fs';
import { join } from 'path';
import { CambridgeProvider } from './cambridge.provider';

describe('CambridgeProvider', () => {
  it('parses definitions, guide words, IPA, and audio from Cambridge HTML', () => {
    const html = readFileSync(
      join(__dirname, '../test-fixtures/cambridge-run.html'),
      'utf8',
    );
    const result = new CambridgeProvider().parse(html, 'run');

    expect(result.definitions).toEqual([
      {
        text: 'to move on your feet at a faster speed than walking',
        partOfSpeech: 'verb',
        guideWord: 'MOVE FAST',
        cefr: undefined,
        examples: ['I can run a mile.'],
        source: 'cambridge',
      },
    ]);
    expect(result.ipa).toEqual({ uk: '/rʌn/', us: '/rʌn/' });
    expect(result.audio.uk).toBe(
      'https://dictionary.cambridge.org/media/english/uk_pron/u/ukr/ukrun/ukrun.mp3',
    );
  });
});
