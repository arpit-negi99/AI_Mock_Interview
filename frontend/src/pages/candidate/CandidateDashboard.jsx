import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CandidateDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Candidate workspace"
        title="Interview readiness dashboard"
        description="Start a mock interview and review completed feedback once your sessions are available."
        actions={<Link to={ROUTES.INTERVIEW_CONFIGURATION}><Button icon={PlayCircle}>New mock interview</Button></Link>}
      />
      <Card className="p-8">
        <EmptyState
          title="No interview activity yet"
          description="Your completed sessions and AI feedback reports will appear here after you finish an interview."
        />
      </Card>
    </>
  );
}
