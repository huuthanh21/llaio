import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GeminiService } from '@core/services';
import { ButtonDirective, SpinnerComponent } from '@shared/components';
import { InputDirective } from '@shared/directives';
import { Clock, History, LucideAngularModule, Trash2, X } from 'lucide-angular';
import { marked } from 'marked';
import { ContentStatusComponent } from './components/content-status/content-status.component';
import { WordHistoryService } from './services/word-history.service';
@Component({
  selector: 'app-word-definition',
  imports: [
    ReactiveFormsModule,
    SpinnerComponent,
    LucideAngularModule,
    ContentStatusComponent,
    ButtonDirective,
    InputDirective,
  ],
  templateUrl: './word-definition.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordDefinitionComponent {
  // Services
  private readonly geminiService = inject(GeminiService);

  private readonly wordHistoryService = inject(WordHistoryService);

  // Constants
  protected readonly ICONS = {
    X,
    History,
    Trash2,
    Clock,
  };

  // Public Properties
  public readonly searchControl = new FormControl<string>('', { nonNullable: true });

  // Protected State
  protected readonly definition = signal<string>('');

  protected readonly isLoading = signal(false);

  protected readonly isStreaming = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly historyOpen = signal(false);

  protected readonly searchHistory = this.wordHistoryService.history;

  public async onSearch(word: string | null = null) {
    const searchTerm = word || this.searchControl.value;
    if (!searchTerm.trim()) return;

    // Update input if coming from history click
    this.searchControl.setValue(searchTerm);
    this.historyOpen.set(false);

    this.error.set(null);

    // Check for cached response first to save tokens
    const cachedResponse = this.wordHistoryService.getCachedResponse(searchTerm);
    if (cachedResponse) {
      this.definition.set(cachedResponse);
      return;
    }

    this.isLoading.set(true);
    this.isStreaming.set(true);
    this.definition.set('');

    let lastParsed = '';
    this.geminiService.generateDefinition(searchTerm).subscribe({
      next: async (result) => {
        const parsed = await marked.parse(result, { breaks: true });
        this.definition.set(parsed);
        lastParsed = parsed;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Gemini API Error:', err);
        this.error.set('Failed to fetch definition. Please check your API key and connection.');
        this.isLoading.set(false);
        this.isStreaming.set(false);
      },
      complete: () => {
        this.isStreaming.set(false);
        // Save final response to history for future lookups
        this.wordHistoryService.addToHistory(searchTerm, lastParsed);
      },
    });
  }

  public onReset() {
    this.searchControl.setValue('');
    this.definition.set('');
    this.error.set(null);
  }

  public clearHistory() {
    this.wordHistoryService.clearHistory();
    this.historyOpen.set(false);
  }

  protected toggleHistory(): void {
    this.historyOpen.update((v) => !v);
  }
}
