import React, { useContext } from "react";
import { NotesContext } from "../context/NotesContext";
import NoteCard from "../components/NoteCard";
import { useI18n } from "../i18n/I18nProvider";

// Page that shows only archived notes.
export default function Archived() {
    const ctx = useContext(NotesContext);
    const { state } = ctx;
    const { t } = useI18n();

    const archivedNotes = state.notes.filter((note) => note.archived === true || note.archived === "true");

    return (
        <main id="main-content">
            <div className="container py-5">
                <h1 className="display-5 mb-4">{t('archived')}</h1>
                
                <section className="mb-4">
                    <div className="d-flex gap-3 mb-3 flex-wrap">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => ctx.shareAllNotes()}
                            aria-label={t('shareAll')}
                            title={t('shareAll')}
                        >
                            {t('shareAll')}
                        </button>
                    </div>
                </section>

                <section>
                    {archivedNotes.length === 0 ? (
                        <div className="text-center py-5">
                            <h2 className="h5 mb-3">{t('noArchivedNotes')}</h2>
                            <p className="text-muted">{t('createAndArchiveNotes')}</p>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {archivedNotes.map((note) => (
                                <div className="col-12 col-md-6 col-lg-4" key={note.id}>
                                    <NoteCard note={note} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
