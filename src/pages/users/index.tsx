import { useEffect, useState } from "react";
import {
    Card,
    Table,
    Group,
    Text,
    Button,
    Loader,
    Modal,
    TextInput,
    Select,
    Stack,
    Title,
    ActionIcon,
    ScrollArea,
} from "@mantine/core";
import { IconEdit, IconRefresh, IconSearch } from "@tabler/icons-react";

const endpoint = import.meta.env.VITE_ENDPOINT;

interface Client {
    _id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    phone?: string;
    status: "active" | "inactive" | "banned";
}

export default function Users() {
    const [clients, setClients] = useState<Client[]>([]);
    const [filtered, setFiltered] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);
    const [selected, setSelected] = useState<Client | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${endpoint}/client/records`);
            console.log("Fetch response:", res);
            const data = await res.json();
            console.log("Fetched clients:", data);
            setClients(data);
            setFiltered(data);
        } catch (err) {
            console.error("Error fetching clients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);



    const handleUpdate = async () => {
        if (!selected) return;
        try {
            await fetch(`${endpoint}/client/record/${selected._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selected),
            });
            setEditModal(false);
            fetchClients();
        } catch (err) {
            console.error("Error updating user:", err);
        }
    };

    const handleSearch = (query: string) => {
        setSearch(query);
        if (!query.trim()) {
            setFiltered(clients);
        } else {
            const q = query.toLowerCase();
            setFiltered(
                clients.filter((u) =>
                    `${u.firstname} ${u.lastname} ${u.username} ${u.email}`
                        .toLowerCase()
                        .includes(q)
                )
            );
        }
    };

    return (
        <Stack p="md">
            <Group justify="space-between">
                <Title order={2}>User Management</Title>
                <Group>
                    <TextInput
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => handleSearch(e.currentTarget.value)}
                        rightSection={<IconSearch size={16} />}
                    />
                    <Button
                        leftSection={<IconRefresh size={16} />}
                        variant="light"
                        onClick={fetchClients}
                    >
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
                    <Text c="dimmed" ta="center">
                        No users found.
                    </Text>
                ) : (
                    <ScrollArea>
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Username</Table.Th>
                                    <Table.Th>Phone</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.map((u) => (
                                    <Table.Tr key={u._id}>
                                        <Table.Td>
                                            {u.firstname} {u.lastname}
                                        </Table.Td>
                                        <Table.Td>{u.email}</Table.Td>
                                        <Table.Td>{u.username}</Table.Td>
                                        <Table.Td>{u.phone || "-"}</Table.Td>
                                        <Table.Td>
                                            <Text
                                                fw={600}
                                                c={
                                                    u.status === "active"
                                                        ? "green"
                                                        : u.status === "inactive"
                                                            ? "yellow"
                                                            : "red"
                                                }
                                            >
                                                {u.status}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={6}>
                                                <ActionIcon
                                                    variant="light"
                                                    color="blue"
                                                    onClick={() => {
                                                        setSelected(u);
                                                        setEditModal(true);
                                                    }}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                                {/* <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    onClick={() => handleDelete(u._id)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon> */}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Card>


            <Modal
                opened={editModal}
                onClose={() => setEditModal(false)}
                title="Edit User"
                centered
            >
                {selected && (
                    <Stack>
                        <TextInput
                            label="First name"
                            value={selected.firstname}
                            onChange={(e) => {
                                const lettersOnly = e.currentTarget.value.replace(
                                    /[^a-zA-Z\s]/g,
                                    ""
                                );

                                setSelected({
                                    ...selected,
                                    firstname: lettersOnly,
                                });
                            }}
                        />

                        <TextInput
                            label="Last name"
                            value={selected.lastname}
                            onChange={(e) => {
                                const lettersOnly = e.currentTarget.value.replace(
                                    /[^a-zA-Z\s]/g,
                                    ""
                                );

                                setSelected({
                                    ...selected,
                                    lastname: lettersOnly,
                                });
                            }}
                        />

                        <TextInput
                            label="Phone"
                            type="tel"
                            value={selected.phone || ""}
                            onChange={(e) => {
                                const numbersOnly = e.currentTarget.value.replace(
                                    /\D/g,
                                    ""
                                );

                                setSelected({
                                    ...selected,
                                    phone: numbersOnly,
                                });
                            }}
                        />

                        <Select
                            label="Status"
                            value={selected.status}
                            onChange={(v) =>
                                setSelected({
                                    ...selected,
                                    status: v as Client["status"],
                                })
                            }
                            data={[
                                { label: "Active", value: "active" },
                                { label: "Inactive", value: "inactive" },
                                { label: "Banned", value: "banned" },
                            ]}
                        />

                        <Group justify="end" mt="md">
                            <Button
                                variant="light"
                                onClick={() => setEditModal(false)}
                            >
                                Cancel
                            </Button>

                            <Button onClick={handleUpdate}>
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
