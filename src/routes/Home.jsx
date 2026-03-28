import React, { useContext, useState } from "react";
import { NotesContext } from "../context/NotesContext";
import { useI18n } from "../i18n/I18nProvider";
import NoteCard from "../components/NoteCard";
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

/**
 * Home Component (Page)
 * 
 * Professional notes list page with enhanced mobile experience.
 * Features left-side share button, improved filtering, and better
 * accessibility. Supports both active and archived note views.
 * 
 * @component
 * @example
 * // Used as the main notes list route
 * <Route path="/notes" element={<Home />} />
 * 
 * @returns {React.ReactElement} Enhanced home page with notes management
 */
export default function Home() {
    const { state, shareAllNotes } = useContext(NotesContext);
    const { t } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isSharing, setIsSharing] = useState(false);

    const showArchived = searchParams.get('archived') === 'true';

    /**
     * Toggles between showing archived and active notes
     */
    function toggleArchived() {
        if (showArchived) {
            searchParams.delete('archived');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ archived: 'true' });
        }
    }

    /**
     * Handles sharing all notes with enhanced error handling and validation
     */
    async function handleShareAll() {
        const nonArchivedNotes = state.notes.filter(n => !n.archived);
        
        if (nonArchivedNotes.length === 0) {
            alert('No notes to share. Create some notes first!');
            return;
        }

        setIsSharing(true);
        try {
            shareAllNotes();
        } catch (error) {
            console.error('Share failed:', error);
            alert('Share failed. Please try again.');
        } finally {
            setIsSharing(false);
        }
    }

    /**
     * Filters notes based on current archived toggle state
     */
    const notes = state.notes.filter(n => (showArchived ? true : !n.archived));

    /**
     * Gets appropriate heading based on current view
     */
    const getPageTitle = () => {
        if (showArchived) {
            return t('archived');
        }
        return notes.length === 0 ? t('noNotesYet') : t('notes');
    };

    /**
     * Gets appropriate empty state message
     */
    const getEmptyMessage = () => {
        if (showArchived) {
            return {
                title: t('noArchivedNotes'),
                description: t('createAndArchiveNotes')
            };
        }
        return {
            title: t('noNotesYet'),
            description: t('startByCreatingFirstNote')
        };
    };

    return (
        <main id="main-content" className={styles.homePage}>
            {/* Left-side floating share button for mobile */}
            <div className={styles.floatingShareContainer}>
                <button
                    className={styles.floatingShareBtn}
                    onClick={handleShareAll}
                    disabled={isSharing || state.notes.length === 0}
                    aria-label="Share all notes"
                    title="Share all notes"
                >
                    {isSharing ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        '📤'
                    )}
                </button>
            </div>

            <div className="container py-4 py-md-5">
                {/* Page header */}
                <div className="row justify-content-between align-items-center mb-4">
                    <div className="col-md-8">
                        <h1 className={styles.display6}>{getPageTitle()}</h1>
                        {!showArchived && (
                            <p className={styles.textMuted}>
                                {notes.length} {notes.length === 1 ? 'note' : 'notes'} • Create and organize
                            </p>
                        )}
                    </div>
                    <div className="col-md-4 text-md-end">
                        <div className="d-flex gap-2 justify-content-md-end">
                            <button 
                                className={styles.btnPrimary}
                                onClick={handleShareAll}
                                disabled={isSharing || state.notes.length === 0}
                                aria-label="Share all notes"
                            >
                                {isSharing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Sharing...
                                    </>
                                ) : (
                                    <>
                                        📤 Share All
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controls section */}
                <section className="mb-4">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="d-flex gap-2 flex-wrap">
                                <button 
                                    className={showArchived ? styles.btnOutlineSecondary : styles.btnPrimary}
                                    onClick={toggleArchived} 
                                    aria-pressed={!showArchived}
                                    aria-label={showArchived ? 'Show active notes' : 'Show archived notes'}
                                >
                                    {showArchived ? 'Show Active' : 'Show Archived'}
                                </button>
                                
                                {!showArchived && (
                                    <span className={styles.badgeBgSecondary}>
                                        {notes.length} notes
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {!showArchived && (
                            <div className="col-md-6 text-md-end">
                                <span className={styles.textMutedSmall}>
                                    Tip: Archive notes to keep your active list clean
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Notes grid or empty state */}
                <section>
                    {notes.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyContent}>
                                <div className={styles.emptyIcon}>
                                    {showArchived ? '📦' : '📝'}
                                </div>
                                <h2 className={styles.h5}>{getEmptyMessage().title}</h2>
                                <p className={styles.emptyDescription}>{getEmptyMessage().description}</p>
                                
                            {!showArchived && (
                                <div className="d-flex gap-2 flex-wrap justify-content-center">
                                    <button 
                                        className={styles.btnPrimary}
                                        onClick={() => navigate('/notes/new')}
                                        aria-label="Create first note"
                                    >
                                        ✏️ Create Note
                                    </button>
                                    <button 
                                        className={styles.btnOutlineSecondary}
                                        onClick={() => navigate('/about')}
                                        aria-label="Learn more"
                                    >
                                        ℹ️ Learn More
                                    </button>
                                </div>
                            )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.notesGrid}>
                            {notes.map((note) => (
                                <NoteCard 
                                    key={note.id} 
                                    note={note} 
                                    className="note-card"
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
