"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";

type TextFilter = {
  type: "text";
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
};

type SelectFilter = {
  type: "select";
  name: string;
  label: string;
  defaultValue?: string;
  options: readonly { value: string; label: string }[];
};

type SimpleQueryFilter = TextFilter | SelectFilter;

function SimpleQueryFilters({
  action,
  filters,
  title = "Pesquisar cadastros",
  submitLabel = "Pesquisar",
}: {
  action: string;
  filters: readonly SimpleQueryFilter[];
  title?: string;
  submitLabel?: string;
}) {
  const [selectValues, setSelectValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      filters
        .filter((filter): filter is SelectFilter => filter.type === "select")
        .map((filter) => [filter.name, filter.defaultValue || "__todos__"]),
    ),
  );

  return (
    <form action={action} className="grid gap-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Search aria-hidden="true" className="size-4 text-interactive" />
        {title}
      </h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) =>
          filter.type === "text" ? (
            <TextField
              key={`${filter.name}:${filter.defaultValue ?? ""}`}
              id={`filtro-${filter.name}`}
              name={filter.name}
              label={filter.label}
              defaultValue={filter.defaultValue}
              placeholder={filter.placeholder}
              maxLength={filter.maxLength}
            />
          ) : (
            <div key={filter.name} className="min-w-0">
              <input
                type="hidden"
                name={filter.name}
                value={
                  selectValues[filter.name] === "__todos__"
                    ? ""
                    : selectValues[filter.name]
                }
              />
              <SelectField
                id={`filtro-${filter.name}`}
                label={filter.label}
                value={selectValues[filter.name]}
                onValueChange={(value) =>
                  setSelectValues((current) => ({
                    ...current,
                    [filter.name]: value,
                  }))
                }
                options={filter.options.map((option) => ({
                  ...option,
                  value: option.value || "__todos__",
                }))}
              />
            </div>
          ),
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild type="button" variant="outline">
          <Link href={action}>Limpar filtros</Link>
        </Button>
        <Button type="submit">
          <Search data-icon="inline-start" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { SimpleQueryFilters, type SimpleQueryFilter };
