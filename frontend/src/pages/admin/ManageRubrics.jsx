import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';

export default function ManageRubrics() {
  return (
    <>
      <PageHeader title="Manage rubrics" description="Central place for scoring dimensions, weights, and reviewer guidance." />
      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea label="Technical rubric" defaultValue="Correctness: 35&#10;Depth: 25&#10;Tradeoffs: 20&#10;Clarity: 20" />
          <Textarea label="Behavioral rubric" defaultValue="Situation: 20&#10;Action: 30&#10;Impact: 30&#10;Reflection: 20" />
        </div>
        <Button className="mt-4" onClick={() => toast.success('Rubrics saved')}>Save rubrics</Button>
      </Card>
    </>
  );
}
