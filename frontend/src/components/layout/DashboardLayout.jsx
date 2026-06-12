import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app-shell min-h-screen">
      <Navbar
        showSidebarToggle
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
      />
      <div className="mx-auto flex max-w-7xl">
        <AnimatePresence initial={false}>
          {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}
        </AnimatePresence>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
