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

const OXFORD_BASE_URL = 'https://www.oxfordlearnersdictionaries.com';

@Injectable()
export class OxfordProvider {
  private readonly timeoutMs = Number(
    process.env.DICTIONARY_TIMEOUT_MS || 6000,
  );

  async lookup(word: string): Promise<ProviderLookupResult> {
    const normalizedWord = normalizeWord(word);
    const url = `${OXFORD_BASE_URL}/definition/english/${encodeURIComponent(
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
      uk:
        cleanText($('.phons_br .phon').first().text()) ||
        cleanText($('.phonetics .phon').first().text()) ||
        undefined,
      us:
        cleanText($('.phons_n_am .phon').first().text()) ||
        cleanText($('.phonetics .phon').eq(1).text()) ||
        undefined,
    };
    const audio = {
      uk: this.extractAudio($, '.phons_br'),
      us: this.extractAudio($, '.phons_n_am'),
    };

    $('.entry').each((_, entry) => {
      const entryNode = $(entry);
      const partOfSpeech =
        cleanText(entryNode.find('.webtop .pos').first().text()) ||
        cleanText(entryNode.find('.pos').first().text()) ||
        undefined;

      entryNode.find('.sense').each((__, sense) => {
        const text = this.extractDefinition($, sense);

        if (!text) {
          return;
        }

        definitions.push({
          text,
          partOfSpeech,
          guideWord: this.extractGuideWord($, sense),
          cefr: this.extractCefr($, sense),
          examples: this.extractExamples($, sense),
          source: 'oxford',
        });
      });
    });

    if (definitions.length === 0) {
      $('.def').each((_, definition) => {
        const text = cleanText($(definition).text());

        if (!text) {
          return;
        }

        definitions.push({
          text,
          examples: [],
          source: 'oxford',
        });
      });
    }

    return {
      source: 'oxford',
      word,
      normalizedWord,
      definitions: this.dedupeDefinitions(definitions),
      ipa,
      audio,
    };
  }

  private extractDefinition($: CheerioAPI, sense: any) {
    return (
      cleanText($(sense).find('.def').first().text()) ||
      cleanText($(sense).find('.xrefs .xr').first().text()) ||
      undefined
    );
  }

  private extractGuideWord($: CheerioAPI, sense: any) {
    return (
      cleanText($(sense).closest('.shcut-g').find('.shcut').first().text()) ||
      undefined
    );
  }

  private extractCefr($: CheerioAPI, sense: any) {
    const cefr = cleanText($(sense).attr('cefr'));

    return cefr ? cefr.toUpperCase() : undefined;
  }

  private extractExamples($: CheerioAPI, sense: any) {
    return uniqueStrings(
      $(sense)
        .find('.examples .x, .x')
        .map((_, example) => cleanText($(example).text()))
        .get(),
    ).slice(0, 5);
  }

  private extractAudio($: CheerioAPI, rootSelector: string) {
    const source = firstNonEmpty(
      $(`${rootSelector} .sound`).first().attr('data-src-mp3'),
      $(`${rootSelector} .sound`).first().attr('data-src-ogg'),
      $(`${rootSelector} audio source[type="audio/mpeg"]`).first().attr('src'),
      $(`${rootSelector} audio source`).first().attr('src'),
    );

    return toAbsoluteUrl(source, OXFORD_BASE_URL);
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
