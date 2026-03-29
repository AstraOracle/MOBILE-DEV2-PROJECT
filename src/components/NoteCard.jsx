import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { NotesContext } from "../context/NotesContext";
import { useI18n } from "../i18n/I18nProvider";
import "../web-components/share-button";
import { truncateText, formatFriendlyDate, formatNoteTimestamp } from "../lib/formatters";
import styles from "./NoteCard.module.css";

/**
 * Render a single note preview card in a note list.
 *
 * Responsibilities:
 * - Display a preview of a note's text and timestamp
 * - Provide archive and delete actions for the note
 * - Expose sharing through the custom <share-button> web component
 *
 * @param {object} props Component props.
 * @param {object} props.note Note data to render.
 * @param {number} props.note.id Unique note identifier.
 * @param {string} props.note.text Full note text content.
 * @param {boolean} [props.note.archived] Whether the note is archived.
 * @param {string} [props.note.updatedAt] ISO timestamp of last update.
 * @param {string} [props.note.createdAt] ISO timestamp of creation.
 * @param {(noteId: number) => void | Promise<void>} [props.onDelete] Optional override for delete handling.
 * @param {string} [props.className] Optional extra class names for layout wrappers.
 * @returns {React.ReactElement} A reusable note card preview.
 */
export default function NoteCard({ note, onDelete, className = "" }) {
    const { updateNote, deleteNote: deleteNoteFromContext } = useContext(NotesContext);
    const { t } = useI18n();

    const toggleArchiveStatus = async () => {
        try {
            await updateNote(note.id, {
                archived: !note.archived,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Archive toggle failed:", error);
            alert(t("archiveFailed"));
        }
    };

    const handleDelete = async () => {
        const shouldDelete = window.confirm(t("confirmDeleteNote"));
        if (!shouldDelete) return;

        try {
            if (typeof onDelete === "function") {
                await onDelete(note.id);
            } else {
                await deleteNoteFromContext(note.id);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert(t("deleteFailed"));
        }
    };

    const previewText = truncateText(note.text, 180);
    const displayDate = formatFriendlyDate(note.updatedAt || note.createdAt);
    const fullTimestamp = formatNoteTimestamp(note);

    return (
        <article className={`${styles.noteCard} ${className}`.trim()} data-note-id={note.id}>
            <div className={`${styles.noteBody} d-flex flex-column`}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex gap-2 align-items-center">
                        <share-button
                            class={styles.shareBtn}
                            note-text={note.text}
                            label={t("share")}
                            aria-label={t("shareNote")}
                        >
                            Share
                        </share-button>

                        <button
                            className={`btn ${note.archived ? "btn-outline-success" : "btn-outline-warning"} btn-sm`}
                            aria-label={note.archived ? t("unarchiveNote") : t("archiveNote")}
                            onClick={toggleArchiveStatus}
                            title={note.archived ? t("unarchiveNote") : t("archiveNote")}
                        >
                            {note.archived ? t("unarchive") : t("archive")}
                        </button>
                    </div>

                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDelete}
                        aria-label={t("deleteNote")}
                        title={t("deleteNote")}
                    >
                        Delete
                    </button>
                </div>

                <div className={`${styles.noteContent} flex-grow-1`}>
                    <Link
                        to={`/note/${note.id}`}
                        className={styles.noteLink}
                        aria-label={`${t("editNote")}: ${previewText}`}
                    >
                        <p className={styles.noteText}>{previewText}</p>
                    </Link>

                    <div className="d-flex justify-content-between align-items-center">
                        <p className="text-muted small mb-0" title={fullTimestamp}>
                            {displayDate}
                        </p>
                        {note.archived && (
                            <span className="badge bg-warning-subtle text-warning-emphasis small">
                                {t("archived")}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <div className={styles.touchTarget} aria-hidden="true"></div>
                </div>
            </div>
        </article>
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
    className: PropTypes.string,
};
