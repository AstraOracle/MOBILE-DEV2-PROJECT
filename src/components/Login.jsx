import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nProvider";

export default function Login() {
  const { login, register, user, logout } = useContext(AuthContext);
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || t("authFailed"));
    }
  };

  if (user) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm rounded-3 p-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
          <p className="mb-3">
            {t("signedInAs")} <strong>{user.username}</strong>
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <form
        onSubmit={handleSubmit}
        className="card shadow-sm rounded-3 p-4"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <h3 className="h4 mb-4">{mode === "login" ? t("signIn") : t("register")}</h3>
        <div className="mb-3">
          <label className="visually-hidden" htmlFor="username-input">
            {t("username")}
          </label>
          <input
            id="username-input"
            className="form-control"
            required
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="visually-hidden" htmlFor="password-input">
            {t("password")}
          </label>
          <input
            id="password-input"
            className="form-control"
            required
            placeholder={t("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary flex-grow-1">
            {mode === "login" ? t("signIn") : t("createAccount")}
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-grow-1"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? t("createAccount") : t("haveAccount")}
          </button>
        </div>
      </form>
    </div>
  );
}
