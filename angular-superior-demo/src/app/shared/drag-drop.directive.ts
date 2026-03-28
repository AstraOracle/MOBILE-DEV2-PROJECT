import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

export interface DragDropEvent {
  element: HTMLElement;
  data: any;
  originalEvent: DragEvent;
}

@Directive({
  selector: '[appDragDrop]'
})
export class DragDropDirective {
  @Output() dragStart = new EventEmitter<DragDropEvent>();
  @Output() dragEnd = new EventEmitter<DragDropEvent>();
  @Output() dragOver = new EventEmitter<DragDropEvent>();
  @Output() drop = new EventEmitter<DragDropEvent>();

  private dragData: any = null;

  constructor(private el: ElementRef) {
    this.el.nativeElement.draggable = true;
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    this.dragData = this.el.nativeElement.dataset.dragData 
      ? JSON.parse(this.el.nativeElement.dataset.dragData) 
      : { id: this.el.nativeElement.id, text: this.el.nativeElement.textContent };
    
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(this.dragData));
      event.dataTransfer.effectAllowed = 'move';
    }
    
    this.el.nativeElement.style.opacity = '0.5';
    this.el.nativeElement.style.cursor = 'grabbing';
    
    this.dragStart.emit({
      element: this.el.nativeElement,
      data: this.dragData,
      originalEvent: event
    });
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent) {
    this.el.nativeElement.style.opacity = '';
    this.el.nativeElement.style.cursor = '';
    
    this.dragEnd.emit({
      element: this.el.nativeElement,
      data: this.dragData,
      originalEvent: event
    });
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    
    this.dragOver.emit({
      element: this.el.nativeElement,
      data: this.dragData,
      originalEvent: event
    });
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const data = event.dataTransfer?.getData('text/plain');
      const dragData = data ? JSON.parse(data) : null;
      
      this.drop.emit({
        element: this.el.nativeElement,
        data: dragData,
        originalEvent: event
      });
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  }
}