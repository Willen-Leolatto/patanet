// src/features/policy/pages/ReportChannel.jsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldAlert, ArrowLeft, AlertTriangle, Info } from "lucide-react";

const REPORT_EMAIL = "dev.patanet@gmail.com";

function mailtoUrl({ subject, body }) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  return `mailto:${REPORT_EMAIL}?subject=${s}&body=${b}`;
}

export default function ReportChannel() {
  const navigate = useNavigate();

  const body = useMemo(() => {
    const now = new Date().toISOString();
    return [
      "Olá equipe PataNet,",
      "",
      "Quero denunciar uma situação de maus-tratos / crueldade / negligência grave contra um animal.",
      "",
      `Data/hora (UTC): ${now}`,
      "",
      "1) Local da ocorrência:",
      "- Cidade/UF:",
      "- Endereço completo (ou ponto de referência):",
      "- Se possível, coordenadas ou como chegar:",
      "",
      "2) O que aconteceu:",
      "- Descreva o que foi visto (datas, horários, frequência):",
      "- Quantos animais e quais (espécie/raça/cor):",
      "",
      "3) Envolvidos (se souber):",
      "- Nome/apelido do responsável:",
      "- Descrição física / placa de veículo:",
      "",
      "4) Provas e evidências:",
      "- Anexar fotos/vídeos (nítidos e, se possível, com data):",
      "- Testemunhas (se houver):",
      "",
      "5) Seu contato (opcional):",
      "- Nome:",
      "- Telefone/e-mail:",
      "",
      "Obrigado.",
    ].join("\n");
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <ShieldAlert className="h-4 w-4" /> Canal de denúncia (pets)
        </div>

        <h1 className="mt-3 text-2xl font-bold">Denúncia de maus-tratos</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Este canal é para denunciar <b>maus-tratos, crueldade ou negligência grave</b> contra animais.
          No momento, a denúncia é enviada por e-mail (sem upload direto no app).
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <b>Emergência / risco imediato?</b> Não confronte o agressor.
              Se houver perigo agora, acione a Polícia Militar: <b>190</b>.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" />
            <div>
              Para a denúncia ser investigada, é importante enviar o <b>máximo de detalhes</b>: endereço,
              datas/horários, descrição do ocorrido e, se possível, <b>fotos/vídeos</b>.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
            href={mailtoUrl({ subject: "[DENÚNCIA MAUS-TRATOS] PataNet", body })}
          >
            <Mail className="h-4 w-4" /> Enviar denúncia por e-mail
          </a>

          <Link
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
            to="/ajuda"
          >
            Ver políticas
          </Link>
        </div>

        <h2 className="text-lg font-semibold">Outros canais oficiais (sem sair do app)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>
            <b>Delegacia/Polícia Civil</b>: registre um boletim de ocorrência levando as provas.
          </li>
          <li>
            <b>Disque Denúncia</b>: <b>181</b> (disponível em muitos estados).
          </li>
          <li>
            <b>Ministério Público</b>: muitos estados aceitam denúncias por e-mail/site.
          </li>
          <li>
            <b>Animais silvestres/crimes ambientais</b>: IBAMA Linha Verde <b>0800 61 8080</b>.
          </li>
        </ul>

        <p className="mt-2 text-xs text-zinc-500">Última atualização: 12/03/2026</p>
      </section>
    </div>
  );
}
