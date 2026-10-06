// src/api/reports.api.js
import { http } from "./axios.js";

/**
 * Backend:
 * POST /reports
 * {
 *   type: 'POST'|'USER'|'ANIMAL'|'OTHER',
 *   category: 'GENERAL'|'CSAE'|'PET_ABUSE',
 *   targetId: string,
 *   message: string,
 *   attachments?: string[]
 * }
 */
export async function createReport({ type, category, targetId, message, attachments } = {}) {
  const response = await http.post("/reports", {
    type,
    category,
    targetId,
    message,
    attachments: attachments || undefined,
  });
  return response.data;
}

export async function fetchMyReports({ page = 1, perPage = 10 } = {}) {
  const response = await http.get("/reports/me", { params: { page, perPage } });
  return response.data;
}
