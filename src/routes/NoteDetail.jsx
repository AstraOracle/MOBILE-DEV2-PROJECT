import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NotesContext } from '../context/NotesContext';
import { useI18n } from '../i18n/I18nProvider';
import { formatNoteTimestamp } from '../lib/formatters';
import styles from './NoteDetail.module.css';

// Page for creating and editing notes.
export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new' || !id;

    const { state, addNote, updateNote, deleteNote, shareNote, archiveNote } = useContext(NotesContext);
    const { t } = useI18n();
    const [noteText, setNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentNote = isNew ? null : state.notes.find((note) => note.id === parseInt(id, 10));

    useEffect(() => {
        if (!isNew && currentNote) {
            setNoteText(currentNote.text);
        } else if (isNew) {
            setNoteText('');
        } else {
            navigate('/notes');
        }
    }, [isNew, currentNote, id, navigate]);

    const handleSave = async () => {
        if (!noteText.trim()) {
            alert(t('pleaseEnterNoteText'));
            return;
        }

        setIsSaving(true);

        try {
            if (isNew) {
                await addNote(noteText);
                navigate('/notes');
            } else {
                if (!currentNote) {
                    alert(t('noteNotFound'));
                    navigate('/notes');
                    return;
                }

                await updateNote(currentNote.id, { text: noteText });
                navigate('/notes');
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert(error?.message || t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isNew && currentNote) {
            const confirmed = window.confirm(t('confirmDeleteNote'));
            if (confirmed) {
                setIsDeleting(true);
                try {
                    await deleteNote(currentNote.id);
                    navigate('/notes');
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert(t('deleteFailed'));
                } finally {
                    setIsDeleting(false);
                }
            }
        }
    };

    const handleShare = () => {
        const textToShare = noteText.trim();

        if (!textToShare) {
            alert(t('cannotShareEmptyNote'));
            return;
        }

        const noteToShare = isNew
            ? {
                  id: Date.now(),
                  text: textToShare,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
              }
            : { ...currentNote, text: textToShare };

        try {
            shareNote(noteToShare);
        } catch (error) {
            console.error('Share failed:', error);
            alert(t('shareFailed'));
        }
    };

    const handleCancel = () => {
        if (!isNew && currentNote && noteText !== currentNote.text) {
            const confirmed = window.confirm(t('discardChanges'));
            if (confirmed) {
                navigate('/notes');
            }
        } else {
            navigate('/notes');
        }
    };

    const handleArchive = async () => {
        if (!isNew && currentNote) {
            try {
                await archiveNote(currentNote.id);
                navigate('/notes');
            } catch (error) {
                console.error('Archive failed:', error);
                alert(t('archiveFailed'));
            }
        }
    };

    return (
        <div className={styles.noteDetailContainer}>
            <header className={styles.noteDetailHeader}>
                <button
                    className={styles.btnCancel}
                    onClick={handleCancel}
                    aria-label={t('cancel')}
                >
                    {t('cancel')}
                </button>

                <div className={styles.headerActions}>
                    {!isNew && currentNote && (
                        <span className={styles.noteTimestamp} title={formatNoteTimestamp(currentNote)}>
                            {formatNoteTimestamp(currentNote)}
                        </span>
                    )}
                </div>
            </header>

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

            <div className={styles.noteActions}>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.actionBtn}
                        onClick={handleShare}
                        disabled={isSaving || isDeleting}
                        title={t('shareNote')}
                        aria-label={t('shareNote')}
                    >
                        📤
                    </button>

                    <button
                        className={styles.actionBtn}
                        onClick={handleArchive}
                        disabled={isSaving || isDeleting}
                        title={t('archiveNote')}
                        aria-label={t('archiveNote')}
                    >
                        📦
                    </button>

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
