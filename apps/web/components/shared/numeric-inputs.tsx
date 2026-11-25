"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatBrlInput, normalizeBrlInput } from "@/lib/format/decimal";

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (decimal: string) => void;
};

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [draft, setDraft] = React.useState<string | null>(null);
    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={draft ?? formatBrlInput(value)}
        onChange={(event) => {
          const normalized = normalizeBrlInput(event.target.value);
          setDraft(normalized.formatted);
          onValueChange(normalized.decimal);
        }}
        onFocus={(event) => {
          setDraft(formatBrlInput(value));
          event.currentTarget.select();
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setDraft(null);
          props.onBlur?.(event);
        }}
        data-decimal-value={value || "0"}
      />
    );
  },
);
MoneyInput.displayName = "MoneyInput";

type IntegerInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (digits: string) => void;
};

const IntegerInput = React.forwardRef<HTMLInputElement, IntegerInputProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ""))}
    />
  ),
);
IntegerInput.displayName = "IntegerInput";

export { IntegerInput, MoneyInput };
