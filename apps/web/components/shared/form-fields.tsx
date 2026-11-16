"use client";

import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldMetadata = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
};

function FieldLabelText({
  label,
  required,
}: Pick<FieldMetadata, "label" | "required">) {
  return (
    <>
      {label}
      {required ? (
        <span aria-hidden="true" className="text-destructive">
          {" *"}
        </span>
      ) : null}
    </>
  );
}

function describedBy(id: string, description?: string, error?: string) {
  return (
    [description ? `${id}-description` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> &
  FieldMetadata & { id: string };

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { id, label, description, error, required, fieldClassName, ...props },
    ref,
  ) => (
    <Field className={fieldClassName} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} required={required} />
      </FieldLabel>
      <Input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, description, error)}
        {...props}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  ),
);
TextField.displayName = "TextField";

type TextareaFieldProps = Omit<React.ComponentProps<typeof Textarea>, "id"> &
  FieldMetadata & { id: string };

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    { id, label, description, error, required, fieldClassName, ...props },
    ref,
  ) => (
    <Field className={fieldClassName} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} required={required} />
      </FieldLabel>
      <Textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, description, error)}
        {...props}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  ),
);
TextareaField.displayName = "TextareaField";

type SelectFieldProps = FieldMetadata & {
  id: string;
  name?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
};

function SelectField({
  id,
  name,
  label,
  description,
  error,
  required,
  value,
  onValueChange,
  options,
  placeholder = "Selecione uma opção",
  disabled,
  fieldClassName,
}: SelectFieldProps) {
  return (
    <Field
      className={fieldClassName}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} required={required} />
      </FieldLabel>
      <Select
        value={value ?? ""}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger
          id={id}
          className="h-10 w-full"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(id, description, error)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

type ComboboxFieldProps = FieldMetadata &
  Omit<
    React.ComponentProps<typeof Combobox>,
    "id" | "invalid" | "describedBy"
  > & {
    id: string;
  };

function ComboboxField({
  id,
  label,
  description,
  error,
  required,
  fieldClassName,
  ...props
}: ComboboxFieldProps) {
  return (
    <Field
      className={fieldClassName}
      data-invalid={Boolean(error)}
      data-disabled={props.disabled || undefined}
    >
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} required={required} />
      </FieldLabel>
      <Combobox
        id={id}
        invalid={Boolean(error)}
        describedBy={describedBy(id, description, error)}
        {...props}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

export { ComboboxField, SelectField, TextareaField, TextField };
