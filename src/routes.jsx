// src/routes.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppShell from "@/layouts/AppShell";

// Auth / sessão
const Login = lazy(() => import("@/features/auth/pages/Login"));

// Feed
const Feed = lazy(() => import("@/features/feed/pages/Feed"));

// Pets
const PetList = lazy(() => import("@/features/pets/pages/PetList"));
const PetCreate = lazy(() => import("@/features/pets/pages/PetCreate"));
const PetDetail = lazy(() => import("@/features/pets/pages/PetDetail"));
const PetEdit = lazy(() => import("@/features/pets/pages/PetEdit"));

// Usuários
const UserProfile = lazy(() => import("@/features/users/pages/UserProfile"));
const UserEdit = lazy(() => import("@/features/users/pages/UserEdit"));
const UsersList = lazy(() => import("@/features/users/pages/UsersList"));

// Eventos
const EventsList = lazy(() => import("@/features/events/pages/EventsList"));
const EventCreate = lazy(() => import("@/features/events/pages/EventCreate"));
const EventDetail = lazy(() => import("@/features/events/pages/EventDetail"));

// Políticas / conformidade (públicas e in-app)
const ChildSafety = lazy(() => import("@/features/policy/pages/ChildSafety"));
const Privacy = lazy(() => import("@/features/policy/pages/Privacy"));
const ReportChannel = lazy(() => import("@/features/policy/pages/ReportChannel"));
const CommunityGuidelines = lazy(() => import("@/features/policy/pages/CommunityGuidelines"));
const AccountDeletion = lazy(() => import("@/features/policy/pages/AccountDeletion"));
const PolicyHub = lazy(() => import("@/features/policy/pages/PolicyHub"));

function Loader() {
  return (
    <div className="min-h-dvh grid place-items-center text-sm text-zinc-500 dark:text-zinc-400">
      Carregando…
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/auth" element={<Login />} />
          <Route path="/seguranca-infantil" element={<ChildSafety />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/denuncia" element={<ReportChannel />} />
          <Route path="/diretrizes" element={<CommunityGuidelines />} />
          <Route path="/excluir-conta" element={<AccountDeletion />} />
          <Route path="/ajuda" element={<PolicyHub />} />

          {/* AppShell gerencia layout + proteção internamente */}
          <Route element={<AppShell />}>
            {/* Home -> feed */}
            <Route index element={<Navigate to="/feed" replace />} />

            {/* Feed */}
            <Route path="/feed" element={<Feed />} />

            {/* Pets */}
            <Route path="/pets" element={<PetList />} />
            <Route path="/pets/novo" element={<PetCreate />} />
            <Route path="/pets/:id" element={<PetDetail />} />
            <Route path="/pets/:id/editar" element={<PetEdit />} />

            {/* Perfil do usuário (próprio) */}
            <Route path="/perfil" element={<UserProfile />} />
            <Route path="/perfil/editar" element={<UserEdit />} />

            {/* Perfil de outro usuário */}
            <Route path="/usuario/:userId" element={<UserProfile />} />
            <Route path="/usuarios" element={<UsersList />} />

            {/* Eventos */}
            <Route path="/eventos" element={<EventsList />} />
            <Route path="/eventos/novo" element={<EventCreate />} />
            <Route path="/eventos/:eventId" element={<EventDetail />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
