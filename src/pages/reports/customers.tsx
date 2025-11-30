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
import { exportCSV, exportPDF } from "./utils/export";
import { IconDownload } from "@tabler/icons-react";

interface Props {
    appointments: Appointment[];
}

interface CustomerCount {
    id?: string;
    name: string;
    count: number;
}

export default function CustomersReport({ appointments }: Props) {
    const [query, setQuery] = useState("");
    const [topN, setTopN] = useState<number | undefined>(20);

    const counts = useMemo<CustomerCount[]>(() => {
        const map = new Map<string, CustomerCount>();
        appointments.forEach((a) => {
            const id = a.clientId?._id;
            const name = `${a.clientId?.firstname ?? ""} ${a.clientId?.lastname ?? ""}`.trim() || "Unknown";
            const key = id ?? name;
            const prev = map.get(key);
            if (prev) prev.count += 1;
            else map.set(key, { id, name, count: 1 });
        });
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [appointments]);

    const filtered = counts.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase())
    );
    const topList = typeof topN === "number" ? filtered.slice(0, topN) : filtered;

    const headers = ["Customer", "Visits"];
    const rows = topList.map((r) => [r.name, r.count]);

    // DonutChart data
    const donutData = topList.map((c, i) => ({
        name: c.name,
        value: c.count,
        color: `teal.${(i + 3) % 10}`,
    }));

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3}>Most Frequent Customers</Title>
                <Group>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() => exportCSV("most-frequent-customers.csv", headers, rows)}
                    >
                        Export CSV
                    </Button>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={() => exportPDF("Most Frequent Customers", "most-frequent-customers.pdf", headers, rows)}
                    >
                        Export PDF
                    </Button>
                </Group>
            </Group>

            <Group align="flex-end" gap="sm">
                <TextInput
                    label="Search"
                    placeholder="Search customer"
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

            {topList.length > 0 && (
                <Paper withBorder p="md">
                    <Center>
                        <DonutChart
                            size={200}
                            thickness={30}
                            paddingAngle={5}
                            data={donutData}
                            withLabels
                            labelsType="percent"
                            tooltipDataSource="segment"
                        />
                    </Center>
                </Paper>
            )}

            <Paper withBorder p="md">
                {topList.length === 0 ? (
                    <Text>No customers found.</Text>
                ) : (
                    <ScrollArea style={{ maxHeight: 420 }}>
                        <Table verticalSpacing="sm" striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Customer</Table.Th>
                                    <Table.Th>Visits</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {topList.map((c) => (
                                    <Table.Tr key={c.name}>
                                        <Table.Td>{c.name}</Table.Td>
                                        <Table.Td>{c.count}</Table.Td>
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
