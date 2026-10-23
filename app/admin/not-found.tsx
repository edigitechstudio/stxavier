import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <main className="auth-wrap admin-auth">
      <section className="auth-card">
        <h1>Not found</h1>
        <p className="muted">That record doesn’t exist or was removed.</p>
        <Link href="/admin" className="btn btn-primary">Back to the dashboard</Link>
      </section>
    </main>
  );
}
