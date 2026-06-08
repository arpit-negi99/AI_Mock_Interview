import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PermissionDenied({ homePath = '/' }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="h-12 w-12 text-amber-600" />
      <h1 className="mt-4 text-3xl font-bold text-slate-950">Permission denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">Frontend guards only control the visible experience. The backend must enforce real authorization for production access.</p>
      <Link to={homePath} className="mt-6"><Button>Return to dashboard</Button></Link>
    </section>
  );
}
