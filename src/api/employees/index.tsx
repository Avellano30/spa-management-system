import { logger } from '../../lib/logger';

const endpoint = import.meta.env.VITE_ENDPOINT || "http://localhost:3000";

export interface Employee {
    _id: string;
    name: string;
    imageUrl: string;
    imagePublicId: string;
    status: "available" | "unavailable";
    schedule: string[];
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

export async function createEmployee(employee: NewEmployee): Promise<Employee> {
    const formData = new FormData();
    Object.entries(employee).forEach(([key, val]) => {
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
    if (!res.ok) {
        logger.error('Admin failed to create employee', { name: employee.name });
        throw new Error("Failed to create record");
    }
    const data = await res.json();
    logger.info('Admin created employee', { employeeId: data._id, name: data.name });
    return data;
}

export async function updateEmployee(id: string, employee: Partial<NewEmployee>): Promise<Employee> {
    const formData = new FormData();
    Object.entries(employee).forEach(([key, val]) => {
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
    if (!res.ok) {
        logger.error('Admin failed to update employee', { employeeId: id });
        throw new Error("Failed to update record");
    }
    const data = await res.json();
    logger.info('Admin updated employee', { employeeId: id, name: data.name });
    return data;
}

export async function deleteEmployee(id: string): Promise<void> {
    const res = await fetch(`${endpoint}/employees/${id}`, { method: "DELETE" });
    if (!res.ok) {
        logger.error('Admin failed to delete employee', { employeeId: id });
        throw new Error("Failed to delete record");
    }
    logger.info('Admin deleted employee', { employeeId: id });
}

export async function toggleStatus(id: string, status: "available" | "unavailable"): Promise<Employee> {
    const res = await fetch(`${endpoint}/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        logger.error('Admin failed to toggle employee status', { employeeId: id, status });
        throw new Error("Failed to update status");
    }
    logger.info('Admin toggled employee status', { employeeId: id, status });
    return res.json();
}