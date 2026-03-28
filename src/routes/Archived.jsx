import React, { useContext } from "react";
import { NotesContext } from "../context/NotesContext";
import NoteCard from "../components/NoteCard";

/**
 * Archived Component (Page)
 * 
 * Displays archived notes with unarchive functionality.
 * Shows notes where archived=true and provides unarchive buttons.
 * 
 * @component
 * @example
 * <Route path="/archived" element={<Archived />} />
 * 
 * @returns {React.ReactElement} The archived notes page
 */
export default function Archived() {
    const ctx = useContext(NotesContext);
    const { state } = ctx;

    // Filter archived notes
    const archivedNotes = state.notes.filter(note => note.archived);

    return (
        <main id="main-content">
            <div className="container py-5">
                <h1 className="display-5 mb-4">Archived Notes</h1>
                
                <section className="mb-4">
                    <div className="d-flex gap-3 mb-3 flex-wrap">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => ctx.shareAllNotes()}
                            aria-label="Share All"
                            title="Share All"
                        >
                            Share All
                        </button>
                    </div>
                </section>

                <section>
                    {archivedNotes.length === 0 ? (
                        <div className="text-center py-5">
                            <h2 className="h5 mb-3">No archived notes</h2>
                            <p className="text-muted">Archive notes from the Notes page to see them here.</p>
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
