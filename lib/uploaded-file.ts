export type UploadedFileLike = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type UploadedFileCandidate = {
  name?: unknown;
  type?: unknown;
  size?: unknown;
  arrayBuffer?: unknown;
};

export function coerceUploadedFile(value: FormDataEntryValue | null | undefined): UploadedFileLike | null {
  if (!value || typeof value === "string" || typeof value !== "object") {
    return null;
  }

  const file = value as UploadedFileCandidate;

  if (typeof file.arrayBuffer !== "function" || typeof file.size !== "number") {
    return null;
  }

  return {
    name: typeof file.name === "string" && file.name.length > 0 ? file.name : "upload.bin",
    type: typeof file.type === "string" ? file.type : "",
    size: file.size,
    arrayBuffer: file.arrayBuffer.bind(value),
  };
}
