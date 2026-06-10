import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { dashboardStats, recentInterviews } from '@/utils/mockData';
import { formatDate } from '@/utils/formatters';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function CandidateDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Candidate workspace"
        title="Interview readiness dashboard"
        description="Monitor recent sessions, next actions, and progress signals across practice areas."
        actions={<Link to={ROUTES.INTERVIEW_CONFIGURATION}><Button icon={PlayCircle}>New mock interview</Button></Link>}
      />
      <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" variants={container} initial="hidden" animate="show">
        {dashboardStats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--accent-text)' }}>{stat.change}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b p-5" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent interviews</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
              <tr><th className="p-4">Role</th><th className="p-4">Type</th><th className="p-4">Score</th><th className="p-4">Status</th><th className="p-4">Date</th></tr>
            </thead>
            <tbody style={{ color: 'var(--text-secondary)' }}>
              {recentInterviews.map((item) => (
                <tr key={item.id} className="border-t transition-colors duration-150" style={{ borderColor: 'var(--border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>{item.role}</td>
                  <td className="p-4">{item.type}</td>
                  <td className="p-4">{item.score}%</td>
                  <td className="p-4"><Badge tone={item.status === 'Evaluated' ? 'teal' : 'amber'}>{item.status}</Badge></td>
                  <td className="p-4">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
