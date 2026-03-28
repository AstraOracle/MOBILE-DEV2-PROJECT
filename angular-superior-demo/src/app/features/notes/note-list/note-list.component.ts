import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { NotesService, Note } from 'src/app/core/notes.service';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, startWith, switchMap, takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteListComponent implements OnInit, OnDestroy {
  notes$: Observable<Note[]>;
  filteredNotes$!: Observable<Note[]>;
  stats$: Observable<{ total: number; archived: number; active: number }>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  searchControl = new FormControl('');
  filterControl = new FormControl('all');
  sortByControl = new FormControl('date');
  
  private destroy$ = new Subject<void>();

  constructor(private notesService: NotesService) {
    this.loading$ = this.notesService.loading$;
    this.error$ = this.notesService.error$;
    
    // Get notes and stats
    this.notes$ = this.notesService.notes$;
    this.stats$ = this.notesService.getStats();
  }

  ngOnInit(): void {
    // Advanced filtering and sorting logic
    this.filteredNotes$ = combineLatest([
      this.notes$,
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.filterControl.valueChanges.pipe(startWith('all')),
      this.sortByControl.valueChanges.pipe(startWith('date'))
    ]).pipe(
      map(([notes, searchQuery, filter, sortBy]) => {
        let filtered = notes;

        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(note => 
            note.text.toLowerCase().includes(query) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
          );
        }

        // Filter by archived status
        switch (filter) {
          case 'archived':
            filtered = filtered.filter(note => note.archived);
            break;
          case 'active':
            filtered = filtered.filter(note => !note.archived);
            break;
        }

        // Sort notes
        filtered = [...filtered].sort((a, b) => {
          switch (sortBy) {
            case 'date':
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case 'title':
              return a.text.localeCompare(b.text);
            case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              const aPriority = priorityOrder[a.priority || 'medium'];
              const bPriority = priorityOrder[b.priority || 'medium'];
              return bPriority - aPriority;
            default:
              return 0;
          }
        });

        return filtered;
      }),
      takeUntil(this.destroy$)
    );

    // Load initial data
    this.notesService.getNotes().subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  deleteNote(id: number): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(id).subscribe();
    }
  }

  toggleArchive(note: Note): void {
    this.notesService.toggleArchive(note.id).subscribe();
  }

  exportNotes(): void {
    const data = this.notesService.exportNotes();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importNotes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.notesService.importNotes(content).subscribe({
          next: () => {
            alert('Notes imported successfully');
            input.value = '';
          },
          error: () => {
            alert('Failed to import notes. Invalid file format.');
            input.value = '';
          }
        });
      };
      reader.readAsText(file);
    }
  }

  clearCache(): void {
    this.notesService.clearCache();
    alert('Cache cleared');
  }

  refreshNotes(): void {
    this.notesService.getNotes(true).subscribe();
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '🟡';
    }
  }
}
