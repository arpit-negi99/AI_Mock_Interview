import { Activity, Database, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardStats } from '@/utils/mockData';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AdminDashboard() {
  return (
    <>
      <PageHeader eyebrow="Admin workspace" title="Operations dashboard" description="Track platform health, content coverage, reports, and system activity." />
      <motion.div className="grid gap-4 md:grid-cols-3" variants={container} initial="hidden" animate="show">
        {[
          { label: 'Active users', value: '2,840', icon: Users },
          { label: 'Question records', value: '1,260', icon: Database },
          { label: 'Evaluations today', value: '318', icon: Activity },
        ].map(({ label, value, icon: Icon }) => (
          <motion.div key={label} variants={item}>
            <Card>
              <Icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {dashboardStats.slice(0, 2).map((stat) => (
          <Card key={stat.label}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.label}</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.change}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
