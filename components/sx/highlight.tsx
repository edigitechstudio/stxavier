/** Renders `text` with the first occurrence of `highlight` wrapped in the theme's italic accent <em>. */
export function Highlight({ text, highlight }: { text: string; highlight?: string | null }) {
  if (!highlight) return <>{text}</>;
  const i = text.indexOf(highlight);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <em>{highlight}</em>
      {text.slice(i + highlight.length)}
    </>
  );
}
