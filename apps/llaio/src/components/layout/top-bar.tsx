import { Menu } from 'lucide-react';
import { useLanguageStore, LANGUAGES } from '@/stores';
import type { Language } from '@/stores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { targetLanguage, setLanguage } = useLanguageStore();

  return (
    <header className="bg-background/80 flex h-12 items-center border-b border-border px-5 backdrop-blur-sm">
      <button
        className="mr-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-foreground transition-all duration-150 hover:bg-accent-hover md:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <div className="flex-1" />

      <Select value={targetLanguage} onValueChange={(val) => setLanguage(val as Language)}>
        <SelectTrigger className="h-8 w-36 border-0 bg-accent text-[13px] font-medium shadow-none hover:bg-accent-hover">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </header>
  );
}
