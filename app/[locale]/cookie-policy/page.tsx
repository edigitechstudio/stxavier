import { DocPage, docMetadata } from '@/components/sx/doc-page';

export const generateMetadata = () => docMetadata('cookie-policy');

export default function Page() {
  return <DocPage id="cookie-policy" />;
}
