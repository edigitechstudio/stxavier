import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { ChangePasswordForm } from '@/components/admin/staff-forms';
import { demoAuth } from '@/lib/auth/mode';
import { requireStaff } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'My account' };

export default function AccountPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const viewer = await requireStaff('/admin/account');
  return (
    <AdminShell section="account" viewer={viewer} title="My account">
      <section className="admin-card">
        <h2>{viewer.name}</h2>
        <p className="muted">
          {viewer.email} · <span className="cap">{viewer.role}</span>
        </p>
      </section>
      <section className="admin-card">
        <h2>Change password</h2>
        {demoAuth ? <p className="muted">Passwords are not used in local demo mode.</p> : <ChangePasswordForm />}
      </section>
    </AdminShell>
  );
}
