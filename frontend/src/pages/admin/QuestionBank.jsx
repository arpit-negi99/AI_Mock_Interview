import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function QuestionBank() {
  return (
    <>
      <PageHeader title="Question bank" description="Searchable and filterable content table ready for server-side pagination." actions={<Link to={ROUTES.ADD_QUESTION}><Button icon={Plus}>Add question</Button></Link>} />
      <Card className="p-8">
        <EmptyState title="No questions yet" description="Create the first question or connect this page to the live question bank API." />
      </Card>
    </>
  );
}
