// Main application imports
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
import { I18nProvider } from "./i18n/I18nProvider";

// Main application component - handles routing and global context providers
function App() {
  // Wrapping the entire app in ErrorBoundary to catch any unexpected errors
  // I18nProvider handles internationalization (must be outside BrowserRouter)
  // AuthProvider handles user authentication state
  // NotesProvider manages the global notes state
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
  console.log('AppContent rendered');
  
  return (
    <>
      <a href="#main-content" className="visually-hidden-focusable">Skip to content</a>
      
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <NavLink to="/" className="navbar-brand">
            📝 Duly Noted
          </NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink 
                  to="/notes/new" 
                  className={({isActive}) => {
                    console.log('New Note link active:', isActive);
                    return isActive ? "nav-link active" : "nav-link";
                  }}
                >
                  New Note
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/notes" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                  Notes
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/archived" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                  Archived
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/about" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                  About
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/login" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                  Account
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
        <Route path="/" element={<NoteDetail isNew={true} />} />
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
