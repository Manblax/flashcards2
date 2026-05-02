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

  it('parses current Cambridge work markup without duplicated examples', () => {
    const html = `
      <div class="entry-body__el">
        <div class="pos-header dpos-h">
          <span class="pos dpos">noun</span>
          <span class="uk dpron-i">
            <span class="daud">
              <audio>
                <source type="audio/mpeg" src="/media/english/uk_pron/u/ukw/ukwor/ukwordp005.mp3" />
              </audio>
            </span>
            <span class="pron dpron">/<span class="ipa dipa">wɜːk</span>/</span>
          </span>
          <span class="us dpron-i">
            <span class="pron dpron">/<span class="ipa dipa">wɝːk</span>/</span>
          </span>
        </div>
        <div class="pos-body">
          <div class="pr dsense">
            <h3 class="dsense_h">
              <span class="hw dsense_hw">work</span>
              <span class="pos dsense_pos">noun</span>
              <span class="guideword dsense_gw">(<span>ACTIVITY</span>)</span>
            </h3>
            <div class="sense-body dsense_b">
              <div class="def-block ddef_block">
                <div class="ddef_h">
                  <span class="def-info ddef-info">
                    <span class="epp-xref dxref A1">A1</span>
                  </span>
                  <div class="def ddef_d db">an activity that a person uses effort to do, usually for money: </div>
                </div>
                <div class="def-body ddef_b">
                  <div class="examp dexamp">
                    <span class="lu dlu">do work</span>
                    <span class="eg deg">I've got so much work to do.</span>
                  </div>
                </div>
              </div>
              <div class="def-block ddef_block">
                <div class="ddef_h">
                  <span class="def-info ddef-info">
                    <span class="epp-xref dxref A2">A2</span>
                  </span>
                  <div class="def ddef_d db">the material used by someone at work, or what they produce: </div>
                </div>
                <div class="def-body ddef_b">
                  <div class="examp dexamp">
                    <span class="eg deg">I'll have to take this work home with me.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="pr dsense">
            <h3 class="dsense_h">
              <span class="hw dsense_hw">work</span>
              <span class="pos dsense_pos">noun</span>
              <span class="guideword dsense_gw">(<span>CREATION</span>)</span>
            </h3>
            <div class="sense-body dsense_b">
              <div class="def-block ddef_block">
                <div class="ddef_h">
                  <span class="def-info ddef-info">
                    <span class="epp-xref dxref B2">B2</span>
                  </span>
                  <div class="def ddef_d db">something created as a result of effort: </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const result = new CambridgeProvider().parse(html, 'work');

    expect(result.ipa).toEqual({ uk: '/wɜːk/', us: '/wɝːk/' });
    expect(result.audio.uk).toBe(
      'https://dictionary.cambridge.org/media/english/uk_pron/u/ukw/ukwor/ukwordp005.mp3',
    );
    expect(result.definitions).toEqual([
      {
        text: 'an activity that a person uses effort to do, usually for money',
        partOfSpeech: 'noun',
        guideWord: 'ACTIVITY',
        cefr: 'A1',
        examples: ["I've got so much work to do."],
        source: 'cambridge',
      },
      {
        text: 'the material used by someone at work, or what they produce',
        partOfSpeech: 'noun',
        guideWord: 'ACTIVITY',
        cefr: 'A2',
        examples: ["I'll have to take this work home with me."],
        source: 'cambridge',
      },
      {
        text: 'something created as a result of effort',
        partOfSpeech: 'noun',
        guideWord: 'CREATION',
        cefr: 'B2',
        examples: [],
        source: 'cambridge',
      },
    ]);
  });
});
