import { AppText } from '@/components/AppText';

// 탭 화면 맨 위의 큰 제목
export function PageTitle({ children }: { children: string }) {
  return (
    <AppText weight="extrabold" size={26}>
      {children}
    </AppText>
  );
}
