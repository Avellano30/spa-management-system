import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, Center, Loader, Modal, Title, Text } from "@mantine/core";
import { getAppointments } from "../api/appointments";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState } from "react";
import type { EventApi } from "@fullcalendar/core";

export default function BookingCalendar() {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);

  const [opened, setOpened] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setOpened(true);
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
        const [approved, rescheduled] = await Promise.all([
            getAppointments({ status: "Approved" }),
            getAppointments({ status: "Rescheduled" }),
        ]);

        const data = [...approved, ...rescheduled];

      const formatted = data.map((item) => {
        const [date] = item.date.split("T");
        // Compose a string of all service names (or categories) for the title
        const serviceNames =
          item.services && item.services.length > 0
            ? item.services
                .map((s) => s.service?.name || "Service deleted")
                .join(", ")
            : "No service";
        const serviceCategories =
          item.services && item.services.length > 0
            ? item.services.map((s) => s.service?.category || "").join(", ")
            : "";
        return {
          title: serviceNames,
          start: `${date}T${item.startTime}:00`,
          end: `${date}T${item.endTime}:00`,
            color: item.status === "Rescheduled" ? "orange" : undefined,
          extendedProps: {
            customer: `${item.clientId.firstname} ${item.clientId.lastname}`,
            service: serviceCategories,
            phone: `${item.clientId.phone}`,
            email: `${item.clientId.email}`,
            employee:
              typeof item.employee === "object" &&
              item.employee &&
              "name" in item.employee
                ? item.employee.name
                : item.employee || "-",
          },
        };
      });

      setBookings(formatted);
    } catch (err: any) {
      showNotification({ color: "red", title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Title order={3} mb="md">
        Calendar
      </Title>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={bookings}
        eventClick={handleEventClick}
        height="80vh"
        editable={false}
        selectable={true}
      />

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Appointment Details"
      >
        {selectedEvent && (
          <>
            <Text fw={600}>Service: {selectedEvent.title}</Text>
            <br />
            <Text>Start: {selectedEvent.start?.toLocaleString()}</Text>
            <Text>End: {selectedEvent.end?.toLocaleString()}</Text>
            <br />
            <Text>Client: {selectedEvent.extendedProps.customer}</Text>
            <Text>Contact: {selectedEvent.extendedProps.phone}</Text>
            <Text>Email: {selectedEvent.extendedProps.email}</Text>
            <br />
            <Text>Therapist: {selectedEvent.extendedProps.employee}</Text>
          </>
        )}
      </Modal>
    </Card>
  );
}
