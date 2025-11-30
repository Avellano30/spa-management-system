import { Modal, Table, Badge, Text, Button } from "@mantine/core";
import { useState } from "react";
import {IconClipboardText, IconFileSearch} from "@tabler/icons-react";

export const PaymentHistoryModal = ({ payments }: any) => {
    const [opened, setOpened] = useState(false);

    return (
        <>
            <Button
                size="xs"
                fullWidth={true}
                variant="light"
                color="blue"
                onClick={() => setOpened(true)}
            >
                <IconFileSearch size={15}/>
            </Button>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title="Payment History"
                centered
                size="lg"
            >
                {/*{a.payments && a.payments?.length > 0 ? a.payments[0]?.method : 'Cash'}*/}
                {payments && payments.length ? (
                    <Table striped withTableBorder withColumnBorders>
                        <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Amount</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Date</Table.Th>
                        </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                        {payments.map((p: any) => (
                            <Table.Tr key={p._id}>
                                <Table.Td>{p.type}</Table.Td>
                                <Table.Td>₱{p.amount.toFixed(2)}</Table.Td>
                                <Table.Td>
                                    <Badge color={p.status === "Completed" ? "green" : "yellow"}>
                                        {p.status === "Completed" ? "PAID" : "PENDING"}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>{new Date(p.createdAt).toLocaleString()}</Table.Td>
                            </Table.Tr>
                        ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Text size="sm" c="dimmed">
                        No payments yet.
                    </Text>
                )}
            </Modal>
        </>
    );
};
