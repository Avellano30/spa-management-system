const endpoint = import.meta.env.VITE_ENDPOINT || "http://localhost:3000";

export interface Intensity {
  _id: string;
  name: string[];
}

export interface NewIntensity {
  name: string[];
}

export async function getAllIntensities(): Promise<Intensity[]> {
  const res = await fetch(`${endpoint}/intensities`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function createIntensity(
  intensity: NewIntensity,
): Promise<Intensity> {
  const res = await fetch(`${endpoint}/intensities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(intensity),
  });
  if (!res.ok) throw new Error("Failed to create intensity");
  return res.json();
}

export async function deleteIntensity(id: string): Promise<void> {
  const res = await fetch(`${endpoint}/intensities/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete intensity");
}
