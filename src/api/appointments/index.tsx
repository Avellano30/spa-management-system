const endpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

interface Payment {
    amount: number;
    method: "Online" | "Cash";
    type: "Balance" | "Downpayment" | "Full" | "Refund";
    status: "Pending" | "Completed" | "Failed";
    transactionId?: string;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Appointment {
    _id: string;
    clientId: { _id: string; firstname: string; lastname: string; email: string };
    serviceId: { _id: string; name: string; price: number; duration: number };
    date: string;
    startTime: string;
    endTime: string;
    status: "Pending" | "Approved" | "Cancelled" | "Rescheduled" | "Completed";
    notes?: string;
    payments?: Payment[];
}

export async function getAppointments(params?: { status?: string }): Promise<Appointment[]> {
    const query = params?.status ? `?status=${params.status}` : "";
    const res = await fetch(`${endpoint}/appointment${query}`);
    if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch appointments");
    const data = await res.json();
    return data.appointments;
}

export async function approveAppointment(id: string) {
    const res = await fetch(`${endpoint}/appointment/${id}/approve`, { method: "PATCH" });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to approve");
    return res.json();
}

export async function cancelAppointment(id: string, notes: string) {
  const res = await fetch(`${endpoint}/appointment/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
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

// Dashboard stats
export async function getAppointmentStats(): Promise<Record<string, number>> {
    const res = await fetch(`${endpoint}/appointment`);
    if (!res.ok) throw new Error('Failed to load appointments');
    const { appointments } = await res.json();

    const stats = appointments.reduce((acc: Record<string, number>, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {});

    return stats;
}

export const createCashPayment = async (
  appointmentId: string,
  type: "Full" | "Downpayment" | "Balance" | "Refund",
  amount: number,
  remarks?: string
) => {
  const res = await fetch(`${endpoint}/payment/cash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appointmentId,
      type,
      amount,
      remarks,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create cash payment");
  }

  return res.json();
};