import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Group,
  Badge,
  Select,
  TextInput,
  Flex,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  getAppointments,
  approveAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  type Appointment,
} from "../../api/appointments";
import { useSearchParams } from "react-router";
import { DateInput, TimePicker } from "@mantine/dates";

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string | undefined>(undefined);

  const [searchParams] = useSearchParams();
  const paramStatusFilter = searchParams.get("status");
  
  const load = async () => {
    try {
      const data = await getAppointments(paramStatusFilter ? { status: paramStatusFilter } : undefined);
      setAppointments(data);
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };
  
  useEffect(() => { load(); }, [statusFilter]);

  // Apply filters automatically
  useEffect(() => {
    let temp = [...appointments];
    if (statusFilter !== "All") {
      temp = temp.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (a) =>
          a.clientId.firstname.toLowerCase().includes(s) ||
          a.clientId.lastname.toLowerCase().includes(s) ||
          a.serviceId.name.toLowerCase().includes(s)
      );
    }
    setFiltered(temp);
  }, [statusFilter, search, appointments]);

  const handleAction = async (
    id: string,
    action: Function,
    successMsg: string
  ) => {
    try {
      await action(id);
      showNotification({ color: "green", title: "Success", message: successMsg });
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  const handleReschedule = async () => {
    if (!selected || !newDate || !newTime) return;
    try {
      await rescheduleAppointment(
        selected._id,
        newDate,
        newTime
      );
      showNotification({
        color: "green",
        title: "Rescheduled",
        message: "Appointment moved.",
      });
      setRescheduleModal(false);
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  return (
    <div>
      <Flex justify="space-between" align="center" mb="md">
        <h1>Appointments</h1>
        <Group>
          <TextInput
            placeholder="Search by client or service"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "All")}
            data={[
              "All",
              "Pending",
              "Approved",
              "Completed",
              "Cancelled",
              "Rescheduled",
            ]}
            style={{ width: 180 }}
          />
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </Group>
      </Flex>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Client</Table.Th>
            <Table.Th>Service</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <Table.Tr key={a._id}>
                <Table.Td>
                  {a.clientId.firstname} {a.clientId.lastname}
                </Table.Td>
                <Table.Td>{a.serviceId.name}</Table.Td>
                <Table.Td>{new Date(a.date).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  {a.startTime} - {a.endTime}
                </Table.Td>
                <Table.Td>
                  <Badge color={statusColor(a.status)}>{a.status}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {a.status === "Pending" && (
                      <Button
                        size="xs"
                        onClick={() =>
                          handleAction(a._id, approveAppointment, "Approved")
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {(a.status === "Pending" || a.status === "Approved") && (
                      <Button
                        size="xs"
                        color="red"
                        onClick={() =>
                          handleAction(a._id, cancelAppointment, "Cancelled")
                        }
                      >
                        Cancel
                      </Button>
                    )}
                    {(a.status === "Approved" ||
                      a.status === "Rescheduled") && (
                      <>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelected(a);
                            setRescheduleModal(true);
                          }}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="xs"
                          color="teal"
                          onClick={() =>
                            handleAction(
                              a._id,
                              completeAppointment,
                              "Completed"
                            )
                          }
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6} style={{ textAlign: "center" }}>
                No appointments found
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={rescheduleModal}
        onClose={() => setRescheduleModal(false)}
        title="Reschedule Appointment"
        centered
      >
        <DateInput label="New Date" value={newDate} onChange={setNewDate} />
        <TimePicker
          label="New Start Time"
          value={newTime}
          onChange={setNewTime}
          format="12h"
          withDropdown
        />
        <Button mt="sm" onClick={handleReschedule}>
          Save Changes
        </Button>
      </Modal>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "Pending":
      return "yellow";
    case "Approved":
      return "blue";
    case "Completed":
      return "green";
    case "Cancelled":
      return "red";
    case "Rescheduled":
      return "orange";
    default:
      return "gray";
  }
}
