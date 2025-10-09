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
const UserEdit = lazy(() => import("@/features/users/pages/UserEdit")); // ⬅️ NOVO

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
          {/* Rotas públicas de autenticação */}
          <Route path="/auth" element={<Login />} />

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
            {/* ⬇️ NOVA ROTA: editar perfil */}
            <Route path="/perfil/editar" element={<UserEdit />} />

            {/* Perfil de outro usuário (caso exista esse fluxo) */}
            <Route path="/usuario/:userId" element={<UserProfile />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
