import { refundAppointment } from "../payments";
import { logger } from "../../lib/logger";

const endpoint = import.meta.env.VITE_ENDPOINT || "http://localhost:3000";

export interface Service {
    category: any;
    _id: string;
    name: string;
    price: number;
    duration: number;
}

export interface EmployeeRef {
    _id: string;
    name: string;
    [key: string]: any;
}

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
    clientId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
        phone: string;
        createdAt: string;
    };
    services: {
        serviceId: string;
        intensity?: string;
        service: Service & { price: number };
    }[];
    date: string;
    startTime: string;
    endTime: string;
    status: "Pending" | "Approved" | "Cancelled" | "Rescheduled" | "Completed" | "Refunded";
    notes?: string;
    payments?: Payment[];
    employee?: string | EmployeeRef;
    createdAt: string;
}

export async function getAppointments(params?: { status?: string }): Promise<Appointment[]> {
    const query = params?.status ? `?status=${params.status}` : "";
    const res = await fetch(`${endpoint}/appointment${query}`);
    if (!res.ok) {
        logger.error('Failed to fetch appointments', { status: params?.status });
        throw new Error((await res.json()).message || "Failed to fetch appointments");
    }
    return (await res.json()).appointments;
}

export async function approveAppointment(id: string) {
    const res = await fetch(`${endpoint}/appointment/${id}/approve`, { method: "PATCH" });
    if (!res.ok) {
        logger.error('Failed to approve appointment', { appointmentId: id });
        throw new Error((await res.json()).message || "Failed to approve");
    }
    logger.info('Appointment approved', { appointmentId: id });
    return res.json();
}

export async function cancelAppointment(id: string, notes: string, isAdmin: boolean = false) {
    const res = await fetch(`${endpoint}/appointment/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, isAdmin }),
    });
    if (!res.ok) {
        logger.error('Failed to cancel appointment', { appointmentId: id, notes });
        throw new Error((await res.json()).message || "Failed to cancel");
    }

    const response = await res.json();
    const clientName = response.appointment?.clientId?.firstname
        ? `${response.appointment.clientId.firstname} ${response.appointment.clientId.lastname}`
        : null;
    const hasRefund = response.appointment?.payments?.some(
        (p: any) => p.type === 'Refund' && p.status === 'Completed');
    logger.info(
        hasRefund ? 'Admin cancelled appointment with refund' : 'Admin cancelled appointment',
        { appointmentId: id, isAdmin, notes, clientName }
    );


    const completedPayments = (response.appointment.payments ?? [])
        .filter((p: Payment) => p.status === "Completed");
    const total = completedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

    if (total > 0) {
        try {
            await refundAppointment(id, total, notes);
            logger.info('Refund processed', { appointmentId: id, amount: total });
        } catch (error) {
            logger.error('Failed to process refund', { appointmentId: id, amount: total });
            console.error("Failed to process refund:", error);
        }
    }

    return response.appointment;
}

export async function completeAppointment(id: string) {
    const res = await fetch(`${endpoint}/appointment/${id}/complete`, { method: "PATCH" });
    if (!res.ok) {
        logger.error('Failed to complete appointment', { appointmentId: id });
        throw new Error((await res.json()).message || "Failed to complete");
    }
    logger.info('Admin completed appointment', { appointmentId: id });

    return res.json();
}

export async function rescheduleAppointment(id: string, date: string, startTime: string, notes?: string) {
    const res = await fetch(`${endpoint}/appointment/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, notes }),
    });
    if (!res.ok) {
        logger.error('Failed to reschedule appointment', { appointmentId: id, date, startTime });
        throw new Error((await res.json()).message || "Failed to reschedule");
    }
    logger.info('Admin rescheduled appointment', { appointmentId: id, date, startTime });
    return res.json();
}

export const createCashPayment = async (
    appointmentId: string,
    type: "Full" | "Downpayment" | "Balance" | "Refund",
    amount: number,
    remarks?: string,
) => {
    const res = await fetch(`${endpoint}/payment/cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, type, amount, remarks }),
    });
    if (!res.ok) {
        logger.error('Failed to create cash payment', { appointmentId, type, amount });
        throw new Error((await res.json().catch(() => ({}))).message || "Failed to create cash payment");
    }
    logger.info('Cash payment created', { appointmentId, type, amount });
    return res.json();
};

export async function getAppointmentStats(): Promise<Record<string, number>> {
    const res = await fetch(`${endpoint}/appointment`);
    if (!res.ok) throw new Error("Failed to load appointments");
    const { appointments } = await res.json();
    return appointments.reduce((acc: Record<string, number>, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {});
}

export async function getOccupancyData(date: string): Promise<{
    openingTime: string;
    closingTime: string;
    totalRooms: number;
    bufferTime?: number;
    bookings: { start: string; end: string }[];
}> {
    const res = await fetch(`${endpoint}/appointment/occupancy?date=${date}`);
    if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch occupancy data");
    return res.json();
}

export async function getMonthlyAvailability(month: string): Promise<Record<string, "open" | "full">> {
    const res = await fetch(`${endpoint}/appointment/monthly-availability?month=${month}`);
    if (!res.ok) throw new Error("Failed to fetch monthly availability");
    return res.json();
}