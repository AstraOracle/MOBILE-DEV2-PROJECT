import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

export default function About() {
    const { user } = useContext(AuthContext);
    const { t } = useI18n();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main id="main-content">
            <div className="container py-5">
                <h1 className="display-5 mb-4">{t('aboutTitle')}</h1>
                <p className="lead">{t('aboutDescription')}</p>

                {user && (
                    <div className="card bg-light border-primary mt-5">
                        <div className="card-body">
                            <h5 className="card-title">{t('accountInfo')}</h5>
                            <p className="mb-2">
                                <strong>{t('statusLabel')}:</strong>{" "}
                                <span className="badge bg-success">{t('signedIn')}</span>
                            </p>
                            <p className="mb-0">
                                <strong>{t('username')}:</strong> <code>{user.username}</code>
                            </p>
                        </div>
                    </div>
                )}

                {!user && mounted && (
                    <div className="alert alert-info mt-5">
                        <strong>{t('notSignedIn')}</strong> - {t('accountPrompt')}
                    </div>
                )}
            </div>
        </main>
    );
}
