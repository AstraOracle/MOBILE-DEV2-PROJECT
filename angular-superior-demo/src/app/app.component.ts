import { Component } from '@angular/core';
import { NoteFormComponent } from './features/notes/note-form/note-form.component';
import { NoteListComponent } from './features/notes/note-list/note-list.component';

@Component({
  selector: 'app-root',
  template: `
    <h1>Angular Superior Demo</h1>
    <app-note-form ></app-note-form>
    <app-note-list></app-note-list>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-superior-demo';
}
