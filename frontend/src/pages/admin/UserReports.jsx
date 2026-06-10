import { recentInterviews } from '@/utils/mockData';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function UserReports() {
  return (
    <>
      <PageHeader title="User reports" description="Report listings are ready for server-side pagination, filters, exports, and reviewer workflows." />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
            <tr><th className="p-4">Candidate</th><th className="p-4">Role</th><th className="p-4">Score</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody style={{ color: 'var(--text-secondary)' }}>
            {recentInterviews.map((item) => (
              <tr key={item.id} className="border-t transition-colors duration-150" style={{ borderColor: 'var(--border-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Candidate {item.id}</td>
                <td className="p-4">{item.role}</td><td className="p-4">{item.score}%</td>
                <td className="p-4"><Badge tone="teal">{item.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
