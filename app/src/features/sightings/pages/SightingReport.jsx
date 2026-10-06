// src/features/sightings/pages/SightingReport.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  Square,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Heart,
  RotateCcw,
} from "lucide-react";

import { reportSighting } from "@/api/sightings.api.js";
import { useToast } from "@/components/ui/ToastProvider";

const MAX_RECORD_SECONDS = 15;
const GEO_TIMEOUT_MS = 4000; // não trava o envio esperando GPS indefinidamente

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (window.MediaRecorder?.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

/**
 * "Avistei um Pet" — fluxo público (sem login) para relatar um pet avistado
 * na rua: grava um vídeo curto (até 15s), captura o GPS automaticamente e
 * envia para o PataNet Vision assim que a gravação é encerrada, priorizando
 * velocidade (submissão em poucos segundos após parar de gravar).
 */
export default function SightingReport() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState("idle"); // idle | recording | submitting | result | error
  const [notes, setNotes] = useState("");
  const [seconds, setSeconds] = useState(MAX_RECORD_SECONDS);
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [geoStatus, setGeoStatus] = useState("locating"); // locating | ready | denied
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Captura o GPS assim que a tela abre, sem bloquear o resto do fluxo.
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoStatus("ready");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: 30000 }
    );
    return () => {
      try {
        navigator.geolocation.clearWatch?.(watchId);
      } catch {
        // best-effort: nada a fazer se a API de geolocalização não suportar clearWatch
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopCameraTracks() {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => handleRecordingStopped(mimeType || "video/webm");
      recorderRef.current = recorder;
      recorder.start();

      setSeconds(MAX_RECORD_SECONDS);
      setStep("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            stopRecording();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setErrorMsg(
        "Não foi possível acessar a câmera/microfone. Verifique as permissões do app."
      );
      setStep("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    stopCameraTracks();
  }

  async function handleRecordingStopped(mimeType) {
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (!blob.size) {
      setErrorMsg("A gravação ficou vazia. Tente novamente.");
      setStep("error");
      return;
    }

    setStep("submitting");
    try {
      const resp = await reportSighting({
        videoBlob: blob,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        notes: notes.trim() || undefined,
      });
      setResult(resp);
      setStep("result");
    } catch (e) {
      console.error(e);
      setErrorMsg(
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "Não foi possível enviar o relato agora. Tente novamente."
      );
      setStep("error");
      toast.error("Falha ao enviar o relato.");
    }
  }

  function resetFlow() {
    setResult(null);
    setErrorMsg("");
    setNotes("");
    setStep("idle");
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <header className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
          <Heart className="h-4 w-4" /> Avistei um Pet
        </div>
        <h1 className="mt-3 text-2xl font-bold">Encontrou um pet na rua?</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Grave um vídeo curto (até {MAX_RECORD_SECONDS}s). Não é necessário fazer login —
          usamos o vídeo para tentar identificar o tutor e avaliar o estado do animal.
        </p>
      </header>

      <div className="mb-3 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <MapPin className="h-3.5 w-3.5" />
        {geoStatus === "locating" && "Obtendo sua localização…"}
        {geoStatus === "ready" && "Localização capturada automaticamente."}
        {geoStatus === "denied" && "Localização indisponível (relato será enviado sem GPS)."}
      </div>

      {(step === "idle" || step === "error") && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {step === "error" && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Observação rápida (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: cão de porte médio, coleira azul, próximo à praça…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <button
            type="button"
            onClick={startRecording}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            <Video className="h-4 w-4" /> Gravar vídeo ({MAX_RECORD_SECONDS}s)
          </button>
        </div>
      )}

      {step === "recording" && (
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-black p-2 shadow-sm dark:border-zinc-800">
          <div className="relative overflow-hidden rounded-xl">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[3/4] w-full bg-black object-cover"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {seconds}s
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Square className="h-4 w-4" /> Parar e enviar agora
          </button>
        </div>
      )}

      {step === "submitting" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-[#f77904]" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Enviando relato e analisando o vídeo…
          </p>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Relato enviado! Analisamos {result.frames_analyzed ?? "alguns"} frame(s) do vídeo.
            </p>
          </div>

          {Array.isArray(result.matches) && result.matches.length > 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 text-sm font-semibold">Possíveis correspondências</div>
              <ul className="space-y-1.5 text-sm">
                {result.matches.map((m, i) => (
                  <li key={m.pet_id || i} className="flex items-center justify-between">
                    <span>Pet #{m.pet_id}</span>
                    <span className="text-xs opacity-70">
                      {Math.round((m.similarity_score || 0) * 100)}% de similaridade
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm opacity-80 dark:border-zinc-800 dark:bg-zinc-900">
              Nenhum pet cadastrado corresponde a este vídeo ainda.
            </div>
          )}

          {result.abuse_assessment?.abuse_suspected && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4" /> Possíveis indícios de maus-tratos
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(result.abuse_assessment.indicators || []).map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>
          )}

          {result.vet_report?.summary && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-1 text-sm font-semibold">Laudo</div>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
                {result.vet_report.summary}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={resetFlow}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4" /> Fazer outro relato
          </button>
        </div>
      )}
    </div>
  );
}
