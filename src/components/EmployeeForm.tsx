import { Button, FileInput, Image, Select, TextInput } from "@mantine/core";
import { useState } from "react";
import type { NewEmployee, Employee } from "../api/employees";

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
