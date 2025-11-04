import { useEffect, useState } from 'react';
import { Button, NumberInput, TextInput, Group, Paper, Title, Loader } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { getSpaSettings, createSpaSettings, updateSpaSettings, type SpaSettings } from '../../api/settings';

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
    <Paper shadow="sm" p="xl" radius="md" className="max-w-lg mx-auto mt-8">
      <Title order={3} mb="md">Spa Settings</Title>

      <NumberInput
        label="Total Rooms"
        min={1}
        value={totalRooms}
        onChange={(v) => setTotalRooms(Number(v) || 1)}
        mb="sm"
      />

      <TextInput
        label="Opening Time"
        type="time"
        value={openingTime}
        onChange={(e) => setOpeningTime(e.currentTarget.value)}
        mb="sm"
      />

      <TextInput
        label="Closing Time"
        type="time"
        value={closingTime}
        onChange={(e) => setClosingTime(e.currentTarget.value)}
        mb="sm"
      />

      <Group mt="md" justify="flex-end">
        <Button loading={saving} onClick={handleSave}>
          {settings ? 'Save Changes' : 'Create Settings'}
        </Button>
      </Group>
    </Paper>
  );
}
