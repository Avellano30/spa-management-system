import { useEffect, useState, useMemo } from "react";
import {
    Stack,
    Title,
    Loader,
    Text,
    Button,
    Group,
    Paper,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { BarChart } from "@mantine/charts";
import { getAppointments, type Appointment } from "../../api/appointments";
import { IconDownload } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

export default function Reports() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);

    // Fetch appointments
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getAppointments();
                setAppointments(res);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Aggregate earnings per service per day
    const aggregated = useMemo(() => {
        return appointments.reduce((acc, appt) => {
            if (!appt.payments?.length) return acc;

            const date = appt.date.split("T")[0]; // YYYY-MM-DD
            const serviceName = appt.serviceId?.name || "Service has been deleted";

            if (!acc[date]) acc[date] = {};
            if (!acc[date][serviceName]) acc[date][serviceName] = 0;

            const totalPayments = appt.payments.reduce((sum, p) => sum + p.amount, 0);
            acc[date][serviceName] += totalPayments;

            return acc;
        }, {} as Record<string, Record<string, number>>);
    }, [appointments]);

    // Chart data
    const chartData = useMemo(() => {
        return Object.entries(aggregated)
            .map(([date, services]) => ({
                date,
                ...services,
                total: Object.values(services).reduce((a, b) => a + b, 0),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [aggregated]);

    // Unique service names
    const serviceNames = useMemo(() => {
        const set = new Set<string>();
        appointments.forEach((a) => set.add(a.serviceId?.name || "Service has been deleted"));
        return [...set];
    }, [appointments]);

    const series = serviceNames.map((name, i) => ({
        name,
        color: `teal.${(i + 4) % 10}`,
    }));

    // Filter chart data by date range
    const filteredChartData = useMemo(() => {
        if (!dateRange[0] || !dateRange[1]) return chartData;

        const start = dayjs(dateRange[0]);
        const end = dayjs(dateRange[1]);

        return chartData.filter((row) => {
            const rowDate = dayjs(row.date);
            return rowDate.isAfter(start.subtract(1, "day")) && rowDate.isBefore(end.add(1, "day"));
        });
    }, [chartData, dateRange]);

    // Total earnings
    const totalEarnings = filteredChartData.reduce((sum, d) => sum + d.total, 0);

    // Export CSV
    const exportCSV = () => {
        const headers = ["date", ...serviceNames, "total"];
        const rows = filteredChartData.map((row) =>
            headers.map((h) => (row[h] !== undefined ? JSON.stringify(row[h]) : "0")).join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "service-earnings-report.csv";
        link.click();
    };

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

        doc.setFontSize(14);
        doc.text("Service Earnings Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${now}`, 14, 28);

        if (dateRange[0] && dateRange[1]) {
            doc.text(
                `Date Range: ${dayjs(dateRange[0]).format("YYYY-MM-DD")} - ${dayjs(dateRange[1]).format("YYYY-MM-DD")}`,
                14,
                34
            );
        }

        const tableColumns = ["Date", ...serviceNames, "Total"];
        const tableRows = filteredChartData.map((row) => [
            row.date,
            ...serviceNames.map((s) => row[s] || 0),
            row.total,
        ]);

        autoTable(doc, {
            startY: 40,
            head: [tableColumns],
            body: tableRows,
            theme: "striped",
            headStyles: { fillColor: [22, 160, 133] },
            foot: [["", "", "", "Total Earnings:", totalEarnings]],
            footStyles: { fillColor: [22, 160, 133] },
        });

        doc.save("service-earnings-report.pdf");
    };

    return (
        <Stack p="md" gap="lg">
            <Group justify="space-between">
                <Title order={2}>Service Earnings Report</Title>
                <Group>
                    <Button leftSection={<IconDownload size={18} />} variant="light" onClick={exportCSV}>
                        Export CSV
                    </Button>
                    <Button leftSection={<IconDownload size={18} />} variant="light" onClick={exportPDF}>
                        Export PDF
                    </Button>
                </Group>
            </Group>

            <DatePickerInput
                type="range"
                value={dateRange}
                onChange={setDateRange}
                label="Filter by date range"
            />

            <Paper p="md" radius="md" withBorder>
                <Text size="lg" fw={600}>
                    Total Earnings: ₱{totalEarnings.toLocaleString()}
                </Text>
            </Paper>

            {loading && <Loader />}
            {error && <Text c="red">{error}</Text>}

            {!loading && !error && filteredChartData.length > 0 && (
                <>
                    <BarChart
                        h={380}
                        data={filteredChartData}
                        dataKey="date"
                        type="stacked"
                        series={series}
                        valueFormatter={(v) => `₱${v.toLocaleString()}`}
                        tooltipProps={{
                            labelFormatter: (d) => `Date: ${d}`,
                            formatter: (value, name) => [`₱${Number(value).toLocaleString()}`, name],
                        }}
                    />

                    <Paper p="md" withBorder radius="md">
                        <Title order={4} mb="sm">
                            Total Sales Per Day
                        </Title>

                        <Stack gap={6}>
                            {filteredChartData.map((day) => (
                                <Group key={day.date} wrap="nowrap">
                                    <Text style={{ whiteSpace: "nowrap" }}>{day.date}</Text>
                                    <div
                                        style={{
                                            flex: 1,
                                            borderBottom: "1px dotted #ccc",
                                            margin: "0 8px",
                                            height: "0.8em",
                                        }}
                                    />
                                    <Text fw={600} style={{ whiteSpace: "nowrap" }}>
                                        ₱{day.total.toLocaleString()}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Paper>
                </>
            )}
        </Stack>
    );
}
