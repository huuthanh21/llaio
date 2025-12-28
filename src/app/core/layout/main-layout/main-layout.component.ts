import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { SettingsStore } from '../../stores/settings.store';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, TopBarComponent, SidebarComponent, SettingsModalComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly router = inject(Router);

  protected readonly settingsStore = inject(SettingsStore);

  // Detect mobile breakpoint (max-width: 768px)
  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly sidebarMode = computed(() => (this.isMobile() ? 'over' : 'side'));

  protected readonly sidebarOpen = signal(true);

  public constructor() {
    // specific effect to react to mobile state changes
    effect(() => {
      const mobile = this.isMobile();
      // On mobile, default to closed. On desktop, default to open.
      // We use allowSignalWrites because we are updating a signal inside an effect.
      // However, typical pattern is to just set it.
      if (mobile) {
        this.sidebarOpen.set(false);
      } else {
        this.sidebarOpen.set(true);
      }
    });

    // Close sidebar on navigation if on mobile
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobile()) {
        this.sidebarOpen.set(false);
      }
    });
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}
