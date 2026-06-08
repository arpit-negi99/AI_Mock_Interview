import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">404</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950">Page not found</h1>
      <p className="mt-3 text-slate-600">The page may have moved or the route has not been enabled yet.</p>
      <Link to={ROUTES.HOME} className="mt-6"><Button>Go home</Button></Link>
    </section>
  );
}
