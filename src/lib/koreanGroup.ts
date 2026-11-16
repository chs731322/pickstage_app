// 이름 목록을 가나다 묶음으로 나눌 때 쓴다 (공연장·아티스트 목록 공용)

const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 쌍자음은 짝이 되는 자음 묶음에 넣는다 (ㄲ→ㄱ)
const MERGE: Record<string, string> = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };

// 이름의 첫 글자로 묶음 이름을 정한다: 한글은 초성(ㄱ,ㄴ…), 영문은 대문자, 숫자·기호는 '#'
export function nameGroupOf(name: string): string {
  const ch = name.trim().charAt(0);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const initial = INITIALS[Math.floor((code - 0xac00) / 588)];
    return MERGE[initial] ?? initial;
  }
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : '#';
}
