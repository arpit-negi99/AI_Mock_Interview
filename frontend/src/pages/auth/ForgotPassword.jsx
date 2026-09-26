import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
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
  const navigate = useNavigate();
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
        setPendingEmail(values.email.trim().toLowerCase());
        toast.success('If an active account exists, a reset code will arrive by email.');
        return;
      }

      if (APP_CONFIG.enableMocks) {
        toast.success('Password reset successful');
      } else {
        await authService.resetPassword({ email: pendingEmail, otp: values.otp, password: values.password });
        toast.success('Password reset successful');
      }
      navigate(ROUTES.LOGIN, { replace: true });
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
          {pendingEmail ? `If an active account exists for ${pendingEmail}, check your inbox and spam folder for a code. It expires in 10 minutes.` : 'Enter your account email to request a password reset code.'}
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
          {pendingEmail && <Button className="w-full" variant="secondary" disabled={isSubmitting} onClick={() => { setPendingEmail(''); clearErrors(); }}>Change email or request another code</Button>}
        </motion.form>
        <p className="mt-5 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>If you created your account while temporary storage was active, it may have been lost when the server restarted. <Link to={ROUTES.REGISTER} className="underline" style={{ color: 'var(--accent-text)' }}>Create an account</Link> if you have not registered in the current database.</p>
        <Link to={ROUTES.LOGIN} className="mt-4 inline-block text-sm underline" style={{ color: 'var(--accent-text)' }}>Back to sign in</Link>
      </motion.div>
    </Card>
  );
}
