import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AuditLogs() {
  return (
    <>
      <PageHeader title="Audit logs" description="Immutable activity feed structure for security, compliance, and support triage." />
      <Card className="p-8"><EmptyState title="No audit events" description="System activity will appear here once audit logging is connected." /></Card>
    </>
  );
}
