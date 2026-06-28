"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { uploadCustomerDoc, type Customer } from "@/lib/api";

interface Props {
  onUploaded: (customer: Customer) => void;
}

export default function UploadZone({ onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      if (!file.name.endsWith(".docx")) {
        setError("Only .docx files are supported.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const customer = await uploadCustomerDoc(file);
        onUploaded(customer);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-brand-500 bg-brand-50"
            : loading
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <>
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
              <p className="text-base font-medium text-gray-700">Extracting requirements with AI…</p>
              <p className="text-sm text-gray-500">Gemini is reading the document. This takes 5–10 seconds.</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="w-12 h-12 text-brand-500" />
              <p className="text-base font-medium text-brand-700">Drop it here</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
                <FileText className="w-7 h-7 text-brand-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  Drop customer requirement document here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or{" "}
                  <span className="text-brand-600 font-medium underline underline-offset-2">
                    click to browse
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                .docx files only · max 5 MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
