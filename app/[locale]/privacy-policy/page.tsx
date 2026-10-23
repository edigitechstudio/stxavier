import { DocPage, docMetadata } from '@/components/sx/doc-page';

export const generateMetadata = () => docMetadata('privacy-policy');

export default function Page() {
  return <DocPage id="privacy-policy" />;
}
