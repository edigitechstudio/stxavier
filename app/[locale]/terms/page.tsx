import { DocPage, docMetadata } from '@/components/sx/doc-page';

export const generateMetadata = () => docMetadata('terms');

export default function Page() {
  return <DocPage id="terms" />;
}
