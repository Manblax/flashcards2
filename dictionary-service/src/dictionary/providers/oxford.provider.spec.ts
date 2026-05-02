import { readFileSync } from 'fs';
import { join } from 'path';
import { OxfordProvider } from './oxford.provider';

describe('OxfordProvider', () => {
  it('parses definitions, examples, IPA, and audio from Oxford HTML', () => {
    const html = readFileSync(
      join(__dirname, '../test-fixtures/oxford-run.html'),
      'utf8',
    );
    const result = new OxfordProvider().parse(html, 'run');

    expect(result.definitions).toEqual([
      {
        text: 'to move using your legs, going faster than when you walk',
        partOfSpeech: 'verb',
        examples: ['She ran across the road.'],
        source: 'oxford',
      },
    ]);
    expect(result.ipa).toEqual({ uk: '/rʌn/', us: '/rʌn/' });
    expect(result.audio).toEqual({
      uk: 'https://example.com/uk-run.mp3',
      us: 'https://example.com/us-run.mp3',
    });
  });
});
