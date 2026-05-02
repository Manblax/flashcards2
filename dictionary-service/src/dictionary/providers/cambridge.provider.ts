import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type {
  ProviderDefinition,
  ProviderLookupResult,
} from '../dictionary.types';
import {
  cleanText,
  firstNonEmpty,
  normalizeWord,
  toAbsoluteUrl,
  uniqueStrings,
} from '../dictionary.utils';
import { fetchHtml } from './http-client';

const CAMBRIDGE_BASE_URL = 'https://dictionary.cambridge.org';

@Injectable()
export class CambridgeProvider {
  private readonly timeoutMs = Number(
    process.env.DICTIONARY_TIMEOUT_MS || 6000,
  );

  async lookup(word: string): Promise<ProviderLookupResult> {
    const normalizedWord = normalizeWord(word);
    const url = `${CAMBRIDGE_BASE_URL}/dictionary/english/${encodeURIComponent(
      normalizedWord.replace(/\s+/g, '-'),
    )}`;
    const html = await fetchHtml(url, this.timeoutMs);

    return this.parse(html, word);
  }

  parse(html: string, word: string): ProviderLookupResult {
    const $ = cheerio.load(html);
    const normalizedWord = normalizeWord(word);
    const definitions: ProviderDefinition[] = [];
    const ipa = {
      uk: this.extractIpa($, '.uk'),
      us: this.extractIpa($, '.us'),
    };
    const audio = {
      uk: this.extractAudio($, '.uk'),
      us: this.extractAudio($, '.us'),
    };

    $('.entry-body__el').each((_, entry) => {
      const entryNode = $(entry);
      const partOfSpeech =
        cleanText(entryNode.find('.posgram .pos').first().text()) ||
        cleanText(entryNode.find('.pos-header .pos').first().text()) ||
        undefined;
      entryNode.find('.def-block').each((__, block) => {
        const definition = this.extractDefinition($, block);

        if (!definition) {
          return;
        }

        definitions.push({
          text: definition,
          partOfSpeech,
          guideWord: this.extractGuideWord($, block),
          cefr: this.extractCefr($, block),
          examples: this.extractExamples($, block),
          source: 'cambridge',
        });
      });
    });

    if (definitions.length === 0) {
      $('.def-block').each((_, block) => {
        const definition = this.extractDefinition($, block);

        if (!definition) {
          return;
        }

        definitions.push({
          text: definition,
          guideWord: this.extractGuideWord($, block),
          examples: this.extractExamples($, block),
          source: 'cambridge',
        });
      });
    }

    return {
      source: 'cambridge',
      word,
      normalizedWord,
      definitions: this.dedupeDefinitions(definitions),
      ipa,
      audio,
    };
  }

  private extractDefinition($: CheerioAPI, block: any) {
    const definition =
      cleanText($(block).find('.def.ddef_d.db').first().text()) ||
      cleanText($(block).find('.def').first().text()) ||
      undefined;

    return definition?.replace(/:$/, '');
  }

  private extractIpa($: CheerioAPI, rootSelector: string) {
    return (
      cleanText($(`${rootSelector} .pron`).first().text()) ||
      cleanText($(`${rootSelector} .ipa`).first().text()) ||
      undefined
    );
  }

  private extractCefr($: CheerioAPI, block: any) {
    return (
      cleanText($(block).find('.def-info .epp-xref.dxref').first().text()) ||
      cleanText($(block).find('.def-info .epp-xref').first().text()) ||
      cleanText($(block).find('.epp-xref.dxref').first().text()) ||
      cleanText($(block).find('.epp-xref').first().text()) ||
      undefined
    );
  }

  private extractGuideWord($: CheerioAPI, block: any) {
    return this.normalizeGuideWord(
      cleanText($(block).prevAll('.guideword').first().find('.gw').text()) ||
        cleanText($(block).prevAll('.guideword').first().text()) ||
        cleanText(
          $(block).closest('.pr.dsense').find('.guideword .gw').first().text(),
        ) ||
        cleanText(
          $(block).closest('.pr.dsense').find('.guideword').first().text(),
        ) ||
        cleanText(
          $(block).closest('.sense-body').prev('.guideword').find('.gw').text(),
        ) ||
        cleanText($(block).closest('.sense-body').prev('.guideword').text()) ||
        undefined,
    );
  }

  private normalizeGuideWord(value: string | undefined) {
    const guideWord = cleanText(value).replace(/^\((.*)\)$/, '$1');

    return guideWord || undefined;
  }

  private extractExamples($: CheerioAPI, block: any) {
    const examples: string[] = [];

    $(block)
      .find('.examp, .eg')
      .each((_, example) => {
        const exampleNode = $(example);

        if (exampleNode.hasClass('examp')) {
          const nestedExamples = exampleNode.find('.eg');

          if (nestedExamples.length) {
            nestedExamples.each((__, nestedExample) => {
              examples.push(cleanText($(nestedExample).text()));
            });
          } else {
            examples.push(cleanText(exampleNode.text()));
          }

          return;
        }

        if (!exampleNode.closest('.examp').length) {
          examples.push(cleanText(exampleNode.text()));
        }
      });

    return uniqueStrings(examples).slice(0, 5);
  }

  private extractAudio($: CheerioAPI, rootSelector: string) {
    const source = firstNonEmpty(
      $(`${rootSelector} source[type="audio/mpeg"]`).first().attr('src'),
      $(`${rootSelector} source`).first().attr('src'),
      $(`${rootSelector} .daud source`).first().attr('src'),
    );

    return toAbsoluteUrl(source, CAMBRIDGE_BASE_URL);
  }

  private dedupeDefinitions(definitions: ProviderDefinition[]) {
    const seen = new Set<string>();

    return definitions.filter((definition) => {
      const key = `${definition.partOfSpeech || ''}:${definition.text}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}
