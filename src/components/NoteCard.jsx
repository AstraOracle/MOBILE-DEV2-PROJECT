import React, { useContext } from "react";
import PropTypes from 'prop-types';
import { NotesContext } from "../context/NotesContext";
import { useI18n } from '../i18n/I18nProvider';
import { Link } from 'react-router-dom';
import "../web-components/share-button";
import { truncateText, formatFriendlyDate, formatNoteTimestamp } from '../lib/formatters';
import styles from './NoteCard.module.css';

/**
 * NoteCard Component
 * 
 * Professional note card component with enhanced mobile experience.
 * Displays note content, timestamps, and action buttons for sharing,
 * archiving, and deleting. Optimized for touch interactions and accessibility.
 * 
 * @component
 * @example
 * <NoteCard note={note} />
 * 
 * @param {Object} props - Component props
 * @param {Object} props.note - Note object with id, text, createdAt, updatedAt, archived
 * @param {Function} props.onDelete - Optional delete handler
 * @returns {React.ReactElement} Enhanced note card
 */
export default function NoteCard({ note, onDelete }) {
    const { updateNote, deleteNote: deleteNoteFromContext, shareNote } = useContext(NotesContext);
    const { t } = useI18n();

    /**
     * Archive or unarchive a note with proper context integration
     */
    const toggleArchiveStatus = async () => {
        try {
            await updateNote(note.id, { 
                archived: !note.archived,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Archive toggle failed:', error);
            alert(t('archiveFailed'));
        }
    };

    /**
     * Delete a note with user confirmation and proper error handling
     */
    const handleDelete = async () => {
        const shouldDelete = window.confirm(t('confirmDeleteNote'));
        if (!shouldDelete) return;
        
        try {
            if (typeof onDelete === 'function') {
                onDelete(note.id);
            } else {
                await deleteNoteFromContext(note.id);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert(t('deleteFailed'));
        }
    };

    /**
     * Share a note using the context share function with enhanced error handling
     */
    const handleShare = () => {
        const textToShare = note.text.trim();
        
        if (!textToShare) {
            alert(t('cannotShareEmptyNote'));
            return;
        }

        try {
            shareNote(note);
        } catch (error) {
            console.error('Share failed:', error);
            alert(t('shareFailed'));
        }
    };

    /**
     * Get the best date to display for this note
     * Prefer updatedAt if available, otherwise fall back to createdAt
     */
    const getDisplayDate = () => note.updatedAt || note.createdAt;

    /**
     * Truncate note text for preview with improved mobile readability
     */
    const previewText = truncateText(note.text, 180);
    const displayDate = formatFriendlyDate(getDisplayDate());
    const fullTimestamp = formatNoteTimestamp(note);

    return (
        <div className={styles.noteCard} data-note-id={note.id}>
            <div className="card-body d-flex flex-column">
                {/* Header with actions */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex gap-2">
                        {/* Native share button */}
                        <button
                            className={styles.shareBtn}
                            onClick={handleShare}
                            aria-label={t('shareNote')}
                            title={t('shareNote')}
                        >
                            📤
                        </button>
                        
                        {/* Archive toggle */}
                        <button
                            className={`btn ${note.archived ? 'btn-outline-success' : 'btn-outline-warning'} btn-sm`}
                            aria-label={note.archived ? t('unarchiveNote') : t('archiveNote')}
                            onClick={toggleArchiveStatus}
                            title={note.archived ? t('unarchiveNote') : t('archiveNote')}
                        >
                            {note.archived ? t('unarchive') : t('archive')}
                        </button>
                    </div>
                    
                    {/* Delete button */}
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDelete}
                        aria-label={t('deleteNote')}
                        title={t('deleteNote')}
                    >
                        🗑️
                    </button>
                </div>

                {/* Note content */}
                <div className="flex-grow-1">
                    <Link 
                        to={`/note/${note.id}`} 
                        className="text-decoration-none text-dark"
                        aria-label={`${t('editNote')}: ${previewText}`}
                    >
                        <p className="card-text mb-2">
                            {previewText}
                        </p>
                    </Link>
                    
                    {/* Timestamp with tooltip for full details */}
                    <div className="d-flex justify-content-between align-items-center">
                        <p 
                            className="text-muted small mb-0"
                            title={fullTimestamp}
                        >
                            {displayDate}
                        </p>
                        {note.archived && (
                            <span className="badge bg-warning-subtle text-warning-emphasis small">
                                📦 {t('archived')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Touch-friendly bottom border for mobile */}
                <div className="card-footer border-0 pt-0">
                    <div className={styles.touchTarget} aria-hidden="true"></div>
                </div>
            </div>
        </div>
    );
}

NoteCard.propTypes = {
    note: PropTypes.shape({
        id: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
        archived: PropTypes.bool,
        updatedAt: PropTypes.string,
        createdAt: PropTypes.string,
    }).isRequired,
    onDelete: PropTypes.func,
};
