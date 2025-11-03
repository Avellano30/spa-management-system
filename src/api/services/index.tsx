const endpoint = import.meta.env.VITE_ENDPOINT || 'http://localhost:3000';

export interface Service {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: number; // minutes
    category: string;
    imageUrl: string;
    imagePublicId: string;
    status: 'available' | 'unavailable';
}

export async function getAllServices() {
    const response = await fetch(`${endpoint}/services`);

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const data: Service[] = await response.json();
    console.log(data);
    return data;
}

