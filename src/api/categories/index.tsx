const endpoint = import.meta.env.VITE_ENDPOINT || "http://localhost:3000";

export interface Category {
  _id: string;
  name: string | string[];
}

export interface NewCategory {
  name: string | string[];
}

export async function getAllCategories(): Promise<Category[]> {
  const res = await fetch(`${endpoint}/categories`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function createCategory(category: NewCategory): Promise<Category> {
  const res = await fetch(`${endpoint}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${endpoint}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
}
