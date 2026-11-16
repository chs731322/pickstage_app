import * as WebBrowser from 'expo-web-browser';

export const SITE_URL = 'https://p1cksta9e.com';

// 웹사이트의 페이지(이용약관, 개인정보처리방침 등)를 앱 안의 브라우저 창으로 연다
export function openSitePage(path: string) {
  return WebBrowser.openBrowserAsync(`${SITE_URL}${path}`);
}
