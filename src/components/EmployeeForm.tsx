import { Button, FileInput, Image, Select, TextInput } from "@mantine/core";
import { useState } from "react";
import type { NewEmployee, Employee } from "../api/employees";
import { Checkbox, SimpleGrid, Card, Text } from "@mantine/core";

interface Props {
  initial?: Partial<Employee | NewEmployee>;
  onSubmit: (data: NewEmployee) => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function ServiceForm({
  initial = {},
  onSubmit,
  submitLabel = "Save",
  loading = false,
}: Props) {
  const [form, setForm] = useState<NewEmployee>({
    name: initial.name || "",
    status: initial.status || "",
    image: undefined,
    schedule: initial.schedule || [],
  });

  const [preview, setPreview] = useState<string | null>(
    (initial as Employee)?.imageUrl || null,
  );

  const handleChange = (field: keyof NewEmployee, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (file: File | null) => {
    handleChange("image", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview((initial as Employee)?.imageUrl || null);
    }
  };

  const schedule = form.schedule || [];
  const days = [
    { label: "Monday", value: "monday" },
    { label: "Tuesday", value: "tuesday" },
    { label: "Wednesday", value: "wednesday" },
    { label: "Thursday", value: "thursday" },
    { label: "Friday", value: "friday" },
    { label: "Saturday", value: "saturday" },
  ];

  return (
    <div className="flex flex-col gap-3 mt-4">
      <TextInput
        label="Name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        required
      />
      <FileInput label="Image" accept="image/*" onChange={handleImageChange} />

      <Select
        label="Status"
        value={form.status}
        onChange={(value) => handleChange("status", value ?? "")}
        data={[
          { label: "Available", value: "available" },
          { label: "Unavailable", value: "unavailable" },
        ]}
      />

      <Text fw={500} mt="md">
        Schedule
      </Text>

      <Checkbox.Group
        value={schedule}
        onChange={(value) => handleChange("schedule", value)}
      >
        <SimpleGrid cols={3} mt="xs">
          {days.map((day) => (
            <Card
              key={day.value}
              withBorder
              radius="md"
              padding="sm"
              style={{
                cursor: "pointer",
                borderColor: schedule.includes(day.value)
                  ? "#228be6"
                  : undefined,
                background: schedule.includes(day.value)
                  ? "#e7f5ff"
                  : undefined,
              }}
              onClick={() => {
                if (schedule.includes(day.value)) {
                  handleChange(
                    "schedule",
                    schedule.filter((d) => d !== day.value),
                  );
                } else {
                  handleChange("schedule", [...schedule, day.value]);
                }
              }}
            >
              <Checkbox
                value={day.value}
                label={day.label}
                checked={schedule.includes(day.value)}
                readOnly
              />
            </Card>
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      {preview && (
        <div className="flex justify-center mt-2">
          <Image
            src={preview}
            alt="Preview"
            h={120}
            fit="contain"
            radius="md"
          />
        </div>
      )}

      <Button
        loading={loading}
        loaderProps={{ type: "dots" }}
        mt="sm"
        onClick={() => onSubmit(form)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
