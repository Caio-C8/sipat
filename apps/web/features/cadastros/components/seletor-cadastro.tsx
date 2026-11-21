"use client";
import { useEffect, useId, useState } from "react";
import { ComboboxField } from "@/components/shared/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useListarNaturezas,
  useListarResponsaveisAtivos,
  useListarFornecedoresAtivos,
  type OpcaoCadastro,
} from "../api/hooks";
import { mensagemErro } from "./cadastro-ui";
import { useCadastroFieldError } from "./cadastro-field-errors";

type Props = {
  name: string;
  rotulo: string;
  inicial?: OpcaoCadastro;
  required?: boolean;
};
function SeletorPaginado({
  name,
  rotulo,
  inicial,
  required = true,
  consulta,
}: { consulta: ReturnType<typeof useListarNaturezas> } & Props) {
  const id = useId();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [escolhida, setEscolhida] = useState<OpcaoCadastro | undefined>(
    inicial,
  );
  const fieldError = useCadastroFieldError(name);
  const { carregar, dados, loading, erro } = consulta;
  useEffect(() => {
    void carregar({
      busca: busca || undefined,
      pagina: String(pagina),
      limite: "20",
    });
  }, [busca, pagina, carregar]);
  const opcoes = dados?.dados ?? [];
  const options = [
    ...(escolhida && !opcoes.some((opcao) => opcao.id === escolhida.id)
      ? [escolhida]
      : []),
    ...opcoes,
  ].map((opcao) => ({ value: opcao.id, label: opcao.rotulo }));
  return (
    <div className="grid min-w-0 gap-3 rounded-md border border-border p-3">
      <ComboboxField
        id={id}
        name={name}
        label={rotulo}
        required={required}
        options={options}
        value={escolhida?.id}
        onValueChange={(value) =>
          setEscolhida(
            [...(dados?.dados ?? []), ...(inicial ? [inicial] : [])].find(
              (opcao) => opcao.id === value,
            ),
          )
        }
        onSearchChange={(value) => {
          setPagina(1);
          setBusca(value.trim());
        }}
        searchPlaceholder={`Buscar ${rotulo.toLocaleLowerCase("pt-BR")}…`}
        loading={loading}
        error={fieldError}
      />
      {erro != null && (
        <Alert variant="destructive">
          <AlertDescription>
            {mensagemErro(erro)}{" "}
            <Button
              type="button"
              variant="link"
              onClick={() =>
                void carregar({
                  busca: busca || undefined,
                  pagina: String(pagina),
                  limite: "20",
                })
              }
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagina === 1 || loading}
          onClick={() => setPagina((p) => p - 1)}
        >
          Opções anteriores
        </Button>
        <span>Página {pagina}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dados || pagina >= dados.meta.ultimaPagina || loading}
          onClick={() => setPagina((p) => p + 1)}
        >
          Mais opções
        </Button>
      </div>
    </div>
  );
}

export function SeletorNatureza(props: Props) {
  const consulta = useListarNaturezas();
  return <SeletorPaginado {...props} consulta={consulta} />;
}

export function SeletorResponsavel(props: Props) {
  const consulta = useListarResponsaveisAtivos();
  return <SeletorPaginado {...props} consulta={consulta} />;
}

export function SeletorFornecedor(props: Props) {
  const consulta = useListarFornecedoresAtivos();
  return <SeletorPaginado {...props} consulta={consulta} />;
}
