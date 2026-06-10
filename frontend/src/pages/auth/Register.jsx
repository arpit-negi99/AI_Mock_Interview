import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

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
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.h1 variants={item} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create account</motion.h1>
        <motion.form variants={item} className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Register</Button>
        </motion.form>
        <motion.p variants={item} className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Already registered? <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent-text)' }} className="hover:underline">Login</Link></motion.p>
      </motion.div>
    </Card>
  );
}
