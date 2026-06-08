import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  async function onSubmit() {
    toast.success('Reset instructions queued');
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <h1 className="text-2xl font-bold text-slate-950">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your account email and the backend can later send a secure reset link.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Send instructions</Button>
      </form>
    </Card>
  );
}
