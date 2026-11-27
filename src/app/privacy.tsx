import { LegalDocument } from '@/components/LegalDocument';
import { privacyDoc } from '@/content/legal';

export default function PrivacyScreen() {
  return <LegalDocument doc={privacyDoc} />;
}
