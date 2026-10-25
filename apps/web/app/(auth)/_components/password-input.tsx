"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "../auth.module.css";

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.passwordWrap}>
      <LockKeyhole className={styles.fieldIcon} size={17} aria-hidden="true" />
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        maxLength={128}
        className={styles.input}
      />
      <button
        className={styles.visibilityButton}
        type="button"
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
