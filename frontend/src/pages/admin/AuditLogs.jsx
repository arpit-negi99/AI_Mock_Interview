import { auditLogs } from '@/utils/mockData';
import { formatRelativeTime } from '@/utils/formatters';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function AuditLogs() {
  return (
    <>
      <PageHeader title="Audit logs" description="Immutable activity feed structure for security, compliance, and support triage." />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Status</th><th className="p-4">Time</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.map((item) => (
              <tr key={item.id}><td className="p-4 font-medium text-slate-950">{item.actor}</td><td className="p-4">{item.action}</td><td className="p-4"><Badge tone="teal">{item.status}</Badge></td><td className="p-4">{formatRelativeTime(item.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
