const endpoint = import.meta.env.VITE_ENDPOINT || "http://localhost:3000";

export interface Employee {
  _id: string;
  name: string;
  imageUrl: string;
  imagePublicId: string;
  status: "available" | "unavailable";
  schedule: string[]; // e.g. ["monday", "tuesday"]
}

export interface NewEmployee {
  name: string;
  status: string;
  schedule: string[];
  image?: File | null;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const res = await fetch(`${endpoint}/employees`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function createEmployee(service: NewEmployee): Promise<Employee> {
  const formData = new FormData();
  Object.entries(service).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
        if (key === "schedule" && Array.isArray(val)) {
            val.forEach((day: string) => formData.append("schedule[]", day));
        } else {
            formData.append(key, val as any);
        }
    }
  });

  const res = await fetch(`${endpoint}/employees`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create record");
  return res.json();
}

export async function updateEmployee(
  id: string,
  service: Partial<NewEmployee>,
): Promise<Employee> {
  const formData = new FormData();
    Object.entries(service).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
            if (key === "schedule" && Array.isArray(val)) {
                val.forEach((day: string) => formData.append("schedule[]", day));
            } else {
                formData.append(key, val as any);
            }
        }
    });

  const res = await fetch(`${endpoint}/employees/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to update record");
  return res.json();
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`${endpoint}/employees/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete record");
}

export async function toggleStatus(
  id: string,
  status: "available" | "unavailable",
): Promise<Employee> {
  console.log("Toggling status for employee ID:", id, "to", status);
  const res = await fetch(`${endpoint}/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}
