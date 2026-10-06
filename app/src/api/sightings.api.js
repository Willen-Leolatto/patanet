// src/api/sightings.api.js
//
// Cliente para o microsserviço PataNet Vision (patanet-vision/), usado pelo
// fluxo "Avistei um Pet" (sem login). Usa uma instância própria do axios —
// e não a `http` de src/api/axios.js — porque este serviço não exige
// autenticação e fica em um host diferente da API principal; não faz
// sentido anexar o Bearer token do usuário a essa chamada.
import axios from "axios";

const visionHttp = axios.create({
  baseURL: import.meta.env.VITE_VISION_API_URL || "http://localhost:8000",
});

/**
 * Envia o vídeo gravado (até 15s) + localização para análise no PataNet
 * Vision: POST /internal/sightings/analyze (multipart/form-data).
 *
 * Retorna { frames_analyzed, matches, hsv_findings, abuse_assessment, vet_report }.
 */
export async function reportSighting({ videoBlob, latitude, longitude, notes }) {
  const fd = new FormData();
  fd.append("media_kind", "video");
  fd.append("media", videoBlob, "sighting.webm");
  if (latitude != null) fd.append("latitude", String(latitude));
  if (longitude != null) fd.append("longitude", String(longitude));
  if (notes) fd.append("notes", notes);

  const response = await visionHttp.post("/internal/sightings/analyze", fd);
  return response.data;
}
