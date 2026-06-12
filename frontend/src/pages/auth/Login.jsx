import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: 'candidate@example.com', password: 'password123' } });
  const serverError = errors.root?.server?.message;

  async function onSubmit(values) {
    clearErrors('root.server');
    try {
      const user = await login(values);
      const fallback = user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD;
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (error) {
      const message = error?.message || 'Unable to sign in. Please try again.';
      setError('root.server', { type: 'server', message });
      toast.error(message);
    }
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.h1 variants={item} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sign in</motion.h1>
        <motion.p variants={item} className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Use admin@example.com to preview the admin workspace in mock mode.</motion.p>
        <motion.form variants={item} className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div role="alert" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
              {serverError}
            </div>
          )}
          <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Login</Button>
        </motion.form>
        <motion.div variants={item} className="mt-4 flex justify-between text-sm">
          <Link to={ROUTES.FORGOT_PASSWORD} style={{ color: 'var(--accent-text)' }} className="hover:underline">Forgot password?</Link>
          <Link to={ROUTES.REGISTER} style={{ color: 'var(--accent-text)' }} className="hover:underline">Create account</Link>
        </motion.div>
      </motion.div>
    </Card>
  );
}
