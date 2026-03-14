import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useLanguageStore, LANGUAGES } from '@/stores/language-store';
import { useThemeStore, THEMES } from '@/stores/theme-store';
import type { Language } from '@/stores/language-store';
import type { Theme } from '@/stores/theme-store';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SettingsModal() {
  const { apiKey, googleCseApiKey, isModalOpen, setApiKey, setGoogleCseApiKey, closeModal } =
    useSettingsStore();
  const { nativeLanguage, setNativeLanguage } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localGoogleCseApiKey, setLocalGoogleCseApiKey] = useState(googleCseApiKey);
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [localNativeLanguage, setLocalNativeLanguage] = useState<Language>(nativeLanguage);

  useEffect(() => {
    if (isModalOpen) {
      setLocalApiKey(apiKey);
      setLocalGoogleCseApiKey(googleCseApiKey);
      setLocalTheme(theme);
      setLocalNativeLanguage(nativeLanguage);
    }
  }, [isModalOpen, apiKey, googleCseApiKey, theme, nativeLanguage]);

  const handleSave = () => {
    setApiKey(localApiKey);
    setGoogleCseApiKey(localGoogleCseApiKey);
    setTheme(localTheme);
    setNativeLanguage(localNativeLanguage);
    closeModal();
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-heading-20 m-0">Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys, preferred theme, and native language.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-foreground" htmlFor="api-key">
              Gemini API Key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              autoComplete="off"
              spellCheck={false}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
            <p className="text-[12px] text-muted-foreground">
              Your key is stored locally and never sent to our servers.{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-foreground"
              >
                Get API Key
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-foreground" htmlFor="google-cse-key">
              Google Custom Search API Key
            </label>
            <Input
              id="google-cse-key"
              type="password"
              placeholder="Enter your Google CSE API key"
              autoComplete="off"
              spellCheck={false}
              value={localGoogleCseApiKey}
              onChange={(e) => setLocalGoogleCseApiKey(e.target.value)}
            />
            <p className="text-[12px] text-muted-foreground">
              Used for image search in flashcard generation.{' '}
              <a
                href="https://programmablesearchengine.google.com/controlpanel/all"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-foreground"
              >
                Get API Key
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-foreground" htmlFor="theme-select">
              Theme
            </label>
            <Select value={localTheme} onValueChange={(val) => setLocalTheme(val as Theme)}>
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-2">
                      {t === 'System' && <Monitor className="size-4 opacity-60" />}
                      {t === 'Light' && <Sun className="size-4 opacity-60" />}
                      {t === 'Dark' && <Moon className="size-4 opacity-60" />}
                      <span>{t}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-foreground" htmlFor="native-lang">
              Native Language
            </label>
            <Select
              value={localNativeLanguage}
              onValueChange={(val) => setLocalNativeLanguage(val as Language)}
            >
              <SelectTrigger id="native-lang" className="w-full">
                <SelectValue placeholder="Select native language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[12px] text-muted-foreground">
              Translations and explanations will be in this language.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
