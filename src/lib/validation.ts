// 입력 검사 (서버도 다시 검사하지만, 화면에서 먼저 알려주면 빠르다)

// 아주 느슨한 이메일 형식: 공백 없이 "무언가@무언가.무언가"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

// 이메일 입력 검사 결과: 문제가 없으면 null, 있으면 사용자에게 보여줄 문구
export function emailError(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해주세요.';
  if (!isValidEmail(email)) return '올바른 이메일 형식이 아니에요.';
  return null;
}

// 비밀번호: 영문 + 숫자 + 특수문자를 모두 포함해 8~20자 (서버 SignupRequest와 같은 규칙)
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,20}$/;

export function isValidPassword(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}

export const PASSWORD_RULE = '영문, 숫자, 특수문자를 모두 포함해 8~20자로 입력해주세요.';

// 닉네임: 앞뒤 공백을 뺀 2~10자
export function isValidNickname(nickname: string): boolean {
  const length = nickname.trim().length;
  return length >= 2 && length <= 10;
}
