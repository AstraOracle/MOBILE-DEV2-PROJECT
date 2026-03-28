import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register, user, logout } = useContext(AuthContext);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Auth failed');
    }
  };

  if (user) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm rounded-3 p-4" style={{maxWidth: '400px', margin: '0 auto'}}>
          <p className="mb-3">Signed in as <strong>{user.username}</strong></p>
          <button className="btn btn-primary" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <form onSubmit={handleSubmit} className="card shadow-sm rounded-3 p-4" style={{maxWidth: '400px', margin: '0 auto'}}>
        <h3 className="h4 mb-4">{mode === 'login' ? 'Sign in' : 'Register'}</h3>
        <div className="mb-3">
          <input className="form-control" required placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="mb-3">
          <input className="form-control" required placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary flex-grow-1">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
          <button type="button" className="btn btn-secondary flex-grow-1" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Have an account?'}</button>
        </div>
      </form>
    </div>
  );
}