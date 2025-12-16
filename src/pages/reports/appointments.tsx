import { useMemo, useState } from "react";
import {
    Stack,
    Title,
    Group,
    Button,
    Paper,
    ScrollArea,
    Table,
    Select, Center
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import type { Appointment } from "../../api/appointments";
import {exportCSV, exportPDF, printPDF} from "./utils/export";
import { IconDownload, IconPrinter } from "@tabler/icons-react";
import {DonutChart} from "@mantine/charts";


interface Props {
    appointments: Appointment[];
}

export default function AppointmentsReport({ appointments }: Props) {
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
    const [clientFilter, setClientFilter] = useState<string | null>(null);
    const [serviceFilter, setServiceFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appt) => {
            const [start, end] = dateRange;
            const apptDate = dayjs(appt.date);

            if (start && end) {
                const s = dayjs(start).startOf("day");
                const e = dayjs(end).endOf("day");
                if (!apptDate.isAfter(s.subtract(1, "second")) || !apptDate.isBefore(e.add(1, "second"))) return false;
            }

            if (clientFilter && `${appt.clientId.firstname} ${appt.clientId.lastname}` !== clientFilter) return false;
            if (serviceFilter && appt.serviceId?.name !== serviceFilter) return false;
            if (statusFilter && appt.status !== statusFilter) return false;

            return true;
        });
    }, [appointments, dateRange, clientFilter, serviceFilter, statusFilter]);

    const csvHeaders = [
        "Client Name",
        "Service Name",
        "Appointment Date",
        "Appointment Time",
        "Notes",
        "Status"
    ];

    const csvRows = filteredAppointments.map((appt) => [
        `${appt.clientId.firstname} ${appt.clientId.lastname}`,
        appt.serviceId?.name ?? "Service (deleted)",
        dayjs(appt.date).format("YYYY-MM-DD"),
        `${appt.startTime} - ${appt.endTime}`,
        appt.notes ?? "",
        appt.status
    ]);

    const clientOptions = Array.from(new Set(appointments.map((a) => `${a.clientId.firstname} ${a.clientId.lastname}`)))
        .map((name) => ({ value: name, label: name }));

    const serviceOptions = Array.from(new Set(appointments.map((a) => a.serviceId?.name ?? "Service (deleted)")))
        .map((name) => ({ value: name, label: name }));

    const statusOptions = ["Pending", "Approved", "Cancelled", "Rescheduled", "Completed"]
        .map((status) => ({ value: status, label: status }));

    const statusCounts = useMemo(() => {
        const map = new Map<string, number>();
        filteredAppointments.forEach((a) => {
            map.set(a.status, (map.get(a.status) ?? 0) + 1);
        });
        return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
    }, [filteredAppointments]);

    const statusDonutData = statusCounts.map((s, i) => ({
        name: s.status,
        value: s.count,
        color: `teal.${(i + 3) % 10}`,
    }));

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3}>Appointments Status</Title>
                <Group>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() => exportCSV("appointments-status-report.csv", csvHeaders, csvRows)}
                    >
                        Export CSV
                    </Button>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() =>
                            exportPDF("Appointments Status Report", "appointments-status-report.pdf", csvHeaders, csvRows)
                        }
                    >
                        Export PDF
                    </Button>
                    <Button
                        leftSection={<IconPrinter size={16} />}
                        onClick={() => printPDF("Appointments Status Report", csvHeaders, csvRows)}
                    >
                        Print PDF
                    </Button>
                </Group>
            </Group>

            {statusCounts.length > 0 && (
                <Paper withBorder p="md">
                    <Center>
                        <DonutChart
                            size={180}
                            thickness={30}
                            paddingAngle={5}
                            data={statusDonutData}
                            withLabels
                            labelsType="percent"
                            tooltipDataSource="segment"
                            w={1000}
                        />
                    </Center>
                </Paper>
            )}

            <Group gap="sm" align="flex-end">
                <DatePickerInput
                    type="range"
                    value={dateRange}
                    onChange={setDateRange}
                    label="Filter by date range"
                    placeholder="Pick a date range"
                    allowSingleDateInRange={false}
                    className="flex-1"
                />

                <Select
                    label="Client"
                    placeholder="All Clients"
                    value={clientFilter}
                    onChange={setClientFilter}
                    data={[{ value: "", label: "All Clients" }, ...clientOptions]}
                    className="flex-1"
                />

                <Select
                    label="Service"
                    placeholder="All Services"
                    value={serviceFilter}
                    onChange={setServiceFilter}
                    data={[{ value: "", label: "All Services" }, ...serviceOptions]}
                    className="flex-1"
                />

                <Select
                    label="Status"
                    placeholder="All Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={[{ value: "", label: "All Status" }, ...statusOptions]}
                    className="flex-1"
                />
            </Group>

            <Paper withBorder p="md">
                <ScrollArea style={{ maxHeight: 400 }}>
                    <Table verticalSpacing="sm" striped>
                        <Table.Thead>
                            <Table.Tr>
                                {csvHeaders.map((h) => (
                                    <Table.Th key={h}>{h}</Table.Th>
                                ))}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredAppointments.map((appt) => (
                                <Table.Tr key={appt._id}>
                                    <Table.Td>{`${appt.clientId.firstname} ${appt.clientId.lastname}`}</Table.Td>
                                    <Table.Td>{appt.serviceId?.name ?? "Service (deleted)"}</Table.Td>
                                    <Table.Td>{dayjs(appt.date).format("YYYY-MM-DD")}</Table.Td>
                                    <Table.Td>{`${appt.startTime} - ${appt.endTime}`}</Table.Td>
                                    <Table.Td>{appt.notes ?? ""}</Table.Td>
                                    <Table.Td fw={"bold"}>{appt.status}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Paper>
        </Stack>
    );
}
