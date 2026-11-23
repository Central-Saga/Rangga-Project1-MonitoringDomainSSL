export interface FieldErrorProps {
  message?: string;
}

/** Pesan validasi per field, ditempatkan tepat di bawah input terkait. */
export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-danger">
      {message}
    </p>
  );
}
