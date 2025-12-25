import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { marked } from 'marked';
import { GeminiService } from '../../core/services/gemini.service';
import { WordHistoryService } from '../../core/services/word-history.service';

@Component({
  selector: 'app-word-definition',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './word-definition.component.html',
  styleUrl: './word-definition.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordDefinitionComponent {
  private geminiService = inject(GeminiService);

  private wordHistoryService = inject(WordHistoryService);

  protected searchControl = new FormControl<string>('', { nonNullable: true });

  protected definition = signal<string>('');

  protected isLoading = signal(false);

  protected error = signal<string | null>(null);

  // History
  protected searchHistory = this.wordHistoryService.history;

  public async onSearch(word: string | null = null) {
    const searchTerm = word || this.searchControl.value;
    if (!searchTerm.trim()) return;

    // Update input if coming from history click
    this.searchControl.setValue(searchTerm);

    this.error.set(null);

    // Check for cached response first to save tokens
    const cachedResponse = this.wordHistoryService.getCachedResponse(searchTerm);
    if (cachedResponse) {
      this.definition.set(cachedResponse);
      return;
    }

    this.isLoading.set(true);
    this.definition.set('');

    this.geminiService.generateDefinition(searchTerm).subscribe({
      next: async (result) => {
        const parsed = await marked.parse(result);
        this.definition.set(parsed);
        // Save response to history for future lookups
        this.wordHistoryService.addToHistory(searchTerm, parsed);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Gemini API Error:', err);
        this.error.set('Failed to fetch definition. Please check your API key and connection.');
        this.isLoading.set(false);
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
  }
}
