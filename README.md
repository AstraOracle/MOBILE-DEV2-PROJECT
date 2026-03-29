# Duly Noted

Duly Noted is a mobile-friendly note-taking application built with React, plus a companion Angular demo and a custom web component implementation. The app focuses on reusable components, offline-first note persistence, accessible interaction patterns, and clear routing for common note workflows.

## Core Features

- Create, edit, archive, delete, and share notes
- Persist notes locally with IndexedDB for offline use
- Track sync state and queue offline actions
- Navigate with React Router between notes, archived notes, account, and about pages
- Switch languages with an i18n provider
- Use a custom `share-button` web component with Shadow DOM and slot content
- Review isolated React components in Storybook
- Explore an Angular demo with reactive forms, directives, bindings, and RxJS state

## Project Structure

- [src/App.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\App.js): main React app shell and routing
- [src/context/NotesContext.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\context\NotesContext.jsx): global note state, offline queue, sync status
- [src/components/NoteCard.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.jsx): reusable note card with web-component sharing
- [src/routes/NoteDetail.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\routes\NoteDetail.jsx): dedicated create/edit note page
- [src/web-components/share-button.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\web-components\share-button.js): custom element with Shadow DOM
- [angular-superior-demo](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\angular-superior-demo): Angular component and reactivity demo
- [.storybook](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\.storybook): Storybook configuration for React components

## Rubric Alignment

### Component Design & Documentation

- Components are split by responsibility across routes, context, hooks, UI components, and utilities.
- Reusable interfaces are documented with prop types and component comments in files like [src/components/NoteCard.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.jsx) and [src/components/SyncStatus.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\SyncStatus.jsx).

### Web Components

- The app includes a custom `share-button` element implemented in [src/web-components/share-button.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\web-components\share-button.js).
- It uses Shadow DOM, slot content, accessible live regions, and is mounted in the real UI through [src/components/NoteCard.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.jsx).

### Angular Components

- The Angular demo includes reusable components, directives, and service-driven reactivity.
- Strong examples include [notes.service.ts](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\angular-superior-demo\src\app\core\notes.service.ts), [note-form.component.ts](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\angular-superior-demo\src\app\features\notes\note-form\note-form.component.ts), and shared directives in [angular-superior-demo\src\app\shared](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\angular-superior-demo\src\app\shared).

### React Setup & Fundamentals

- The app is scaffolded with Create React App and uses React Router, context providers, error boundaries, and immutable state updates.
- Storybook stories are included for core reusable components in [src/components/NoteCard.stories.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.stories.jsx) and [src/components/SyncStatus.stories.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\SyncStatus.stories.jsx).

### Application State Management

- Global note state is managed in [src/context/NotesContext.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\context\NotesContext.jsx) with a reducer and dedicated sync metadata.
- Local and global state are separated cleanly across page components and shared providers.

### Routing & Navigation

- Page routing is defined in [src/App.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\App.js) for the notes list, new note page, note detail page, archived page, account page, and about page.
- The notes page and dedicated editor support deep-link navigation through route parameters and URL state.

### Styling & Responsiveness

- Styling combines global CSS with CSS modules such as [src/routes/Home.module.css](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\routes\Home.module.css) and [src/components/NoteCard.module.css](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.module.css).
- Layouts are responsive for desktop and mobile, with accessible labels, keyboard focus states, and readable spacing.

### Dynamic Data & Persistence

- Full note CRUD is supported through [src/routes/NoteDetail.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\routes\NoteDetail.jsx) and [src/context/NotesContext.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\context\NotesContext.jsx).
- IndexedDB persistence and offline queue helpers live in [src/lib/idb.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\lib\idb.js).

### Accessibility & Multi-language Support

- The app includes skip links, ARIA labels, status regions, and keyboard-friendly interactions.
- Translations are centralized in [src/i18n/i18n.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\i18n\i18n.js) and used throughout the application.

### Professionalism & Usability

- The app uses a dedicated new note page, consistent note card layout, clear archive flow, and documented component stories.
- The repository now includes a rubric-oriented README, reusable component stories, and improved submission-facing structure.

## Local Development

### React app

```bash
npm install
npm start
```

### Storybook

```bash
npm run storybook
```

### Angular demo

```bash
cd angular-superior-demo
npm install
npm start
```
