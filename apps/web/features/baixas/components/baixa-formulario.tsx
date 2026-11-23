"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, PackageCheck } from "lucide-react";
import {
  BaixarPatrimonioDadosSchema,
  TIPOS_BAIXA_PATRIMONIO,
  type BaixaPatrimonioDetalhe,
  type PatrimonioResumo,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/shared/form-fields";
import { browserPatrimonioOperations } from "@/features/patrimonios/api/browser-patrimonio-operations";
import { mensagemErroBaixa, rotulosTipoBaixa } from "../apresentacao";

function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function BaixaFormulario({
  patrimonio,
  compacto = false,
  onCancelar,
  onPendingChange,
  onSuccess,
}: {
  patrimonio: Pick<PatrimonioResumo, "id" | "numeroPatrimonio" | "descricao">;
  compacto?: boolean;
  onCancelar?: () => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess: (baixa: BaixaPatrimonioDetalhe) => void;
}) {
  const hoje = hojeSaoPaulo();
  const feedback = useRef<HTMLDivElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const [dataBaixa, setDataBaixa] = useState("");
  const [tipo, setTipo] = useState("");
  const [comissaoId, setComissaoId] = useState("");
  const [comissoes, setComissoes] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [carregandoComissoes, setCarregandoComissoes] = useState(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [confirmado, setConfirmado] = useState(false);
  const controleComissoes = useRef<AbortController | null>(null);

  async function carregarComissoes(data: string) {
    controleComissoes.current?.abort();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > hoje) return;
    const controle = new AbortController();
    controleComissoes.current = controle;
    setCarregandoComissoes(true);
    setErro("");
    try {
      const resposta =
        await browserPatrimonioOperations.listarOpcoesComissoesBaixa(
          patrimonio.id,
          { dataBaixa: data, pagina: "1", limite: "50" },
          controle.signal,
        );
      if (!controle.signal.aborted) setComissoes(resposta.dados);
    } catch (falha) {
      if (!controle.signal.aborted) setErro(mensagemErroBaixa(falha));
    } finally {
      if (!controle.signal.aborted) setCarregandoComissoes(false);
    }
  }

  useEffect(() => () => controleComissoes.current?.abort(), []);

  useEffect(() => onPendingChange?.(pending), [onPendingChange, pending]);
  useEffect(() => {
    if (erro) {
      feedback.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      feedback.current?.focus();
    }
  }, [erro]);

  function limparErroCampo(campo: string) {
    setErrosCampos((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
  }

  function focarPrimeiroCampoInvalido() {
    requestAnimationFrame(() => {
      const campo = formulario.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      campo?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      campo?.focus();
    });
  }

  async function confirmar(formData: FormData) {
    if (pending) return;
    const documento = formData.get("documento");
    const validacao = BaixarPatrimonioDadosSchema.safeParse({
      dataBaixa: String(formData.get("dataBaixa")),
      tipo: String(formData.get("tipo")),
      comissaoId: String(formData.get("comissaoId")),
      motivo: String(formData.get("motivo")),
      observacao: String(formData.get("observacao")).trim() || undefined,
    });
    const proximosErros: Record<string, string> = {};
    if (!validacao.success) {
      for (const issue of validacao.error.issues) {
        const campo = issue.path.join(".");
        if (proximosErros[campo]) continue;
        proximosErros[campo] =
          campo === "dataBaixa"
            ? "Informe uma data da baixa válida."
            : campo === "tipo"
              ? "Selecione o tipo da baixa."
              : issue.message;
      }
    }
    if (!confirmado)
      proximosErros.confirmacao =
        "Confirme que revisou os dados e reconhece que a baixa é irreversível.";
    if (documento instanceof File && documento.size > 10 * 1024 * 1024) {
      proximosErros.documento = "O PDF deve possuir no máximo 10 MiB.";
    } else if (
      documento instanceof File &&
      documento.size > 0 &&
      documento.type &&
      documento.type !== "application/pdf"
    ) {
      proximosErros.documento = "Selecione um arquivo PDF.";
    }
    if (!validacao.success || Object.keys(proximosErros).length) {
      setErro("");
      setErrosCampos(proximosErros);
      focarPrimeiroCampoInvalido();
      return;
    }
    setPending(true);
    setErro("");
    setErrosCampos({});
    try {
      const resposta = await browserPatrimonioOperations.baixar(
        patrimonio.id,
        {
          ...validacao.data,
        },
        documento instanceof File && documento.size ? documento : undefined,
      );
      onSuccess(resposta.dados);
    } catch (falha) {
      setErro(mensagemErroBaixa(falha));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formulario}
      action={(dados) => void confirmar(dados)}
      noValidate
      className={compacto ? "grid gap-5 p-5 sm:p-7" : "grid gap-5"}
    >
      {erro ? (
        <Alert ref={feedback} tabIndex={-1} variant="destructive">
          <AlertTitle>Não foi possível registrar a baixa</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}
      <Card asChild className="p-4 shadow-none">
        <section aria-labelledby="bem-baixa">
          <div className="flex items-start gap-3">
            <PackageCheck
              aria-hidden="true"
              className="mt-0.5 size-5 text-interactive"
            />
            <div className="min-w-0">
              <h2 id="bem-baixa" className="font-bold">
                Patrimônio selecionado para baixa
              </h2>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {patrimonio.numeroPatrimonio} · {patrimonio.descricao}
              </p>
            </div>
            <Badge className="ml-auto" variant="outline">
              Selecionado
            </Badge>
          </div>
        </section>
      </Card>

      <FieldSet className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <FieldLegend className="px-2 font-bold">Dados da baixa</FieldLegend>
        <TextField
          id="dataBaixa"
          label="Data da baixa"
          type="date"
          name="dataBaixa"
          required
          max={hoje}
          value={dataBaixa}
          error={errosCampos.dataBaixa}
          onChange={(e) => {
            limparErroCampo("dataBaixa");
            setDataBaixa(e.target.value);
            setComissaoId("");
            setComissoes([]);
            void carregarComissoes(e.target.value);
          }}
        />
        <SelectField
          id="tipoBaixa"
          name="tipo"
          label="Tipo"
          required
          value={tipo}
          error={errosCampos.tipo}
          onValueChange={(value) => {
            limparErroCampo("tipo");
            setTipo(value);
          }}
          options={TIPOS_BAIXA_PATRIMONIO.map((value) => ({
            value,
            label: rotulosTipoBaixa[value] ?? value,
          }))}
          placeholder="Selecione"
        />
        <SelectField
          id="comissaoBaixa"
          name="comissaoId"
          label="Comissão vigente na data"
          required
          value={comissaoId}
          error={errosCampos.comissaoId}
          onValueChange={(value) => {
            limparErroCampo("comissaoId");
            setComissaoId(value);
          }}
          options={comissoes.map((comissao) => ({
            value: comissao.id,
            label: comissao.nome,
          }))}
          disabled={carregandoComissoes || comissoes.length === 0}
          placeholder={
            carregandoComissoes
              ? "Carregando…"
              : comissoes.length
                ? "Selecione"
                : "Nenhuma comissão elegível"
          }
          fieldClassName="sm:col-span-2"
        />
      </FieldSet>

      <FieldSet className="grid gap-4 rounded-lg border border-border bg-card p-4">
        <FieldLegend className="px-2 font-bold">
          Justificativa e documento
        </FieldLegend>
        <TextareaField
          id="motivoBaixa"
          label="Motivo"
          name="motivo"
          required
          maxLength={2000}
          rows={4}
          error={errosCampos.motivo}
          onChange={() => limparErroCampo("motivo")}
        />
        <TextareaField
          id="observacaoBaixa"
          label="Observação (opcional)"
          name="observacao"
          maxLength={2000}
          rows={3}
          error={errosCampos.observacao}
          onChange={() => limparErroCampo("observacao")}
        />
        <TextField
          id="documentoBaixa"
          label="Documento PDF (opcional, até 10 MiB)"
          type="file"
          name="documento"
          accept="application/pdf,.pdf"
          error={errosCampos.documento}
          onChange={() => limparErroCampo("documento")}
        />
      </FieldSet>

      <Alert>
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>Operação irreversível</AlertTitle>
        <AlertDescription>
          <p>
            A baixa altera o patrimônio para BAIXADO e não pode ser editada,
            excluída ou estornada.
          </p>
          <Field
            className="mt-4"
            data-invalid={Boolean(errosCampos.confirmacao)}
          >
            <Label className="flex items-start gap-2 text-sm font-medium">
              <Checkbox
                className="mt-1"
                checked={confirmado}
                aria-invalid={Boolean(errosCampos.confirmacao) || undefined}
                aria-describedby={
                  errosCampos.confirmacao
                    ? "confirmacao-baixa-error"
                    : undefined
                }
                onCheckedChange={(checked) => {
                  limparErroCampo("confirmacao");
                  setConfirmado(checked === true);
                }}
              />
              Revisei o patrimônio, a data, o tipo, a comissão, a justificativa
              e o documento e confirmo a baixa irreversível.
            </Label>
            {errosCampos.confirmacao ? (
              <FieldError id="confirmacao-baixa-error">
                {errosCampos.confirmacao}
              </FieldError>
            ) : null}
          </Field>
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        {onCancelar ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="destructive"
          disabled={pending || carregandoComissoes || comissoes.length === 0}
        >
          {pending ? "Confirmando…" : "Confirmar baixa"}
        </Button>
      </div>
    </form>
  );
}
