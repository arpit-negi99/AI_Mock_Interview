import { APP_CONFIG } from '@/constants/appConfig';

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8" style={{ color: 'var(--text-tertiary)' }}>
        <p>&copy; 2026 {APP_CONFIG.name}. AI-assisted practice, human-owned growth.</p>
        <p>Privacy-ready architecture. Backend authorization required for production.</p>
      </div>
    </footer>
  );
}
