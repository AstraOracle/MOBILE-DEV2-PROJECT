import React from "react";
import { BrowserRouter } from "react-router-dom";
import NoteCard from "./NoteCard";
import { I18nProvider } from "../i18n/I18nProvider";
import { NotesContext } from "../context/NotesContext";

const mockContext = {
  state: { notes: [], queue: [], lastSync: null, syncStatus: "idle" },
  notes: [],
  queue: [],
  lastSync: null,
  syncStatus: "idle",
  updateNote: async () => {},
  deleteNote: async () => {},
  archiveNote: async () => {},
  addNote: async () => {},
  shareNote: async () => {},
  shareAllNotes: async () => {},
  syncNotes: async () => {},
};

const meta = {
  title: "Components/NoteCard",
  component: NoteCard,
  decorators: [
    (Story) => (
      <I18nProvider>
        <BrowserRouter>
          <NotesContext.Provider value={mockContext}>
            <div style={{ width: 360 }}>
              <Story />
            </div>
          </NotesContext.Provider>
        </BrowserRouter>
      </I18nProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Reusable note preview card with archive/delete actions and sharing powered by the custom <share-button> web component.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  args: {
    note: {
      id: 1,
      text: "Buy milk, eggs, and bread after class.",
      archived: false,
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    },
  },
};

export const Archived = {
  args: {
    note: {
      id: 2,
      text: "Completed project checklist and submission notes.",
      archived: true,
      createdAt: "2026-03-27T09:15:00.000Z",
      updatedAt: "2026-03-28T08:30:00.000Z",
    },
  },
};

export const LongContent = {
  args: {
    note: {
      id: 3,
      text: "This is a longer note used to show how the card handles wrapping, padding, and scanability when content spans multiple lines in the notes grid.",
      archived: false,
      createdAt: "2026-03-28T06:15:00.000Z",
      updatedAt: "2026-03-28T07:45:00.000Z",
    },
  },
};
