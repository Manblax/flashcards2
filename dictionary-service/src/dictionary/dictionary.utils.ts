export function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function validateLookupWord(word: string | undefined) {
  const normalizedWord = normalizeWord(word || '');

  if (!normalizedWord) {
    return null;
  }

  if (normalizedWord.length > 80) {
    return null;
  }

  if (!/^[a-z][a-z\s'-]*$/i.test(normalizedWord)) {
    return null;
  }

  return normalizedWord;
}

export function cleanText(value: string | undefined | null) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => Boolean(value && value.trim()));
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

export function toAbsoluteUrl(value: string | undefined, baseUrl: string) {
  if (!value) {
    return undefined;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (value.startsWith('/')) {
    return new URL(value, baseUrl).toString();
  }

  return value;
}
