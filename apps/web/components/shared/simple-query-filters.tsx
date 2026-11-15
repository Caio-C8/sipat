import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  submitLabel = "Consultar",
}: {
  action: string;
  filters: readonly SimpleQueryFilter[];
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      {filters.map((filter) => (
        <label key={filter.name} className="grid gap-1 text-sm font-medium">
          {filter.label}
          {filter.type === "text" ? (
            <Input
              name={filter.name}
              defaultValue={filter.defaultValue}
              placeholder={filter.placeholder}
              maxLength={filter.maxLength}
              className="h-10 font-normal"
            />
          ) : (
            <select
              name={filter.name}
              defaultValue={filter.defaultValue}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
      <Button type="submit" variant="outline" className="h-10">
        {submitLabel}
      </Button>
    </form>
  );
}

export { SimpleQueryFilters, type SimpleQueryFilter };
