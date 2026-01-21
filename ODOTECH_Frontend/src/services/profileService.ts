const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    phone: string;
    role_system: string;
    point: number;
    position: string;
    salary: number;
    payable: number;
    join_date: string;
    status: string;
    last_login_at: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateProfileData {
    name: string;
    email: string;
    phone: string;
    username: string;
}

export interface ChangePasswordData {
    newPassword: string;
}

export async function getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/api/accounts/profile/me`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/api/accounts/profile/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
}

export async function changePassword(data: ChangePasswordData): Promise<{ ok: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/accounts/profile/me/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
    }

    return response.json();
}
