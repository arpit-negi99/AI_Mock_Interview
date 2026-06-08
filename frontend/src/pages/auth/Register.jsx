import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function Register() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    await createAccount(values);
    navigate(ROUTES.PROFILE_SETUP);
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <h1 className="text-2xl font-bold text-slate-950">Create account</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Full name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
        <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
        <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Register</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already registered? <Link to={ROUTES.LOGIN} className="text-teal-700 hover:underline">Login</Link></p>
    </Card>
  );
}
