import React, { useContext } from 'react';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { NotesContext } from '../context/NotesContext';
import { useI18n } from '../i18n/I18nProvider';

/**
 * SyncStatus Component
 * 
 * Displays the synchronization status of notes, including network connectivity,
 * sync state, queued actions count, and timestamp of last successful sync.
 * Updates in real-time as sync operations progress.
 * 
 * @component
 * @example
 * <SyncStatus />
 * 
 * @returns {React.ReactElement} A status indicator with sync information
 */
export default function SyncStatus() {
  const online = useOnlineStatus();
  const { queue, lastSync, syncStatus } = useContext(NotesContext);
  const { t } = useI18n();

  const hasPendingActions = queue && queue.length > 0;

  let badgeColor = 'bg-secondary';
  if (syncStatus === 'syncing') badgeColor = 'bg-primary';
  if (syncStatus === 'error') badgeColor = 'bg-danger';
  if (!online) badgeColor = 'bg-warning';

  return (
    <div 
      className="d-flex align-items-center gap-2 small text-muted"
      aria-live="polite" 
      aria-atomic="true"
      role="status"
    >
      <span 
        className={`badge rounded-circle ${badgeColor}`}
        style={{width: '8px', height: '8px', padding: '0'}}
        aria-hidden="true"
      ></span>
      
      <span>{online ? t('online') : t('offline')}</span>
      
      {syncStatus === 'syncing' && (
        <span>{t('syncing')}</span>
      )}
      
      {syncStatus === 'error' && (
        <span className="text-danger">{t('syncError')}</span>
      )}
      
      {hasPendingActions && (
        <span title={`${queue.length} pending actions`}>
          {t('queued')}: {queue.length}
        </span>
      )}
      
      {lastSync && (
        <span title={new Date(lastSync).toLocaleString()}>
          {t('last')}: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
