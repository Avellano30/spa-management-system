import { Button, FileInput, NumberInput, TextInput, Textarea } from '@mantine/core';
import { useState } from 'react';
import type { NewService, Service } from '../api/services';

interface Props {
  initial?: Partial<Service | NewService>;
  onSubmit: (data: NewService) => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function ServiceForm({ initial = {}, onSubmit, submitLabel = 'Save', loading = false }: Props) {
  const [form, setForm] = useState<NewService>({
    name: initial.name || '',
    description: initial.description || '',
    price: initial.price || 0,
    duration: initial.duration || 0,
    category: initial.category || '',
    image: undefined,
  });

  const handleChange = (field: keyof NewService, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="flex flex-col gap-3 mt-4">
      <TextInput label="Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
      <Textarea label="Description" value={form.description} onChange={(e) => handleChange('description', e.target.value)} required />
      <NumberInput label="Price" value={form.price} onChange={(v) => handleChange('price', v ?? 0)} required />
      <NumberInput label="Duration (min)" value={form.duration} onChange={(v) => handleChange('duration', v ?? 0)} required />
      <TextInput label="Category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} required />
      <FileInput label="Image" accept="image/*" onChange={(v) => handleChange('image', v)} />
      <Button loading={loading} loaderProps={loading ? { type: 'dots' } : undefined} mt="sm" variant="filled" onClick={() => onSubmit(form)} >{submitLabel}</Button>
    </div>
  );
}
