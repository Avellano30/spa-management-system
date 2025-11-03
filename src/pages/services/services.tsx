import { useEffect, useState } from "react";
import {getAllServices, type Service} from "../../api/services";
import {Button, FileInput, Image, Modal, NumberInput, Table, Textarea, TextInput} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconPencil, IconTrash} from "@tabler/icons-react";

interface NewService {
    name: string;
    description: string;
    price: number;
    duration: number; // minutes
    category: string;
    image?: string;
}
const endpoint = import.meta.env.VITE_ENDPOINT || 'http://localhost:3000';
export default function ServicesList() {
    const [services, setServices] = useState<Service[]>([]);
    const [newService, setNewService] = useState<NewService>({
        name: "",
        description: "",
        price: 0,
        duration: 0, // minutes
        category: "",
        image: "",
    });
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    // const [validationError, setValidationError] = useState<string>("");
    // Disclosure hooks for modals
    const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

    useEffect(() => {
        async function fetchServices() {
            try {
                const data = await getAllServices();
                setServices(data);
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        }

        fetchServices();
    }, [services, newService]);

    const handleInputChange = (field: keyof Service | keyof NewService, value: string | number | File) => {
        if (selectedService) {
            setSelectedService({ ...selectedService, [field]: value });
        } else {
            setNewService({ ...newService, [field]: value });
        }
        // setValidationError("");
    };

    const handleFormSubmit = async () => {
        // if (!validateNewProduct()) return;

        const formData = new FormData();
        formData.append("name", newService.name);
        formData.append("description", newService.description);
        formData.append("price", newService.price.toString());
        formData.append("duration", newService.duration.toString());
        formData.append("category", newService.category);
        if (newService.image) {
            formData.append("image", newService.image);
        }
        try {
            const response = await fetch(`${endpoint}/services`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Error creating product");
            }

            const createdService: Service = await response.json();
            setServices((prevServices) => [...prevServices, createdService]);
            closeAddModal();
            setNewService({ name: "", description: "", price: 0, duration: 0, category: "", image: undefined });
        } catch (error) {
            console.error("Error creating product:", error);
        }
    };

    const handleEditFormSubmit = async () => {
        if (!selectedService) return;

        const formData = new FormData();
        formData.append("name", selectedService.name);
        formData.append("description", selectedService.description);
        formData.append("price", selectedService.price.toString());
        formData.append("duration", selectedService.duration.toString());
        formData.append("category", selectedService.category);
        if (selectedService.imageUrl) {
            formData.append("image", selectedService.imageUrl);
        }

        try {
            const response = await fetch(`${endpoint}/services/${selectedService._id}`, {
                method: "PATCH",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Error updating service");
            }

            const updatedService: Service = await response.json();
            setServices((prevServices) =>
                prevServices.map((service) => (service._id === updatedService._id ? updatedService : service))
            );
            closeEditModal();
            setSelectedService(null);
        } catch (error) {
            console.error("Error updating service:", error);
        }
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;

        try {
            const response = await fetch(`${endpoint}/services/${serviceToDelete._id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Error deleting service");
            }

            setServices((prevServices) => prevServices.filter((service) => service._id !== serviceToDelete._id));
            closeDeleteModal();
            setServiceToDelete(null);
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    const rows = services.map((service) => (
        <Table.Tr key={service._id}>
            <Table.Td>{service.name}</Table.Td>
            <Table.Td>{service.description}</Table.Td>
            <Table.Td>{service.duration}</Table.Td>
            <Table.Td>{service.price}</Table.Td>
            <Table.Td>{service.category}</Table.Td>
            <Table.Td>{service.status}</Table.Td>
            <Table.Td><Image src={service.imageUrl} className="w-auto h-16"/></Table.Td>
            <Table.Td className="space-x-2">
                <Button onClick={() => {
                    setSelectedService(service);
                    openEditModal();
                }}><IconPencil /></Button>
                <Button onClick={() => {
                    setServiceToDelete(service);
                    openDeleteModal()
                }}
                ><IconTrash /></Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Button className='mb-4' variant="filled" onClick={openAddModal}>
                Add Service
            </Button>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Price</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Image</Table.Th>
                        <Table.Th>Action</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            <Modal.Root opened={addModalOpened} onClose={closeAddModal} centered>
                <Modal.Overlay />
                <Modal.Content>
                    <Modal.Header bg={"black"} >
                        <Modal.Title c={"white"} fw={"bold"}>Add New Service</Modal.Title>
                        <Modal.CloseButton c={"white"} bg={"transparent"} />
                    </Modal.Header>
                    <Modal.Body>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 15 }}>
                            <TextInput
                                radius="md"
                                label="Service Name"
                                placeholder="Enter Service Name"
                                value={newService.name}
                                onChange={(e) => handleInputChange("name", e.currentTarget.value)}
                                withAsterisk
                                required
                            />

                            <Textarea
                                radius="md"
                                label="Description"
                                withAsterisk
                                placeholder="Write a brief description of the service"
                                value={newService.description}
                                onChange={(e) => handleInputChange("description", e.currentTarget.value)}
                                required
                            />

                            <NumberInput
                                label="Price"
                                placeholder="Enter Price"
                                allowNegative={false}
                                value={newService.price}
                                onChange={(value) => handleInputChange("price", value ?? 0)}
                                stepHoldDelay={500}
                                stepHoldInterval={100}
                                withAsterisk
                                required
                            />

                            <NumberInput
                                label="Duration"
                                placeholder="Enter Duration"
                                allowNegative={false}
                                value={newService.duration}
                                onChange={(value) => handleInputChange("duration", value ?? 0)}
                                stepHoldDelay={500}
                                stepHoldInterval={100}
                                withAsterisk
                                required
                            />

                            <TextInput
                                radius="md"
                                label="Category"
                                placeholder="Enter Category"
                                value={newService.category}
                                onChange={(e) => handleInputChange("category", e.currentTarget.value)}
                                withAsterisk
                                required
                            />

                            <FileInput
                                variant="filled"
                                label="Image"
                                placeholder="Upload Image"
                                accept="image/*"
                                withAsterisk
                                required
                                onChange={(value) => handleInputChange("image", value as File)}
                            />

                            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                                <Button onClick={handleFormSubmit} variant="outline" color="black" bg={"white"}>
                                    Add Service
                                </Button>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>

            {selectedService && (<Modal.Root opened={editModalOpened} onClose={closeEditModal} centered>
                <Modal.Overlay/>
                <Modal.Content>
                    <Modal.Header bg={"black"}>
                        <Modal.Title c={"white"} fw={"bold"}>Edit Service</Modal.Title>
                        <Modal.CloseButton c={"white"} bg={"transparent"}/>
                    </Modal.Header>
                    <Modal.Body>
                        <div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: 15}}>
                            <TextInput
                                radius="md"
                                label="Service Name"
                                placeholder="Enter Service Name"
                                value={selectedService.name}
                                onChange={(e) => handleInputChange("name", e.currentTarget.value)}
                                withAsterisk
                                required
                            />

                            <Textarea
                                radius="md"
                                label="Description"
                                withAsterisk
                                placeholder="Write a brief description of the service"
                                value={selectedService.description}
                                onChange={(e) => handleInputChange("description", e.currentTarget.value)}
                                required
                            />

                            <NumberInput
                                label="Price"
                                placeholder="Enter Price"
                                allowNegative={false}
                                value={selectedService.price}
                                onChange={(value) => handleInputChange("price", value ?? 0)}
                                stepHoldDelay={500}
                                stepHoldInterval={100}
                                withAsterisk
                                required
                            />

                            <NumberInput
                                label="Duration"
                                placeholder="Enter Duration"
                                allowNegative={false}
                                value={selectedService.duration}
                                onChange={(value) => handleInputChange("duration", value ?? 0)}
                                stepHoldDelay={500}
                                stepHoldInterval={100}
                                withAsterisk
                                required
                            />

                            <TextInput
                                radius="md"
                                label="Category"
                                placeholder="Enter Category"
                                value={selectedService.category}
                                onChange={(e) => handleInputChange("category", e.currentTarget.value)}
                                withAsterisk
                                required
                            />

                            <FileInput
                                variant="filled"
                                label="Image"
                                placeholder="Upload Image"
                                accept="image/*"
                                withAsterisk
                                required
                                onChange={(value) => handleInputChange("imageUrl", value as File)}
                            />

                            <div style={{display: "flex", justifyContent: "center", marginTop: "10px"}}>
                                <Button onClick={handleEditFormSubmit} variant="outline" color="black" bg={"white"}>
                                    Edit Service
                                </Button>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>)}

            {serviceToDelete && (
                <Modal.Root opened={deleteModalOpened} onClose={() => { setServiceToDelete(null); closeDeleteModal(); }} centered>
                    <Modal.Overlay />
                    <Modal.Content>
                        <Modal.Header bg={"black"} >
                            <Modal.Title c={"white"} fw={"bold"}>Delete Service</Modal.Title>
                            <Modal.CloseButton c={"white"} bg={"transparent"} />
                        </Modal.Header>
                        <Modal.Body>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 15 }}>
                                <p>Are you sure you want to delete this service?</p>
                                <h1>
                                    <strong>{serviceToDelete.name}</strong>
                                </h1>
                                <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                                    <Button onClick={handleDelete} variant="outline" color="#ff0000" bg={"#ff00001a"}>
                                        Delete
                                    </Button>
                                    <Button onClick={closeDeleteModal} variant="outline" color="#000000" bg={"#0000001a"} ml="md">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal.Content>
                </Modal.Root>
            )}
        </div>
    )
};
