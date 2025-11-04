const endpoint = import.meta.env.VITE_ENDPOINT || 'http://localhost:3000';

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl: string;
  imagePublicId: string;
  status: 'available' | 'unavailable';
}

export interface NewService {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: File | null;
}

export async function getAllServices(): Promise<Service[]> {
  const res = await fetch(`${endpoint}/services`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function createService(service: NewService): Promise<Service> {
  const formData = new FormData();
  Object.entries(service).forEach(([key, val]) => {
    if (val !== undefined && val !== null) formData.append(key, val as any);
  });

  const res = await fetch(`${endpoint}/services`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to create service');
  return res.json();
}

export async function updateService(id: string, service: Partial<NewService>): Promise<Service> {
  const formData = new FormData();
  Object.entries(service).forEach(([key, val]) => {
    if (val !== undefined && val !== null) formData.append(key, val as any);
  });

  const res = await fetch(`${endpoint}/services/${id}`, { method: 'PATCH', body: formData });
  if (!res.ok) throw new Error('Failed to update service');
  return res.json();
}

export async function deleteService(id: string): Promise<void> {
  const res = await fetch(`${endpoint}/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete service');
}

export async function toggleServiceStatus(id: string, status: 'available' | 'unavailable'): Promise<Service> {
    console.log('Toggling status for service ID:', id, 'to', status);
    const res = await fetch(`${endpoint}/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}
