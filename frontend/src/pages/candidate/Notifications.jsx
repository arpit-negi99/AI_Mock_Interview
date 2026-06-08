import { notifications } from '@/utils/mockData';
import { formatRelativeTime } from '@/utils/formatters';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Notifications() {
  return (
    <>
      <PageHeader title="Notifications" description="Pagination-ready notification feed for evaluations, plans, reminders, and admin messages." />
      {notifications.length === 0 ? <EmptyState title="No notifications" /> : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card key={item.id} animate={false}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                </div>
                <span className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
