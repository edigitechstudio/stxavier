import { evaluate } from '@mdx-js/mdx';
import type { MDXComponents } from 'mdx/types';
import * as runtime from 'react/jsx-runtime';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { Link } from '@/i18n/navigation';

const components: MDXComponents = {
  a: ({ href = '', children, ...props }) =>
    href.startsWith('/') ? (
      <Link href={href} {...props}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener" {...props}>{children}</a>
    ),
  table: (props) => (
    <div className="table-wrap my-6">
      <table className="data-table" {...props} />
    </div>
  ),
  // eslint-disable-next-line @next/next/no-img-element -- remote CMS images with unknown dimensions
  img: ({ alt = '', ...props }) => <img alt={alt} loading="lazy" decoding="async" {...props} />,
};

/**
 * Compiles and renders MDX on the server (no client JS). Heading ids match the TOC slugs.
 * Posts written in the dashboard use format "md": plain Markdown, so they can't run code.
 */
export async function MdxContent({ source, format = 'mdx' }: { source: string; format?: 'md' | 'mdx' }) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    format,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  });
  return <Content components={components} />;
}
