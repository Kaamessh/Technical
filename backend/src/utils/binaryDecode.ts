export function binaryToDecimal(binaryStr: string): number {
  const cleanBinary = binaryStr.trim();
  return parseInt(cleanBinary, 2);
}

export function computeFinalPassword(binaryClue: string, targetWord: string): string {
  const decimalVal = binaryToDecimal(binaryClue);
  return `${decimalVal}${targetWord.trim()}`.toLowerCase();
}

export function verifyFinalPassword(inputPassword: string, binaryClue: string, targetWord: string): boolean {
  const expected = computeFinalPassword(binaryClue, targetWord);
  const normalizedInput = inputPassword.trim().toLowerCase();
  return normalizedInput === expected;
}
