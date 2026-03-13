import React, { useEffect, useState } from "react";
import {
  Tabs,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Paper,
  Loader,
  Title,
  Stack,
  FileInput,
  Text,
} from "@mantine/core";
import {
  getHomepageSettings,
  updateHomepageSettings,
  createHomepageSettings,
  type HomepageSettings,
} from "../../api/settings/homepage";
import {
  getSpaSettings,
  updateSpaSettings,
  createSpaSettings,
  type SpaSettings,
} from "../../api/settings";
import { showNotification } from "@mantine/notifications";
import { TimePicker } from "@mantine/dates";

import {
  createCategory,
  deleteCategory,
  getAllCategories,
} from "../../api/categories";

import {
  createIntensity,
  deleteIntensity,
  getAllIntensities,
} from "../../api/intensity";

const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>("spa");

  const [homepage, setHomepage] = useState<HomepageSettings>({
    brand: { name: "", logoUrl: "" },
    contact: { email: "", phone: "", address: "" },
    content: { heading: "", description: "", bodyDescription: "" },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loadingHomepage, setLoadingHomepage] = useState(true);

  const [spa, setSpa] = useState<SpaSettings | null>(null);
  const [loadingSpa, setLoadingSpa] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hp = await getHomepageSettings();
        console.log(hp);
        if (hp) {
          setHomepage({
            brand: {
              name: hp.brand.name || "",
              logoUrl: hp.brand.logoUrl || "",
            },
            contact: {
              email: hp.contact.email || "",
              phone: hp.contact.phone || "",
              address: hp.contact.address || "",
            },
            content: {
              heading: hp.content.heading || "",
              description: hp.content.description || "",
              bodyDescription: hp.content.bodyDescription || "",
            },
            createdAt: hp.createdAt ? new Date(hp.createdAt) : new Date(),
            updatedAt: hp.updatedAt ? new Date(hp.updatedAt) : new Date(),
          });
        }
      } catch (error) {
        console.error("Failed to load homepage settings", error);
      } finally {
        setLoadingHomepage(false);
      }

      try {
        const sp = await getSpaSettings();
        setSpa(sp);
      } catch (error) {
        console.error("Failed to load spa settings", error);
      } finally {
        setLoadingSpa(false);
      }

      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }

      try {
        const data = await getAllIntensities();
        setIntensities(data);
      } catch (err) {
        console.error("Failed to load intensities");
      } finally {
        setLoadingIntensities(false);
      }
    };

    fetchData();
  }, []);

  const saveHomepage = async () => {
    try {
      const formData = new FormData();
      formData.append("brand[name]", homepage.brand.name);
      formData.append("contact[email]", homepage.contact.email);
      if (homepage.contact.phone)
        formData.append("contact[phone]", homepage.contact.phone);
      if (homepage.contact.address)
        formData.append("contact[address]", homepage.contact.address);
      if (homepage.content.heading)
        formData.append("content[heading]", homepage.content.heading);
      if (homepage.content.description)
        formData.append("content[description]", homepage.content.description);
      if (homepage.content.bodyDescription)
        formData.append(
          "content[bodyDescription]",
          homepage.content.bodyDescription,
        );

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      let result;
      if (!homepage.createdAt) {
        result = await createHomepageSettings(formData);
      } else {
        result = await updateHomepageSettings(formData);
      }
      setHomepage(result);

      showNotification({
        title: "Success",
        message: "Homepage settings saved successfully",
        color: "green",
      });
    } catch (error: unknown) {
      const e = error as Error;
      showNotification({
        title: "Error",
        message: e.message || "Failed to save homepage settings",
        color: "red",
      });
    }
  };

  const saveSpa = async () => {
    if (!spa) return;
    try {
      let result;
      if (!spa.createdAt) {
        result = await createSpaSettings(spa);
      } else {
        result = await updateSpaSettings(spa);
      }
      setSpa(result);

      showNotification({
        title: "Success",
        message: "Spa settings saved successfully",
        color: "green",
      });
    } catch (error: unknown) {
      const e = error as Error;
      showNotification({
        title: "Error",
        message: e.message || "Failed to save spa settings",
        color: "red",
      });
    }
  };

  const addCategory = async () => {
    if (!newCategory) return;

    const created = await createCategory({ name: newCategory });

    setCategories([...categories, created]);
    setNewCategory("");

    showNotification({
      title: "Success",
      message: "Category added",
      color: "green",
    });
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  interface Category {
    _id?: string;
    name: string;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  // INTENSITY HANDLERS (same as categories, can be refactored later)

  const addIntensity = async () => {
    if (!newIntensity) return;

    const created = await createIntensity({ name: newIntensity });

    setIntensities([...intensities, created]);
    setNewIntensity("");

    showNotification({
      title: "Success",
      message: "Intensity added",
      color: "green",
    });
  };

  const removeIntensity = async (id: string) => {
    await deleteIntensity(id);
    setIntensities((prev) => prev.filter((c) => c._id !== id));
  };

  interface Category {
    _id?: string;
    name: string;
  }

  interface Intensity {
    _id?: string;
    name: string;
  }

  const [intensities, setIntensities] = useState<Intensity[]>([]);
  const [newIntensity, setNewIntensity] = useState("");
  const [loadingIntensities, setLoadingIntensities] = useState(true);

  if (loadingHomepage || loadingSpa) return <Loader />;

  return (
    <Stack gap="md" p="md">
      <Title order={2}>Settings</Title>

      <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
        <Tabs.List>
          <Tabs.Tab value="spa">Spa Settings</Tabs.Tab>
          <Tabs.Tab value="homepage">Homepage Settings</Tabs.Tab>
          <Tabs.Tab value="categories">Categories</Tabs.Tab>
          <Tabs.Tab value="intensity">Intensity</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="homepage" pt="md">
          <Paper p="md" shadow="xs">
            <TextInput
              label="Brand Name"
              value={homepage.brand.name}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, name: e.target.value },
                }))
              }
            />
            <FileInput
              label="Brand Logo"
              placeholder="Select logo"
              accept="image/*"
              value={logoFile}
              onChange={setLogoFile}
            />
            <TextInput
              label="Contact Email"
              value={homepage.contact.email}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value },
                }))
              }
            />
            <TextInput
              label="Contact Phone"
              value={homepage.contact.phone}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value },
                }))
              }
            />
            <TextInput
              label="Contact Address"
              value={homepage.contact.address}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, address: e.target.value },
                }))
              }
            />
            <TextInput
              label="Heading"
              value={homepage.content.heading}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  content: { ...prev.content, heading: e.target.value },
                }))
              }
            />
            <TextInput
              label="Home Description"
              value={homepage.content.description}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  content: { ...prev.content, description: e.target.value },
                }))
              }
            />
            <Textarea
              label="About Description"
              value={homepage.content.bodyDescription}
              onChange={(e) =>
                setHomepage((prev) => ({
                  ...prev,
                  content: { ...prev.content, bodyDescription: e.target.value },
                }))
              }
            />
            <Group justify="right" mt="md">
              <Button onClick={saveHomepage}>Save Homepage Settings</Button>
            </Group>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="spa" pt="md">
          <Paper p="md" shadow="xs">
            <NumberInput
              label="Total Beds"
              value={spa?.totalRooms || 1}
              min={1}
              onChange={(value) =>
                setSpa((prev) =>
                  prev ? { ...prev, totalRooms: Number(value) || 1 } : null,
                )
              }
            />
            <NumberInput
              label="Minimum Downpayment (%)"
              value={spa?.downPayment || 30}
              min={1}
              max={100}
              onChange={(value) =>
                setSpa((prev) =>
                  prev ? { ...prev, downPayment: Number(value) || 1 } : null,
                )
              }
            />
            <TimePicker
              label="Opening Time"
              value={spa?.openingTime || ""}
              onChange={(value) =>
                setSpa((prev) =>
                  prev ? { ...prev, openingTime: value || "" } : null,
                )
              }
              format="12h"
              withDropdown
            />

            <TimePicker
              label="Closing Time"
              value={spa?.closingTime || ""}
              onChange={(value) =>
                setSpa((prev) =>
                  prev ? { ...prev, closingTime: value || "" } : null,
                )
              }
              format="12h"
              withDropdown
            />
            <Group justify="right" mt="md">
              <Button onClick={saveSpa}>Save Spa Settings</Button>
            </Group>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="categories" pt="md">
          <Paper p="md" shadow="xs">
            <Group mb="md">
              <TextInput
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button onClick={addCategory}>Add</Button>
            </Group>

            {loadingCategories ? (
              <Loader />
            ) : (
              <Stack>
                {categories.map((cat) => (
                  <Group key={cat._id} justify="space-between">
                    <Text>{cat.name}</Text>
                    <Button
                      color="red"
                      variant="light"
                      onClick={() => removeCategory(cat._id!)}
                    >
                      Delete
                    </Button>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="intensity" pt="md">
          <Paper p="md" shadow="xs">
            <Group mb="md">
              <TextInput
                placeholder="New intensity"
                value={newIntensity}
                onChange={(e) => setNewIntensity(e.target.value)}
              />
              <Button onClick={addIntensity}>Add</Button>
            </Group>

            {loadingIntensities ? (
              <Loader />
            ) : (
              <Stack>
                {intensities.map((intensity) => (
                  <Group key={intensity._id} justify="space-between">
                    <Text>{intensity.name}</Text>
                    <Button
                      color="red"
                      variant="light"
                      onClick={() => removeIntensity(intensity._id!)}
                    >
                      Delete
                    </Button>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default AdminSettingsPage;
