"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InventarioDetalhe } from "@repo/contracts";
import {
  NomeInventarioSchema,
  TextoLongoInventarioSchema,
} from "@repo/contracts";
import { useRouter } from "next/navigation";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { ComboboxField, TextField } from "@/components/shared/form-fields";
import { FormErrorSummary } from "@/components/shared/form-error-summary";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { criarOperacoesReavaliacoes } from "@/features/reavaliacoes/api/reavaliacao-operations";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { isApiError } from "@/lib/api/core/api-error";
import { browserInventarioOperations } from "../api/browser-inventario-operations";

const operacoesComissoes = criarOperacoesReavaliacoes(browserApiClient);
const FormularioInventarioSchema = z.strictObject({
  nome: NomeInventarioSchema,
  descricao: z.union([TextoLongoInventarioSchema, z.literal("")]),
  observacao: z.union([TextoLongoInventarioSchema, z.literal("")]),
  comissaoId: z.uuid({ error: "Selecione uma comissão vigente." }),
});

type FormularioInventario = z.input<typeof FormularioInventarioSchema>;

export function InventarioForm({
  inventario,
  onCancel,
}: {
  inventario?: InventarioDetalhe;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(inventario);
  const [erroGeral, setErroGeral] = React.useState<string[]>([]);
  const [carregandoComissoes, setCarregandoComissoes] = React.useState(true);
  const [comissoes, setComissoes] = React.useState<
    { value: string; label: string }[]
  >(
    inventario
      ? [{ value: inventario.comissao.id, label: inventario.comissao.nome }]
      : [],
  );
  const [chaveCriacao, setChaveCriacao] = React.useState<{
    payload: string;
    chave: string;
  } | null>(null);
  const form = useForm<FormularioInventario>({
    resolver: zodResolver(FormularioInventarioSchema),
    defaultValues: {
      nome: inventario?.nome ?? "",
      descricao: inventario?.descricao ?? "",
      observacao: inventario?.observacao ?? "",
      comissaoId: inventario?.comissao.id ?? "",
    },
  });
  const comissao = useController({ control: form.control, name: "comissaoId" });

  React.useEffect(() => {
    const controller = new AbortController();
    operacoesComissoes
      .comissoes(
        { contexto: "REGISTRO", pagina: "1", limite: "50" },
        { signal: controller.signal },
      )
      .then((resposta) => {
        setComissoes((atuais) => {
          const mapa = new Map(atuais.map((item) => [item.value, item]));
          for (const item of resposta.dados) {
            mapa.set(item.id, {
              value: item.id,
              label: item.nome,
            });
          }
          return [...mapa.values()];
        });
      })
      .catch((falha) => {
        if (!controller.signal.aborted) {
          setErroGeral([
            isApiError(falha)
              ? falha.message
              : "Não foi possível carregar as comissões. Tente novamente.",
          ]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoComissoes(false);
      });
    return () => controller.abort();
  }, []);

  async function enviar(valores: FormularioInventario) {
    setErroGeral([]);
    const campos = {
      nome: valores.nome,
      descricao: valores.descricao.trim() || null,
      observacao: valores.observacao.trim() || null,
      comissaoId: valores.comissaoId,
    };
    try {
      const resposta = inventario
        ? await browserInventarioOperations.editar(inventario.id, {
            ...campos,
            versaoEsperada: inventario.updatedAt,
          })
        : await (() => {
            const body = {
              nome: campos.nome,
              ...(campos.descricao ? { descricao: campos.descricao } : {}),
              ...(campos.observacao ? { observacao: campos.observacao } : {}),
              comissaoId: campos.comissaoId,
            };
            const payload = JSON.stringify(body);
            const registro =
              chaveCriacao?.payload === payload
                ? chaveCriacao
                : { payload, chave: crypto.randomUUID() };
            if (registro !== chaveCriacao) setChaveCriacao(registro);
            return browserInventarioOperations.criar({
              ...body,
              chaveIdempotencia: registro.chave,
            });
          })();
      setChaveCriacao(null);
      toast.success(
        inventario
          ? "Inventário atualizado com sucesso."
          : "Inventário aberto com sucesso.",
      );
      router.push(`/inventarios/${resposta.dados.id}`);
      router.refresh();
    } catch (falha) {
      if (isApiError(falha)) {
        let possuiErroCampo = false;
        let primeiroCampo: keyof FormularioInventario | undefined;
        for (const erro of falha.erros) {
          const campo = erro.campo as keyof FormularioInventario;
          if (campo in form.getValues()) {
            form.setError(campo, { message: erro.mensagem });
            possuiErroCampo = true;
            primeiroCampo ??= campo;
          }
        }
        if (possuiErroCampo && primeiroCampo) form.setFocus(primeiroCampo);
        setErroGeral([falha.message]);
      } else {
        setErroGeral([
          `Não foi possível ${inventario ? "salvar as alterações" : "abrir o inventário"}. Tente novamente.`,
        ]);
      }
    }
  }

  const erros = form.formState.errors;
  return (
    <form
      className="grid gap-5"
      noValidate
      onChange={() => erroGeral.length > 0 && setErroGeral([])}
      onSubmit={form.handleSubmit(enviar)}
    >
      <FormErrorSummary messages={erroGeral} focus={erroGeral.length > 0} />
      <TextField
        id="inventario-nome"
        label="Nome do inventário"
        required
        maxLength={150}
        placeholder="Ex.: Inventário patrimonial 2026"
        error={erros.nome?.message}
        {...form.register("nome")}
      />
      <Field data-invalid={Boolean(erros.descricao)}>
        <FieldLabel htmlFor="inventario-descricao">Descrição</FieldLabel>
        <Textarea
          id="inventario-descricao"
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(erros.descricao) || undefined}
          aria-describedby={
            erros.descricao ? "inventario-descricao-error" : undefined
          }
          {...form.register("descricao")}
        />
        {erros.descricao?.message ? (
          <FieldError id="inventario-descricao-error">
            {erros.descricao.message}
          </FieldError>
        ) : null}
      </Field>
      <Field data-invalid={Boolean(erros.observacao)}>
        <FieldLabel htmlFor="inventario-observacao">Observação</FieldLabel>
        <Textarea
          id="inventario-observacao"
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(erros.observacao) || undefined}
          aria-describedby={
            erros.observacao ? "inventario-observacao-error" : undefined
          }
          {...form.register("observacao")}
        />
        {erros.observacao?.message ? (
          <FieldError id="inventario-observacao-error">
            {erros.observacao.message}
          </FieldError>
        ) : null}
      </Field>
      <ComboboxField
        id="inventario-comissao"
        label="Comissão vigente"
        required
        options={comissoes}
        value={comissao.field.value}
        onValueChange={(value) => {
          setErroGeral([]);
          comissao.field.onChange(value);
        }}
        loading={carregandoComissoes}
        disabled={form.formState.isSubmitting}
        placeholder="Selecione uma comissão"
        searchPlaceholder="Buscar comissão…"
        emptyText="Nenhuma comissão vigente encontrada."
        error={erros.comissaoId?.message}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting}
          onClick={onCancel ?? (() => router.push("/inventarios"))}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting || carregandoComissoes}
        >
          {form.formState.isSubmitting
            ? editando
              ? "Salvando…"
              : "Abrindo…"
            : editando
              ? "Salvar alterações"
              : "Abrir inventário"}
        </Button>
      </div>
    </form>
  );
}
