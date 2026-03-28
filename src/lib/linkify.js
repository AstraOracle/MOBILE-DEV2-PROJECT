/**
 * URL Linkification Utilities
 * Converts plain text URLs to clickable HTML links
 */

import React from 'react';

/**
 * Converts URLs in text to clickable links
 * @param {string} text - Plain text that may contain URLs
 * @returns {ReactElement} - Text with URLs converted to link elements
 */
export function linkifyText(text) {
  if (!text) return text;
  
  // URL regex pattern - matches http, https, and www URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        
        // Check if this part is a URL
        if (urlRegex.test(part)) {
          // Add protocol if missing
          const href = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                fontWeight: '500',
              }}
            >
              {part}
            </a>
          );
        }
        
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Converts URLs to clickable links as a string
 * Useful for plain text contexts
 * @param {string} text - Text with URLs
 * @returns {string} - HTML string with links
 */
export function linkifyTextToHTML(text) {
  if (!text) return text;
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 500;">${url}</a>`;
  });
}