import { useEffect, useState } from "react";
import { Card, Grid, Text, Title } from "@mantine/core";
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

export default function App() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    getAppointmentStats()
      .then(setStats)
      .catch((err) => showNotification({ color: "red", title: "Error", message: err.message }));
  }, []);

  const handleNavigate = (status: string) => {
    navigate(`/appointments?status=${status}`);
  };

  return (
    <div>
      <Title order={2} mb="md">Appointment Overview</Title>
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
              <Text fw={600} color={statusColors[status]}>
                {status}
              </Text>
              <Title order={3}>{count}</Title>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}
