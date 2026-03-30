import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { NotesContext } from "../context/NotesContext";
import { useI18n } from '../i18n/I18nProvider';
import styles from './NoteForm.module.css';

/**
 * NoteForm Component
 * 
 * Professional form component for creating new notes with enhanced validation
 * and error handling. Supports both callback and context-based note creation.
 * 
 * @component
 * @example
 * <NoteForm onAdd={(note) => console.log('Note added:', note)} />
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAdd - Optional callback for note creation
 * @returns {React.ReactElement} Enhanced note form
 */
export default function NoteForm({ onAdd }) {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addNote } = useContext(NotesContext);
    const { t } = useI18n();

    /**
     * Basic validation to ensure we have some content
     */
    const isValidNote = (noteText) => noteText.trim().length > 0;

    /**
     * Handle form submission with proper error handling
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Quick validation - bail out if empty
        if (!isValidNote(text)) {
            alert(t('pleaseEnterNoteText'));
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Try to use the provided callback first, fall back to context
            if (typeof onAdd === 'function') {
                onAdd({ text: text.trim() });
            } else {
                await addNote(text.trim());
            }

            // Clear the input after successful submission
            setText("");
        } catch (error) {
            console.error('Note creation failed:', error);
            alert(t('createNoteFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.noteForm} onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="note-input">
                {t('addNote')}
            </label>
            <input
                id="note-input"
                className={styles.formControl}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('enterNewNote')}
                required
                aria-label={t('newNoteText')}
                disabled={isSubmitting}
            />
            <button 
                type="submit" 
                className={styles.addButton}
                disabled={isSubmitting || !isValidNote(text)}
            >
                {isSubmitting ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t('creating')}
                    </>
                ) : t('addNote')}
            </button>
        </form>
    );
}

NoteForm.propTypes = {
    onAdd: PropTypes.func,
};

NoteForm.defaultProps = {
    onAdd: undefined,
};
