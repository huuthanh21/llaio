import { useState, useEffect } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useMobile } from '@/hooks';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { SettingsModal } from './settings-modal';

export function MainLayout() {
  const isMobile = useMobile();
  const { pathname } = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const handleDismissOverlay = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside
        className={`fixed z-30 h-full w-56 border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-background-secondary">
          <div className="animate-content-enter p-5 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {sidebarOpen && isMobile && (
        <div
          className="bg-foreground/30 fixed inset-0 z-20 backdrop-blur-[2px] md:hidden"
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={handleDismissOverlay}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDismissOverlay();
            }
          }}
        />
      )}

      <SettingsModal />
    </div>
  );
}
