import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Notifications() {
  return (
    <>
      <PageHeader title="Notifications" description="Pagination-ready notification feed for evaluations, plans, reminders, and admin messages." />
      <Card className="p-8"><EmptyState title="No notifications" description="Evaluation updates and reminders will appear here." /></Card>
    </>
  );
}
