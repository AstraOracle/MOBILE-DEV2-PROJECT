import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { getAllNotes, setNotes, getQueue, setQueue, clearQueue } from '../lib/idb';

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

    const queueOfflineAction = useCallback(async (action) => {
        const nextQueue = [
            ...state.queue,
            {
                ...action,
                queuedAt: new Date().toISOString(),
            },
        ];
        await setQueue(nextQueue);
        dispatch({ type: "SET_QUEUE", payload: nextQueue });
    }, [state.queue]);

    // Load notes from IndexedDB
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const notes = await getAllNotes();
                dispatch({ type: "LOAD", payload: notes });
            } catch (err) {
                console.error('Failed to load notes:', err);
            }
        };
        loadNotes();
    }, []);

    // Save notes to IndexedDB
    useEffect(() => {
        const saveNotes = async () => {
            try {
                await setNotes(state.notes);
            } catch (err) {
                console.error('Failed to save notes:', err);
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
                console.error('Failed to save queue:', err);
            }
        };
        saveQueue();
    }, [state.queue]);

    // Sync functionality
    const syncNotes = useCallback(async () => {
        dispatch({ type: "SET_SYNC_STATUS", payload: 'syncing' });
        
        try {
            // Get pending actions from queue
            const queue = await getQueue();
            
            if (queue.length === 0) {
                dispatch({ type: "SET_SYNC_STATUS", payload: 'idle' });
                return;
            }

            // Simulate processing queued offline actions.
            for (const item of queue) {
                try {
                    console.log('Syncing item:', item);
                } catch (err) {
                    console.error('Sync failed for item:', item, err);
                }
            }

            // Clear queue after successful sync
            await clearQueue();
            dispatch({ type: "SET_QUEUE", payload: [] });
            dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
            dispatch({ type: "SET_SYNC_STATUS", payload: 'idle' });

        } catch (err) {
            console.error('Sync failed:', err);
            dispatch({ type: "SET_SYNC_STATUS", payload: 'error' });
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            syncNotes().catch((error) => {
                console.error('Automatic sync failed:', error);
            });
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [syncNotes]);

    // Add new note with timestamp
    const addNote = useCallback(async (noteText) => {
        console.log('addNote called with:', noteText);
        if (!noteText || !noteText.trim()) {
            console.error('addNote: Empty note text provided');
            throw new Error('Note text cannot be empty');
        }
        
        const newNote = {
            id: Date.now(),
            text: noteText.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            console.log('Attempting to save note to IndexedDB:', newNote);
            // Get current notes and add new note
            const currentNotes = await getAllNotes();
            const updatedNotes = [...currentNotes, newNote];
            await setNotes(updatedNotes);
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await queueOfflineAction({ type: 'ADD_NOTE', payload: newNote });
            }
            console.log('Note saved to IndexedDB successfully');
            dispatch({ type: "ADD", payload: newNote });
            console.log('Note added to state successfully');
        } catch (err) {
            console.error('Failed to add note:', err);
            throw new Error('Unable to save note');
        }
    }, [queueOfflineAction]);

    // Update existing note with timestamp
    const updateNote = useCallback(async (id, updates) => {
        // Find the note first
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
            const updatedNotes = state.notes.map(n => 
                n.id === id ? updatedNote : n
            );
            await setNotes(updatedNotes);
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await queueOfflineAction({ type: 'UPDATE_NOTE', payload: updatedNote });
            }
            dispatch({ type: "UPDATE", payload: updatedNote });
        } catch (err) {
            console.error('Failed to update note:', err);
            throw new Error('Unable to save note changes');
        }
    }, [state.notes, queueOfflineAction]);

    // Delete note
    const deleteNote = useCallback(async (id) => {
        try {
            const updatedNotes = state.notes.filter(n => n.id !== id);
            await setNotes(updatedNotes);
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await queueOfflineAction({ type: 'DELETE_NOTE', payload: { id } });
            }
            dispatch({ type: "DELETE", payload: id });
        } catch (err) {
            console.error('Failed to delete note:', err);
            throw new Error('Unable to delete note');
        }
    }, [state.notes, queueOfflineAction]);

    // Fallback sharing method using clipboard API
    const fallbackShare = useCallback(async (text) => {
        if (!text) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                console.log('Text copied to clipboard');
            } else {
                // Last resort: manual copy via textarea
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                console.log('Text copied to clipboard (fallback method)');
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
                navigator.share(shareData).then(() => {
                    console.log('Note shared successfully');
                }).catch((error) => {
                    console.error('Share failed:', error);
                    // Fallback to clipboard if share fails
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
                navigator.share(shareData).then(() => {
                    console.log('All notes shared successfully');
                }).catch((error) => {
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

    /**
     * Archive a note by setting its archived property to true
     */
    const archiveNote = useCallback(async (id) => {
        const noteToArchive = state.notes.find(n => n.id === id);
        
        if (!noteToArchive) {
            console.error('Note not found for archiving:', id);
            throw new Error('Note not found');
        }
        
        const updatedNote = {
            ...noteToArchive,
            archived: true,
            updatedAt: new Date().toISOString()
        };
        
        try {
            const updatedNotes = state.notes.map(n => 
                n.id === id ? updatedNote : n
            );
            await setNotes(updatedNotes);
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await queueOfflineAction({ type: 'ARCHIVE_NOTE', payload: updatedNote });
            }
            dispatch({ type: "UPDATE", payload: updatedNote });
        } catch (err) {
            console.error('Failed to archive note:', err);
            throw new Error('Unable to archive note');
        }
    }, [state.notes, queueOfflineAction]);

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
