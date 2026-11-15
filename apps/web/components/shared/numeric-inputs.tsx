"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  centsDigitsToDecimal,
  decimalToCentsDigits,
  formatBrlInput,
} from "@/lib/format/decimal";

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (decimal: string) => void;
};

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      value={formatBrlInput(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        onValueChange(centsDigitsToDecimal(digits));
      }}
      onFocus={(event) => {
        event.currentTarget.select();
        props.onFocus?.(event);
      }}
      data-decimal-value={centsDigitsToDecimal(decimalToCentsDigits(value))}
    />
  ),
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
