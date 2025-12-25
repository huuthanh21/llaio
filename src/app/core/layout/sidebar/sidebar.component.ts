import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected navItems = [
    { label: 'Dashboard', route: '/', icon: 'dashboard' },
    { label: 'Translator', route: '/translator', icon: 'translate' },
    { label: 'Vocab Builder', route: '/vocab', icon: 'school' },
    { label: 'Scenario Practice', route: '/scenario', icon: 'chat' },
  ];
}
