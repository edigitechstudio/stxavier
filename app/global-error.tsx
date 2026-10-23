'use client';

/** Last-resort boundary when the root layout itself fails. Must render its own <html>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, textAlign: 'center' }}>
        <div>
          <h1 style={{ color: '#0061a5' }}>Something went wrong</h1>
          <p>Please refresh the page, or call us on +977-1-5333081.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 999, border: 0, background: '#0061a5', color: '#fff', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
