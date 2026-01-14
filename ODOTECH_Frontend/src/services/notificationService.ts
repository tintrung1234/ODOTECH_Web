const getApiUrl = () => import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export async function getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
    try {
        const res = await fetch(`${getApiUrl()}/api/notifications?limit=${limit}&offset=${offset}`, {
            credentials: 'include'
        });
        if (res.status === 401 || res.status === 403) return [];
        if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getUnreadCount(): Promise<number> {
    try {
        const res = await fetch(`${getApiUrl()}/api/notifications/unread-count`, {
            credentials: 'include'
        });
        if (res.status === 401 || res.status === 403) return 0;
        if (!res.ok) throw new Error(`Failed to fetch unread count (${res.status})`);
        const data = await res.json();
        return data.count;
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export async function markAsRead(id: number): Promise<boolean> {
    try {
        const res = await fetch(`${getApiUrl()}/api/notifications/${id}/read`, {
            method: 'PATCH',
            credentials: 'include'
        });
        return res.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function markAllAsRead(): Promise<boolean> {
    try {
        const res = await fetch(`${getApiUrl()}/api/notifications/read-all`, {
            method: 'PATCH',
            credentials: 'include'
        });
        return res.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
}
