"use client";
import { FormularioCadastro } from "./formulario-cadastro";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ProcessoCompraDetalhe,
  NotaFiscalResumo,
  CriarNotaFiscalProcessoCompraSchema,
} from "@repo/contracts";
import type * as z from "zod";
import {
  useCriarProcessoCompra,
  useAlterarProcessoCompra,
  useCriarNotaFiscal,
  useAlterarNotaFiscal,
  useSubstituirAnexoNotaFiscal,
  useRemoverAnexoNotaFiscal,
} from "../api/hooks";
import {
  Campo,
  texto,
  opcional,
  campo,
  cartao,
  botao,
  mensagemErro,
} from "./cadastro-ui";
import { SeletorFornecedor } from "./seletor-cadastro";

function arquivo(dados: FormData, nome: string) {
  const file = dados.get(nome);
  return file instanceof File && file.size > 0 ? file : undefined;
}
function ano(dados: FormData, nome: string) {
  const valor = opcional(dados, nome);
  return valor ? Number(valor) : undefined;
}
function NotaCampos({
  prefixo = "",
  nota,
  admin,
}: {
  prefixo?: string;
  nota?: NotaFiscalResumo;
  admin: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          rotulo="Número da nota fiscal"
          name={prefixo + "numeroNotaFiscal"}
          required
          maxLength={50}
          defaultValue={nota?.numeroNotaFiscal}
        />
        <Campo
          rotulo="Ano da nota fiscal"
          name={prefixo + "anoNotaFiscal"}
          type="number"
          min={1}
          max={9999}
          required
          defaultValue={nota?.anoNotaFiscal}
        />
        <Campo
          rotulo="Data de emissão"
          name={prefixo + "dataEmissao"}
          type="date"
          required
          defaultValue={nota?.dataEmissao}
        />
      </div>
      {admin ? (
        <SeletorFornecedor
          name={prefixo + "fornecedorId"}
          rotulo="Fornecedor"
          inicial={
            nota
              ? { id: nota.fornecedor.id, rotulo: nota.fornecedor.razaoSocial }
              : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm">Fornecedor: {nota?.fornecedor.razaoSocial}</p>
          <input
            type="hidden"
            name={prefixo + "fornecedorId"}
            value={nota?.fornecedor.id ?? ""}
          />
        </>
      )}
    </div>
  );
}
export function FormularioProcesso({
  registro,
  admin,
}: {
  registro?: ProcessoCompraDetalhe;
  admin: boolean;
}) {
  const criar = useCriarProcessoCompra();
  const alterar = useAlterarProcessoCompra();
  const [notas, setNotas] = useState<string[]>([]);
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        titulo={
          registro ? "Editar processo de compra" : "Novo processo de compra"
        }
        destino="/cadastros"
        idempotente={!registro}
        rotulo="Salvar processo"
        salvar={async (dados, chave) => {
          const valores = {
            numeroProcesso: opcional(dados, "numeroProcesso"),
            anoProcesso: ano(dados, "anoProcesso"),
            numeroEmpenho: opcional(dados, "numeroEmpenho"),
            anoEmpenho: ano(dados, "anoEmpenho"),
            valorTotal: opcional(dados, "valorTotal")?.replace(",", "."),
            observacao: opcional(dados, "observacao"),
          };
          if (registro)
            return (
              (
                await alterar.confirmar({
                  id: registro.id,
                  body: {
                    numeroProcesso: valores.numeroProcesso ?? null,
                    anoProcesso: valores.anoProcesso ?? null,
                    numeroEmpenho: valores.numeroEmpenho ?? null,
                    anoEmpenho: valores.anoEmpenho ?? null,
                    valorTotal: valores.valorTotal ?? null,
                    observacao: valores.observacao ?? null,
                  },
                })
              )?.dados ?? null
            );
          const anexos: File[] = [];
          const itens: z.input<typeof CriarNotaFiscalProcessoCompraSchema>[] =
            [];
          for (const id of dados.getAll("notaIds").map(String)) {
            const p = "nota-" + id + "-";
            const anexo = arquivo(dados, p + "anexo");
            itens.push({
              numeroNotaFiscal: texto(dados, p + "numeroNotaFiscal"),
              anoNotaFiscal: Number(texto(dados, p + "anoNotaFiscal")),
              dataEmissao: texto(dados, p + "dataEmissao"),
              fornecedorId: texto(dados, p + "fornecedorId"),
              ...(anexo ? { anexoIndice: anexos.length } : {}),
            });
            if (anexo) anexos.push(anexo);
          }
          return (
            (
              await criar.confirmar({
                dados: { ...valores, chaveIdempotencia: chave, notas: itens },
                anexos,
              })
            )?.dados ?? null
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Número do processo"
            name="numeroProcesso"
            maxLength={50}
            defaultValue={registro?.numeroProcesso ?? ""}
          />
          <Campo
            rotulo="Ano do processo"
            name="anoProcesso"
            type="number"
            min={1}
            max={9999}
            defaultValue={registro?.anoProcesso ?? ""}
          />
          <Campo
            rotulo="Número do empenho"
            name="numeroEmpenho"
            maxLength={50}
            defaultValue={registro?.numeroEmpenho ?? ""}
          />
          <Campo
            rotulo="Ano do empenho"
            name="anoEmpenho"
            type="number"
            min={1}
            max={9999}
            defaultValue={registro?.anoEmpenho ?? ""}
          />
        </div>
        <Campo
          rotulo="Valor total (R$)"
          name="valorTotal"
          inputMode="decimal"
          placeholder="Ex.: 1250,00"
          defaultValue={registro?.valorTotal ?? ""}
        />
        <div className="text-sm">
          <label htmlFor="observacao-processo">Observação</label>
          <textarea
            id="observacao-processo"
            name="observacao"
            maxLength={5000}
            defaultValue={registro?.observacao ?? ""}
            className={campo + " min-h-24"}
          />
        </div>
        {!registro && (
          <section className="grid gap-4 border-t border-[#dfe7f1] pt-4">
            <h3 className="font-semibold">Notas fiscais</h3>
            {admin ? (
              <>
                <p className="text-sm">
                  Inclua até 20 notas. Cada nota aceita um PDF opcional de até
                  10 MiB.
                </p>
                {notas.map((id, index) => (
                  <fieldset
                    key={id}
                    className="grid min-w-0 gap-3 rounded-md border border-[#dfe7f1] p-3"
                  >
                    <legend>Nota {index + 1}</legend>
                    <input type="hidden" name="notaIds" value={id} />
                    <NotaCampos prefixo={"nota-" + id + "-"} admin={admin} />
                    <Campo
                      rotulo={"PDF da nota " + (index + 1)}
                      name={"nota-" + id + "-anexo"}
                      type="file"
                      accept=".pdf,application/pdf"
                    />
                    <button
                      type="button"
                      className={botao}
                      onClick={() =>
                        setNotas((atual) => atual.filter((x) => x !== id))
                      }
                    >
                      Retirar nota {index + 1}
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className={botao}
                  disabled={notas.length >= 20}
                  onClick={() =>
                    setNotas((atual) => [...atual, crypto.randomUUID()])
                  }
                >
                  Adicionar nota fiscal
                </button>
              </>
            ) : (
              <p className="rounded-md bg-[#eef5ff] p-3 text-sm">
                Você pode cadastrar o processo sem notas. A inclusão de notas
                fiscais está disponível ao Administrador.
              </p>
            )}
          </section>
        )}
      </FormularioCadastro>
      {registro && <NotasProcesso registro={registro} admin={admin} />}
    </div>
  );
}
function NotasProcesso({
  registro,
  admin,
}: {
  registro: ProcessoCompraDetalhe;
  admin: boolean;
}) {
  const router = useRouter();
  const [selecionada, setSelecionada] = useState<
    NotaFiscalResumo | null | undefined
  >(undefined);
  const substituir = useSubstituirAnexoNotaFiscal();
  const remover = useRemoverAnexoNotaFiscal();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<string | null>(null);
  const pending = substituir.pending || remover.pending;
  async function executar(acao: () => Promise<unknown>) {
    setErro(null);
    setSucesso(null);
    try {
      const resultado = await acao();
      if (resultado === null) return;
      setExcluir(null);
      setSucesso("Anexo atualizado.");
      router.refresh();
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }
  return (
    <section className={cartao + " grid gap-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">Notas fiscais vinculadas</h2>
        {admin && (
          <button
            type="button"
            className={botao}
            onClick={() => setSelecionada(null)}
          >
            Adicionar nota fiscal
          </button>
        )}
      </div>
      {erro && (
        <p role="alert" className="text-sm text-red-800">
          {erro}
        </p>
      )}
      {sucesso && (
        <p role="status" className="text-sm">
          {sucesso}
        </p>
      )}
      {registro.notas.length === 0 && (
        <p className="text-sm">Nenhuma nota fiscal vinculada.</p>
      )}
      <ul className="grid gap-3">
        {registro.notas.map((nota) => (
          <li
            key={nota.id}
            className="grid min-w-0 gap-3 rounded-md border border-[#dfe7f1] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong>
                  {nota.numeroNotaFiscal}/{nota.anoNotaFiscal}
                </strong>
                <p className="text-sm">
                  {nota.fornecedor.razaoSocial} · Emissão:{" "}
                  {nota.dataEmissao.split("-").reverse().join("/")}
                </p>
              </div>
              <button
                type="button"
                className={botao}
                onClick={() => setSelecionada(nota)}
              >
                Editar nota {nota.numeroNotaFiscal}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {nota.anexoUrl ? (
                <a
                  className={botao}
                  href={"/api/backend/notas-fiscais/" + nota.id + "/anexo"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir PDF da nota {nota.numeroNotaFiscal}
                </a>
              ) : (
                <span>Sem anexo PDF</span>
              )}
              <label className={botao + " max-w-full flex-wrap"}>
                {nota.anexoUrl ? "Substituir PDF" : "Anexar PDF"}
                <input
                  aria-label={
                    (nota.anexoUrl
                      ? "Substituir PDF da nota "
                      : "Anexar PDF à nota ") + nota.numeroNotaFiscal
                  }
                  type="file"
                  accept=".pdf,application/pdf"
                  className="min-w-0 w-full max-w-full"
                  disabled={pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void executar(() =>
                        substituir.confirmar({ id: nota.id, anexo: file }),
                      );
                    e.target.value = "";
                  }}
                />
              </label>
              {nota.anexoUrl && (
                <button
                  type="button"
                  className={botao}
                  disabled={pending}
                  onClick={() => setExcluir(nota.id)}
                >
                  Remover PDF da nota {nota.numeroNotaFiscal}
                </button>
              )}
            </div>
            {excluir === nota.id && (
              <div className="grid gap-2">
                <p>Confirmar remoção do PDF desta nota?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={botao}
                    disabled={pending}
                    onClick={() =>
                      void executar(() => remover.confirmar(nota.id))
                    }
                  >
                    Confirmar remoção do PDF
                  </button>
                  <button
                    type="button"
                    className={botao}
                    disabled={pending}
                    onClick={() => setExcluir(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {selecionada !== undefined && (
        <div className="grid gap-2">
          <button
            type="button"
            className={botao}
            onClick={() => setSelecionada(undefined)}
          >
            Fechar formulário da nota
          </button>
          <FormularioNota
            key={
              selecionada
                ? JSON.stringify(
                    registro.notas.find((n) => n.id === selecionada.id) ??
                      selecionada,
                  )
                : "nova"
            }
            nota={selecionada ?? undefined}
            registro={registro}
            admin={admin}
            onSucesso={() => setSelecionada(undefined)}
          />
        </div>
      )}
    </section>
  );
}
function FormularioNota({
  nota,
  registro,
  admin,
  onSucesso,
}: {
  nota?: NotaFiscalResumo;
  registro: ProcessoCompraDetalhe;
  admin: boolean;
  onSucesso: () => void;
}) {
  const criar = useCriarNotaFiscal();
  const alterar = useAlterarNotaFiscal();
  return (
    <FormularioCadastro
      titulo={nota ? "Editar nota fiscal" : "Nova nota fiscal"}
      destino={"/cadastros?id=" + registro.id + "&salvo=1"}
      idempotente={!nota}
      rotulo="Salvar nota fiscal"
      onSucesso={onSucesso}
      salvar={async (dados, chave) => {
        const valores = {
          numeroNotaFiscal: texto(dados, "numeroNotaFiscal"),
          anoNotaFiscal: Number(texto(dados, "anoNotaFiscal")),
          dataEmissao: texto(dados, "dataEmissao"),
          fornecedorId: texto(dados, "fornecedorId"),
        };
        const resposta = nota
          ? await alterar.confirmar({ id: nota.id, body: valores })
          : admin
            ? await criar.confirmar({
                dados: {
                  ...valores,
                  processoCompraId: registro.id,
                  chaveIdempotencia: chave,
                },
                anexo: arquivo(dados, "anexo"),
              })
            : null;
        return resposta?.dados ?? null;
      }}
    >
      <NotaCampos nota={nota} admin={admin} />
      {!nota && (
        <Campo
          rotulo="Anexo PDF (até 10 MiB)"
          name="anexo"
          type="file"
          accept=".pdf,application/pdf"
        />
      )}
    </FormularioCadastro>
  );
}
