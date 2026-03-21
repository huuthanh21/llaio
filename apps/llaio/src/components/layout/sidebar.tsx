import { Link } from '@tanstack/react-router';
import { Search, Sparkles, Bookmark, Settings } from 'lucide-react';
import { useSettingsStore } from '@/stores';

interface SidebarProps {
  onClose: () => void;
}

const navItems = [
  { label: 'Word Definition', route: '/lookup', icon: Search },
  {
    label: 'Flashcard Generator',
    route: '/flashcard-generator',
    icon: Sparkles,
  },
  {
    label: 'Saved Words',
    route: '/saved-words',
    icon: Bookmark,
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const { openModal } = useSettingsStore();

  return (
    <nav className="flex h-full flex-col px-3 py-4">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="text-heading-14 uppercase tracking-[0.15em] text-foreground">Llaio</span>
      </div>

      {/* Navigation */}
      <ul className="m-0 flex-1 list-none space-y-0.5 p-0">
        {navItems.map((item) => (
          <li key={item.route}>
            <Link
              to={item.route}
              className="nav-indicator group mb-0.5 flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-[14px] font-medium leading-tight no-underline transition-all duration-150 hover:bg-accent-hover hover:text-foreground"
              activeProps={{
                className:
                  'nav-indicator nav-indicator-active group mb-0.5 flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-[14px] font-semibold leading-tight no-underline bg-accent text-foreground',
              }}
              inactiveProps={{
                className:
                  'nav-indicator group mb-0.5 flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-[14px] font-medium leading-tight no-underline transition-all duration-150 hover:bg-accent-hover hover:text-foreground text-muted-foreground',
              }}
              activeOptions={{ exact: true }}
              onClick={onClose}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Settings */}
      <div className="border-t border-border pt-3">
        <button
          className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border-none bg-transparent px-3 text-left font-[inherit] text-[14px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent-hover hover:text-foreground"
          onClick={openModal}
        >
          <Settings className="h-[18px] w-[18px] shrink-0 opacity-70" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
