import { useEffect, useState,useCallback } from "react";
import {
    Button,
    Modal,
    Table,
    Group,
    Badge,
    Select,
    TextInput,
    Title,
    Stack,
    ScrollArea,
    Card,
    Loader,
    Text,
    NumberInput,
    Box,
    SimpleGrid,
    Textarea,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
    getAppointments,
    approveAppointment,
    cancelAppointment,
    completeAppointment,
    rescheduleAppointment,
    getOccupancyData,
    type Appointment,
    createCashPayment,
} from "../../api/appointments";
import { useSearchParams } from "react-router";
import { DateInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { PaymentHistoryModal } from "../../components/PaymentHistoryModal.tsx";
import { getSpaSettings, type SpaSettings } from "../../api/settings";
import dayjs from "dayjs";

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

export default function Appointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filtered, setFiltered] = useState<Appointment[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [search, setSearch] = useState("");

    // Reschedule state
    const [rescheduleModal, setRescheduleModal] = useState(false);
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [newDate, setNewDate] = useState<DateValue>(null);
    const [newTime, setNewTime] = useState<string>("");
    const [rescheduleNotes, setRescheduleNotes] = useState("");
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [spaSettings, setSpaSettings] = useState<SpaSettings | null>(null);
    const [occupancy, setOccupancy] = useState<{
        openingTime: string;
        closingTime: string;
        totalRooms: number;
        bufferTime?: number;
        bookings: { start: string; end: string }[];
    } | null>(null);
    const [appointmentsForDay, setAppointmentsForDay] = useState<Appointment[]>([]);

    const [cancelModal, setCancelModal] = useState(false);
    const [cancelNotes, setCancelNotes] = useState("");
    const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);

    const [cashModal, setCashModal] = useState(false);
    const [cashAmount, setCashAmount] = useState<string | number>(0);
    const [cashRemarks, setCashRemarks] = useState("");
    const [selectedForCash, setSelectedForCash] = useState<Appointment | null>(null);

    const [searchParams] = useSearchParams();
    const paramStatusFilter = searchParams.get("status");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAppointments(
                paramStatusFilter ? { status: paramStatusFilter } : undefined,
            );
            setAppointments(data);
        } catch (err) {
            showNotification({ color: "red", title: "Error", message: (err as Error).message });
        } finally {
            setLoading(false);
        }
    }, [paramStatusFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        getSpaSettings().then(setSpaSettings).catch(console.error);
    }, []);

    // Fetch occupancy + appointments when reschedule date changes
    useEffect(() => {
        if (!newDate) return;
        const dateStr = dayjs(newDate as Date).format("YYYY-MM-DD");

        getSpaSettings().then(setSpaSettings).catch(console.error);

        getOccupancyData(dateStr).then(setOccupancy).catch(console.error);

        Promise.all([
            getAppointments({ status: "Approved" }),
            getAppointments({ status: "Pending" }),
            getAppointments({ status: "Rescheduled" }),
        ]).then(([approved, pending, rescheduled]) => {
            const all = [...approved, ...pending, ...rescheduled];
            setAppointmentsForDay(
                all.filter(
                    (a) => a.date.split("T")[0] === dateStr && a._id !== selected?._id
                )
            );
        });
    }, [newDate,selected?._id]);

    // Apply filters
    useEffect(() => {
        let temp = [...appointments];
        if (statusFilter !== "All")
            temp = temp.filter((a) => a.status === statusFilter);
        if (search.trim()) {
            const s = search.toLowerCase();
            temp = temp.filter(
                (a) =>
                    (a.clientId?.firstname?.toLowerCase() || "").includes(s) ||
                    (a.clientId?.lastname?.toLowerCase() || "").includes(s) ||
                    a.services?.some((srv) =>
                        srv.service?.name?.toLowerCase().includes(s),
                    ) ||
                    false,
            );
        }
        setFiltered(temp);
    }, [statusFilter, search, appointments]);

    // ── Slot logic (mirrored from client) ──────────────────────────────────────

    function isSlotDisabled(checkTime: string): boolean {
        if (!occupancy) return false;
        const { openingTime, closingTime, totalRooms, bookings } = occupancy;

        const isWithinHours =
            closingTime > openingTime
                ? checkTime >= openingTime && checkTime < closingTime
                : checkTime >= openingTime || checkTime < closingTime;
        if (!isWithinHours) return true;

        // 2. Cutoff check — service must finish before closing time
        const isOvernight = closingTime < openingTime;
        const baseDate = isOvernight && checkTime < openingTime
            ? "2026-01-02"
            : "2026-01-01";
        const slotStart = dayjs(`${baseDate}T${checkTime}`);
        const slotEnd = slotStart.add(serviceDuration, 'minute');
        const adjustedClosing = isOvernight
            ? dayjs(`2026-01-02T${closingTime}`)
            : dayjs(`2026-01-01T${closingTime}`);
        if (slotEnd.isAfter(adjustedClosing)) return true;

        const overlapping = bookings.filter(({ start, end }) => {
            const check = dayjs(`2026-01-01T${checkTime}`);
            const s = dayjs(`2026-01-01T${start}`);
            const e = dayjs(`2026-01-01T${end}`).add(occupancy.bufferTime ?? 15, "minute");
            return (check.isSame(s) || check.isAfter(s)) && check.isBefore(e);
        }).length;
        if (overlapping >= totalRooms) return true;

        const selectedEmployeeId =
            selected?.employee && typeof selected.employee === "object"
                ? selected.employee._id
                : null;

        if (selectedEmployeeId) {
            const therapistBusy = appointmentsForDay.some((appt) => {
                const check = dayjs(`2026-01-01T${checkTime}`);
                const s = dayjs(`2026-01-01T${appt.startTime}`);
                const e = dayjs(`2026-01-01T${appt.endTime}`).add(
                    occupancy.bufferTime ?? 15,
                    "minute"
                );
                const apptEmployeeId =
                    appt.employee && typeof appt.employee === "object"
                        ? appt.employee._id
                        : appt.employee;
                return (
                    apptEmployeeId === selectedEmployeeId &&
                    (check.isSame(s) || check.isAfter(s)) &&
                    check.isBefore(e)
                );
            });
            if (therapistBusy) return true;
        }

        return false;
    }

    function generateSlots(): string[] {
        const openingTime = occupancy?.openingTime ?? spaSettings?.openingTime;
        const closingTime = occupancy?.closingTime ?? spaSettings?.closingTime;
        if (!openingTime || !closingTime) return [];

        const bufferMins = occupancy?.bufferTime ?? spaSettings?.bufferTime ?? 15;
        const slots: string[] = [];

        let current = dayjs(`2026-01-01T${openingTime}`);
        const closing = dayjs(`2026-01-01T${closingTime}`);
        const end = closing.isBefore(current) ? closing.add(1, "day") : closing;

        while (current.isBefore(end)) {
            slots.push(current.format("HH:mm"));
            current = current.add(1, "hour");
        }

        if (occupancy?.bookings) {
            occupancy.bookings.forEach(({ end: bookingEnd }) => {
                const bufferEndTime = dayjs(`2026-01-01T${bookingEnd}`)
                    .add(bufferMins, "minute")
                    .format("HH:mm");
                if (!slots.includes(bufferEndTime)) {
                    slots.push(bufferEndTime);
                }
            });
        }

        return slots.sort(
            (a, b) =>
                dayjs(`2026-01-01T${a}`).valueOf() - dayjs(`2026-01-01T${b}`).valueOf()
        );
    }

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleAction = async (
        id: string,
        action: (id: string) => Promise<unknown>,
        successMsg: string,
    ) => {
        try {
            await action(id);
            showNotification({ color: "green", title: "Success", message: successMsg });
            load();
        } catch (err) {
            showNotification({ color: "red", title: "Error", message:(err as Error).message });
        }
    };

    const handleReschedule = async () => {
        if (!selected || !newDate || !newTime) {
            showNotification({ color: "red", title: "Missing Info", message: "Select date and time." });
            return;
        }
        if (isSlotDisabled(newTime)) {
            showNotification({ color: "red", title: "Invalid Slot", message: "This time slot is unavailable." });
            return;
        }
        setRescheduleLoading(true);
        try {
            const dateStr = dayjs(newDate as Date).format("YYYY-MM-DD");
            await rescheduleAppointment(selected._id, dateStr, newTime, rescheduleNotes);
            showNotification({ color: "green", title: "Rescheduled", message: "Appointment moved." });
            setRescheduleModal(false);
            setNewDate(null);
            setNewTime("");
            setRescheduleNotes("");
            setOccupancy(null);
            load();
        } catch (err) {
            showNotification({ color: "red", title: "Error", message:(err as Error).message });
        } finally {
            setRescheduleLoading(false);
        }
    };

    const openCancelModal = (appt: Appointment) => {
        setSelectedForCancel(appt);
        setCancelNotes("");
        setCancelModal(true);
    };

    const handleCancel = async () => {
        if (!selectedForCancel) return;
        if (!cancelNotes.trim()) {
            showNotification({ color: "red", title: "Error", message: "Please provide cancellation notes." });
            return;
        }
        try {
            await cancelAppointment(selectedForCancel._id, cancelNotes, true);
            showNotification({ color: "green", title: "Success", message: "Appointment cancelled." });
            setCancelModal(false);
            setCancelNotes("");
            setSelectedForCancel(null);
            load();
        } catch (err) {
            showNotification({ color: "red", title: "Error", message:(err as Error).message });
        }
    };

    const openCashModal = (appt: Appointment) => {
        setSelectedForCash(appt);
        const totalPaid = appt.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalServicePrice =
            appt.services?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || 0;
        setCashAmount(totalServicePrice - totalPaid);
        setCashRemarks("");
        setCashModal(true);
    };

    const handleCashPayment = async () => {
        if (!selectedForCash || !cashAmount || Number(cashAmount) <= 0) return;
        try {
            await createCashPayment(
                selectedForCash._id,
                "Balance",
                Number(cashAmount),
                cashRemarks,
            );
            showNotification({ color: "green", title: "Success", message: "Cash payment recorded." });
            setCashModal(false);
            setCashAmount(0);
            setCashRemarks("");
            setSelectedForCash(null);
            load();
        } catch (err) {
            showNotification({ color: "red", title: "Error", message:(err as Error).message });
        }
    };

    const handleComplete = async (appt: Appointment) => {
        try {
            const totalPaid = appt.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const totalServicePrice =
                appt.services?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || 0;
            const remaining = totalServicePrice - totalPaid;
            if (remaining > 0) {
                showNotification({
                    color: "red",
                    title: "Cannot Complete",
                    message: `Appointment has an unpaid balance of ₱${remaining}.`,
                });
                return;
            }
            await completeAppointment(appt._id);
            showNotification({ color: "green", title: "Success", message: "Appointment completed." });
            load();
        } catch (err) {
            showNotification({ color: "red", title: "Error", message:(err as Error).message });
        }
    };

    const serviceDuration = (selected?.services || []).reduce(
        (sum: number, s: { service?: { duration?: number } }) => sum + (s.service?.duration || 0),
        0
    );
    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <Stack p="md">
            <Group justify="space-between">
                <Title order={2}>Appointment Management</Title>
                <Group>
                    <TextInput
                        placeholder="Search by client or service..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        rightSection={<IconSearch size={16} />}
                    />
                    <Select
                        placeholder="Filter by status"
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v || "All")}
                        data={["All", "Pending", "Approved", "Completed", "Cancelled", "Rescheduled"]}
                        style={{ width: 180 }}
                    />
                    <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={load}>
                        Refresh
                    </Button>
                </Group>
            </Group>

            <Card shadow="sm" p="md" radius="md">
                {loading ? (
                    <Group justify="center" p="xl">
                        <Loader />
                    </Group>
                ) : filtered.length === 0 ? (
                    <Text c="dimmed" ta="center">No appointment found.</Text>
                ) : (
                    <ScrollArea>
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Client</Table.Th>
                                    <Table.Th>Service</Table.Th>
                                    <Table.Th>Booking Date</Table.Th>
                                    <Table.Th>Therapist</Table.Th>
                                    <Table.Th>Notes</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Payment Method</Table.Th>
                                    <Table.Th>Payment</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.map((a) => {
                                    const totalPaid = a.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                    const totalServicePrice =
                                        a.services?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || 0;
                                    const remaining = totalServicePrice - totalPaid;
                                    return (
                                        <Table.Tr key={a._id}>
                                            <Table.Td>
                                                {a.clientId?.firstname
                                                    ? `${a.clientId.firstname} ${a.clientId.lastname}`
                                                    : "Deleted Client"}
                                            </Table.Td>
                                            <Table.Td>
                                                {a.services && a.services.length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                                                        {a.services.map((s, idx) => (
                                                            <li key={s.serviceId || idx}>
                                                                <strong>{s.service?.name || "Service deleted"}</strong>
                                                                {s.intensity && (
                                                                    <span style={{ marginLeft: 4, fontStyle: "italic", color: "#888" }}>
                                    ({s.intensity})
                                  </span>
                                                                )}
                                                                {typeof s.service?.price === "number" && (
                                                                    <span style={{ marginLeft: 8 }}>
                                    ₱{s.service.price.toLocaleString()}
                                  </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span>Service(s) not found.</span>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {new Date(a.date).toLocaleDateString()}
                                                <br />
                                                <div>
                                                    <span>{formatTime(a.startTime)}</span>-
                                                    <span>{formatTime(a.endTime)}</span>
                                                </div>
                                            </Table.Td>
                                            <Table.Td>
                                                {a.employee && typeof a.employee === "object" && "name" in a.employee
                                                    ? a.employee.name
                                                    : a.employee || "-"}
                                            </Table.Td>
                                            <Table.Td>{a.notes || "-"}</Table.Td>
                                            <Table.Td style={{ minWidth: "120px", whiteSpace: "nowrap" }}>
                                                <Badge
                                                    color={statusColor(a.status)}
                                                    variant="filled"
                                                    fullWidth
                                                    style={{ minWidth: "110px", textAlign: "center" }}
                                                >
                                                    {a.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {a.payments?.length ? a.payments[0]?.method : "Cash"}
                                            </Table.Td>
                                            <Table.Td>
                                                <PaymentHistoryModal payments={a.payments} />
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    {a.status === "Pending" && (
                                                        <Button
                                                            size="xs"
                                                            onClick={() => handleAction(a._id, approveAppointment, "Approved")}
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {["Pending", "Approved", "Rescheduled"].includes(a.status) && (
                                                        <Button size="xs" color="red" onClick={() => openCancelModal(a)}>
                                                            Cancel
                                                        </Button>
                                                    )}
                                                    {(a.status === "Approved" || a.status === "Rescheduled") && (
                                                        <>
                                                            <Button
                                                                size="xs"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelected(a);
                                                                    setNewDate(null);
                                                                    setNewTime("");
                                                                    setOccupancy(null);
                                                                    setRescheduleNotes("");
                                                                    setRescheduleModal(true);
                                                                }}
                                                            >
                                                                Reschedule
                                                            </Button>
                                                            {remaining > 0 ? (
                                                                <Button size="xs" color="orange" onClick={() => openCashModal(a)}>
                                                                    Add Cash Payment
                                                                </Button>
                                                            ) : (
                                                                <Button size="xs" color="teal" onClick={() => handleComplete(a)}>
                                                                    Complete
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Card>

            {/* Reschedule Modal — full timegrid */}
            <Modal
                opened={rescheduleModal}
                onClose={() => {
                    setRescheduleModal(false);
                    setNewDate(null);
                    setNewTime("");
                    setOccupancy(null);
                    setRescheduleNotes("");
                }}
                title="Reschedule Appointment"
                centered
                size="lg"
                overlayProps={{ blur: 3, backgroundOpacity: 0.4 }}

            >
                <Stack gap="md">
                    {/* Date Picker */}
                    <Box p="md" style={{ backgroundColor: "#f8f9fa", borderRadius: "14px" }}>
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} size="md" c="dark.3">SELECT DATE</Text>
                            {newDate && (
                                <Badge variant="dot" color="green" size="sm">
                                    {dayjs(newDate as Date).format("dddd, MMMM D")}
                                </Badge>
                            )}
                        </Group>
                        <DateInput
                            placeholder="Pick a date"
                            value={newDate}
                            onChange={(val: DateValue) => {
                                setNewDate(val);
                                setNewTime("");
                            }}
                            minDate={new Date()}
                            size="md"
                            radius="xl"
                            styles={(theme) => ({
                                input: {
                                    backgroundColor: "white",
                                    border: `1.5px solid ${newDate ? theme.colors.green[5] : theme.colors.gray[3]}`,
                                    borderRadius: "12px",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                },
                            })}
                            rightSection={
                                newDate ? (
                                    <Text
                                        size="xs"
                                        c="red"
                                        style={{ cursor: "pointer", userSelect: "none" }}
                                        onClick={() => setNewDate(null)}
                                    >
                                        ✕
                                    </Text>
                                ) : null
                            }
                        />
                        {newDate && (
                            <Group gap="xs" mt="sm">
                                <Badge color="green" variant="light" size="sm">
                                    📅 {dayjs(newDate as Date).format("MMM D, YYYY")}
                                </Badge>
                                <Badge color="blue" variant="light" size="sm">
                                    {dayjs(newDate as Date).format("dddd")}
                                </Badge>
                            </Group>
                        )}
                    </Box>

                    {/* Time Grid */}
                    <Box p="md" style={{ backgroundColor: "#f8f9fa", borderRadius: "14px" }}>
                        <Group justify="space-between" mb="xs" align="flex-start">
                            <div>
                                <Text fw={700} size="md" c="dark.3" mb={4}>SELECT TIME</Text>
                                {(occupancy?.bufferTime ?? spaSettings?.bufferTime) ? (
                                    <Text size="xs" fw={600} c="blue.6">
                                        ⏱ {occupancy?.bufferTime ?? spaSettings?.bufferTime} min buffer between appointments
                                    </Text>
                                ) : null}
                            </div>
                            {!newDate && (
                                <Badge variant="dot" color="gray" size="sm">Pick a date first</Badge>
                            )}
                        </Group>

                        <SimpleGrid cols={3} spacing="sm">
                            {generateSlots().map((slot) => {
                                const disabled = isSlotDisabled(slot);
                                const noDate = !newDate;
                                const isSelected = newTime === slot;
                                return (
                                    <Button
                                        key={slot}
                                        onClick={() => !disabled && !noDate && setNewTime(slot)}
                                        disabled={disabled || noDate}
                                        variant={isSelected ? "filled" : "light"}
                                        color={isSelected ? "blue" : disabled || noDate ? "gray" : "teal"}
                                        radius="xl"
                                        size="sm"
                                        styles={(theme) => ({
                                            root: {
                                                transition: "all 0.2s ease",
                                                opacity: disabled || noDate ? 0.4 : 1,
                                                border: isSelected
                                                    ? "none"
                                                    : `1px solid ${disabled || noDate ? "transparent" : theme.colors.teal[1]}`,
                                                padding: "6px 4px",
                                                "&:hover": {
                                                    transform: disabled || noDate ? "none" : "translateY(-2px)",
                                                    boxShadow: disabled || noDate ? "none" : theme.shadows.xs,
                                                },
                                            },
                                            inner: {
                                                textDecoration: disabled ? "line-through" : "none",
                                                flexDirection: "column",
                                                gap: 0,
                                            },
                                            label: {
                                                fontSize: "11px",
                                                lineHeight: 1.2,
                                                whiteSpace: "pre-line",
                                            },
                                        })}
                                    >
                                        {dayjs(`2026-01-01 ${slot}`).format("h:mm[\n]A")}
                                    </Button>
                                );
                            })}
                        </SimpleGrid>

                        {/* Session info */}
                        {newTime && (
                            <Box mt="md" p="xs" style={{ backgroundColor: "#f0faf0", borderRadius: "8px" }}>
                                <Text size="xs" c="dimmed">
                                    <b>Service Duration:</b> {serviceDuration} mins
                                </Text>
                                <Text size="xs" c="dimmed">
                                    <b>Buffer Time:</b> {occupancy?.bufferTime ?? spaSettings?.bufferTime ?? 0} mins
                                </Text>
                                <Text size="xs" fw={700} c="green.7">
                                    <b>Session ends at:</b>{" "}
                                    {dayjs(`2026-01-01T${newTime}`)
                                        .add(serviceDuration, "minute")
                                        .format("h:mm A")}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    <b>Room clears at:</b>{" "}
                                    {dayjs(`2026-01-01T${newTime}`)
                                        .add(
                                            serviceDuration + (occupancy?.bufferTime ?? spaSettings?.bufferTime ?? 0),
                                            "minute"
                                        )
                                        .format("h:mm A")}
                                </Text>
                            </Box>
                        )}

                        <Group gap="xs" mt="md" justify="center">
                            <Badge color="teal" variant="light" size="xs">Available</Badge>
                            <Badge color="blue" variant="filled" size="xs">Selected</Badge>
                            <Badge color="gray" variant="light" size="xs" style={{ opacity: 0.5 }}>Full / Busy</Badge>
                        </Group>
                    </Box>

                    <Textarea
                        label="Notes (optional)"
                        placeholder="Reason for rescheduling..."
                        value={rescheduleNotes}
                        onChange={(e) => setRescheduleNotes(e.currentTarget.value)}
                    />

                    <Button
                        fullWidth
                        onClick={handleReschedule}
                        loading={rescheduleLoading}
                        disabled={!newDate || !newTime}
                    >
                        Save Changes
                    </Button>
                </Stack>
            </Modal>

            {/* Cancel Modal */}
            <Modal
                opened={cancelModal}
                onClose={() => setCancelModal(false)}
                title={<Text fw={700} size="lg">Cancel Appointment</Text>}
                centered
                size="md"
                overlayProps={{ blur: 3, backgroundOpacity: 0.4 }}
            >
                <Stack gap="md">
                    {/* Appointment summary */}
                    {selectedForCancel && (
                        <Box p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                            <Text size="xs" c="dimmed" fw={600} mb={4}>CANCELLING APPOINTMENT</Text>
                            <Text size="sm" fw={600}>
                                {selectedForCancel.services?.map((s) => s.service?.name).join(", ")}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {new Date(selectedForCancel.date).toLocaleDateString()} at {formatTime(selectedForCancel.startTime)}
                            </Text>
                            <Text size="xs" c="dimmed">
                                Client: {selectedForCancel.clientId?.firstname} {selectedForCancel.clientId?.lastname}
                            </Text>
                        </Box>
                    )}

                    {/* Refund notice — only show if there are completed payments */}
                    {selectedForCancel?.payments?.some((p) => p.status === "Completed") ? (
                        <Box p="sm" style={{ backgroundColor: '#fff3bf', borderRadius: '10px', border: '1px solid #f59f00' }}>
                            <Group gap="xs" mb={4}>
                                <Text size="sm" fw={700} c="yellow.8">💰 Refund Will Be Processed</Text>
                            </Group>
                            <Text size="xs" c="yellow.9">
                                This appointment has a completed payment of{" "}
                                <b>₱{selectedForCancel.payments?.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</b>.
                                Cancelling will automatically trigger a refund and set the status to <b>Refunded</b>.
                            </Text>
                        </Box>
                    ) : (
                        <Box p="sm" style={{ backgroundColor: '#fff5f5', borderRadius: '10px', border: '1px solid #ffa8a8' }}>
                            <Text size="xs" c="red.7">
                                ⚠️ No completed payment found. This appointment will be marked as <b>Cancelled</b> with no refund.
                            </Text>
                        </Box>
                    )}

                    <Textarea
                        label="Cancellation Notes"
                        placeholder="Reason for cancellation..."
                        value={cancelNotes}
                        onChange={(e) => setCancelNotes(e.currentTarget.value)}
                        required
                        minRows={3}
                        autosize
                        styles={{ input: { borderRadius: '10px' } }}
                    />

                    <Group grow>
                        <Button
                            color="gray"
                            variant="outline"
                            onClick={() => setCancelModal(false)}
                            radius="xl"
                        >
                            Go Back
                        </Button>
                        <Button
                            color="red"
                            onClick={handleCancel}
                            radius="xl"
                        >
                            {selectedForCancel?.payments?.some((p) => p.status === "Completed")
                                ? "Cancel & Refund"
                                : "Confirm Cancel"}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Cash Payment Modal */}
            <Modal
                opened={cashModal}
                onClose={() => setCashModal(false)}
                title="Add Cash Payment"
                centered
            >
                <Text>
                    Remaining Balance: ₱
                    {selectedForCash
                        ? (selectedForCash.services?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || 0) -
                        (selectedForCash.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)
                        : 0}
                </Text>
                <NumberInput
                    label="Cash Received"
                    value={cashAmount}
                    onChange={setCashAmount}
                    min={1}
                    max={
                        selectedForCash
                            ? (selectedForCash.services?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || 0) -
                            (selectedForCash.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)
                            : undefined
                    }
                />
                <TextInput
                    label="Remarks"
                    placeholder="Optional notes"
                    value={cashRemarks}
                    onChange={(e) => setCashRemarks(e.currentTarget.value)}
                />
                <Button mt="sm" onClick={handleCashPayment}>
                    Save Payment
                </Button>
            </Modal>
        </Stack>
    );
}

function statusColor(status: string) {
    switch (status) {
        case "Pending":     return "yellow";
        case "Approved":    return "blue";
        case "Completed":   return "green";
        case "Cancelled":   return "red";
        case "Rescheduled": return "orange";
        case "Refunded": return "gray";
    }
}