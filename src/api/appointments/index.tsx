const endpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

export interface Appointment {
  _id: string;
  clientId: { _id: string; firstname: string; lastname: string; email: string };
  serviceId: { _id: string; name: string; price: number; duration: number };
  date: string;
  startTime: string;
  endTime: string;
  status: "Pending" | "Approved" | "Cancelled" | "Rescheduled" | "Completed";
  notes?: string;
}

export async function getAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${endpoint}/appointment`);
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch appointments");
  const data = await res.json();
  return data.appointments;
}

export async function approveAppointment(id: string) {
  const res = await fetch(`${endpoint}/appointment/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to approve");
  return res.json();
}

export async function cancelAppointment(id: string) {
  const res = await fetch(`${endpoint}/appointment/${id}/cancel`, { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to cancel");
  return res.json();
}

export async function completeAppointment(id: string) {
  const res = await fetch(`${endpoint}/appointment/${id}/complete`, { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to complete");
  return res.json();
}

export async function rescheduleAppointment(id: string, date: string, startTime: string) {
  const res = await fetch(`${endpoint}/appointment/${id}/reschedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, startTime }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to reschedule");
  return res.json();
}
