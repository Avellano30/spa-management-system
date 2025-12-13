import { Button, Group, Stack, Title, Text, Card } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';

const Logs = () => {
    const goToLogRocket = () => {
        window.open('https://app.logrocket.com/rlg94d/appointment-system/sessions', '_blank');
    };

    return (
        <Stack p="xl" gap="xl">
            <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Group justify="space-between" align="center">
                    <Stack gap={2}>
                        <Title order={2}>User Activity Logs</Title>
                        <Text size="sm" c="dimmed">
                            View all user sessions and interactions via LogRocket. Only admins can access this.
                        </Text>
                    </Stack>
                    <Button
                        color="blue"
                        size="md"
                        onClick={goToLogRocket}
                        leftSection={<IconRocket size={18} />}
                    >
                        Open LogRocket
                    </Button>
                </Group>
            </Card>

            <Text size="sm" c="dimmed">
                Logs are read-only and only accessible to administrators.
            </Text>
        </Stack>
    );
}

export default Logs;
