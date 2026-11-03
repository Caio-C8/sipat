"use client";
import { FormularioCadastro } from "./formulario-cadastro";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ComissaoDetalhe,
  MembroInicialComissaoInput,
  AlterarComissaoBodyInput,
} from "@repo/contracts";
import {
  useCriarComissao,
  useAlterarComissao,
  useAdicionarMembroComissao,
  useAlterarMembroComissao,
  useRemoverMembroComissao,
} from "../api/hooks";
import {
  Campo,
  Descricao,
  texto,
  opcional,
  campo,
  cartao,
  botao,
  mensagemErro,
} from "./cadastro-ui";
import { SeletorResponsavel } from "./seletor-cadastro";
type MembroLocal = MembroInicialComissaoInput & { nome: string };

function EscolhaMembro({
  adicionar,
}: {
  adicionar: (membro: MembroLocal) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <SeletorResponsavel
        name="integranteId"
        rotulo="Funcionário"
        required={false}
      />
      <label className="text-sm">
        Função na comissão
        <select className={campo} name="papel">
          <option value="MEMBRO">Membro</option>
          <option value="PRESIDENTE">Presidente</option>
        </select>
      </label>
      {erro && (
        <p role="alert" className="text-sm text-red-800">
          {erro}
        </p>
      )}
      <button
        type="button"
        className={botao}
        onClick={(e) => {
          const root = e.currentTarget.parentElement!;
          const select = root.querySelector<HTMLSelectElement>(
            'select[name="integranteId"]',
          )!;
          const papel =
            root.querySelector<HTMLSelectElement>('select[name="papel"]')!
              .value === "PRESIDENTE"
              ? "PRESIDENTE"
              : "MEMBRO";
          if (!select.value) {
            setErro("Selecione um funcionário.");
            return;
          }
          setErro(null);
          adicionar({
            responsavelId: select.value,
            nome: select.selectedOptions[0]?.text ?? "",
            papel,
          });
        }}
      >
        Adicionar funcionário
      </button>
    </div>
  );
}
export function FormularioComissao({
  registro,
}: {
  registro?: ComissaoDetalhe;
}) {
  const criar = useCriarComissao();
  const alterar = useAlterarComissao();
  const [membros, setMembros] = useState<MembroLocal[]>([]);
  const [erroMembros, setErroMembros] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        titulo={registro ? "Editar comissão" : "Nova comissão"}
        destino="/cadastros/comissoes"
        idempotente={!registro}
        rotulo="Salvar comissão"
        salvar={async (dados, chave) => {
          const valores = {
            nome: texto(dados, "nome"),
            descricao: opcional(dados, "descricao"),
            numeroAto: opcional(dados, "numeroAto"),
            dataVigenciaInicio: texto(dados, "dataVigenciaInicio"),
            dataVigenciaFim: texto(dados, "dataVigenciaFim"),
          };
          if (registro) {
            const body: AlterarComissaoBodyInput = {};
            if (valores.nome !== registro.nome) body.nome = valores.nome;
            if ((valores.descricao ?? null) !== registro.descricao)
              body.descricao = valores.descricao ?? null;
            if ((valores.numeroAto ?? null) !== registro.numeroAto)
              body.numeroAto = valores.numeroAto ?? null;
            if (valores.dataVigenciaInicio !== registro.dataVigenciaInicio)
              body.dataVigenciaInicio = valores.dataVigenciaInicio;
            if (valores.dataVigenciaFim !== registro.dataVigenciaFim)
              body.dataVigenciaFim = valores.dataVigenciaFim;
            return (
              (await alterar.confirmar({ id: registro.id, body }))?.dados ??
              null
            );
          }
          const membrosSalvos = JSON.parse(
            texto(dados, "membros"),
          ) as MembroInicialComissaoInput[];
          return (
            (
              await criar.confirmar({
                ...valores,
                chaveIdempotencia: chave,
                membros: membrosSalvos,
              })
            )?.dados ?? null
          );
        }}
      >
        <Campo
          rotulo="Nome da comissão"
          name="nome"
          required
          maxLength={150}
          defaultValue={registro?.nome}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Início da vigência"
            type="date"
            name="dataVigenciaInicio"
            required
            defaultValue={registro?.dataVigenciaInicio}
          />
          <Campo
            rotulo="Fim da vigência"
            type="date"
            name="dataVigenciaFim"
            required
            defaultValue={registro?.dataVigenciaFim}
          />
        </div>
        <Campo
          rotulo="Portaria / ato de designação"
          name="numeroAto"
          maxLength={100}
          defaultValue={registro?.numeroAto ?? ""}
        />
        <Descricao valor={registro?.descricao} />
        {registro ? (
          <p className="rounded-md bg-[#eef5ff] p-3 text-sm">
            Após o primeiro uso patrimonial, apenas nome e descrição podem ser
            alterados. A API verifica essa restrição ao salvar.
          </p>
        ) : (
          <section className="grid gap-3 border-t border-[#dfe7f1] pt-4">
            <h3 className="font-semibold">Membros da comissão</h3>
            <input
              type="hidden"
              name="membros"
              value={JSON.stringify(
                membros.map(({ responsavelId, papel }) => ({
                  responsavelId,
                  papel,
                })),
              )}
            />
            {erroMembros && (
              <p role="alert" className="text-sm text-red-800">
                {erroMembros}
              </p>
            )}
            <EscolhaMembro
              adicionar={(membro) => {
                if (membros.length >= 50) {
                  setErroMembros("A comissão permite até 50 integrantes.");
                  return;
                }
                if (
                  membros.some((m) => m.responsavelId === membro.responsavelId)
                ) {
                  setErroMembros("O funcionário já foi selecionado.");
                  return;
                }
                if (
                  membro.papel === "PRESIDENTE" &&
                  membros.some((m) => m.papel === "PRESIDENTE")
                ) {
                  setErroMembros("A comissão permite apenas um presidente.");
                  return;
                }
                setErroMembros(null);
                setMembros((atual) => [...atual, membro]);
              }}
            />
            {membros.length === 0 && (
              <p className="text-sm">Nenhum membro selecionado.</p>
            )}
            <ul className="grid gap-2">
              {membros.map((m) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#dfe7f1] p-3 text-sm"
                  key={m.responsavelId}
                >
                  <span>
                    {m.nome} ·{" "}
                    {m.papel === "PRESIDENTE" ? "Presidente" : "Membro"}
                  </span>
                  <button
                    type="button"
                    className={botao}
                    onClick={() =>
                      setMembros((atual) =>
                        atual.filter(
                          (x) => x.responsavelId !== m.responsavelId,
                        ),
                      )
                    }
                  >
                    Remover {m.nome}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </FormularioCadastro>
      {registro && <MembrosComissao registro={registro} />}
    </div>
  );
}
function MembrosComissao({ registro }: { registro: ComissaoDetalhe }) {
  const router = useRouter();
  const adicionar = useAdicionarMembroComissao();
  const alterar = useAlterarMembroComissao();
  const remover = useRemoverMembroComissao();
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<string | null>(null);
  const pending = adicionar.pending || alterar.pending || remover.pending;
  async function executar(acao: () => Promise<unknown>) {
    setErro(null);
    setMensagem(null);
    try {
      const resultado = await acao();
      if (resultado === null) return;
      setExcluir(null);
      setMensagem("Composição atualizada.");
      router.refresh();
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }
  return (
    <section className={cartao + " grid gap-4"}>
      <h2 className="text-base font-bold">Membros da comissão</h2>
      {erro && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="text-sm">
          {mensagem}
        </p>
      )}
      <fieldset disabled={pending} className="grid min-w-0 gap-4">
        <EscolhaMembro
          adicionar={(m) => {
            void executar(() =>
              adicionar.confirmar({
                id: registro.id,
                body: { responsavelId: m.responsavelId, papel: m.papel },
              }),
            );
          }}
        />
        {registro.membros.length === 0 && (
          <p className="text-sm">Nenhum integrante cadastrado.</p>
        )}
        <ul className="grid gap-3">
          {registro.membros.map((m) => (
            <li
              key={m.id}
              className="grid gap-3 rounded-md border border-[#dfe7f1] p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <div className="text-sm">
                {m.responsavel.nome}
                <small className="block">
                  {m.responsavel.matricula} ·{" "}
                  {m.responsavel.ativo ? "Ativo" : "Inativo"}
                </small>
              </div>
              <label className="text-sm">
                Papel de {m.responsavel.nome}
                <select
                  className={campo}
                  value={m.papel}
                  disabled={!m.responsavel.ativo}
                  onChange={(e) => {
                    const papel =
                      e.target.value === "PRESIDENTE" ? "PRESIDENTE" : "MEMBRO";
                    void executar(() =>
                      alterar.confirmar({
                        comissaoId: registro.id,
                        membroComissaoId: m.id,
                        body: { papel },
                      }),
                    );
                  }}
                >
                  <option value="MEMBRO">Membro</option>
                  <option value="PRESIDENTE">Presidente</option>
                </select>
              </label>
              <button
                className={botao}
                type="button"
                onClick={() => setExcluir(m.id)}
              >
                Remover {m.responsavel.nome}
              </button>
              {excluir === m.id && (
                <div className="grid gap-2 sm:col-span-3">
                  <p className="text-sm">
                    Confirmar remoção do integrante {m.responsavel.nome}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      className={botao}
                      type="button"
                      onClick={() =>
                        void executar(() =>
                          remover.confirmar({
                            comissaoId: registro.id,
                            membroComissaoId: m.id,
                          }),
                        )
                      }
                    >
                      Confirmar remoção
                    </button>
                    <button
                      className={botao}
                      type="button"
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
      </fieldset>
    </section>
  );
}
