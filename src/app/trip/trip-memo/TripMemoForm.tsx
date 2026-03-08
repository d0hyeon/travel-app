import { Stack, TextField } from "@mui/material";
import { useState, type FormEvent } from "react";

interface Props {
  id: string;
  defaultValue?: string;
  onSubmit: (content: string) => void | Promise<void>;
}

export function TripMemoForm({ id, defaultValue = '', onSubmit }: Props) {
  const [content, setContent] = useState(defaultValue);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed) {
      await onSubmit(trimmed);
    }
  };

  return (
    <Stack
      component="form"
      id={id}
      onSubmit={handleSubmit}
      gap={2}
    >
      <TextField
        autoFocus
        multiline
        minRows={3}
        maxRows={10}
        placeholder="메모를 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        fullWidth
      />
    </Stack>
  );
}
