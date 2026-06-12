import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Bell, ClipboardList, FileText, LayoutDashboard, Library, ListChecks, ScrollText, Search, Settings, ShieldCheck, SlidersHorizontal, Upload } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/classNames';

const candidateLinks = [
  { label: 'Dashboard', to: ROUTES.CANDIDATE_DASHBOARD, icon: LayoutDashboard },
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

export function Sidebar({ onClose }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('');
  const links = user?.role === ROLES.ADMIN ? adminLinks : candidateLinks;
  const visibleLinks = useMemo(() => {
    const searchTerm = filter.trim().toLowerCase();
    if (!searchTerm) return links;
    return links.filter(({ label }) => label.toLowerCase().includes(searchTerm));
  }, [filter, links]);

  return (
    <>
      <motion.button
        type="button"
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        aria-label="Close navigation"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="fixed bottom-0 left-0 top-[65px] z-40 w-72 shrink-0 border-r px-5 py-6 lg:sticky lg:top-[65px] lg:z-auto lg:h-[calc(100vh-65px)]"
        style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        initial={{ x: -288, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -288, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="mb-6 flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Filter menu</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter Menu"
              className="h-10 w-full rounded-lg border-0 py-2 pl-9 pr-3 text-sm outline-none transition-colors"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            />
          </label>
        </div>
        <nav className="space-y-2" aria-label="Dashboard navigation">
          {visibleLinks.map(({ label, to, icon: Icon }, index) => (
            <motion.div key={to} custom={index} variants={navItemVariants} initial="hidden" animate="show">
              <NavLink
                to={to}
                className={() => cn('flex min-h-11 items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200')}
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                })}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}
