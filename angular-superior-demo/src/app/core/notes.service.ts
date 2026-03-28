import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay, retry } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export interface Note {
  id: number;
  text: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface NoteStats {
  total: number;
  archived: number;
  active: number;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  notes$ = this.notesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  private apiUrl = 'api/notes';
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastFetchTime = 0;

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Try to load from localStorage first
    const cachedNotes = localStorage.getItem('notes-cache');
    if (cachedNotes) {
      try {
        const notes = JSON.parse(cachedNotes);
        this.notesSubject.next(notes);
        this.lastFetchTime = Date.now();
      } catch (error) {
        console.warn('Failed to load cached notes:', error);
      }
    }
  }

  private updateCache(notes: Note[]) {
    localStorage.setItem('notes-cache', JSON.stringify(notes));
    this.lastFetchTime = Date.now();
  }

  getNotes(forceRefresh = false): Observable<Note[]> {
    const now = Date.now();
    const isCacheValid = (now - this.lastFetchTime) < this.cacheTimeout;

    if (isCacheValid && !forceRefresh) {
      return of(this.notesSubject.value).pipe(delay(100)); // Simulate network delay
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Note[]>(this.apiUrl).pipe(
      retry(3),
      delay(500), // Simulate network delay
      tap(notes => {
        this.notesSubject.next(notes);
        this.updateCache(notes);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Failed to load notes');
        return this.getOfflineNotes();
      })
    );
  }

  addNote(text: string): Observable<Note> {
    if (!text || text.trim().length === 0) {
      return throwError(() => new Error('Note text cannot be empty'));
    }

    const newNote: Omit<Note, 'id'> = {
      text: text.trim(),
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Note>(this.apiUrl, newNote).pipe(
      tap(note => {
        const currentNotes = this.notesSubject.value;
        this.notesSubject.next([...currentNotes, note]);
        this.updateCache([...currentNotes, note]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Failed to add note');
        return this.addOfflineNote(newNote);
      })
    );
  }

  updateNote(id: number, updates: Partial<Note>): Observable<Note> {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return throwError(() => new Error('Note not found'));
    }

    const updatedNote = {
      ...currentNotes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<Note>(`${this.apiUrl}/${id}`, updatedNote).pipe(
      tap(note => {
        currentNotes[noteIndex] = note;
        this.notesSubject.next([...currentNotes]);
        this.updateCache([...currentNotes]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Failed to update note');
        currentNotes[noteIndex] = { ...currentNotes[noteIndex], ...updates };
        this.notesSubject.next([...currentNotes]);
        this.updateCache([...currentNotes]);
        return of(updatedNote);
      })
    );
  }

  deleteNote(id: number): Observable<void> {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return throwError(() => new Error('Note not found'));
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const updatedNotes = currentNotes.filter(n => n.id !== id);
        this.notesSubject.next(updatedNotes);
        this.updateCache(updatedNotes);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Failed to delete note');
        return of(undefined);
      })
    );
  }

  toggleArchive(id: number): Observable<Note> {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return throwError(() => new Error('Note not found'));
    }

    const noteToUpdate = currentNotes[noteIndex];
    const updatedNote = {
      ...noteToUpdate,
      archived: !noteToUpdate.archived,
      updatedAt: new Date().toISOString()
    };

    return this.updateNote(id, updatedNote);
  }

  getStats(): Observable<NoteStats> {
    return this.notes$.pipe(
      map(notes => ({
        total: notes.length,
        archived: notes.filter(n => n.archived).length,
        active: notes.filter(n => !n.archived).length
      }))
    );
  }

  searchNotes(query: string): Observable<Note[]> {
    if (!query || query.trim().length === 0) {
      return this.notes$;
    }

    const searchQuery = query.toLowerCase().trim();
    return this.notes$.pipe(
      map(notes => notes.filter(note => 
        note.text.toLowerCase().includes(searchQuery)
      ))
    );
  }

  private getOfflineNotes(): Observable<Note[]> {
    const cachedNotes = localStorage.getItem('notes-cache');
    if (cachedNotes) {
      try {
        const notes = JSON.parse(cachedNotes);
        this.notesSubject.next(notes);
        return of(notes);
      } catch (error) {
        console.warn('Failed to load offline notes:', error);
      }
    }
    return of([]);
  }

  private addOfflineNote(note: Omit<Note, 'id'>): Observable<Note> {
    const newNote: Note = {
      ...note,
      id: Date.now()
    };
    
    const currentNotes = this.notesSubject.value;
    const updatedNotes = [...currentNotes, newNote];
    this.notesSubject.next(updatedNotes);
    this.updateCache(updatedNotes);
    
    return of(newNote);
  }

  clearCache(): void {
    localStorage.removeItem('notes-cache');
    this.lastFetchTime = 0;
  }

  exportNotes(): string {
    const notes = this.notesSubject.value;
    return JSON.stringify(notes, null, 2);
  }

  importNotes(jsonData: string): Observable<Note[]> {
    try {
      const notes: Note[] = JSON.parse(jsonData);
      
      // Validate notes structure
      const validNotes = notes.filter(note => 
        note.id && note.text && typeof note.archived === 'boolean'
      );

      this.notesSubject.next(validNotes);
      this.updateCache(validNotes);
      
      return of(validNotes);
    } catch (error) {
      return throwError(() => new Error('Invalid JSON data'));
    }
  }
}