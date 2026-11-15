"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NaturezaDetalhe } from "@repo/contracts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { FormErrorSummary } from "@/components/shared/form-error-summary";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api/core/api-error";
import { useAlterarNatureza, useCriarNatureza } from "../api/hooks";
import { mensagemErro } from "./cadastro-ui";

const NaturezaFormSchema = z.strictObject({
  nome: z
    .string()
    .trim()
    .min(1, { error: "Informe o nome da natureza." })
    .max(100, { error: "O nome deve possuir no máximo 100 caracteres." }),
  descricao: z.string().trim().max(2_000, {
    error: "A descrição deve possuir no máximo 2.000 caracteres.",
  }),
});

type NaturezaFormInput = z.input<typeof NaturezaFormSchema>;
type NaturezaFormData = z.output<typeof NaturezaFormSchema>;

function fieldMessages(errors: {
  nome?: { message?: string };
  descricao?: { message?: string };
}) {
  return [errors.nome?.message, errors.descricao?.message].filter(
    (message): message is string => Boolean(message),
  );
}

function FormularioNatureza({ registro }: { registro?: NaturezaDetalhe }) {
  const router = useRouter();
  const criar = useCriarNatureza();
  const alterar = useAlterarNatureza();
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const defaults = React.useMemo<NaturezaFormInput>(
    () => ({
      nome: registro?.nome ?? "",
      descricao: registro?.descricao ?? "",
    }),
    [registro],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NaturezaFormInput, unknown, NaturezaFormData>({
    resolver: zodResolver(NaturezaFormSchema),
    defaultValues: defaults,
    mode: "onTouched",
    shouldFocusError: true,
  });

  const validationMessages = fieldMessages(errors);
  const pending = isSubmitting || criar.pending || alterar.pending;
  const title = registro ? "Editar natureza" : "Nova natureza";

  async function save(data: NaturezaFormData) {
    setGeneralError(null);
    try {
      const response = registro
        ? await alterar.confirmar({
            id: registro.id,
            body: { nome: data.nome, descricao: data.descricao || null },
          })
        : await criar.confirmar({
            nome: data.nome,
            descricao: data.descricao || undefined,
          });

      if (!response) return;
      toast.success(registro ? "Natureza atualizada." : "Natureza cadastrada.");
      router.replace(
        `/cadastros/naturezas?id=${encodeURIComponent(response.dados.id)}&salvo=1`,
      );
    } catch (error) {
      let hasFieldError = false;
      if (isApiError(error)) {
        for (const issue of error.erros) {
          if (issue.campo === "nome" || issue.campo === "descricao") {
            setError(
              issue.campo,
              { type: issue.codigo, message: issue.mensagem },
              { shouldFocus: !hasFieldError },
            );
            hasFieldError = true;
          }
        }
      }
      if (!hasFieldError) setGeneralError(mensagemErro(error));
    }
  }

  function resetForm() {
    if (
      isDirty &&
      !window.confirm("Descartar as alterações deste formulário?")
    ) {
      return;
    }
    setGeneralError(null);
    reset(defaults);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          aria-label={title}
          aria-busy={pending}
          className="grid gap-5"
          noValidate
          onSubmit={handleSubmit(save)}
        >
          <FormErrorSummary
            messages={generalError ? [generalError] : []}
            focus
          />
          <FormErrorSummary messages={validationMessages} />

          <fieldset
            disabled={pending}
            className="grid min-w-0 gap-5 disabled:opacity-75"
          >
            <TextField
              id="natureza-nome"
              label="Nome da natureza"
              required
              autoComplete="off"
              maxLength={100}
              error={errors.nome?.message}
              {...register("nome")}
            />
            <Field data-invalid={Boolean(errors.descricao)}>
              <FieldLabel htmlFor="natureza-descricao">Descrição</FieldLabel>
              <Textarea
                id="natureza-descricao"
                maxLength={2_000}
                aria-invalid={Boolean(errors.descricao) || undefined}
                aria-describedby={
                  errors.descricao ? "natureza-descricao-error" : undefined
                }
                className="min-h-28"
                {...register("descricao")}
              />
              {errors.descricao?.message ? (
                <FieldError id="natureza-descricao-error">
                  {errors.descricao.message}
                </FieldError>
              ) : null}
            </Field>

            <CardFooter className="flex-wrap justify-end gap-3 border-t px-0 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                {registro ? "Restaurar alterações" : "Limpar"}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar natureza"}
              </Button>
            </CardFooter>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}

export { FormularioNatureza, NaturezaFormSchema };
