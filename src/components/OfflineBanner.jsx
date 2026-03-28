import useOnlineStatus from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
    const online = useOnlineStatus();

    if (online) return null;

    return (
        <div role="alert" className="offline">
            You are offline. Changes will persist locally.
        </div>
    )
}