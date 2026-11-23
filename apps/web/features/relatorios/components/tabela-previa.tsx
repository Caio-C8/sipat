import type { TipoRelatorio } from "@repo/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  chaveRegistroRelatorio,
  DadosRegistro,
  rotulo,
  valor,
} from "../apresentacao";

const colunas: Record<TipoRelatorio, string[]> = {
  patrimonios: [
    "numeroPatrimonio",
    "descricao",
    "setorAtual",
    "salaAtual",
    "valorLiquidoAtual",
  ],
  "ficha-bem": ["tipo", "ocorrencia", "descricaoSnapshot"],
  movimentacoes: [
    "numeroPatrimonio",
    "descricao",
    "setorOrigem",
    "setorDestino",
    "dataTransferencia",
  ],
  manutencoes: [
    "numeroPatrimonio",
    "descricao",
    "fornecedor",
    "situacao",
    "dataEnvio",
    "valorRealizado",
  ],
  depreciacoes: [
    "numeroPatrimonio",
    "competencia",
    "valorContabilAnterior",
    "valorDepreciado",
    "valorContabilNovo",
  ],
  "pendencias-depreciacao": [
    "numeroPatrimonio",
    "competenciaEsperada",
    "quantidadePendencias",
    "valorLiquidoAtual",
    "quotaPrevista",
  ],
  reavaliacoes: [
    "numeroPatrimonioAtual",
    "dataReavaliacao",
    "valorLiquidoAnterior",
    "valorReavaliado",
    "valorResidualNovo",
  ],
  inventarios: [
    "numeroPatrimonio",
    "setorEsperado",
    "verificacao",
    "situacao",
    "correcao",
  ],
  emprestimos: [
    "numeroPatrimonio",
    "destinatario",
    "dataSaida",
    "previsao",
    "situacao",
  ],
  baixas: ["numeroPatrimonio", "tipo", "dataBaixa", "motivo"],
};

export function TabelaPrevia({
  tipo,
  dados,
}: {
  tipo: TipoRelatorio;
  dados: Record<string, unknown>[];
}) {
  const campos = colunas[tipo];
  return (
    <Table
      className="min-w-170"
      containerClassName="rounded-lg border"
      containerProps={{
        tabIndex: 0,
        role: "region",
        "aria-label": "Registros do relatório",
      }}
    >
      <caption className="sr-only">Registros selecionados</caption>
      <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
        <TableRow>
          {campos.map((campo) => (
            <TableHead key={campo}>{rotulo(campo)}</TableHead>
          ))}
          <TableHead>Detalhes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((registro, indice) => (
          <TableRow
            key={chaveRegistroRelatorio(registro, indice)}
            className="align-top"
          >
            {campos.map((campo) => (
              <TableCell
                key={campo}
                className="max-w-64 whitespace-normal wrap-break-word"
              >
                {valor(registro[campo])}
              </TableCell>
            ))}
            <TableCell>
              <details>
                <summary className="cursor-pointer whitespace-nowrap font-medium text-interactive">
                  Mais informações
                </summary>
                <div className="mt-3 min-w-64 whitespace-normal">
                  <DadosRegistro
                    dados={Object.fromEntries(
                      Object.entries(registro).filter(
                        ([chave]) =>
                          !campos.includes(chave) &&
                          !chave.endsWith("Id") &&
                          chave !== "id",
                      ),
                    )}
                  />
                </div>
              </details>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
