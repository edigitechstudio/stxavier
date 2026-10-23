import type { Thing, WithContext } from 'schema-dts';

/**
 * Renders JSON-LD in server HTML. `<` is escaped so content can never close the script tag.
 */
export function JsonLd({ data }: { data: WithContext<Thing> | WithContext<Thing>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
