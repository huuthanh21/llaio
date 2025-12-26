import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsStore } from '../../stores/settings.store';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected navItems = [{ label: 'Word Definition', route: '/lookup', icon: 'translate' }];

  private readonly settingsStore = inject(SettingsStore);

  protected openSettings(): void {
    this.settingsStore.openModal();
  }
}
