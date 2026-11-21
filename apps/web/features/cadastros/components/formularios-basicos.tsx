"use client";
import {
  FormularioCadastro,
  type ContextoFormularioCadastro,
} from "./formulario-cadastro";
import type {
  EspecieDetalhe,
  ResponsavelDetalhe,
  SetorDetalhe,
} from "@repo/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  useCriarEspecie,
  useAlterarEspecie,
  useCriarResponsavel,
  useAlterarResponsavel,
  useAlterarSituacaoResponsavel,
  useCriarSetor,
  useAlterarSetor,
  useAlterarSituacaoSetor,
} from "../api/hooks";
import { Campo, Descricao, texto, opcional, mensagemErro } from "./cadastro-ui";
import { SeletorNatureza, SeletorResponsavel } from "./seletor-cadastro";
export { FormularioNatureza } from "./natureza-form";

export function FormularioEspecie({ registro }: { registro?: EspecieDetalhe }) {
  const criar = useCriarEspecie();
  const alterar = useAlterarEspecie();
  return (
    <FormularioCadastro
      titulo={registro ? "Editar espécie" : "Nova espécie"}
      destino="/cadastros/especies"
      rotulo="Salvar espécie"
      salvar={async (dados) => {
        const body = {
          nome: texto(dados, "nome"),
          naturezaId: texto(dados, "naturezaId"),
          descricao: registro
            ? (opcional(dados, "descricao") ?? null)
            : opcional(dados, "descricao"),
        };
        const resposta = registro
          ? await alterar.confirmar({ id: registro.id, body })
          : await criar.confirmar({
              ...body,
              descricao: body.descricao ?? undefined,
            });
        return resposta?.dados ?? null;
      }}
    >
      <Campo
        rotulo="Nome da espécie"
        name="nome"
        required
        maxLength={100}
        defaultValue={registro?.nome}
      />
      <SeletorNatureza
        name="naturezaId"
        rotulo="Natureza vinculada"
        inicial={
          registro
            ? { id: registro.natureza.id, rotulo: registro.natureza.nome }
            : undefined
        }
      />
      <Descricao valor={registro?.descricao} />
    </FormularioCadastro>
  );
}
export function SituacaoCadastro({
  ativo,
  pending,
  alterar,
}: {
  ativo: boolean;
  pending: boolean;
  alterar: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="grid gap-3 rounded-md border border-border p-4 text-sm">
      <p aria-live="polite">
        Situação atual: <strong>{ativo ? "Ativo" : "Inativo"}</strong>
      </p>
      {erro ? (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant={ativo ? "destructive" : "outline"}>
            {ativo ? "Inativar" : "Ativar"} cadastro
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ativo ? "Inativar" : "Ativar"} cadastro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A situação será alterada, mas os vínculos e o histórico existentes
              serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={ativo ? "destructive" : "default"}
              disabled={pending}
              onClick={async (event) => {
                event.preventDefault();
                setErro(null);
                try {
                  const resultado = await alterar();
                  if (resultado === null) return;
                  setConfirmar(false);
                  toast.success("Situação atualizada com sucesso.");
                  router.refresh();
                } catch (e) {
                  setErro(mensagemErro(e));
                  setConfirmar(false);
                }
              }}
            >
              {pending ? "Atualizando…" : "Confirmar situação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export function FormularioResponsavel({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: ResponsavelDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const [versao, setVersao] = useState(0);
  const criar = useCriarResponsavel();
  const alterar = useAlterarResponsavel();
  const situacao = useAlterarSituacaoResponsavel();
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        key={versao}
        titulo={registro ? "Editar responsável" : "Novo responsável"}
        destino="/cadastros/responsaveis"
        destinoSucesso={(id) =>
          registro
            ? `/cadastros/responsaveis/${encodeURIComponent(id)}?salvo=1`
            : "/cadastros/responsaveis?salvo=1"
        }
        mensagemSucesso="Responsável salvo com sucesso."
        contexto={contexto}
        onCancelar={onCancelar}
        onRestaurar={() => setVersao((atual) => atual + 1)}
        onSucesso={onSucesso}
        navegarAposSucesso={contexto !== "modal"}
        rotulo="Salvar responsável"
        salvar={async (dados) => {
          const body = {
            nome: texto(dados, "nome"),
            matricula: texto(dados, "matricula"),
          };
          const resposta = registro
            ? await alterar.confirmar({ id: registro.id, body })
            : await criar.confirmar(body);
          return resposta?.dados ?? null;
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
          <Campo
            rotulo="Matrícula"
            name="matricula"
            required
            maxLength={20}
            defaultValue={registro?.matricula}
          />
          <Campo
            rotulo="Nome completo"
            name="nome"
            required
            maxLength={100}
            defaultValue={registro?.nome}
          />
        </div>
        <p className="rounded-md bg-[#eef5ff] p-4 text-sm">
          Este cadastro disponibiliza o funcionário para assumir a
          responsabilidade pelos bens e participar das comissões.
        </p>
      </FormularioCadastro>
      {registro && (
        <SituacaoCadastro
          ativo={registro.ativo}
          pending={situacao.pending}
          alterar={() =>
            situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
          }
        />
      )}
    </div>
  );
}
export function FormularioSetor({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: SetorDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const [versao, setVersao] = useState(0);
  const criar = useCriarSetor();
  const alterar = useAlterarSetor();
  const situacao = useAlterarSituacaoSetor();
  const destino = registro
    ? "/cadastros/setores/" + registro.id
    : "/cadastros/setores";
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        key={versao}
        titulo={registro ? "Editar setor" : "Novo setor"}
        destino={destino}
        rotaDetalhe={!registro}
        destinoSucesso={(id) =>
          registro
            ? `/cadastros/setores/${encodeURIComponent(id)}?salvo=1`
            : "/cadastros/setores?salvo=1"
        }
        mensagemSucesso="Setor salvo com sucesso."
        contexto={contexto}
        onCancelar={onCancelar}
        onRestaurar={() => setVersao((atual) => atual + 1)}
        onSucesso={onSucesso}
        navegarAposSucesso={contexto !== "modal"}
        idempotente={!registro}
        rotulo="Salvar setor"
        salvar={async (dados, chave) => {
          const body = {
            nome: texto(dados, "nome"),
            sala: opcional(dados, "sala"),
            ramal: opcional(dados, "ramal"),
            responsavelId: texto(dados, "responsavelId"),
          };
          const resposta = registro
            ? await alterar.confirmar({
                id: registro.id,
                body: {
                  ...body,
                  sala: body.sala ?? null,
                  ramal: body.ramal ?? null,
                },
              })
            : await criar.confirmar({ ...body, chaveIdempotencia: chave });
          return resposta?.dados ?? null;
        }}
      >
        <Campo
          rotulo="Nome do setor"
          name="nome"
          required
          maxLength={100}
          defaultValue={registro?.nome}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Sala"
            name="sala"
            maxLength={50}
            defaultValue={registro?.sala ?? ""}
          />
          <Campo
            rotulo="Ramal"
            name="ramal"
            maxLength={10}
            defaultValue={registro?.ramal ?? ""}
          />
        </div>
        <SeletorResponsavel
          name="responsavelId"
          rotulo="Responsável"
          inicial={
            registro
              ? {
                  id: registro.responsavel.id,
                  rotulo:
                    registro.responsavel.nome +
                    " · " +
                    registro.responsavel.matricula +
                    (registro.responsavel.ativo ? "" : " (inativo)"),
                }
              : undefined
          }
        />
      </FormularioCadastro>
      {registro && (
        <SituacaoCadastro
          ativo={registro.ativo}
          pending={situacao.pending}
          alterar={() =>
            situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
          }
        />
      )}
    </div>
  );
}
