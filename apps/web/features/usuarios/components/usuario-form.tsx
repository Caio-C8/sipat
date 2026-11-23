"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UsuarioDetalhe } from "@repo/contracts";
import { toast } from "sonner";
import { SelectField } from "@/components/shared/form-fields";
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
  Campo,
  mensagemErro,
  texto,
} from "@/features/cadastros/components/cadastro-ui";
import { useCadastroFieldError } from "@/features/cadastros/components/cadastro-field-errors";
import { FormularioCadastro } from "@/features/cadastros/components/formulario-cadastro";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesUsuarios } from "../api/usuario-operations";

const operacoes = criarOperacoesUsuarios(browserApiClient);
type PerfilUsuario = "ADMINISTRADOR" | "DIRETOR_PATRIMONIO";

function PerfilUsuarioField({
  value,
  onValueChange,
}: {
  value: PerfilUsuario;
  onValueChange: (value: PerfilUsuario) => void;
}) {
  const error = useCadastroFieldError("perfil");
  return (
    <SelectField
      id="perfil-usuario"
      name="perfil"
      label="Perfil de acesso"
      required
      value={value}
      onValueChange={(next) => onValueChange(next as PerfilUsuario)}
      error={error}
      options={[
        {
          value: "DIRETOR_PATRIMONIO",
          label: "Diretor de patrimônio",
        },
        { value: "ADMINISTRADOR", label: "Administrador" },
      ]}
    />
  );
}

export function UsuarioForm({
  usuario,
  contexto = "pagina",
  onCancelar,
  onSucesso,
}: {
  usuario?: UsuarioDetalhe;
  contexto?: "pagina" | "modal";
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const perfilInicial = usuario?.perfil ?? "DIRETOR_PATRIMONIO";
  const [perfil, setPerfil] = useState<PerfilUsuario>(perfilInicial);

  return (
    <FormularioCadastro
      titulo={usuario ? "Editar usuário" : "Novo usuário"}
      contexto={
        contexto === "modal"
          ? "modal"
          : usuario
            ? "pagina-edicao"
            : "pagina-criacao"
      }
      destino="/usuarios"
      rotaDetalhe
      destinoSucesso={(id) => `/usuarios/${id}?salvo=1`}
      rotulo={usuario ? "Salvar alterações" : "Cadastrar usuário"}
      mensagemSucesso={
        contexto === "modal" ? "Usuário salvo com sucesso." : undefined
      }
      navegarAposSucesso={contexto !== "modal"}
      onCancelar={onCancelar}
      onSucesso={onSucesso}
      onRestaurar={() => setPerfil(perfilInicial)}
      salvar={async (dados) => {
        const body = {
          nome: texto(dados, "nome"),
          email: texto(dados, "email"),
          perfil: texto(dados, "perfil") as PerfilUsuario,
        };
        if (usuario) {
          await operacoes.alterar(usuario.id, body);
          return { id: usuario.id };
        }
        const resposta = await operacoes.criar({
          ...body,
          senha: String(dados.get("senha") ?? ""),
        });
        return resposta.dados;
      }}
    >
      <Campo
        rotulo="Nome completo"
        name="nome"
        defaultValue={usuario?.nome ?? ""}
        maxLength={100}
        autoComplete="name"
        required
      />
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        defaultValue={usuario?.email ?? ""}
        maxLength={150}
        autoComplete="email"
        required
      />
      {!usuario ? (
        <div className="grid gap-1">
          <Campo
            rotulo="Senha inicial"
            name="senha"
            type="password"
            autoComplete="new-password"
            aria-describedby="senha-inicial-description"
            required
          />
          <p
            id="senha-inicial-description"
            className="text-sm text-muted-foreground"
          >
            O usuário deverá redefinir esta senha no primeiro acesso.
          </p>
        </div>
      ) : null}
      <PerfilUsuarioField value={perfil} onValueChange={setPerfil} />
    </FormularioCadastro>
  );
}

export function SituacaoUsuario({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function alternar() {
    setErro(null);
    setOcupado(true);
    try {
      await operacoes.alterarSituacao(usuario.id, !usuario.ativo);
      setConfirmar(false);
      toast.success(
        usuario.ativo
          ? "Usuário inativado com sucesso."
          : "Usuário ativado com sucesso.",
      );
      router.refresh();
    } catch (falha) {
      setErro(mensagemErro(falha));
      setConfirmar(false);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section
      className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm"
      aria-labelledby="situacao-usuario"
    >
      <h2 id="situacao-usuario" className="font-semibold">
        Situação do usuário
      </h2>
      <p aria-live="polite">
        Situação atual: <strong>{usuario.ativo ? "Ativo" : "Inativo"}</strong>
      </p>
      {erro ? (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant={usuario.ativo ? "destructive" : "outline"}
            disabled={ocupado}
          >
            {usuario.ativo ? "Inativar usuário" : "Ativar usuário"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {usuario.ativo ? "Inativar" : "Ativar"} usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {usuario.ativo
                ? `O acesso de ${usuario.nome} será bloqueado e as sessões atuais serão encerradas. O histórico será preservado.`
                : `O acesso de ${usuario.nome} será reativado sem alterar o histórico.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={usuario.ativo ? "destructive" : "default"}
              disabled={ocupado}
              onClick={(event) => {
                event.preventDefault();
                void alternar();
              }}
            >
              {ocupado ? "Atualizando…" : "Confirmar situação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
