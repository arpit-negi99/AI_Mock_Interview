import { useState } from 'react';
import toast from 'react-hot-toast';
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
  const { register: createAccount, verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const [pendingEmail, setPendingEmail] = useState('');
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm();
  const serverError = errors.root?.server?.message;

  async function onSubmit(values) {
    clearErrors('root.server');
    try {
      if (!pendingEmail) {
        await createAccount(values);
        setPendingEmail(values.email);
        return;
      }

      await verifyRegistration({ email: pendingEmail, otp: values.otp });
      navigate(ROUTES.PROFILE_SETUP);
    } catch (error) {
      const message = error?.message || 'Unable to create account. Please try again.';
      setError('root.server', { type: 'server', message });
      toast.error(message);
    }
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.h1 variants={item} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create account</motion.h1>
        {pendingEmail && (
          <motion.p variants={item} className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter the OTP sent to {pendingEmail}.
          </motion.p>
        )}
        <motion.form variants={item} className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div role="alert" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
              {serverError}
            </div>
          )}
          {!pendingEmail ? (
            <>
              <Input label="Full name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
              <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
              <Input label="Password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
            </>
          ) : (
            <Input label="OTP" inputMode="numeric" maxLength={6} {...register('otp', { required: 'OTP is required', pattern: { value: /^\d{6}$/, message: 'Enter the 6 digit OTP' } })} error={errors.otp?.message} />
          )}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>{pendingEmail ? 'Verify account' : 'Email OTP'}</Button>
        </motion.form>
        <motion.p variants={item} className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Already registered? <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent-text)' }} className="hover:underline">Login</Link></motion.p>
      </motion.div>
    </Card>
  );
}
