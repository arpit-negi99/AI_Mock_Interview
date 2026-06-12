import { useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { APP_CONFIG } from '@/constants/appConfig';
import { authService } from '@/services/authService';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ForgotPassword() {
  const [pendingEmail, setPendingEmail] = useState('');
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm();
  const serverError = errors.root?.server?.message;

  async function onSubmit(values) {
    clearErrors('root.server');
    try {
      if (!pendingEmail) {
        if (!APP_CONFIG.enableMocks) {
          await authService.forgotPassword({ email: values.email });
        }
        setPendingEmail(values.email);
        toast.success('Password reset OTP sent to email');
        return;
      }

      if (APP_CONFIG.enableMocks) {
        toast.success('Password reset successful');
      } else {
        await authService.resetPassword({ email: pendingEmail, otp: values.otp, password: values.password });
        toast.success('Password reset successful');
      }
    } catch (error) {
      const message = error?.message || 'Unable to reset password. Please try again.';
      setError('root.server', { type: 'server', message });
      toast.error(message);
    }
  }

  return (
    <Card className="w-full max-w-md" animate={false}>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.h1 variants={item} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset password</motion.h1>
        <motion.p variants={item} className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {pendingEmail ? `Enter the OTP sent to ${pendingEmail} and choose a new password.` : 'Enter your account email to receive a password reset OTP.'}
        </motion.p>
        <motion.form variants={item} className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div role="alert" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
              {serverError}
            </div>
          )}
          {!pendingEmail ? (
            <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          ) : (
            <>
              <Input label="OTP" inputMode="numeric" maxLength={6} {...register('otp', { required: 'OTP is required', pattern: { value: /^\d{6}$/, message: 'Enter the 6 digit OTP' } })} error={errors.otp?.message} />
              <Input label="New password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
            </>
          )}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>{pendingEmail ? 'Reset password' : 'Email OTP'}</Button>
        </motion.form>
      </motion.div>
    </Card>
  );
}
