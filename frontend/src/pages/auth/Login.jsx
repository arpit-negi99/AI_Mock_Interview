import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: 'candidate@example.com', password: 'password123' } });

  async function onSubmit(values) {
    const user = await login(values);
    const fallback = user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD;
    navigate(location.state?.from?.pathname || fallback, { replace: true });
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <h1 className="text-2xl font-bold text-slate-950">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Use admin@example.com to preview the admin workspace in mock mode.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
        <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Login</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-teal-700 hover:underline">Forgot password?</Link>
        <Link to={ROUTES.REGISTER} className="text-teal-700 hover:underline">Create account</Link>
      </div>
    </Card>
  );
}
