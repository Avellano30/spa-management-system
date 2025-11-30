import { useEffect, useState } from "react";
import { Stack, Title, Tabs, Loader, Text } from "@mantine/core";
import { getAppointments, type Appointment } from "../../api/appointments";
import EarningsReport from "./earnings";
import ServicesReport from "./services";
import CustomersReport from "./customers";

export default function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAppointments();
        setAppointments(res);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
      <Stack gap="md" p="md">
        <Title order={2}>Reports</Title>

        {loading && <Loader />}

        {error && <Text c="red">{error}</Text>}

        {!loading && !error && (
          <Tabs defaultValue="earnings" keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="earnings">Earnings</Tabs.Tab>
              <Tabs.Tab value="services">Most Requested Services</Tabs.Tab>
              <Tabs.Tab value="customers">Most Frequent Customers</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="earnings" pt="md">
              <EarningsReport appointments={appointments} />
            </Tabs.Panel>

            <Tabs.Panel value="services" pt="md">
              <ServicesReport appointments={appointments} />
            </Tabs.Panel>

            <Tabs.Panel value="customers" pt="md">
              <CustomersReport appointments={appointments} />
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
  );
}
