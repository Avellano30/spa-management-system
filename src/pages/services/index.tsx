import { useEffect, useState } from 'react';
import { Button, Flex, Image, Modal, Table, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  type Service,
  type NewService,
} from '../../api/services';
import ServiceSwitch from '../../components/ServiceSwitch';
import ServiceForm from '../../components/ServiceForm';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [delOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getAllServices()
      .then(setServices)
      .catch((err) => showNotification({ color: 'red', title: 'Error', message: err.message }));
  }, []);

  const handleAdd = async (data: NewService) => {
    try {
      setAdding(true);
      await createService(data);
      const refreshed = await getAllServices();
      setServices(refreshed);
      showNotification({ color: 'green', title: 'Success', message: 'Service added' });
      closeAdd();
    } catch (err: any) {
      showNotification({ color: 'red', title: 'Error', message: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (data: NewService) => {
    if (!selected) return;
    try {
      setEditing(true);
      const updated = await updateService(selected._id, data);
      setServices((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      showNotification({ color: 'green', title: 'Updated', message: 'Service updated' });
      closeEdit();
      setSelected(null);
    } catch (err: any) {
      showNotification({ color: 'red', title: 'Error', message: err.message });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteService(toDelete._id);
      setServices((prev) => prev.filter((s) => s._id !== toDelete._id));
      showNotification({ color: 'green', title: 'Deleted', message: 'Service removed' });
      closeDelete();
    } catch (err: any) {
      showNotification({ color: 'red', title: 'Error', message: err.message });
    }
  };

  return (
    <div>
      <Flex justify="space-between" align="center" mb="md">
        <Title order={2}>Services</Title>
        <Button onClick={openAdd} justify='flex-end'>Add Service</Button>
      </Flex>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Status</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Image</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {services.map((s) => (
            <Table.Tr key={s._id}>
              <Table.Td>
                <ServiceSwitch
                  service={s}
                  onStatusChange={(updated) =>
                    setServices((prev) =>
                      prev.map((srv) => (srv._id === updated._id ? updated : srv))
                    )
                  }
                />
              </Table.Td>
              <Table.Td>{s.name}</Table.Td>
              <Table.Td>{s.description}</Table.Td>
              <Table.Td>{s.duration}</Table.Td>
              <Table.Td>{s.price}</Table.Td>
              <Table.Td>{s.category}</Table.Td>
              <Table.Td>
                <Image src={s.imageUrl} h={60} />
              </Table.Td>
              <Table.Td className="space-x-2">
                <Button size="xs" onClick={() => { setSelected(s); openEdit(); }}>
                  <IconPencil size={16} />
                </Button>
                <Button size="xs" color="red" onClick={() => { setToDelete(s); openDelete(); }}>
                  <IconTrash size={16} />
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={addOpened} onClose={closeAdd} title="Add Service" centered>
        <ServiceForm onSubmit={handleAdd} submitLabel="Add Service" loading={adding} />
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Edit Service" centered>
        {selected && <ServiceForm initial={selected} onSubmit={handleEdit} submitLabel="Save Changes" loading={editing} />}
      </Modal>

      <Modal opened={delOpened} onClose={closeDelete} title="Confirm Delete" centered>
        <p>Are you sure you want to delete <strong>{toDelete?.name}</strong>?</p>
        <div className="flex justify-center mt-4 gap-3">
          <Button color="red" onClick={handleDelete}>Delete</Button>
          <Button variant="outline" onClick={closeDelete}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
