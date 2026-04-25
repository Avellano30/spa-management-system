import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, Center, Loader, Modal, Title, Text,SegmentedControl,Group } from "@mantine/core";
import { getAppointments } from "../api/appointments";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState,useRef } from "react";
import type { EventApi } from "@fullcalendar/core";

export default function BookingCalendar() {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
    const calendarRef = useRef<FullCalendar>(null);
  const [opened, setOpened] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
    const [view, setView] = useState("dayGridMonth");
    const handleViewChange = (newView: string) => {
        setView(newView);
        calendarRef.current?.getApi().changeView(newView);
    };
  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setOpened(true);
  };

  useEffect(() => {
    load();
  }, []);

    const load = async () => {
        try {
            const [approved, rescheduled, pending] = await Promise.all([
                getAppointments({ status: "Approved" }),
                getAppointments({ status: "Rescheduled" }),
                getAppointments({ status: "Pending" }),
            ]);

            const data = [...approved, ...rescheduled, ...pending];

            const formatted = data.map((item) => {
                const [date] = item.date.split("T");

                // 1. Get Service Names
                const serviceNames =
                    item.services && item.services.length > 0
                        ? item.services
                            .map((s) => s.service?.name || "Service deleted")
                            .join(", ")
                        : "No service";

                // 2. Get Service Categories (Fixed: Added the logic back)
                const serviceCategories =
                    item.services && item.services.length > 0
                        ? item.services.map((s) => s.service?.category || "").join(", ")
                        : "";

                return {
                    title: serviceNames,
                    start: `${date}T${item.startTime}:00`,
                    end: `${date}T${item.endTime}:00`,
                    allDay: false,
                    color: item.status === "Rescheduled"
                        ? "orange"
                        : item.status === "Pending"
                            ? "#fab005"
                            : undefined,
                    extendedProps: {
                        customer: `${item.clientId?.firstname || 'Unknown'} ${item.clientId?.lastname || ''}`,
                        service: serviceCategories,
                        phone: `${item.clientId?.phone || 'N/A'}`,
                        email: `${item.clientId?.email || 'N/A'}`,
                        status: item.status,
                        employee:
                            item.employee && typeof item.employee === "object" && "name" in item.employee
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
          {/* 1. This Group puts the Title and Toggle on the same line */}
          <Group justify="space-between" mb="md">
              <Title order={3}>Calendar Overview</Title>

              <SegmentedControl
                  value={view}
                  onChange={handleViewChange}
                  data={[
                      { label: "Month", value: "dayGridMonth" },
                      { label: "Week", value: "timeGridWeek" },
                      { label: "Day", value: "timeGridDay" },
                  ]}
                  radius="md"
              />
          </Group>

          <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="en-us"
              headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
              }}
              events={bookings}
              eventClick={handleEventClick}
              height="80vh"
              editable={false}
              selectable={true}
              eventDisplay="block"
              displayEventTime={true}
              eventTimeFormat={(info) => {
                  const date = info.date;
                  const hour = date.hour % 12 || 12;
                  const minute = date.minute.toString().padStart(2, '0');
                  const ampm = date.hour >= 12 ? 'pm' : 'am';

                  return `${hour}:${minute}${ampm}`;
              }}
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
