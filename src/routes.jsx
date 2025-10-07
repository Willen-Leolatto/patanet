// src/routes.jsx
import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";

import AppShell from "@layouts/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { PetList, PetCreate, PetDetail, PetEdit } from "@/features/pets";

// Lazy pages
const Feed = lazy(() => import("@features/feed/pages/Feed.jsx"));
const Login = lazy(() => import("@features/auth/pages/Login.jsx"));
const DashboardHome = lazy(() =>
  import("@features/dashboard/pages/DashboardHome.jsx")
);
const Settings = lazy(() =>
  import("@features/dashboard/pages/Settings.jsx")
);

const withSuspense = (el) => <Suspense fallback={null}>{el}</Suspense>;

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppShell />}>
      {/* Pública */}
      <Route path="/auth" element={withSuspense(<Login />)} />

      {/* Privada */}
      <Route element={<ProtectedRoute />}>
        {/* "/" -> Feed */}
        <Route index element={withSuspense(<Feed />)} />
        <Route path="feed" element={withSuspense(<Feed />)} />
        <Route path="dashboard" element={withSuspense(<DashboardHome />)} />

        {/* Pets */}
        <Route path="pets" element={<PetList />} />
        <Route path="pets/novo" element={<PetCreate />} />
        <Route path="pets/:id" element={<PetDetail />} />
        <Route path="pets/:id/editar" element={<PetEdit />} />

        {/* Configurações */}
        <Route
          path="dashboard/configuracoes"
          element={withSuspense(<Settings />)}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);
