import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function About() {
    const { user } = useContext(AuthContext);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) return null;
    
    return (
        <main id="main-content">
            <div className="container py-5">
                <h1 className="display-5 mb-4">About Duly Noted</h1>
                <p className="lead">This App demonstrates advanced React Features</p>
                
                {user && (
                    <div className="card bg-light border-primary mt-5">
                        <div className="card-body">
                            <h5 className="card-title">👤 Account Information</h5>
                            <p className="mb-2">
                                <strong>Status:</strong> <span className="badge bg-success">✓ Signed In</span>
                            </p>
                            <p className="mb-0">
                                <strong>Username:</strong> <code>{user.username}</code>
                            </p>
                        </div>
                    </div>
                )}
                
                {!user && mounted && (
                    <div className="alert alert-info mt-5">
                        <strong>📝 Not signed in</strong> - Go to the <strong>Account</strong> page to sign in or create an account
                    </div>
                )}
            </div>
        </main>
    )
}
