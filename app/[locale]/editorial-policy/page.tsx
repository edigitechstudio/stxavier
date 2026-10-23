import { DocPage, docMetadata } from '@/components/sx/doc-page';

export const generateMetadata = () => docMetadata('editorial-policy');

export default function Page() {
  return <DocPage id="editorial-policy" />;
}
