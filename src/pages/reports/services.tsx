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
    TextInput,
    Select,
    Center,
} from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import type { Appointment } from "../../api/appointments";
import {exportCSV, exportPDF, printPDF} from "./utils/export";
import {IconDownload, IconPrinter} from "@tabler/icons-react";

interface Props {
    appointments: Appointment[];
}

interface ServiceCount {
    service: string;
    count: number;
}

export default function ServicesReport({ appointments }: Props) {
    const [query, setQuery] = useState("");
    const [topN, setTopN] = useState<number | undefined>(20);

    const counts = useMemo<ServiceCount[]>(() => {
        const map = new Map<string, number>();
        appointments.forEach((a) => {
            const name = a.serviceId?.name ?? "Service (deleted)";
            map.set(name, (map.get(name) ?? 0) + 1);
        });
        return Array.from(map.entries())
            .map(([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count);
    }, [appointments]);

    const filtered = counts.filter((c) =>
        c.service.toLowerCase().includes(query.trim().toLowerCase())
    );
    const topList = typeof topN === "number" ? filtered.slice(0, topN) : filtered;

    const headers = ["Service", "Requests"];
    const rows = topList.map((r) => [r.service, r.count]);

    // Prepare DonutChart data
    const donutData = topList.map((s, i) => ({
        name: s.service,
        value: s.count,
        color: `teal.${(i + 3) % 10}`, // optional custom color
    }));

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3}>Most Requested Services</Title>
                <Group>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() => exportCSV("most-requested-services.csv", headers, rows)}
                    >
                        Export CSV
                    </Button>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() => exportPDF("Most Requested Services", "most-requested-services.pdf", headers, rows)}
                    >
                        Export PDF
                    </Button>
                    <Button
                        leftSection={<IconPrinter size={16} />}
                        onClick={() => printPDF("Most Requested Services", headers, rows)}
                    >
                        Print PDF
                    </Button>
                </Group>
            </Group>

            {topList.length > 0 && (
                <Paper withBorder p="md">
                    <Center>
                        <DonutChart
                            size={180}
                            thickness={30}
                            paddingAngle={5}
                            data={donutData}
                            withLabels
                            labelsType="percent"
                            tooltipDataSource="segment"
                            w={1000}
                        />
                    </Center>
                </Paper>
            )}

            <Group align="flex-end" gap="sm">
                <TextInput
                    label="Search"
                    placeholder="Search service"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    label="Top"
                    value={String(topN ?? "")}
                    onChange={(v) => setTopN(Number(v))}
                    data={["1", "5", "10", "15", "20", "50", "100"]}
                />
            </Group>

            <Paper withBorder p="md">
                {topList.length === 0 ? (
                    <Text>No services found.</Text>
                ) : (
                    <ScrollArea style={{ maxHeight: 420 }}>
                        <Table verticalSpacing="sm" striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Service</Table.Th>
                                    <Table.Th>Requests</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {topList.map((s) => (
                                    <Table.Tr key={s.service}>
                                        <Table.Td>{s.service}</Table.Td>
                                        <Table.Td>{s.count}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Paper>
        </Stack>
    );
}
