export function binaryToDecimal(binaryStr: string): number {
  const cleanBinary = binaryStr.replace(/[^01]/g, '');
  if (!cleanBinary) return 0;
  return parseInt(cleanBinary, 2);
}

export function wordToAlphabetPositions(word: string): number[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  const result: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    result.push(clean.charCodeAt(i) - 96);
  }
  return result;
}

export function computeFinalPassword(binaryClue: string, targetWord: string): string {
  const decimalVal = binaryToDecimal(binaryClue);
  const cleanWord = targetWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  return `${decimalVal}${cleanWord}`;
}

export function verifyFinalPassword(inputPassword: string, binaryClue: string, targetWord: string): boolean {
  const expected = computeFinalPassword(binaryClue, targetWord);
  const normalizedInput = inputPassword.trim().toLowerCase().replace(/\s+/g, '');
  return normalizedInput === expected;
}
