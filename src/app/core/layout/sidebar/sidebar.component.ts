import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, SearchIcon, Settings, Sparkles } from 'lucide-angular';
import { SettingsStore } from '../../stores/settings.store';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly SettingsIcon = Settings;

  protected navItems = [
    { label: 'Word Definition', route: '/lookup', icon: SearchIcon },
    { label: 'Flashcard Generator', route: '/flashcard-generator', icon: Sparkles },
  ];

  private readonly settingsStore = inject(SettingsStore);

  protected openSettings(): void {
    this.settingsStore.openModal();
  }
}
