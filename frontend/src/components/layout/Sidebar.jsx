import { NavLink } from 'react-router-dom';
import { BarChart3, Bell, ClipboardList, FileText, LayoutDashboard, Library, ListChecks, ScrollText, Settings, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/classNames';

const candidateLinks = [
  { label: 'Dashboard', to: ROUTES.CANDIDATE_DASHBOARD, icon: LayoutDashboard },
  { label: 'Profile', to: ROUTES.PROFILE_SETUP, icon: UserRound },
  { label: 'Configure', to: ROUTES.INTERVIEW_CONFIGURATION, icon: Settings },
  { label: 'Session', to: ROUTES.INTERVIEW_SESSION, icon: ClipboardList },
  { label: 'Resume', to: ROUTES.RESUME_UPLOAD, icon: Upload },
  { label: 'Evaluation', to: ROUTES.EVALUATION_RESULT, icon: BarChart3 },
  { label: 'Feedback', to: ROUTES.FEEDBACK_REPORT, icon: FileText },
  { label: 'Practice Plan', to: ROUTES.PRACTICE_PLAN, icon: ListChecks },
  { label: 'Notifications', to: ROUTES.NOTIFICATIONS, icon: Bell },
];

const adminLinks = [
  { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Question Bank', to: ROUTES.QUESTION_BANK, icon: Library },
  { label: 'Add Question', to: ROUTES.ADD_QUESTION, icon: ClipboardList },
  { label: 'Rubrics', to: ROUTES.MANAGE_RUBRICS, icon: ShieldCheck },
  { label: 'Reports', to: ROUTES.USER_REPORTS, icon: BarChart3 },
  { label: 'Audit Logs', to: ROUTES.AUDIT_LOGS, icon: ScrollText },
];

export function Sidebar() {
  const { user } = useAuth();
  const links = user?.role === ROLES.ADMIN ? adminLinks : candidateLinks;

  return (
    <aside className="hidden w-68 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
      <div className="mb-5 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">{user?.name || 'User'}</p>
        <p className="text-xs capitalize text-slate-500">{user?.role || ROLES.CANDIDATE}</p>
      </div>
      <nav className="space-y-1" aria-label="Dashboard navigation">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100', isActive && 'bg-teal-50 text-teal-700')}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
