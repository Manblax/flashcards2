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
