import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Search } from 'lucide-react';

interface ContentStatusProps {
  status: 'idle' | 'loading' | 'error' | 'success';
  error?: string | null;
  children: ReactNode;
  hasContent?: boolean;
}

export function ContentStatus({ status, error, children, hasContent = false }: ContentStatusProps) {
  if (status === 'idle') {
    return (
      <div className="border-border/60 bg-surface-raised/50 flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-12">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-foreground/80 text-[15px] font-medium">Look up any word</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Type a word above and press Enter or click Define
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="border-destructive/20 bg-destructive/5 flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border px-6 py-12">
        <p className="text-[14px] text-destructive">
          {error ?? 'Failed to fetch definition. Please try again.'}
        </p>
      </div>
    );
  }

  if (status === 'loading' && !hasContent) {
    return (
      <div className="border-border/60 bg-surface-raised/50 flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border px-6 py-12 text-muted-foreground">
        <Spinner size="md" />
        <p className="text-[13px]">Generating definition…</p>
      </div>
    );
  }

  return <>{children}</>;
}
