import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { LucideAngularModule, MenuIcon } from 'lucide-angular';
import { DropdownComponent } from '../../../shared/components/dropdown/dropdown.component';
import { Language, LANGUAGES, LanguageStore } from '../../stores/language.store';

@Component({
  selector: 'app-top-bar',
  imports: [DropdownComponent, LucideAngularModule],
  templateUrl: './top-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  // Services
  protected readonly languageStore = inject(LanguageStore);

  // Constants
  protected readonly ICONS = {
    Menu: MenuIcon,
  };

  // Outputs
  public readonly menuToggle = output();

  // Properties
  protected readonly languages: Language[] = LANGUAGES;
}
