import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { getAllNotes, setNotes, getQueue, setQueue, clearQueue } from '../lib/idb';
import { AuthContext } from './AuthContext';
import {
    createNoteRequest,
    deleteNoteRequest,
    fetchNotesRequest,
    updateNoteRequest,
} from '../lib/api';

export const NotesContext = createContext();

const initialState = {
    notes: [],
    queue: [],
    lastSync: null,
    syncStatus: 'idle', // 'idle', 'syncing', 'error'
};

function reducer(state, action) {
    switch (action.type) {
        case "LOAD":
            return { ...state, notes: action.payload };
        case "ADD":
            return { ...state, notes: [...state.notes, action.payload] };
        case "DELETE":
            return {
                ...state,
                notes: state.notes.filter((n) => n.id !== action.payload),
            };
        case "UPDATE":
            return {
                ...state,
                notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n)
            };
        case "SET_QUEUE":
            return { ...state, queue: action.payload };
        case "SET_LAST_SYNC":
            return { ...state, lastSync: action.payload };
        case "SET_SYNC_STATUS":
            return { ...state, syncStatus: action.payload };
        default:
            return state;
    }
}

export function NotesProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { token } = useContext(AuthContext);

    const persistNotesCache = useCallback(async (notes) => {
        try {
            await setNotes(notes);
        } catch (error) {
            console.warn('Unable to update local notes cache:', error);
        }
    }, []);

    const persistQueueCache = useCallback(async (queue) => {
        try {
            await setQueue(queue);
        } catch (error) {
            console.warn('Unable to update local sync queue cache:', error);
        }
    }, []);

    const queueOfflineAction = useCallback(async (action) => {
        const storedQueue = await getQueue();
        const nextQueue = [
            ...storedQueue,
            {
                ...action,
                queuedAt: new Date().toISOString(),
            },
        ];
        await persistQueueCache(nextQueue);
        dispatch({ type: "SET_QUEUE", payload: nextQueue });
    }, [persistQueueCache]);

    const loadNotes = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                const remoteNotes = await fetchNotesRequest(token);
                await persistNotesCache(remoteNotes);
                dispatch({ type: "LOAD", payload: remoteNotes });
                dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
                dispatch({ type: "SET_SYNC_STATUS", payload: 'idle' });
                return;
            }
        } catch (err) {
            console.error('Failed to load notes from API, falling back to local cache:', err);
        }

        try {
            const cachedNotes = await getAllNotes();
            dispatch({ type: "LOAD", payload: cachedNotes });
        } catch (err) {
            console.error('Failed to load notes:', err);
        }
    }, [persistNotesCache, token]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    // Save notes to IndexedDB
    useEffect(() => {
        const saveNotes = async () => {
            try {
                await setNotes(state.notes);
            } catch (err) {
                console.warn('Failed to save notes:', err);
            }
        };
        saveNotes();
    }, [state.notes]);

    // Load queue from IndexedDB
    useEffect(() => {
        const loadQueue = async () => {
            try {
                const queue = await getQueue();
                dispatch({ type: "SET_QUEUE", payload: queue });
            } catch (err) {
                console.error('Failed to load queue:', err);
            }
        };
        loadQueue();
    }, []);

    // Save queue to IndexedDB
    useEffect(() => {
        const saveQueue = async () => {
            try {
                await setQueue(state.queue);
            } catch (err) {
                console.warn('Failed to save queue:', err);
            }
        };
        saveQueue();
    }, [state.queue]);

    const syncNotes = useCallback(async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return;
        }

        dispatch({ type: "SET_SYNC_STATUS", payload: 'syncing' });

        try {
            const queue = await getQueue();

            for (const item of queue) {
                switch (item.type) {
                    case 'ADD':
                        await createNoteRequest(item.payload, token);
                        break;
                    case 'UPDATE':
                        await updateNoteRequest(item.payload.id, item.payload, token);
                        break;
                    case 'DELETE':
                        await deleteNoteRequest(item.payload.id, token);
                        break;
                    default:
                        break;
                }
            }

            await clearQueue();
            dispatch({ type: "SET_QUEUE", payload: [] });
            const remoteNotes = await fetchNotesRequest(token);
            await persistNotesCache(remoteNotes);
            dispatch({ type: "LOAD", payload: remoteNotes });
            dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
            dispatch({ type: "SET_SYNC_STATUS", payload: 'idle' });
        } catch (err) {
            console.error('Sync failed:', err);
            dispatch({ type: "SET_SYNC_STATUS", payload: 'error' });
        }
    }, [persistNotesCache, token]);

    useEffect(() => {
        const handleOnline = () => {
            syncNotes().catch((error) => {
                console.error('Automatic sync failed:', error);
            });
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [syncNotes]);

    const addNote = useCallback(async (noteText) => {
        if (!noteText || !noteText.trim()) {
            throw new Error('Note text cannot be empty');
        }

        const newNote = {
            id: Date.now(),
            text: noteText.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
        };

        try {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                const savedNote = await createNoteRequest(newNote, token);
                const nextNotes = [...state.notes, savedNote];
                await persistNotesCache(nextNotes);
                dispatch({ type: "ADD", payload: savedNote });
                dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
                return savedNote;
            }

            const updatedNotes = [...state.notes, newNote];
            await setNotes(updatedNotes);
            await queueOfflineAction({ type: 'ADD', payload: newNote });
            dispatch({ type: "ADD", payload: newNote });
            return newNote;
        } catch (err) {
            console.error('Failed to add note:', err);
            throw err instanceof Error ? err : new Error('Unable to save note');
        }
    }, [persistNotesCache, queueOfflineAction, state.notes, token]);

    const updateNote = useCallback(async (id, updates) => {
        const noteToUpdate = state.notes.find(n => n.id === id);

        if (!noteToUpdate) {
            console.error('Note not found for update:', id);
            throw new Error('Note not found');
        }

        const updatedNote = {
            ...noteToUpdate,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        try {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                const savedNote = await updateNoteRequest(id, updatedNote, token);
                const nextNotes = state.notes.map(n => 
                    n.id === id ? savedNote : n
                );
                await persistNotesCache(nextNotes);
                dispatch({ type: "UPDATE", payload: savedNote });
                dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
                return savedNote;
            }

            const updatedNotes = state.notes.map(n => 
                n.id === id ? updatedNote : n
            );
            await setNotes(updatedNotes);
            await queueOfflineAction({ type: 'UPDATE', payload: updatedNote });
            dispatch({ type: "UPDATE", payload: updatedNote });
            return updatedNote;
        } catch (err) {
            console.error('Failed to update note:', err);
            throw err instanceof Error ? err : new Error('Unable to save note changes');
        }
    }, [persistNotesCache, state.notes, queueOfflineAction, token]);

    const deleteNote = useCallback(async (id) => {
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                await deleteNoteRequest(id, token);
                const updatedNotes = state.notes.filter(n => n.id !== id);
                await persistNotesCache(updatedNotes);
                dispatch({ type: "DELETE", payload: id });
                dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
                return;
            }

            const updatedNotes = state.notes.filter(n => n.id !== id);
            await setNotes(updatedNotes);
            await queueOfflineAction({ type: 'DELETE', payload: { id } });
            dispatch({ type: "DELETE", payload: id });
        } catch (err) {
            console.error('Failed to delete note:', err);
            throw err instanceof Error ? err : new Error('Unable to delete note');
        }
    }, [persistNotesCache, state.notes, queueOfflineAction, token]);

    // Fallback sharing method using clipboard API
    const fallbackShare = useCallback(async (text) => {
        if (!text) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
        } catch (error) {
            console.error('Clipboard copy failed:', error);
        }
    }, []);

    // Share functionality with enhanced error handling
    const shareNote = useCallback((note) => {
        if (!note || !note.text || !note.text.trim()) {
            console.warn('Cannot share empty note');
            return;
        }

        const noteText = note.text.trim();
        const shareData = {
            title: 'Duly Noted - Note Sharing',
            text: noteText,
        };

        // Add URL if available (for better sharing experience)
        if (window.location && window.location.href) {
            shareData.url = window.location.href;
        }

        if (navigator.share) {
            try {
                navigator.share(shareData).catch((error) => {
                    console.error('Share failed:', error);
                    fallbackShare(noteText);
                });
            } catch (error) {
                console.error('Share API error:', error);
                fallbackShare(noteText);
            }
        } else {
            fallbackShare(noteText);
        }
    }, [fallbackShare]);

    const shareAllNotes = useCallback(() => {
        const nonArchivedNotes = state.notes.filter(n => !n.archived);
        
        if (nonArchivedNotes.length === 0) {
            console.warn('No notes to share');
            return;
        }

        const allText = nonArchivedNotes.map((n, index) => {
            const date = n.updatedAt || n.createdAt;
            const formattedDate = new Date(date).toLocaleString();
            return `Note ${index + 1} (${formattedDate}):\n${n.text}\n---`;
        }).join('\n\n');

        const shareData = {
            title: `Duly Noted - ${nonArchivedNotes.length} Notes`,
            text: allText,
        };

        // Add URL if available
        if (window.location && window.location.href) {
            shareData.url = window.location.href;
        }

        if (navigator.share) {
            try {
                navigator.share(shareData).catch((error) => {
                    console.error('Share failed:', error);
                    fallbackShare(allText);
                });
            } catch (error) {
                console.error('Share API error:', error);
                fallbackShare(allText);
            }
        } else {
            fallbackShare(allText);
        }
    }, [state.notes, fallbackShare]);

    const archiveNote = useCallback(async (id) => {
        return updateNote(id, { archived: true });
    }, [updateNote]);

    return (
        <NotesContext.Provider value={{ 
            state, 
            notes: state.notes,
            queue: state.queue,
            lastSync: state.lastSync,
            syncStatus: state.syncStatus,
            dispatch,
            addNote,
            updateNote,
            deleteNote,
            archiveNote,
            shareNote,
            shareAllNotes,
            syncNotes
        }}>
            {children}
        </NotesContext.Provider>
    );
}
