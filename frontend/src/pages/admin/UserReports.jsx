import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function UserReports() {
  return (
    <>
      <PageHeader title="User reports" description="Report listings are ready for server-side pagination, filters, exports, and reviewer workflows." />
      <Card className="p-8"><EmptyState title="No reports yet" description="Completed candidate evaluations will appear here." /></Card>
    </>
  );
}
