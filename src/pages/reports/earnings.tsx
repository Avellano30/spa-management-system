import { useMemo, useState } from "react";
import {
    Stack,
    Title,
    Group,
    Button,
    Paper,
    Text,
    ScrollArea,
    Table,
    Select
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { BarChart } from "@mantine/charts";
import dayjs from "dayjs";
import type { Appointment } from "../../api/appointments";
import {exportCSV, exportPDF, printPDF} from "./utils/export";
import {IconDownload, IconPrinter} from "@tabler/icons-react";

interface Props {
    appointments: Appointment[];
}

interface EarningsRow {
    date: string;
    total: number;
    [serviceName: string]: number | string;
}

export default function EarningsReport({ appointments }: Props) {
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
    const [paymentFilter, setPaymentFilter] = useState<"All" | "Cash" | "Online">("All");
    const filePrefix =
        paymentFilter === "All"
            ? "earnings-all"
            : paymentFilter === "Cash"
                ? "earnings-cash"
                : "earnings-online";

    const aggregated = useMemo(() => {
        const acc: Record<string, Record<string, number>> = {};

        appointments.forEach((appt) => {
            let paidPayments = (appt.payments ?? []).filter(p => p.status === "Completed");

            if (paymentFilter !== "All") {
                paidPayments = paidPayments.filter(p => p.method === paymentFilter);
            }

            if (!paidPayments.length) return;

            const dateKey = dayjs(appt.date).format("YYYY-MM-DD");
            const service = appt.serviceId?.name ?? "Service (deleted)";

            if (!acc[dateKey]) acc[dateKey] = {};
            if (!acc[dateKey][service]) acc[dateKey][service] = 0;

            const totalPayments = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            acc[dateKey][service] += totalPayments;
        });

        return acc;
    }, [appointments, paymentFilter]);


    const chartData: EarningsRow[] = useMemo(() => {
        return Object.entries(aggregated)
            .map(([date, services]) => ({ date, total: Object.values(services).reduce((a, b) => a + b, 0), ...services }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [aggregated]);

    const serviceNames = useMemo(() => {
        const set = new Set<string>();
        appointments.forEach((a) => set.add(a.serviceId?.name ?? "Service (deleted)"));
        return Array.from(set);
    }, [appointments]);

    const filtered = useMemo(() => {
        const [start, end] = dateRange;
        if (!start || !end) return chartData;

        const s = dayjs(start).startOf("day");
        const e = dayjs(end).endOf("day");

        return chartData.filter((r) => {
            const d = dayjs(r.date);
            return d.isAfter(s.subtract(1, "second")) && d.isBefore(e.add(1, "second"));
        });
    }, [chartData, dateRange]);


    const totalEarnings = filtered.reduce((sum, r) => sum + r.total, 0);
    const csvHeaders = ["Date", ...serviceNames, "Total"];
    const csvRows = filtered.map((row) => [row.date, ...serviceNames.map((s) => row[s] ?? 0), row.total]);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3}>Service Earnings</Title>
                <Group>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() =>
                            exportCSV(`${filePrefix}.csv`, csvHeaders, csvRows)
                        }
                    >
                        Export CSV
                    </Button>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() =>
                            exportPDF(
                                `Service Earnings Report (${paymentFilter})`,
                                `${filePrefix}.pdf`,
                                csvHeaders,
                                csvRows,
                                `Total Earnings: ₱${totalEarnings.toLocaleString()}`
                            )
                        }
                    >
                        Export PDF
                    </Button>
                    <Button
                        leftSection={<IconPrinter size={16} />}
                        onClick={() => printPDF("Service Earnings Report", csvHeaders, csvRows)}
                    >
                        Print PDF
                    </Button>
                </Group>
            </Group>

            <Paper withBorder p="md">
                <Text size="lg" fw={700}>
                    Total Earnings: ₱{totalEarnings.toLocaleString()}
                </Text>
            </Paper>

            <Paper withBorder p="md">
                <BarChart
                    h={360}
                    data={filtered}
                    dataKey="date"
                    type="stacked"
                    series={serviceNames.map((name, i) => ({ name, color: `teal.${(i + 3) % 10}` }))}
                    valueFormatter={(v) => `₱${Number(v).toLocaleString()}`}
                    tooltipProps={{
                        labelFormatter: (d) => `Date: ${d}`,
                        formatter: (value, name) => [`₱${Number(value).toLocaleString()}`, String(name)],
                    }}
                />
            </Paper>

            <Group gap="sm">
                <DatePickerInput
                    className="flex-1"
                    type="range"
                    value={dateRange}
                    onChange={setDateRange}
                    label="Filter by date range"
                    placeholder="Pick a date range"
                    allowSingleDateInRange={false}
                />
                <Select
                    label="Payment Method"
                    value={paymentFilter}
                    onChange={(v) => setPaymentFilter(v as any)}
                    data={[
                        { value: "All", label: "All Payments" },
                        { value: "Cash", label: "Cash Only" },
                        { value: "Online", label: "Online Only" },
                    ]}
                />
            </Group>

            <Paper withBorder p="md">
                <Title order={5}>Breakdown</Title>
                <ScrollArea style={{ maxHeight: 320 }}>
                    <Table verticalSpacing="sm" striped>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Date</Table.Th>
                                {serviceNames.map((s) => (
                                    <Table.Th key={s}>{s}</Table.Th>
                                ))}
                                <Table.Th>Total</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map((row) => (
                                <Table.Tr key={row.date}>
                                    <Table.Td style={{ whiteSpace: "nowrap" }}>{row.date}</Table.Td>
                                    {serviceNames.map((s) => (
                                        <Table.Td key={s}>₱{(row[s] ?? 0).toLocaleString()}</Table.Td>
                                    ))}
                                    <Table.Td>₱{row.total.toLocaleString()}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Paper>
        </Stack>
    );
}
