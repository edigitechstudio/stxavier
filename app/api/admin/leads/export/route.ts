import { parseLeadFilter, toCsv } from '@/lib/admin/filters';
import { getViewer, isStaff } from '@/lib/auth/viewer';
import { listLeads } from '@/lib/portal/admin';

/** CSV export of the leads matching the current filters (staff only). */
export async function GET(req: Request) {
  const viewer = await getViewer();
  if (!isStaff(viewer)) return new Response('Forbidden', { status: 403 });

  const filter = parseLeadFilter(new URL(req.url).searchParams);
  const leads = await listLeads(filter, 5000);
  const csv = toCsv([
    ['Received (UTC)', 'Name', 'Phone', 'Email', 'Source', 'Status', 'Destination', 'Intake', 'Details', 'Page', 'Referrer', 'Locale', 'UTM source', 'UTM medium', 'UTM campaign', 'UTM term', 'UTM content'],
    ...leads.map((l) => {
      const { destination, intake, ...rest } = l.payload as Record<string, unknown>;
      return [
        l.created_at,
        l.name,
        l.phone,
        l.email,
        l.source,
        l.status,
        destination as string | undefined,
        intake as string | undefined,
        JSON.stringify(rest),
        l.page_path,
        l.referrer,
        l.locale,
        l.utm_source,
        l.utm_medium,
        l.utm_campaign,
        l.utm_term,
        l.utm_content,
      ];
    }),
  ]);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="stxavier-leads-${day}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
