import { LegalDocument } from '@/components/LegalDocument';
import { termsDoc } from '@/content/legal';

export default function TermsScreen() {
  return <LegalDocument doc={termsDoc} />;
}
