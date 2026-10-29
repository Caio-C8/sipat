"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordInput({
  id,
  name,
  autoComplete,
  autoFocus,
  placeholder,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  id: string;
  name: string;
  autoComplete: string;
  autoFocus?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <LockKeyhole
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#6b809c]"
        size={17}
        aria-hidden="true"
      />
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        required
        maxLength={128}
        className="h-[clamp(2.4rem,2.9vw,3.5rem)] rounded-lg border-[#cbd8e8] bg-white pr-13 pl-11 text-sm text-[#294665] placeholder:text-[#8a9bb2]"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[#667f9e] hover:bg-[#edf3fa] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        type="button"
        aria-controls={id}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
