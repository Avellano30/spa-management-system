const endpoint = import.meta.env.VITE_ENDPOINT || 'http://localhost:3000';

export interface HomepageSettings {
    brand: {
        name: string;
        logoUrl?: string;
    };
    contact: {
        email: string;
        phone?: string;
        address?: string;
    };
    content: {
        heading?: string;
        description?: string;
        bodyDescription?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Fetch homepage settings (JSON)
export async function getHomepageSettings(): Promise<HomepageSettings | null> {
    const res = await fetch(`${endpoint}/homepage-settings`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch homepage settings');
    return res.json();
}

// Create homepage settings (FormData for file upload)
export async function createHomepageSettings(data: FormData) {
    const res = await fetch(`${endpoint}/homepage-settings`, {
        method: 'POST',
        body: data, // no Content-Type header for FormData
    });
    if (!res.ok) throw new Error('Failed to create homepage settings');
    return res.json();
}

// Update homepage settings (FormData for file upload)
export async function updateHomepageSettings(data: FormData) {
    const res = await fetch(`${endpoint}/homepage-settings`, {
        method: 'PATCH',
        body: data, // FormData
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody.message || 'Failed to update homepage settings';
        throw new Error(message);
    }

    return res.json();
}
