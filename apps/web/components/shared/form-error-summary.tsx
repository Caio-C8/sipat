"use client";

import * as React from "react";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FormErrorSummaryProps = {
  title?: string;
  messages: readonly string[];
  focus?: boolean;
};

function FormErrorSummary({
  title = "Revise os dados informados",
  messages,
  focus = false,
}: FormErrorSummaryProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!focus || messages.length === 0) return;
    if (typeof ref.current?.scrollIntoView === "function") {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    ref.current?.focus({ preventScroll: true });
  }, [focus, messages]);

  if (messages.length === 0) return null;

  return (
    <Alert ref={ref} tabIndex={-1} variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="ml-4 list-disc space-y-1">
          {messages.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export { FormErrorSummary };
