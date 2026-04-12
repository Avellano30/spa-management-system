import { useEffect, useState } from "react";
import { Card, Box, Grid, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";
import { showNotification } from "@mantine/notifications";
import { getAppointmentStats } from "./api/appointments";
import BookingCalendar from "./components/BookingCalendar";

const statusColors: Record<string, string> = {
  Pending: "yellow",
  Approved: "blue",
  Completed: "green",
  Cancelled: "red",
  Rescheduled: "orange",
    Refunded:"gray",
};

// default counts for all statuses
const defaultStats: Record<string, number> = {
  Pending: 0,
  Approved: 0,
  Completed: 0,
  Cancelled: 0,
  Rescheduled: 0,
    Refunded: 0,
};

export default function App() {
  const [stats, setStats] = useState<Record<string, number>>(defaultStats);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAppointmentStats();
        setStats({ ...defaultStats, ...data });
      } catch (err: any) {
        showNotification({
          color: "red",
          title: "Error",
          message: err?.message || "Failed to fetch appointment stats",
        });
        setStats(defaultStats);
      }
    };

    fetchStats();
  }, []);

  const handleNavigate = (status: string) => {
    navigate(`/appointments?status=${status}`);
  };

  return (
    <Stack p="lg">
      <Title order={2}>Appointment Overview</Title>

      <Grid>
        {Object.entries(stats).map(([status, count]) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 4 }} key={status}>
              <Card
                  shadow="md"
                  padding="lg"
                  radius="lg"
                  withBorder
                  onClick={() => handleNavigate(status)}
                  // Use the status color for the background
                  bg={`${statusColors[status]}.6`}
                  style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  // Added a small hover effect since they are clickable
                  className="hover:scale-105 active:scale-95"
              >
                  <Text fw={800} c="white" size="md" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {status}
                  </Text>
                  <Title order={1} c="white">
                      {count}
                  </Title>
              </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Box mt="sm" style={{ height: "calc(100vh - 320px)" }}>
        <BookingCalendar />
      </Box>
    </Stack>
  );
}
