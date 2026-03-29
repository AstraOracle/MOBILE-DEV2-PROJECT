import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { NotesProvider } from "./context/NotesContext";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import ErrorBoundary from "./ErrorBoundary";
import Home from "./routes/Home";
import About from "./routes/About";
import NoteDetail from "./routes/NoteDetail";
import Archived from "./routes/Archived";
import OfflineBanner from "./components/OfflineBanner";
import SyncStatus from "./components/SyncStatus";
import LanguageSelector from "./components/LanguageSelector";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotesProvider>
              <AppContent />
            </NotesProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { t } = useI18n();

  return (
    <>
      <a href="#main-content" className="visually-hidden-focusable">
        {t("skipToContent")}
      </a>

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <NavLink to="/" className="navbar-brand">
            Duly Noted
          </NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink to="/notes/new" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  {t("newNote")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/notes" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  {t("notes")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/archived" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  {t("archived")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  {t("about")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  {t("account")}
                </NavLink>
              </li>
            </ul>
            <div className="d-flex gap-3 align-items-center">
              <OfflineBanner />
              <SyncStatus />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<Home />} />
        <Route path="/notes/new" element={<NoteDetail isNew={true} />} />
        <Route path="/note/:id" element={<NoteDetail />} />
        <Route path="/archived" element={<Archived />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
