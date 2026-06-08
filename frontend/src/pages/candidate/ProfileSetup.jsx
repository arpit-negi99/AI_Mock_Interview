import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export default function ProfileSetup() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { targetRole: 'Frontend Engineer', experience: 'mid' } });
  async function onSubmit() {
    toast.success('Profile saved locally');
  }

  return (
    <>
      <PageHeader title="Profile setup" description="Capture candidate context that future AI prompts and backend matching services can use." />
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Target role" {...register('targetRole', { required: 'Target role is required' })} error={errors.targetRole?.message} />
          <Select label="Experience level" {...register('experience')} options={[{ value: 'junior', label: 'Junior' }, { value: 'mid', label: 'Mid-level' }, { value: 'senior', label: 'Senior' }]} />
          <Input label="Primary skills" placeholder="React, Node.js, System Design" {...register('skills')} />
          <Input label="Location preference" placeholder="Remote, Bengaluru, New York" {...register('location')} />
          <Textarea className="md:col-span-2" label="Career goals" {...register('goals')} />
          <div className="md:col-span-2"><Button type="submit" isLoading={isSubmitting}>Save profile</Button></div>
        </form>
      </Card>
    </>
  );
}
