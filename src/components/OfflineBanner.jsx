import useOnlineStatus from "../hooks/useOnlineStatus";
import { useI18n } from "../i18n/I18nProvider";

export default function OfflineBanner() {
    const online = useOnlineStatus();
    const { t } = useI18n();

    if (online) return null;

    return (
        <div role="alert" className="offline">
            {t('offlineMessage')}
        </div>
    )
}
