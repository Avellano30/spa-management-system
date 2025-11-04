import { useState } from 'react';
import { Switch } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { toggleServiceStatus } from '../api/services';
import type { Service } from '../api/services';

interface ServiceSwitchProps {
  service: Service;
  onStatusChange?: (updated: Service) => void; // optional callback for parent update
}

export default function ServiceSwitch({ service, onStatusChange }: ServiceSwitchProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(service.status);

  const handleToggle = async (checked: boolean) => {
    const newStatus = checked ? 'available' : 'unavailable';

    // Optimistic UI update
    setStatus(newStatus);
    setLoading(true);

    try {
      const updated = await toggleServiceStatus(service._id, newStatus);
      onStatusChange?.(updated); // let parent update its local state if needed
      showNotification({
        color: 'green',
        title: 'Status Updated',
        message: `${updated.name} is now ${updated.status}`,
      });
    } catch (err: any) {
      // revert if failed
      setStatus(service.status);
      showNotification({ color: 'red', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Switch
      checked={status === 'available'}
      onChange={(e) => handleToggle(e.currentTarget.checked)}
      size="sm"
      color="green"
      onLabel="ON"
      offLabel="OFF"
      disabled={loading}
    />
  );
}
