import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NotesService, Note } from 'src/app/core/notes.service';

@Component({
  selector: 'app-note-form',
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.css']
})
export class NoteFormComponent implements OnInit {
  @Input() editingNote: Note | null = null;
  @Output() noteSaved = new EventEmitter<Note>();
  @Output() noteCancelled = new EventEmitter<void>();

  noteForm: FormGroup;
  isSubmitting = false;
  charCount: Observable<number>;
  wordCount: Observable<number>;
  suggestions: Observable<string[]>;
  isLoading = false;

  readonly MAX_LENGTH = 1000;
  readonly MIN_LENGTH = 3;
  readonly SUGGESTIONS = [
    'Meeting notes',
    'Shopping list',
    'Ideas for project',
    'Important reminders',
    'Daily journal',
    'Code snippets',
    'Book recommendations'
  ];

  constructor(
    private fb: FormBuilder,
    private notesService: NotesService
  ) {
    this.noteForm = this.fb.group({
      text: [
        '',
        [
          Validators.required,
          Validators.minLength(this.MIN_LENGTH),
          Validators.maxLength(this.MAX_LENGTH),
          this.noDuplicateWordsValidator()
        ],
        [this.asyncValidation.bind(this)]
      ],
      priority: ['medium', Validators.required],
      tags: ['']
    });

    // Character count observable
    this.charCount = this.noteForm.get('text')!.valueChanges.pipe(
      startWith(''),
      map(text => text.length)
    );

    // Word count observable
    this.wordCount = this.noteForm.get('text')!.valueChanges.pipe(
      startWith(''),
      map(text => text.trim().split(/\s+/).filter((word: string) => word.length > 0).length)
    );

    // Suggestions based on input
    this.suggestions = this.noteForm.get('text')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(text => this.getSuggestions(text))
    );
  }

  ngOnInit(): void {
    if (this.editingNote) {
      this.noteForm.patchValue({
        text: this.editingNote.text,
        priority: this.editingNote.priority || 'medium',
        tags: this.editingNote.tags || ''
      });
    }
  }

  onSubmit(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.noteForm.value;

    if (this.editingNote) {
      // Update existing note
      this.notesService.updateNote(this.editingNote.id, {
        text: formData.text,
        priority: formData.priority,
        tags: formData.tags.split(',').map((tag: string) => tag.trim()),
        updatedAt: new Date().toISOString()
      }).subscribe({
        next: (updatedNote) => {
          this.isSubmitting = false;
          this.noteSaved.emit(updatedNote);
          this.noteForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Failed to update note:', error);
        }
      });
    } else {
      // Create new note
      this.notesService.addNote(formData.text).subscribe({
        next: (newNote) => {
          this.isSubmitting = false;
          this.noteSaved.emit({
            ...newNote,
            priority: formData.priority,
            tags: formData.tags.split(',').map((tag: string) => tag.trim())
          });
          this.noteForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Failed to add note:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.noteForm.reset();
    this.noteCancelled.emit();
  }

  onSuggestionClick(suggestion: string): void {
    const currentText = this.noteForm.get('text')?.value || '';
    const newText = currentText ? `${currentText} ${suggestion}` : suggestion;
    this.noteForm.get('text')?.setValue(newText);
  }

  getErrorMessage(controlName: string): string {
    const control = this.noteForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${this.MIN_LENGTH} characters required`;
    }
    if (control?.hasError('maxlength')) {
      return `Maximum ${this.MAX_LENGTH} characters allowed`;
    }
    if (control?.hasError('duplicateWords')) {
      return 'Note contains duplicate words';
    }
    if (control?.hasError('profanity')) {
      return 'Note contains inappropriate content';
    }
    if (control?.hasError('asyncValidation')) {
      return 'Validation failed';
    }
    return '';
  }

  getProgressColor(): string {
    const charCount = this.noteForm.get('text')?.value?.length || 0;
    const percentage = (charCount / this.MAX_LENGTH) * 100;
    
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  private noDuplicateWordsValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const words = control.value.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      
      if (words.length !== uniqueWords.size) {
        return { duplicateWords: true };
      }
      return null;
    };
  }

  private asyncValidation(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) return of(null);

    // Simulate async validation (e.g., checking for profanity)
    return new Observable(observer => {
      setTimeout(() => {
        const hasProfanity = this.checkForProfanity(control.value);
        if (hasProfanity) {
          observer.next({ profanity: true });
        } else {
          observer.next(null);
        }
        observer.complete();
      }, 500);
    });
  }

  private checkForProfanity(text: string): boolean {
    const profanityList = ['badword1', 'badword2', 'badword3'];
    const lowerText = text.toLowerCase();
    return profanityList.some(word => lowerText.includes(word));
  }

  private getSuggestions(input: string): string[] {
    if (!input || input.length < 2) return [];
    
    return this.SUGGESTIONS.filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 3);
  }

  get textControl() {
    return this.noteForm.get('text');
  }

  get priorityControl() {
    return this.noteForm.get('priority');
  }

  get tagsControl() {
    return this.noteForm.get('tags');
  }
}