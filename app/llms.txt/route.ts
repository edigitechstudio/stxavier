import { buildLlmsTxt } from '@/lib/seo/llms';

export async function GET() {
  return new Response(await buildLlmsTxt(false), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
