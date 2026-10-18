import {
  EmailUsuarioSchema,
  NomeUsuarioSchema,
  SenhaInicialUsuarioSchema,
} from "@repo/contracts";
import { createDatabaseClient } from "@repo/database";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { SenhaHasher } from "../common/security/senha-hasher";
import {
  provisionarPrimeiroAdministrador,
  ProvisionamentoAdministradorRecusadoError,
} from "../modules/auth/provisionamento-admin";

function exigirTerminalInterativo(): void {
  if (process.argv.length > 2) {
    throw new Error(
      "O provisionamento não aceita argumentos de linha de comando.",
    );
  }

  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error(
      "O provisionamento exige um terminal interativo seguro para ler a senha.",
    );
  }
}

function lerSenhaOculta(mensagem: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let senha = "";

    const limpar = () => {
      stdin.off("data", aoReceberDados);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const concluir = () => {
      limpar();
      stdout.write("\n");
      resolve(senha);
    };

    const aoReceberDados = (dados: Buffer | string) => {
      for (const caractere of String(dados)) {
        if (caractere === "\u0003") {
          limpar();
          stdout.write("\n");
          reject(new Error("Provisionamento cancelado."));
          return;
        }

        if (caractere === "\r" || caractere === "\n") {
          concluir();
          return;
        }

        if (caractere === "\u0008" || caractere === "\u007f") {
          senha = Array.from(senha).slice(0, -1).join("");
          continue;
        }

        if (caractere >= " " && caractere !== "\u007f") {
          if (Array.from(senha).length <= 128) senha += caractere;
        }
      }
    };

    stdout.write(mensagem);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", aoReceberDados);
  });
}

async function main(): Promise<void> {
  exigirTerminalInterativo();

  const terminal = createInterface({ input: stdin, output: stdout });
  const nomeInformado = await terminal.question("Nome do administrador: ");
  const emailInformado = await terminal.question("E-mail do administrador: ");
  terminal.close();

  const senha = await lerSenhaOculta("Senha: ");
  const confirmacaoSenha = await lerSenhaOculta("Confirme a senha: ");

  if (senha !== confirmacaoSenha) {
    throw new Error("A confirmação da senha não corresponde.");
  }

  const nome = NomeUsuarioSchema.parse(nomeInformado);
  const email = EmailUsuarioSchema.parse(emailInformado);
  const senhaValidada = SenhaInicialUsuarioSchema.parse(senha);
  const database = createDatabaseClient();

  try {
    await database.$connect();
    await provisionarPrimeiroAdministrador(database, new SenhaHasher(), {
      nome,
      email,
      senha: senhaValidada,
    });
    console.info("Primeiro administrador provisionado com sucesso.");
  } finally {
    await database.$disconnect();
  }
}

void main().catch((erro: unknown) => {
  if (erro instanceof ProvisionamentoAdministradorRecusadoError) {
    console.error(erro.message);
  } else if (erro instanceof Error) {
    console.error(`Provisionamento não concluído: ${erro.message}`);
  } else {
    console.error("Provisionamento não concluído.");
  }

  process.exitCode = 1;
});
