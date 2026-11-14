import type { TipoRelatorio } from "@repo/contracts";
import { DadosRegistro, rotulo, valor } from "../apresentacao";

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
    "pedidoId",
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
    <div
      className="min-w-0 overflow-x-auto rounded-lg border border-slate-200"
      tabIndex={0}
      role="region"
      aria-label="Registros do relatório"
    >
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="p-3 text-left font-semibold">
          Registros selecionados
        </caption>
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {campos.map((campo) => (
              <th key={campo} scope="col" className="p-3">
                {rotulo(campo)}
              </th>
            ))}
            <th scope="col" className="p-3">
              Detalhes
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.map((registro, indice) => (
            <tr
              key={String(registro.id ?? indice)}
              className="border-t border-slate-100 align-top even:bg-slate-50/60"
            >
              {campos.map((campo) => (
                <td key={campo} className="max-w-64 break-words p-3">
                  {valor(registro[campo])}
                </td>
              ))}
              <td className="p-3">
                <details>
                  <summary className="cursor-pointer whitespace-nowrap font-medium">
                    Mais informações
                  </summary>
                  <div className="mt-3 min-w-64">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
