import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Group,
  Badge,
  Select,
  TextInput,
  Title,
  Stack,
  ScrollArea,
  Card,
  Loader,
  Text,
  Flex,
  NumberInput,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  getAppointments,
  approveAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  type Appointment,
  createCashPayment,
} from "../../api/appointments";
import { useSearchParams } from "react-router";
import { DateInput, TimePicker } from "@mantine/dates";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { PaymentHistoryModal } from "../../components/PaymentHistoryModal.tsx";

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string | undefined>(undefined);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);

  const [cashModal, setCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState<string | number>(0);
  const [cashRemarks, setCashRemarks] = useState("");
  const [selectedForCash, setSelectedForCash] = useState<Appointment | null>(null);

  const [searchParams] = useSearchParams();
  const paramStatusFilter = searchParams.get("status");

  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAppointments(paramStatusFilter ? { status: paramStatusFilter } : undefined);
      setAppointments(data);
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  // Apply filters automatically
  useEffect(() => {
    let temp = [...appointments];
    if (statusFilter !== "All") temp = temp.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (a) =>
          (a.clientId?.firstname?.toLowerCase() || "").includes(s) ||
          (a.clientId?.lastname?.toLowerCase() || "").includes(s) ||
          (a.serviceId?.name?.toLowerCase() || "").includes(s)
      );
    }
    setFiltered(temp);
  }, [statusFilter, search, appointments]);

  const handleAction = async (id: string, action: Function, successMsg: string) => {
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
      await rescheduleAppointment(selected._id, newDate, newTime);
      showNotification({ color: "green", title: "Rescheduled", message: "Appointment moved." });
      setRescheduleModal(false);
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  const openCancelModal = (appt: Appointment) => {
    setSelectedForCancel(appt);
    setCancelNotes("");
    setCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedForCancel) return;
    if (!cancelNotes.trim()) {
      showNotification({ color: "red", title: "Error", message: "Please provide cancellation notes." });
      return;
    }

    try {
      await cancelAppointment(selectedForCancel._id, cancelNotes);
      showNotification({ color: "green", title: "Success", message: "Appointment cancelled." });
      setCancelModal(false);
      setCancelNotes("");
      setSelectedForCancel(null);
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  // Open cash payment modal
  const openCashModal = (appt: Appointment) => {
    setSelectedForCash(appt);
    const totalPaid = appt.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = appt.serviceId.price - totalPaid;
    setCashAmount(remaining);
    setCashRemarks("");
    setCashModal(true);
  };

  const handleCashPayment = async () => {
    if (!selectedForCash || !cashAmount || Number(cashAmount) <= 0) return;

    try {
      await createCashPayment(selectedForCash._id, "Balance", Number(cashAmount), cashRemarks);
      showNotification({ color: "green", title: "Success", message: "Cash payment recorded." });
      setCashModal(false);
      setCashAmount(0);
      setCashRemarks("");
      setSelectedForCash(null);
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  const handleComplete = async (appt: Appointment) => {
    try {
      const totalPaid = appt.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remaining = appt.serviceId.price - totalPaid;

      if (remaining > 0) {
        showNotification({
          color: "red",
          title: "Cannot Complete",
          message: `Appointment has an unpaid balance of ₱${remaining}.`,
        });
        return;
      }

      await completeAppointment(appt._id);
      showNotification({
        color: "green",
        title: "Success",
        message: "Appointment completed.",
      });
      load();
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    }
  };

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Appointment Management</Title>
        <Group>
          <TextInput
            placeholder="Search by client or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            rightSection={<IconSearch size={16} />}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "All")}
            data={["All", "Pending", "Approved", "Completed", "Cancelled", "Rescheduled"]}
            style={{ width: 180 }}
          />
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={load}>
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
            No appointment found.
          </Text>
        ) : (
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Service</Table.Th>
                  <Table.Th>Booking Date</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Notes</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Payment Method</Table.Th>
                  <Table.Th>Payment</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((a) => {
                  const totalPaid = a.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  const remaining = a.serviceId?.price - totalPaid;
                  return (
                    <Table.Tr key={a._id}>
                      <Table.Td>
                        {a.clientId?.firstname ? `${a.clientId.firstname} ${a.clientId.lastname}` : "Deleted Client"}
                      </Table.Td>
                      <Table.Td>{a.serviceId ? a.serviceId.name : "Service no longer exists."}</Table.Td>
                      <Table.Td>{new Date(a.date).toLocaleDateString()}</Table.Td>
                      <Table.Td>
                        <Flex>
                          <span>{formatTime(a.startTime)}</span>
                          <span>&nbsp;-&nbsp;</span>
                          <span>{formatTime(a.endTime)}</span>
                        </Flex>
                      </Table.Td>
                      <Table.Td>{a.notes || "-"}</Table.Td>
                      <Table.Td>
                        <Badge color={statusColor(a.status)}>{a.status}</Badge>
                      </Table.Td>
                      <Table.Td>{a.payments?.length ? a.payments[0]?.method : "Cash"}</Table.Td>
                      <Table.Td>
                        <PaymentHistoryModal payments={a.payments} />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {a.status === "Pending" && (
                            <Button size="xs" onClick={() => handleAction(a._id, approveAppointment, "Approved")}>
                              Approve
                            </Button>
                          )}
                          {(a.status === "Pending" || a.status === "Approved") && (
                            <Button size="xs" color="red" onClick={() => openCancelModal(a)}>
                              Cancel
                            </Button>
                          )}
                          {(a.status === "Approved" || a.status === "Rescheduled") && (
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

                              {remaining > 0 ? (
                                <Button size="xs" color="orange" onClick={() => openCashModal(a)}>
                                  Add Cash Payment
                                </Button>
                              ) : (
                                <Button size="xs" color="teal" onClick={() => handleComplete(a)}>
                                  Complete
                                </Button>
                              )}
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Reschedule Modal */}
      <Modal
        opened={rescheduleModal}
        onClose={() => setRescheduleModal(false)}
        title="Reschedule Appointment"
        centered
      >
        <DateInput label="New Date" value={newDate} onChange={setNewDate} />
        <TimePicker label="New Start Time" value={newTime} onChange={setNewTime} format="12h" withDropdown />
        <Button mt="sm" onClick={handleReschedule}>
          Save Changes
        </Button>
      </Modal>

      {/* Cancel Modal */}
      <Modal opened={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Appointment" centered>
        <TextInput
          label="Cancellation Notes"
          placeholder="Reason for cancellation..."
          value={cancelNotes}
          onChange={(e) => setCancelNotes(e.currentTarget.value)}
          required
        />
        <Button mt="sm" color="red" onClick={handleCancel}>
          Confirm Cancel
        </Button>
      </Modal>

      {/* Cash Payment Modal */}
      <Modal opened={cashModal} onClose={() => setCashModal(false)} title="Add Cash Payment" centered>
        <Text>Remaining Balance: ₱{selectedForCash ? selectedForCash.serviceId.price - (selectedForCash.payments?.reduce((sum, p) => sum + p.amount, 0) || 0) : 0}</Text>
        <NumberInput
          label="Cash Received"
          value={cashAmount}
          onChange={setCashAmount}
          min={1}
          max={selectedForCash ? selectedForCash.serviceId.price - (selectedForCash.payments?.reduce((sum, p) => sum + p.amount, 0) || 0) : undefined}
        />
        <TextInput
          label="Remarks"
          placeholder="Optional notes"
          value={cashRemarks}
          onChange={(e) => setCashRemarks(e.currentTarget.value)}
        />
        <Button mt="sm" onClick={handleCashPayment}>
          Save Payment
        </Button>
      </Modal>
    </Stack>
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
