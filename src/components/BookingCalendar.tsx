import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, Center, Loader, Title } from "@mantine/core";
import { getAppointments } from "../api/appointments";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState } from "react";

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getAppointments({ status: "Approved" });

      console.log(data);

      const formatted = data.map((item) => ({
        id: item._id,
        title: `${item.status}`,
        start: item.startTime,
        end: item.endTime,
      }));

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
        height="80vh"
        editable={false}
        selectable={true}
      />
    </Card>
  );
}
