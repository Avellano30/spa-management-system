


interface LogMetadata {
    [key: string]: any;
}

async function ship(level: 'info' | 'warn' | 'error', message: string, metadata: LogMetadata = {}) {
    try {
        const token = localStorage.getItem('session');
        const user  = localStorage.getItem('user');
        const adminEmail = user ? JSON.parse(user).email : null;  // ← define it here

        await fetch(`${import.meta.env.VITE_ENDPOINT}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            keepalive: true,
            body: JSON.stringify({
                level,
                message,
                metadata,
                route: window.location.pathname,
                adminEmail,
                clientName: metadata.clientName ?? null,
                role: 'admin',
            }),
        });
    } catch {
        // fail silently
    }
}

export const logAuth = async (message: string, metadata: LogMetadata = {}) => {
    try {
        const user = localStorage.getItem('user');
        const parsed = user ? JSON.parse(user) : null;
        const adminEmail = parsed?.email
            ? parsed.email.charAt(0).toUpperCase() + parsed.email.slice(1)
            : metadata.email ?? null;

        await fetch(`${import.meta.env.VITE_ENDPOINT}/logs/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                level: 'info',
                message,
                metadata,
                route: window.location.pathname,
                role: 'admin',
                adminEmail,
            }),
        });
    } catch {
        // fail silently
    }
};

export const logger = {
    info:  (message: string, metadata?: LogMetadata) => ship('info', message, metadata),
    warn:  (message: string, metadata?: LogMetadata) => ship('warn', message, metadata),
    error: (message: string, metadata?: LogMetadata) => ship('error', message, metadata),
};