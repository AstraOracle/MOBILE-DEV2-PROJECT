import React from "react";
import SyncStatus from "./SyncStatus";
import { I18nProvider } from "../i18n/I18nProvider";
import { NotesContext } from "../context/NotesContext";

const meta = {
  title: "Components/SyncStatus",
  component: SyncStatus,
  decorators: [
    (Story, context) => (
      <I18nProvider>
        <NotesContext.Provider value={context.args.contextValue}>
          <Story />
        </NotesContext.Provider>
      </I18nProvider>
    ),
  ],
  tags: ["autodocs"],
  args: {
    contextValue: {
      state: { notes: [], queue: [], lastSync: null, syncStatus: "idle" },
      queue: [],
      lastSync: null,
      syncStatus: "idle",
    },
  },
};

export default meta;

export const Idle = {};

export const Syncing = {
  args: {
    contextValue: {
      state: { notes: [], queue: [{ type: "ADD_NOTE" }], lastSync: null, syncStatus: "syncing" },
      queue: [{ type: "ADD_NOTE" }],
      lastSync: null,
      syncStatus: "syncing",
    },
  },
};

export const ErrorState = {
  args: {
    contextValue: {
      state: { notes: [], queue: [{ type: "UPDATE_NOTE" }, { type: "DELETE_NOTE" }], lastSync: null, syncStatus: "error" },
      queue: [{ type: "UPDATE_NOTE" }, { type: "DELETE_NOTE" }],
      lastSync: null,
      syncStatus: "error",
    },
  },
};
