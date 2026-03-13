import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPencil,
  IconTrash,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type NewEmployee,
} from "../../api/employees";
import EmployeeForm from "../../components/EmployeeForm";
import { Badge } from "@mantine/core";

export default function Employees() {
  const [services, setServices] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [delOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getAllEmployees();
      setServices(data);
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAdd = async (data: NewEmployee) => {
    try {
      setAdding(true);
      await createEmployee(data);
      await fetchRecords();
      showNotification({
        color: "green",
        title: "Success",
        message: "Employee added",
      });
      closeAdd();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (data: NewEmployee) => {
    if (!selected) return;
    try {
      setEditing(true);
      const updated = await updateEmployee(selected._id, data);
      setServices((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s)),
      );
      showNotification({
        color: "green",
        title: "Updated",
        message: "Employee updated",
      });
      closeEdit();
      setSelected(null);
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteEmployee(toDelete._id);
      setServices((prev) => prev.filter((s) => s._id !== toDelete._id));
      showNotification({
        color: "green",
        title: "Deleted",
        message: "Employee removed",
      });
      closeDelete();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Employees</Title>
        <Group>
          <TextInput
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            rightSection={<IconSearch size={16} />}
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={fetchRecords}
          >
            Refresh
          </Button>
          <Button onClick={openAdd}>Add Employee</Button>
        </Group>
      </Group>

      <Card shadow="sm" p="md" radius="md">
        {loading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : filtered.length === 0 ? (
          <Text c="dimmed" ta="center">
            No employee found.
          </Text>
        ) : (
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Image</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Schedule</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((s) => (
                  <Table.Tr key={s._id}>
                    <Table.Td>
                      <div className="">
                        <Image
                          src={s.imageUrl}
                          alt={s.name}
                          h={80}
                          fit="contain"
                          radius="md"
                        />
                      </div>
                    </Table.Td>
                    <Table.Td>{s.name}</Table.Td>
                    <Table.Td>
                      <Text
                        c={
                          s.status === "available"
                            ? "green"
                            : s.status === "unavailable"
                              ? "red"
                              : "red"
                        }
                        style={{ textTransform: "uppercase" }}
                      >
                        {s.status}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        {s.schedule?.map((day) => (
                          <Badge key={day} variant="light" color="blue">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      <Flex gap="xs" justify="center">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            setSelected(s);
                            openEdit();
                          }}
                        >
                          <IconPencil size={16} />
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => {
                            setToDelete(s);
                            openDelete();
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
                      </Flex>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        opened={addOpened}
        onClose={closeAdd}
        title="Add Employee"
        centered
      >
        <EmployeeForm
          onSubmit={handleAdd}
          submitLabel="Add Employee"
          loading={adding}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit Employee"
        centered
      >
        {selected && (
          <EmployeeForm
            initial={selected}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            loading={editing}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={delOpened}
        onClose={closeDelete}
        title="Confirm Delete"
        centered
      >
        <p>
          Are you sure you want to delete <strong>{toDelete?.name}</strong>?
        </p>
        <div className="flex justify-center mt-4 gap-3">
          <Button color="red" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={closeDelete}>
            Cancel
          </Button>
        </div>
      </Modal>
    </Stack>
  );
}
