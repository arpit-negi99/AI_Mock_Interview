import { Link, Outlet } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { APP_CONFIG } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';

export function AuthLayout() {
  return (
    <div className="app-shell grid min-h-screen lg:grid-cols-[1fr_520px]">
      <section className="hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 text-white"><BrainCircuit className="h-5 w-5" /></span>
          {APP_CONFIG.name}
        </Link>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Mock interview ecosystem</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-slate-950">Practice realistic interviews and turn feedback into a plan.</h1>
          <p className="mt-5 text-lg text-slate-600">Role-aware dashboards, AI evaluation workflows, and backend-ready service boundaries are already prepared.</p>
        </div>
        <p className="text-sm text-slate-500">Use any email containing admin to preview admin access in mock mode.</p>
      </section>
      <main className="flex items-center justify-center bg-white px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
