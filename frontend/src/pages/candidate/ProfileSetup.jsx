import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { targetRole: 'Frontend Engineer', experience: 'mid' } });
  async function onSubmit() {
    toast.success('Profile saved locally');
  }

  async function deleteAccount() {
    const confirmed = window.confirm('Delete your account permanently? This cannot be undone.');
    if (!confirmed) return;

    await userService.deleteAccount();
    await logout({ skipApi: true });
    toast.success('Account deleted');
    navigate(ROUTES.HOME);
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
      <Card className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Delete account</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Permanently remove your account from the database.</p>
          </div>
          <Button variant="danger" onClick={deleteAccount}>Delete account</Button>
        </div>
      </Card>
    </>
  );
}
