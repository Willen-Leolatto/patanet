import React, { useEffect, useMemo, useState } from "react";
import {
  myOrgs,
  createOrg,
  orgAnimals,
  carePending,
  approveCare,
  pendingForOrg,
  vetAcceptCare,
} from "@/api/orgs.api.js";
import {
  listProcedures,
  createProcedure,
  myAgenda,
  orgAppointments,
  vetAcceptAppointment,
  vetDeclineAppointment,
  vetProposeTime,
  setAppointmentProcedure,
} from "@/api/vet.api.js";
import { http } from "@/api/axios.js";

function fmt(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return String(date);
  }
}

export default function VetDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [animals, setAnimals] = useState([]);

  // care
  const [pendingTutor, setPendingTutor] = useState([]);
  const [pendingOrg, setPendingOrg] = useState([]);

  // procedures
  const [procedures, setProcedures] = useState([]);
  const [procName, setProcName] = useState("");
  const [procDur, setProcDur] = useState(30);

  // agenda
  const [agenda, setAgenda] = useState([]);

  // consultas (solicitações + filtros)
  const [appointments, setAppointments] = useState([]);
  const [apptStatusFilter, setApptStatusFilter] = useState("REQUESTED");
  const [proposeDraft, setProposeDraft] = useState({});

  // propose / set procedure (MVP manual)
  const [apptId, setApptId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [procId, setProcId] = useState("");

  // search
  const [search, setSearch] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === orgId),
    [orgs, orgId]
  );

  async function reloadOrgs() {
    const list = await myOrgs();
    const arr = Array.isArray(list) ? list : [];
    setOrgs(arr);
    if (!orgId && arr?.[0]?.id) setOrgId(arr[0].id);
  }

  async function reloadOrgData(nextOrgId) {
    if (!nextOrgId) return;

    try {
      const a = await orgAnimals(nextOrgId);
      setAnimals(Array.isArray(a) ? a : []);
    } catch {
      setAnimals([]);
    }

    try {
      const p = await pendingForOrg(nextOrgId);
      setPendingOrg(Array.isArray(p) ? p : []);
    } catch {
      setPendingOrg([]);
    }

    try {
      const procs = await listProcedures(nextOrgId);
      setProcedures(Array.isArray(procs) ? procs : []);
    } catch {
      setProcedures([]);
    }

    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 7);
      const items = await myAgenda(nextOrgId, {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setAgenda(Array.isArray(items) ? items : []);
    } catch {
      setAgenda([]);
    }

    try {
      const list = await orgAppointments(nextOrgId, {
        status: apptStatusFilter || undefined,
      });
      setAppointments(Array.isArray(list) ? list : []);
    } catch {
      setAppointments([]);
    }
  }

  useEffect(() => {
    reloadOrgs().catch(() => {});
  }, []);

  useEffect(() => {
    if (!orgId) return;
    reloadOrgData(orgId).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const list = await orgAppointments(orgId, {
          status: apptStatusFilter || undefined,
        });
        setAppointments(Array.isArray(list) ? list : []);
      } catch {
        setAppointments([]);
      }
    })();
  }, [orgId, apptStatusFilter]);

  useEffect(() => {
    (async () => {
      try {
        const p = await carePending();
        setPendingTutor(Array.isArray(p) ? p : []);
      } catch {
        setPendingTutor([]);
      }
    })();
  }, []);

  async function quickCreateOrg() {
    setErr("");
    setCreating(true);
    try {
      const slug = `vet-${Date.now()}`;
      await createOrg({ type: "CLINIC", name: "Minha Clínica", slug });
      await reloadOrgs();
    } catch (e) {
      setErr(e?.response?.data?.message || "Não consegui criar a organização.");
    } finally {
      setCreating(false);
    }
  }

  async function approveAsTutor(link) {
    await approveCare(link.animalId, link.id);
    const p = await carePending();
    setPendingTutor(Array.isArray(p) ? p : []);
  }

  async function acceptCareAsVet(link) {
    if (!orgId) return;
    await vetAcceptCare(orgId, link.id);
    await reloadOrgData(orgId);
  }

  async function addProcedure() {
    if (!orgId) return;
    setErr("");
    try {
      await createProcedure(orgId, {
        name: procName.trim(),
        durationMinutes: Number(procDur) || 30,
      });
      setProcName("");
      const procs = await listProcedures(orgId);
      setProcedures(Array.isArray(procs) ? procs : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Falha ao criar procedimento.");
    }
  }

  function toISOStringSafe(value) {
    if (!value) return "";
    try {
      // aceita datetime-local ou ISO
      const d = new Date(value);
      if (!Number.isFinite(d.getTime())) return "";
      return d.toISOString();
    } catch {
      return "";
    }
  }

  function setDraft(apptId, patch) {
    setProposeDraft((prev) => ({
      ...(prev || {}),
      [apptId]: { ...(prev?.[apptId] || {}), ...patch },
    }));
  }

  async function acceptAppointment() {
    if (!apptId) return;
    await vetAcceptAppointment(apptId);
  }

  async function declineAppointment() {
    if (!apptId) return;
    await vetDeclineAppointment(apptId);
  }

  async function proposeTime() {
    setErr("");
    try {
      await vetProposeTime(apptId, { startAt, endAt });
      await reloadOrgData(orgId);
    } catch (e) {
      setErr(e?.response?.data?.message || "Não consegui propor horário.");
    }
  }

  async function assignProcedure() {
    setErr("");
    try {
      await setAppointmentProcedure(apptId, { procedureId: procId });
      await reloadOrgData(orgId);
    } catch (e) {
      setErr(e?.response?.data?.message || "Não consegui definir procedimento.");
    }
  }

  async function doSearch() {
    const q = search.trim();
    if (!q) {
      setSearchUsers([]);
      return;
    }
    const { data } = await http.get("/users", {
      params: { query: q, page: 1, perPage: 10 },
    });
    setSearchUsers(
      Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-bold">Área Vet</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Web-first: organizações, carteira, procedimentos e agenda (próximos 7
        dias).
      </p>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {String(err)}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Minha organização</h2>
            <button
              type="button"
              onClick={quickCreateOrg}
              disabled={creating}
              className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Criando…" : "Criar (teste)"}
            </button>
          </div>

          <select
            className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            <option value="">(selecione)</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.type})
              </option>
            ))}
          </select>

          {selectedOrg ? (
            <p className="mt-2 text-xs text-zinc-500">slug: {selectedOrg.slug}</p>
          ) : null}

          <div className="mt-4">
            <h3 className="text-sm font-semibold">Buscar tutores/usuários</h3>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="nome, @usuário ou email"
              />
              <button
                type="button"
                onClick={doSearch}
                className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
              >
                Buscar
              </button>
            </div>
            {searchUsers?.length ? (
              <div className="mt-2 space-y-2">
                {searchUsers.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-zinc-200 p-2 text-sm dark:border-zinc-800"
                  >
                    <div className="font-semibold">
                      {u.displayName || u.username || u.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      @{u.username} • {u.email}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h2 className="text-lg font-semibold">Carteira (pets vinculados)</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {animals?.length ? (
              animals.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <div className="font-semibold">{c.animal?.name || "Pet"}</div>
                  <div className="text-xs text-zinc-500">status: {c.status}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-500">Sem pets vinculados ainda.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
          <h2 className="text-lg font-semibold">Vínculos pendentes</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Para a organização</h3>
              <div className="mt-2 space-y-2">
                {pendingOrg?.length ? (
                  pendingOrg.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                    >
                      <div className="font-semibold">{p.animal?.name}</div>
                      <div className="text-xs text-zinc-500">org: {p.organization?.name}</div>
                      <button
                        type="button"
                        onClick={() => acceptCareAsVet(p)}
                        className="mt-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Aceitar vínculo
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">Nenhum vínculo pendente.</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Do tutor (se aplicável)</h3>
              <div className="mt-2 space-y-2">
                {pendingTutor?.length ? (
                  pendingTutor.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                    >
                      <div className="font-semibold">{p.animal?.name}</div>
                      <div className="text-xs text-zinc-500">org: {p.organization?.name}</div>
                      <button
                        type="button"
                        onClick={() => approveAsTutor(p)}
                        className="mt-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Aprovar (tutor)
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">Nenhum vínculo pendente.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
          <h2 className="text-lg font-semibold">Procedimentos</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="grid gap-2">
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  value={procName}
                  onChange={(e) => setProcName(e.target.value)}
                  placeholder="Ex.: Avaliação"
                />
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  value={procDur}
                  onChange={(e) => setProcDur(e.target.value)}
                  type="number"
                  min={5}
                  placeholder="Duração (min)"
                />
                <button
                  type="button"
                  onClick={addProcedure}
                  className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
                >
                  Adicionar
                </button>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {procedures?.length ? (
                  procedures.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-zinc-500">{p.durationMinutes || "?"} min</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">Nenhum procedimento cadastrado.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Consultas</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Solicitações e ações rápidas (aceitar/recusar/propor horário).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={apptStatusFilter}
                onChange={(e) => setApptStatusFilter(e.target.value)}
              >
                <option value="REQUESTED">REQUESTED</option>
                <option value="ACCEPTED_BY_VET">ACCEPTED_BY_VET</option>
                <option value="TIME_PROPOSED">TIME_PROPOSED</option>
                <option value="TIME_REJECTED">TIME_REJECTED</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="DECLINED">DECLINED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="DONE">DONE</option>
              </select>
              <button
                type="button"
                onClick={() => reloadOrgData(orgId)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                Recarregar
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {appointments?.length ? (
              appointments.map((a) => {
                const d = proposeDraft?.[a.id] || {};
                const start = d.startAt || "";
                const end = d.endAt || "";

                const canAccept = ["REQUESTED", "TIME_REJECTED"].includes(a.status);
                const canPropose = ["ACCEPTED_BY_VET", "TIME_REJECTED"].includes(a.status);

                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{a.animal?.name || "Pet"}</div>
                        <div className="text-xs text-zinc-500">
                          tutor: {a.tutorUser?.displayName || a.tutorUser?.username || a.tutorUserId}
                        </div>
                        <div className="text-xs text-zinc-500">status: {a.status}</div>
                        <div className="text-xs text-zinc-500">criado: {fmt(a.createdAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setApptId(a.id)}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        title="Seleciona este ID no modo manual"
                      >
                        Usar ID
                      </button>
                    </div>

                    {canAccept ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setErr("");
                            try {
                              await vetAcceptAppointment(a.id);
                              await reloadOrgData(orgId);
                            } catch (e) {
                              setErr(e?.response?.data?.message || "Falha ao aceitar.");
                            }
                          }}
                          className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setErr("");
                            try {
                              await vetDeclineAppointment(a.id);
                              await reloadOrgData(orgId);
                            } catch (e) {
                              setErr(e?.response?.data?.message || "Falha ao recusar.");
                            }
                          }}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          Recusar
                        </button>
                      </div>
                    ) : null}

                    {canPropose ? (
                      <div className="mt-2">
                        <div className="grid gap-2">
                          <input
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                            value={start}
                            onChange={(e) => setDraft(a.id, { startAt: e.target.value })}
                            type="datetime-local"
                          />
                          <input
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                            value={end}
                            onChange={(e) => setDraft(a.id, { endAt: e.target.value })}
                            type="datetime-local"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              setErr("");
                              try {
                                const startAtIso = toISOStringSafe(start);
                                const endAtIso = toISOStringSafe(end);
                                if (!startAtIso || !endAtIso) {
                                  setErr("Preencha start/end.");
                                  return;
                                }
                                await vetProposeTime(a.id, {
                                  startAt: startAtIso,
                                  endAt: endAtIso,
                                });
                                await reloadOrgData(orgId);
                              } catch (e) {
                                setErr(e?.response?.data?.message || "Não consegui propor horário.");
                              }
                            }}
                            className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Propor horário
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {a.status === "TIME_PROPOSED" ? (
                      <div className="mt-2 text-xs text-zinc-500">
                        Horário proposto: {fmt(a.proposedStartAt)} até {fmt(a.proposedEndAt)} (aguardando tutor)
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-zinc-500">Nenhuma consulta neste filtro.</div>
            )}
          </div>

          <h2 className="mt-6 text-lg font-semibold">Agenda (próximos 7 dias)</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {agenda?.length ? (
              agenda.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <div className="font-semibold">{fmt(a.scheduledStartAt)}</div>
                  <div className="text-xs text-zinc-500">até {fmt(a.scheduledEndAt)} • {a.status}</div>
                  <div className="text-xs text-zinc-500">procedure: {a.procedure?.name || a.procedureId || "(n/d)"}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-500">Sem atendimentos agendados.</div>
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-sm font-semibold">Fluxo da consulta (MVP manual)</div>
              <p className="mt-2 text-xs text-zinc-500">
                Se precisar testar algo pontual, ainda dá para usar o modo manual com Appointment ID.
              </p>

              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={apptId}
                onChange={(e) => setApptId(e.target.value)}
                placeholder="Appointment ID"
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={acceptAppointment}
                  className="rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
                >
                  Aceitar
                </button>
                <button
                  type="button"
                  onClick={declineAppointment}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  Recusar
                </button>
              </div>

              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                placeholder="startAt (ISO)"
              />
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                placeholder="endAt (ISO)"
              />
              <button
                type="button"
                onClick={proposeTime}
                className="mt-2 w-full rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
              >
                Propor horário
              </button>

              <select
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={procId}
                onChange={(e) => setProcId(e.target.value)}
              >
                <option value="">(procedimento)</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={assignProcedure}
                className="mt-2 w-full rounded-xl bg-[#f77904] px-3 py-2 text-xs font-semibold text-white"
              >
                Definir procedimento
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
