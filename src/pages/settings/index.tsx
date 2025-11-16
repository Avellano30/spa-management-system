import { useEffect, useState } from 'react';
import {
  Button,
  NumberInput,
  TextInput,
  Group,
  Paper,
  Title,
  Loader,
  Stack,
  Divider,
  Box,
} from '@mantine/core';
import { IconSettings2 } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import {
  getSpaSettings,
  createSpaSettings,
  updateSpaSettings,
  type SpaSettings,
} from '../../api/settings';

export default function Settings() {
  const [settings, setSettings] = useState<SpaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [totalRooms, setTotalRooms] = useState(1);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('20:00');

  useEffect(() => {
    (async () => {
      try {
        const data = await getSpaSettings();
        if (data) {
          setSettings(data);
          setTotalRooms(data.totalRooms);
          setOpeningTime(data.openingTime);
          setClosingTime(data.closingTime);
        }
      } catch (err: any) {
        showNotification({ color: 'red', title: 'Error', message: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { totalRooms, openingTime, closingTime };

      let updated: SpaSettings;
      if (settings) {
        updated = await updateSpaSettings(payload);
        showNotification({ color: 'green', title: 'Updated', message: 'Settings updated' });
      } else {
        updated = await createSpaSettings(payload);
        showNotification({ color: 'green', title: 'Created', message: 'Settings created' });
      }

      setSettings(updated);
    } catch (err: any) {
      showNotification({ color: 'red', title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader color="blue" size="lg" />
      </div>
    );
  }

  return (
    <Box className="flex justify-center w-full">
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        className="w-full max-w-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100"
      >
        <Group mb="lg" align="center">
          <IconSettings2 size={28} className="text-indigo-600" />
          <div>
            <Title order={3} className="text-indigo-900">Spa Configuration</Title>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage your spa’s core operational settings
            </p>
          </div>
        </Group>

        <Divider mb="md" />

        <Stack gap="md">
          <NumberInput
            label="Total Beds"
            min={1}
            value={totalRooms}
            onChange={(v) => setTotalRooms(Number(v) || 1)}
            description="Total number of beds available for services"
            radius="md"
          />

          <Group grow>
            <TextInput
              label="Opening Time"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.currentTarget.value)}
              radius="md"
            />

            <TextInput
              label="Closing Time"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.currentTarget.value)}
              radius="md"
            />
          </Group>
        </Stack>

        <Divider my="lg" />

        <Group justify="flex-end">
          <Button
            size="md"
            radius="md"
            color="indigo"
            loading={saving}
            onClick={handleSave}
          >
            {settings ? 'Save Changes' : 'Create Settings'}
          </Button>
        </Group>
      </Paper>
    </Box>
  );
}
