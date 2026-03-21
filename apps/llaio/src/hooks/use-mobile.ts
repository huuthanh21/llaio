import { useMediaQuery } from './use-media-query';

export function useMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
