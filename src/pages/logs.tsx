import { useEffect, useState } from 'react';
import {
    Group, Stack, Title, Text, Card,
    Table, Badge, Select, TextInput, Pagination,
    Loader, Center
} from '@mantine/core';
import { IconSearch, IconClipboardList } from '@tabler/icons-react';

const LIMIT = 20;

interface LogEntry {
    _id: string;
    message: string;
    timestamp: string;
    context?: {
        adminEmail?: string;
        clientName?: string;
        role?: 'admin' | 'client';
    };
}

const Logs = () => {
    const [logs, setLogs]                       = useState<LogEntry[]>([]);
    const [loading, setLoading]                 = useState(false);
    const [page, setPage]                       = useState(1);
    const [total, setTotal]                     = useState(0);
    const [roleFilter, setRoleFilter]           = useState('');
    const [searchInput, setSearchInput]         = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        fetchLogs();
    }, [roleFilter, debouncedSearch, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(roleFilter      && { role: roleFilter }),
                ...(debouncedSearch && { search: debouncedSearch }),
                page:  String(page),
                limit: String(LIMIT),
            });

            const token = localStorage.getItem('session');
            const res = await fetch(`${import.meta.env.VITE_ENDPOINT}/logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setLogs(data.logs ?? []);
            setTotal(data.totalPages ?? 1);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const rows = logs.map(log => (
        <Table.Tr key={log._id}>
            <Table.Td>{new Date(log.timestamp).toLocaleString()}</Table.Td>
            <Table.Td>
                <Badge color={log.context?.role === 'admin' ? 'red' : 'teal'}>
                    {log.context?.role?.toUpperCase() ?? '—'}
                </Badge>
            </Table.Td>
            <Table.Td>
                {log.context?.adminEmail
                    ? log.context.adminEmail.charAt(0).toUpperCase() + log.context.adminEmail.slice(1)
                    : log.context?.clientName ?? '—'}
            </Table.Td>
            <Table.Td>{log.message}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Stack p="xl" gap="xl">
            {/* Header */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Group justify="space-between" align="center">
                    <Group align="center" gap="md">
                        <IconClipboardList size={32} color="var(--mantine-color-blue-6)" />
                        <Stack gap={2}>
                            <Title order={2}>User Activity Logs</Title>
                            <Text size="sm" c="dimmed">
                                Real-time log of all admin and client actions. Read-only.
                            </Text>
                        </Stack>
                    </Group>
                    <Badge size="lg" variant="light" color="teal">
                        Live
                    </Badge>
                </Group>
            </Card>

            {/* Filters */}
            <Group>
                <Select
                    placeholder="All roles"
                    clearable
                    data={['admin', 'client']}
                    value={roleFilter}
                    onChange={val => { setRoleFilter(val ?? ''); setPage(1); }}
                    w={150}
                />
                <TextInput
                    placeholder="Search user or message..."
                    leftSection={<IconSearch size={14} />}
                    value={searchInput}
                    onChange={e => setSearchInput(e.currentTarget.value)}
                    w={260}
                />
            </Group>

            {/* Table */}
            <Card shadow="sm" radius="md" withBorder padding={0}>
                {loading ? (
                    <Center p="xl"><Loader /></Center>
                ) : logs.length === 0 ? (
                    <Center p="xl"><Text c="dimmed">No logs found.</Text></Center>
                ) : (
                    <Table striped highlightOnHover withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Time</Table.Th>
                                <Table.Th>Role</Table.Th>
                                <Table.Th>User</Table.Th>
                                <Table.Th>Message</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Pagination */}
            {total > 1 && (
                <Center>
                    <Pagination total={total} value={page} onChange={setPage} />
                </Center>
            )}

            <Text size="sm" c="dimmed">
                Logs are read-only and only accessible to administrators.
            </Text>
        </Stack>
    );
};

export default Logs;