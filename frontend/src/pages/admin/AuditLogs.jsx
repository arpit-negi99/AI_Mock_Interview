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
          <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
            <tr><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Status</th><th className="p-4">Time</th></tr>
          </thead>
          <tbody style={{ color: 'var(--text-secondary)' }}>
            {auditLogs.map((item) => (
              <tr key={item.id} className="border-t transition-colors duration-150" style={{ borderColor: 'var(--border-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>{item.actor}</td>
                <td className="p-4">{item.action}</td>
                <td className="p-4"><Badge tone="teal">{item.status}</Badge></td>
                <td className="p-4">{formatRelativeTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
