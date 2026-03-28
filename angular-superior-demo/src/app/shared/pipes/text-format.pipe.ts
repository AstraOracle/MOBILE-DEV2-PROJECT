import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textFormat'
})
export class TextFormatPipe implements PipeTransform {
  transform(value: string, format: 'uppercase' | 'lowercase' | 'titlecase' | 'truncate' = 'titlecase', ...args: any[]): string {
    if (!value) return '';

    switch (format) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'titlecase':
        return value.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'truncate':
        const maxLength = args[0] || 50;
        return value.length > maxLength 
          ? value.substring(0, maxLength) + '...' 
          : value;
      default:
        return value;
    }
  }
}

@Pipe({
  name: 'noteStats'
})
export class NoteStatsPipe implements PipeTransform {
  transform(notes: any[], filter: 'all' | 'archived' | 'active' = 'all'): number {
    if (!notes) return 0;

    switch (filter) {
      case 'archived':
        return notes.filter(note => note.archived).length;
      case 'active':
        return notes.filter(note => !note.archived).length;
      default:
        return notes.length;
    }
  }
}

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}