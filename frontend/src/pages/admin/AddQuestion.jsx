import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export default function AddQuestion() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  async function onSubmit() {
    toast.success('Question draft saved');
  }

  return (
    <>
      <PageHeader title="Add question" description="Create a question record with rubric tags and metadata for future AI scoring." />
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Skill" {...register('skill', { required: 'Skill is required' })} error={errors.skill?.message} />
          <Select label="Difficulty" {...register('difficulty')} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
          <Select label="Type" {...register('type')} options={[{ value: 'technical', label: 'Technical' }, { value: 'behavioral', label: 'Behavioral' }, { value: 'system-design', label: 'System Design' }]} />
          <Input label="Estimated minutes" type="number" min="1" {...register('duration')} />
          <Textarea className="md:col-span-2" label="Question prompt" {...register('prompt', { required: 'Prompt is required' })} error={errors.prompt?.message} />
          <Textarea className="md:col-span-2" label="Evaluation rubric" {...register('rubric')} />
          <div className="md:col-span-2"><Button type="submit" isLoading={isSubmitting}>Save question</Button></div>
        </form>
      </Card>
    </>
  );
}
