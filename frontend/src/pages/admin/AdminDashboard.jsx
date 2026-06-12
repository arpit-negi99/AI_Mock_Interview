import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboard() {
  return (
    <>
      <PageHeader eyebrow="Admin workspace" title="Operations dashboard" description="Track platform health, content coverage, reports, and system activity." />
      <Card className="p-8">
        <EmptyState title="No operational data yet" description="Platform metrics and report activity will appear after live backend analytics are connected." />
      </Card>
    </>
  );
}
