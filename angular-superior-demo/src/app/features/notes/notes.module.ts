import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Components
import { NoteFormComponent } from './note-form/note-form.component';
import { NoteListComponent } from './note-list/note-list.component';

// Directives
import { HighlightDirective } from '../../shared/highlight.directive';
import { DragDropDirective } from '../../shared/drag-drop.directive';
import { ConditionalRenderDirective } from '../../shared/conditional-render.directive';

// Pipes
import { TextFormatPipe, NoteStatsPipe, TimeAgoPipe } from '../../shared/pipes/text-format.pipe';

@NgModule({
  declarations: [
    NoteFormComponent,
    NoteListComponent,
    // Directives
    HighlightDirective,
    DragDropDirective,
    ConditionalRenderDirective,
    // Pipes
    TextFormatPipe,
    NoteStatsPipe,
    TimeAgoPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    NoteFormComponent,
    NoteListComponent,
    // Directives
    HighlightDirective,
    DragDropDirective,
    ConditionalRenderDirective,
    // Pipes
    TextFormatPipe,
    NoteStatsPipe,
    TimeAgoPipe
  ]
})
export class NotesModule {}
