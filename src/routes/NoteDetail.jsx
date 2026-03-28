import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NotesContext } from '../context/NotesContext';
import { useI18n } from '../i18n/I18nProvider';
import { formatNoteTimestamp } from '../lib/formatters';
import styles from './NoteDetail.module.css';

/**
 * NoteDetail Component
 * 
 * Professional note editing interface with mobile-first design.
 * Features large textarea optimized for mobile devices, timestamp tracking,
 * and native sharing integration.
 * 
 * @component
 * @example
 * <NoteDetail />
 * 
 * @returns {React.ReactElement} Enhanced note editing interface
 */
export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new' || !id;
    
    console.log('NoteDetail rendered:', { id, isNew, params: useParams() });
    
    const { state, addNote, updateNote, deleteNote, shareNote, archiveNote } = useContext(NotesContext);
    const { t } = useI18n();
    const [noteText, setNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Get current note from context
    const currentNote = isNew ? null : state.notes.find(n => n.id === parseInt(id));

    // Load note text when editing existing note
    useEffect(() => {
        console.log('NoteDetail useEffect:', { isNew, currentNote, id });
        
        if (!isNew && currentNote) {
            setNoteText(currentNote.text);
            console.log('Loaded existing note:', currentNote);
        } else if (isNew) {
            setNoteText('');
            console.log('Creating new note');
        } else {
            // Note not found - redirect to notes list
            console.log('Note not found, redirecting to /notes');
            navigate('/notes');
        }
    }, [isNew, currentNote, id, navigate]);

    /**
     * Handle note saving with proper error handling
     */
    const handleSave = async () => {
        if (!noteText.trim()) {
            alert('Please enter note text');
            return;
        }

        setIsSaving(true);
        
        try {
            if (isNew) {
                await addNote(noteText);
                // Navigate to the notes list
                navigate('/notes');
            } else {
                // Check if currentNote exists before trying to update
                if (!currentNote) {
                    alert('Note not found');
                    navigate('/notes');
                    return;
                }
                await updateNote(currentNote.id, { text: noteText });
                navigate('/notes');
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Handle note deletion with confirmation
     */
    const handleDelete = async () => {
        if (!isNew && currentNote) {
            const confirmed = window.confirm('Are you sure you want to delete this note?');
            if (confirmed) {
                setIsDeleting(true);
                try {
                    await deleteNote(currentNote.id);
                    navigate('/notes');
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Delete failed');
                } finally {
                    setIsDeleting(false);
                }
            }
        }
    };

    /**
     * Handle note sharing with enhanced error handling
     */
    const handleShare = () => {
        const textToShare = noteText.trim();
        
        if (!textToShare) {
            alert('Cannot share empty note');
            return;
        }

        const noteToShare = isNew 
            ? { 
                id: Date.now(),
                text: textToShare,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : { ...currentNote, text: textToShare };
        
        try {
            shareNote(noteToShare);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Share failed. Please try again.');
        }
    };

    /**
     * Handle cancel action
     */
    const handleCancel = () => {
        if (!isNew && currentNote && noteText !== currentNote.text) {
            const confirmed = window.confirm('Discard changes?');
            if (confirmed) {
                navigate('/notes');
            }
        } else {
            navigate('/notes');
        }
    };

    /**
     * Handle archive action
     */
    const handleArchive = async () => {
        if (!isNew && currentNote) {
            try {
                await archiveNote(currentNote.id);
                navigate('/notes');
            } catch (error) {
                console.error('Archive failed:', error);
                alert('Archive failed');
            }
        }
    };

    return (
        <div className={styles.noteDetailContainer}>
            {/* Header with navigation */}
            <header className={styles.noteDetailHeader}>
                <button 
                    className={styles.btnCancel}
                    onClick={handleCancel}
                    aria-label={t('cancel')}
                >
                    ← {t('back')}
                </button>
                
                <div className={styles.headerActions}>
                    {!isNew && currentNote && (
                        <span className={styles.noteTimestamp} title={formatNoteTimestamp(currentNote)}>
                            {formatNoteTimestamp(currentNote)}
                        </span>
                    )}
                </div>
            </header>

            {/* Main content area */}
            <main className={styles.noteDetailMain}>
                <div className={styles.noteEditorContainer}>
                    <label htmlFor="note-textarea" className="visually-hidden">
                        {isNew ? t('newNote') : t('editNote')}
                    </label>
                    
                    <textarea
                        id="note-textarea"
                        className={styles.noteTextarea}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={t('startWriting')}
                        aria-label={t('noteContent')}
                    />
                </div>
            </main>

            {/* Floating action buttons for mobile */}
            <div className={styles.noteActions}>
                <div className={styles.actionButtons}>
                    {/* Share Button */}
                    <button
                        className={styles.actionBtn}
                        onClick={handleShare}
                        disabled={isSaving || isDeleting}
                        title={t('shareNote')}
                        aria-label={t('shareNote')}
                    >
                        📤
                    </button>

                    {/* Archive Button */}
                    <button
                        className={styles.actionBtn}
                        onClick={handleArchive}
                        disabled={isSaving || isDeleting}
                        title={t('archiveNote')}
                        aria-label={t('archiveNote')}
                    >
                        📦
                    </button>

                    {/* Delete Button */}
                    {!isNew && (
                        <button
                            className={styles.actionBtn}
                            onClick={handleDelete}
                            disabled={isSaving || isDeleting}
                            title={t('deleteNote')}
                            aria-label={t('deleteNote')}
                        >
                            🗑️
                        </button>
                    )}
                </div>

                {/* Save Button - Fixed at bottom for easy access */}
                <div className={styles.saveContainer}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={isSaving || isDeleting}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t('saving')}
                            </>
                        ) : isNew ? t('createNote') : t('saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
}
