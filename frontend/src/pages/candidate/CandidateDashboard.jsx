import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { dashboardStats, recentInterviews } from '@/utils/mockData';
import { formatDate } from '@/utils/formatters';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CandidateDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Candidate workspace"
        title="Interview readiness dashboard"
        description="Monitor recent sessions, next actions, and progress signals across practice areas."
        actions={<Link to={ROUTES.INTERVIEW_CONFIGURATION}><Button icon={PlayCircle}>New mock interview</Button></Link>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-teal-700">{stat.change}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-950">Recent interviews</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="p-4">Role</th><th className="p-4">Type</th><th className="p-4">Score</th><th className="p-4">Status</th><th className="p-4">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInterviews.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 font-medium text-slate-950">{item.role}</td>
                  <td className="p-4 text-slate-600">{item.type}</td>
                  <td className="p-4 text-slate-600">{item.score}%</td>
                  <td className="p-4"><Badge tone={item.status === 'Evaluated' ? 'teal' : 'amber'}>{item.status}</Badge></td>
                  <td className="p-4 text-slate-600">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
