# PICKSTAGE 앱

공연·페스티벌 정보 서비스 [PICKSTAGE](https://p1cksta9e.com)의 모바일 앱입니다. (Expo SDK 58, React Native, TypeScript, Expo Router)
서버는 웹과 같은 백엔드(`pickstage_backend`)를 씁니다.

## 실행

```bash
npm install
npx expo start          # 폰의 Expo Go 앱으로 QR 코드를 찍어서 실행
npx expo start --web    # 컴퓨터 브라우저에서 화면만 빠르게 확인 (개발용)
```

- **실제 폰으로 확인:** App Store에서 **Expo Go**를 설치하고, 컴퓨터와 같은 와이파이에서 `npx expo start`의 QR 코드를 찍습니다.
- **웹 미리보기:** 서버의 CORS가 `http://localhost:5173`만 허용하므로 `npx expo start --web --port 5173`으로 띄워야 서버 데이터가 보입니다. (폰 앱은 CORS와 무관합니다.)
- **iOS 시뮬레이터:** Xcode가 있어야 합니다 (`npx expo start --ios`).
- Expo Go에 없는 네이티브 기능(푸시 알림 토큰 등)은 설치용 빌드에서 확인합니다.

## 안드로이드 설치 파일(APK) 만들기

```bash
npx eas-cli@latest login                                      # 처음 한 번 (Expo 계정)
npx eas-cli@latest build --platform android --profile preview  # 클라우드에서 빌드
```

- 빌드가 끝나면 설치 링크가 나옵니다. 안드로이드 폰에서 열어 설치합니다. (폰에서 "출처를 알 수 없는 앱 설치"를 허용해야 합니다.)
- 설치한 앱은 운영 서버에 접속하므로 어떤 네트워크에서도 동작합니다.
- 안드로이드 푸시 알림은 Firebase(FCM) 설정을 추가해야 동작합니다. 아직 설정하지 않았습니다.
- 설정 파일은 `eas.json`입니다. (`preview`: 팀 확인용 APK, `production`: 스토어 제출용)

## 서버 주소

기본값은 운영 서버입니다. 내 컴퓨터의 서버를 쓰려면 `.env.example`을 `.env`로 복사해 `EXPO_PUBLIC_API_BASE_URL`을 바꿉니다
(폰에서는 `localhost`가 아니라 컴퓨터의 IP, 예: `http://192.168.0.10:8080`).
`EXPO_PUBLIC_` 변수는 앱에 그대로 들어가므로 비밀 키를 넣지 않습니다.

## 구조

```
src/
  app/                 화면 (Expo Router: 파일 하나가 화면 하나)
    _layout.tsx          시작 화면 유지, 글꼴·로그인 정보 불러오기, 화면 이동 규칙(로그인 필요 화면 보호)
    (tabs)/              하단 탭 5개: 홈 · 공연 · 캘린더 · 커뮤니티 · 마이
    festival/[id].tsx    공연 상세 (artist, venue, user 도 같은 방식)
    login · signup · forgot-password   로그아웃 상태에서만 열리는 화면
    notifications · checklist · push-settings   로그인해야 열리는 화면
  components/          공용 화면 조각 (AppText, Screen, WeatherCard, app-tabs ...)
  lib/                 api.ts(서버 통신, 토큰 갱신) · auth.tsx(로그인 상태) · storage.ts(토큰 보관) · queryClient.ts
  theme/               색, Pretendard 글꼴, 간격
  types/api.ts         서버 응답 자료형
```

- 로그인 정보는 폰의 보안 저장소(iOS 키체인 / Android 키스토어)에 저장합니다.
- 액세스 토큰이 만료되면(401) 자동으로 갱신하고 요청을 다시 보냅니다. 갱신도 실패하면 로그아웃 상태로 돌아갑니다.
- 서버 데이터는 TanStack Query로 보관합니다 (1분 안에 같은 데이터를 다시 열면 서버를 다시 부르지 않음).

## 개발 규칙

- 패키지는 `npx expo install <패키지>`로 설치합니다 (SDK에 맞는 버전으로 설치됩니다).
- 화면을 바꾼 뒤에는 `npx tsc --noEmit`, `npx eslint src`, `npx expo-doctor`를 확인합니다.
- Expo는 SDK마다 바뀌는 점이 많아서, 새 기능을 쓰기 전에 `https://docs.expo.dev/versions/v58.0.0/` 문서를 확인합니다.
