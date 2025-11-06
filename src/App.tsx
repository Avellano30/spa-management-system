import { useEffect, useState } from "react";
import { Card, Grid, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";
import { showNotification } from "@mantine/notifications";
import { getAppointmentStats } from "./api/appointments";

const statusColors: Record<string, string> = {
  Pending: "yellow",
  Approved: "blue",
  Completed: "green",
  Cancelled: "red",
  Rescheduled: "orange",
};

// default counts for all statuses
const defaultStats: Record<string, number> = {
  Pending: 0,
  Approved: 0,
  Completed: 0,
  Cancelled: 0,
  Rescheduled: 0,
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
    <Stack p="md">
      <Title order={2}>Appointment Overview</Title>
      
      <Grid>
        {Object.entries(stats).map(([status, count]) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }} key={status}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              onClick={() => handleNavigate(status)}
              style={{
                cursor: "pointer",
                borderColor: `var(--mantine-color-${statusColors[status]}-6)`,
              }}
            >
              <Text fw={600} c={statusColors[status]}>
                {status}
              </Text>
              <Title order={3}>{count}</Title>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
