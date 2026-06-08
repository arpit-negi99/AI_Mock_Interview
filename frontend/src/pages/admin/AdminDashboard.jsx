import { Activity, Database, Users } from 'lucide-react';
import { dashboardStats } from '@/utils/mockData';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

export default function AdminDashboard() {
  return (
    <>
      <PageHeader eyebrow="Admin workspace" title="Operations dashboard" description="Track platform health, content coverage, reports, and system activity." />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active users', value: '2,840', icon: Users },
          { label: 'Question records', value: '1,260', icon: Database },
          { label: 'Evaluations today', value: '318', icon: Activity },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <Icon className="h-6 w-6 text-teal-600" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {dashboardStats.slice(0, 2).map((stat) => (
          <Card key={stat.label}>
            <h2 className="font-semibold text-slate-950">{stat.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{stat.change}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
