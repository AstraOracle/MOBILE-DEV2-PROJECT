/**
 * Format a date to be more user-friendly
 * Shows "Today", "Yesterday", day of week, or full date depending on age
 * 
 * @param {string|Date} dateString - The date to format (ISO string or Date object)
 * @returns {string} Human-readable date string
 */
export function formatFriendlyDate(dateString) {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  
  // Compare dates without time components
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = todayOnly - dateOnly;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (diffDays === 0) {
    return `Today ${timeString}`;
  } else if (diffDays === 1) {
    return `Yesterday ${timeString}`;
  } else if (diffDays < 7) {
    // Show day name for recent dates
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${timeString}`;
  } else {
    // For older dates, show month and day
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Truncate text to fit in a preview area
 * Tries to avoid cutting words in half by finding the last space
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Max characters before truncating (default: 200)
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Get the truncated text and find the last space
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Only break at space if it's not too close to the beginning
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Format a date with full details for detailed views
 * Shows full month name, day, year, and time
 * 
 * @param {string|Date} dateString - The date to format
 * @returns {string} Detailed date string
 */
export function formatLongDate(dateString) {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// TODO: Add a function to format relative times like "2 hours ago"
// TODO: Maybe add support for different locale formats based on user settings

/**
 * Format timestamp for note display showing both created and updated times
 * @param {Object} note - Note object with createdAt and updatedAt
 * @returns {string} Formatted timestamp string
 */
export function formatNoteTimestamp(note) {
    if (!note || !note.createdAt) {
        return '';
    }

    const created = formatLongDate(note.createdAt);
    
    // If note has been updated and it's different from created time
    if (note.updatedAt && note.updatedAt !== note.createdAt) {
        const updated = formatLongDate(note.updatedAt);
        return `Created: ${created} • Updated: ${updated}`;
    }
    
    return `Created: ${created}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 172800) {
        return 'Yesterday';
    } else {
        return formatLongDate(dateObj);
    }
}
