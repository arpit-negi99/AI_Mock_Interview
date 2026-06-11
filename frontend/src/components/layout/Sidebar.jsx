import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' } }),
};

export function Sidebar() {
  const { user } = useAuth();
  const links = user?.role === ROLES.ADMIN ? adminLinks : candidateLinks;

  return (
    <aside className="hidden w-68 shrink-0 border-r p-4 lg:block" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="mb-5 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</p>
        <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{user?.role || ROLES.CANDIDATE}</p>
      </div>
      <nav className="space-y-1" aria-label="Dashboard navigation">
        {links.map(({ label, to, icon: Icon }, index) => (
          <motion.div key={to} custom={index} variants={navItemVariants} initial="hidden" animate="show">
            <NavLink to={to} className={() => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200')}
              style={({ isActive }) => ({ color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)', backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent' })}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </aside>
  );
}
