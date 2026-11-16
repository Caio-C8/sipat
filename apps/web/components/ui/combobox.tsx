"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  LoaderCircleIcon,
  SearchIcon,
} from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ComboboxProps = {
  options: readonly ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  loading?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  describedBy?: string;
  name?: string;
};

function Combobox({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = "Selecione uma opção",
  searchPlaceholder = "Buscar…",
  emptyText = "Nenhuma opção encontrada.",
  loadingText = "Carregando opções…",
  loading = false,
  disabled = false,
  invalid = false,
  id,
  describedBy,
  name,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selected = options.find((option) => option.value === value);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = onSearchChange
    ? options
    : options.filter((option) =>
        option.label.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      );

  function updateSearch(next: string) {
    setSearch(next);
    onSearchChange?.(next);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen && search) updateSearch("");
      }}
    >
      <Popover.Trigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon aria-hidden="true" className="opacity-50" />
        </Button>
      </Popover.Trigger>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          <div className="relative p-1">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder.replace(/…$/, "")}
              className="h-9 pl-8"
            />
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <p
                role="status"
                className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground"
              >
                <LoaderCircleIcon
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
                {loadingText}
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  <CheckIcon
                    aria-hidden="true"
                    className={cn(
                      "size-4",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { Combobox };
