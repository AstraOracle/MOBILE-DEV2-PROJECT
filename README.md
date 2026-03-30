# Duly Noted

Duly Noted is a note-taking app built with React. This repo also includes an Angular demo and a custom web component for sharing notes.

## Core Features

- Create, edit, archive, delete, and share notes
- Save notes through the API and keep a local cache with IndexedDB
- Track sync state and queued actions
- Navigate with React Router between notes, archived notes, account, and about pages
- Switch languages with an i18n provider
- Use a custom `share-button` web component with Shadow DOM and slot content
- Review isolated React components in Storybook
- Explore an Angular demo with reactive forms, directives, bindings, and RxJS state

## Project Structure

- [src/App.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\App.js): main React app shell and routing
- [src/context/NotesContext.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\context\NotesContext.jsx): note state, sync status, and CRUD actions
- [src/components/NoteCard.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.jsx): note card used in the list views
- [src/routes/NoteDetail.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\routes\NoteDetail.jsx): dedicated create/edit note page
- [src/web-components/share-button.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\web-components\share-button.js): custom element with Shadow DOM
- [angular-superior-demo](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\angular-superior-demo): Angular component and reactivity demo
- [.storybook](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\.storybook): Storybook configuration for React components

## Notes

- The React app uses hash routing so page refreshes still work during local development.
- Notes are saved through the API in [duly-noted/server/data.json](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\duly-noted\server\data.json).
- There is also a local IndexedDB cache in [src/lib/idb.js](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\lib\idb.js) for offline support.
- Storybook stories are included for some reusable components in [src/components/NoteCard.stories.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\NoteCard.stories.jsx) and [src/components/SyncStatus.stories.jsx](C:\Users\vipin\OneDrive\Desktop\MOBILE-DEV-2-PROJECT\src\components\SyncStatus.stories.jsx).

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
