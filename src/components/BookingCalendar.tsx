import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
    Card,
    Center,
    Loader,
    Modal,
    Title,
    Text,
    SegmentedControl,
    Group,
    Divider,
    Badge,
    Grid,
    Paper,
    Stack
} from "@mantine/core";
import { getAppointments } from "../api/appointments";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState, useRef } from "react";
import type { EventApi } from "@fullcalendar/core";
import {
    IconClock,
    IconUser,
    IconPhone,
    IconMail,
    IconCalendar
} from "@tabler/icons-react";
import dayjs from "dayjs";

export default function BookingCalendar() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const calendarRef = useRef<FullCalendar>(null);
    const [opened, setOpened] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
    const [view, setView] = useState("dayGridMonth");

    const handleViewChange = (newView: string) => {
        setView(newView);
        calendarRef.current?.getApi().changeView(newView);
    };

    const handleEventClick = (info: any) => {
        setSelectedEvent(info.event);
        setOpened(true);
    };

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const [approved, rescheduled, pending] = await Promise.all([
                getAppointments({ status: "Approved" }),
                getAppointments({ status: "Rescheduled" }),
                getAppointments({ status: "Pending" }),
            ]);

            const data = [...approved, ...rescheduled, ...pending];

            const formatted = data.map((item) => {
                const [date] = item.date.split("T");

                const serviceNames =
                    item.services && item.services.length > 0
                        ? item.services
                            .map((s) => s.service?.name || "Service deleted")
                            .join(", ")
                        : "No service";

                const serviceCategories =
                    item.services && item.services.length > 0
                        ? item.services.map((s) => s.service?.category || "").join(", ")
                        : "";

                return {
                    title: serviceNames,
                    start: `${date}T${item.startTime}:00`,
                    end: `${date}T${item.endTime}:00`,
                    allDay: false,
                    color: item.status === "Rescheduled"
                        ? "orange"
                        : item.status === "Pending"
                            ? "#fab005"
                            : undefined,
                    extendedProps: {
                        customer: `${item.clientId?.firstname || 'Unknown'} ${item.clientId?.lastname || ''}`,
                        service: serviceCategories,
                        phone: `${item.clientId?.phone || 'N/A'}`,
                        email: `${item.clientId?.email || 'N/A'}`,
                        status: item.status,
                        employee:
                            item.employee && typeof item.employee === "object" && "name" in item.employee
                                ? item.employee.name
                                : item.employee || "-",
                    },
                };
            });

            setBookings(formatted);
        } catch (err: any) {
            showNotification({ color: "red", title: "Error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Center style={{ height: "70vh" }}>
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Card shadow="sm" padding="lg" radius="md">
            <Group justify="space-between" mb="md">
                <Title order={3}>Calendar Overview</Title>
                <SegmentedControl
                    value={view}
                    onChange={handleViewChange}
                    data={[
                        { label: "Month", value: "dayGridMonth" },
                        { label: "Week", value: "timeGridWeek" },
                        { label: "Day", value: "timeGridDay" },
                    ]}
                    radius="md"
                />
            </Group>

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="en-us"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "",
                }}
                events={bookings}
                eventClick={handleEventClick}
                height="80vh"
                editable={false}
                selectable={true}
                eventDisplay="block"
                displayEventTime={true}
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                }}
            />

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={<Text fw={700} size="lg">Appointment Details</Text>}
                centered
                size="md"
                radius="md"
                padding="xl"
            >
                {selectedEvent && (
                    <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={2}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} lts="1px">
                                    Service(s)
                                </Text>
                                <Text size="xl" fw={800} c="teal.7" style={{ lineHeight: 1.2 }}>
                                    {selectedEvent.title}
                                </Text>
                            </Stack>
                            <Badge
                                color={
                                    selectedEvent.extendedProps.status === 'Rescheduled' ? 'orange' :
                                        selectedEvent.extendedProps.status === 'Pending' ? 'yellow' : 'teal'
                                }
                                variant="light"
                                size="lg"
                            >
                                {selectedEvent.extendedProps.status}
                            </Badge>
                        </Group>

                        <Divider variant="dashed" />

                        <Paper withBorder p="sm" radius="md" bg="gray.0">
                            <Grid gutter="md">
                                <Grid.Col span={6}>
                                    <Group gap="xs" wrap="nowrap">
                                        <IconCalendar size={20} color="var(--mantine-color-teal-6)" />
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed" fw={700}>DATE</Text>
                                            <Text size="sm" fw={600}>
                                                {dayjs(selectedEvent.start).format("MMMM D, YYYY")}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Group gap="xs" wrap="nowrap">
                                        <IconClock size={20} color="var(--mantine-color-teal-6)" />
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed" fw={700}>TIME</Text>
                                            <Text size="sm" fw={600}>
                                                {dayjs(selectedEvent.start).format("h:mm A")} - {dayjs(selectedEvent.end).format("h:mm A")}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        <Stack gap="xs">
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} lts="1px">Client Details</Text>
                            <Group gap="sm">
                                <IconUser size={18} stroke={1.5} />
                                <Text size="sm" fw={500}>{selectedEvent.extendedProps.customer}</Text>
                            </Group>
                            <Group gap="sm">
                                <IconPhone size={18} stroke={1.5} color="gray" />
                                <Text size="sm">{selectedEvent.extendedProps.phone}</Text>
                            </Group>
                            <Group gap="sm">
                                <IconMail size={18} stroke={1.5} color="gray" />
                                <Text size="sm">{selectedEvent.extendedProps.email}</Text>
                            </Group>
                        </Stack>

                        <Divider variant="dashed" />

                        <Group justify="space-between" bg="teal.0" p="xs" style={{ borderRadius: '8px' }}>
                            <Group gap="xs">
                                {/* Standard person icon as requested */}
                                <IconUser size={18} color="var(--mantine-color-teal-8)" />
                                <Text size="sm" fw={600} c="teal.9">Staff Assigned:</Text>
                            </Group>
                            <Text size="sm" fw={700} c="teal.9">
                                {selectedEvent.extendedProps.employee}
                            </Text>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Card>
    );
}