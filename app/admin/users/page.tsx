import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { AddStaffForm, SetPasswordForm } from '@/components/admin/staff-forms';
import { demoAuth } from '@/lib/auth/mode';
import { fmtDate } from '@/lib/admin/labels';
import { requireAdmin } from '@/lib/auth/viewer';
import { listProfiles } from '@/lib/portal/admin';
import type { UserRole } from '@/types/portal';
import { changeRole } from '../actions';

export const metadata: Metadata = { title: 'Users & roles' };

const ROLES: { value: UserRole; label: string; help: string }[] = [
  { value: 'student', label: 'Student', help: 'Portal only' },
  { value: 'counsellor', label: 'Counsellor', help: 'Leads, bookings, applications' },
  { value: 'admin', label: 'Admin', help: 'Everything, incl. roles & content' },
];

export default function UsersPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Users />
    </Suspense>
  );
}

async function Users() {
  const viewer = await requireAdmin();
  const people = await listProfiles();
  const staff = people.filter((p) => p.role !== 'student');
  const students = people.filter((p) => p.role === 'student');

  const table = (rows: typeof people, withPassword: boolean) => (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th scope="col">Name</th><th scope="col">Joined</th><th scope="col">Role</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                {p.full_name ?? '-'}<small>{p.email}</small>
                {withPassword && p.id !== viewer.id && !demoAuth && <SetPasswordForm userId={p.id} name={p.full_name ?? p.email ?? 'this person'} />}
              </td>
              <td className="nowrap">{fmtDate(p.created_at)}</td>
              <td>
                {p.id === viewer.id ? (
                  <span className="badge is-admin">You · admin</span>
                ) : (
                  <form action={changeRole} className="row-actions">
                    <input type="hidden" name="id" value={p.id} />
                    <select name="role" defaultValue={p.role} aria-label={`Role for ${p.full_name ?? p.email}`}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button type="submit" className="btn btn-outline btn-sm">Save</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminShell section="users" viewer={viewer} title="Users & roles">
      <p className="muted admin-lead">
        Staff sign in at <code>/admin/login</code> with the email and password you set here; no emails are sent. Students sign in to the portal with an email link.
        {' '}{ROLES.map((r) => `${r.label}: ${r.help}`).join(' · ')}.
      </p>
      {!demoAuth && (
        <section className="admin-card">
          <h2>Add staff member</h2>
          <p className="muted">Creates their login straight away. If the email already has an account (for example a student), it becomes staff with this password.</p>
          <AddStaffForm />
        </section>
      )}
      <section className="admin-card">
        <h2>Staff ({staff.length})</h2>
        {table(staff, true)}
      </section>
      <section className="admin-card">
        <h2>Students ({students.length})</h2>
        {students.length ? table(students, false) : <p className="muted">No students yet.</p>}
      </section>
    </AdminShell>
  );
}
