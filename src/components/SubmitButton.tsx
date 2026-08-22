// START GENAI
"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

export function SubmitButton({
  children,
  pendingText,
  className = "w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60",
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`flex items-center justify-center gap-2 ${className}`}>
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}
// END GENAI
