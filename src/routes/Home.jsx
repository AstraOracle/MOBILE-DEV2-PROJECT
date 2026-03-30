import React, { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NotesContext } from "../context/NotesContext";
import { useI18n } from "../i18n/I18nProvider";
import NoteCard from "../components/NoteCard";
import styles from "./Home.module.css";

/**
 * Main notes list page.
 * Supports filtering, empty states, and sharing all active notes.
 */
export default function Home() {
    const { state, shareAllNotes } = useContext(NotesContext);
    const { t } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isSharing, setIsSharing] = useState(false);

    const showArchived = searchParams.get("archived") === "true";
    const isArchivedNote = (note) => note.archived === true || note.archived === "true";
    const notes = state.notes.filter((note) => (showArchived ? isArchivedNote(note) : !isArchivedNote(note)));

    function toggleArchived() {
        if (showArchived) {
            searchParams.delete("archived");
            setSearchParams(searchParams);
            return;
        }

        setSearchParams({ archived: "true" });
    }

    async function handleShareAll() {
        const nonArchivedNotes = state.notes.filter((note) => !isArchivedNote(note));

        if (nonArchivedNotes.length === 0) {
            alert(t("noNotesToShare"));
            return;
        }

        setIsSharing(true);
        try {
            await shareAllNotes();
        } catch (error) {
            console.error("Share failed:", error);
            alert(t("shareFailed"));
        } finally {
            setIsSharing(false);
        }
    }

    const getPageTitle = () => {
        if (showArchived) return t("archived");
        return notes.length === 0 ? t("noNotesYet") : t("notes");
    };

    const getEmptyMessage = () => {
        if (showArchived) {
            return {
                title: t("noArchivedNotes"),
                description: t("createAndArchiveNotes"),
            };
        }

        return {
            title: t("noNotesYet"),
            description: t("startByCreatingFirstNote"),
        };
    };

    return (
        <main id="main-content" className={styles.homePage}>
            <div className={styles.floatingShareContainer}>
                <button
                    className={styles.floatingShareBtn}
                    onClick={handleShareAll}
                    disabled={isSharing || state.notes.length === 0}
                    aria-label={t("shareAllNotes")}
                    title={t("shareAllNotes")}
                >
                    {isSharing ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        "Share"
                    )}
                </button>
            </div>

            <div className="container py-4 py-md-5">
                <div className="row justify-content-between align-items-center mb-4">
                    <div className="col-md-8">
                        <h1 className={styles.display6}>{getPageTitle()}</h1>
                        {!showArchived && (
                            <p className={styles.textMuted}>
                                {notes.length} {notes.length === 1 ? t("note") : t("notes")} - {t("createAndOrganizeNotes")}
                            </p>
                        )}
                    </div>
                    <div className="col-md-4 text-md-end">
                        <div className="d-flex gap-2 justify-content-md-end">
                            <button
                                className={styles.btnPrimary}
                                onClick={handleShareAll}
                                disabled={isSharing || state.notes.length === 0}
                                aria-label={t("shareAllNotes")}
                            >
                                {isSharing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t("sharing")}
                                    </>
                                ) : (
                                    t("shareAll")
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <section className="mb-4">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="d-flex gap-2 flex-wrap">
                                <button
                                    className={showArchived ? styles.btnOutlineSecondary : styles.btnPrimary}
                                    onClick={toggleArchived}
                                    aria-pressed={!showArchived}
                                    aria-label={showArchived ? t("activeNotesLabel") : t("archivedNotesLabel")}
                                >
                                    {showArchived ? t("showActive") : t("showArchived")}
                                </button>

                                {!showArchived && (
                                    <span className={styles.badgeBgSecondary}>
                                        {notes.length} {t("notes")}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!showArchived && (
                            <div className="col-md-6 text-md-end">
                                <span className={styles.textMutedSmall}>{t("archiveTip")}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    {notes.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyContent}>
                                <div className={styles.emptyIcon}>{showArchived ? "Archived" : "Notes"}</div>
                                <h2 className={styles.h5}>{getEmptyMessage().title}</h2>
                                <p className={styles.emptyDescription}>{getEmptyMessage().description}</p>

                                {!showArchived && (
                                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                                        <button
                                            className={styles.btnPrimary}
                                            onClick={() => navigate("/notes/new")}
                                            aria-label={t("createFirstNote")}
                                        >
                                            {t("createNote")}
                                        </button>
                                        <button
                                            className={styles.btnOutlineSecondary}
                                            onClick={() => navigate("/about")}
                                            aria-label={t("learnMore")}
                                        >
                                            {t("learnMore")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.notesGrid}>
                            {notes.map((note) => (
                                <NoteCard key={note.id} note={note} className="note-card" />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
