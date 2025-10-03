// src/routes.jsx
import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
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
const Settings = lazy(() => import("@features/dashboard/pages/Settings.jsx"));

const withSuspense = (el) => <Suspense fallback={null}>{el}</Suspense>;

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<AppShell />}>
        <Route path="/login" element={withSuspense(<Login />)} />

        <Route index element={withSuspense(<Feed />)} />
        <Route path="/feed" element={withSuspense(<Feed />)} />

        <Route
          element={
            <ProtectedRoute>
              <div />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={withSuspense(<DashboardHome />)} />
          <Route path="/pets" element={<PetList />} />
          <Route path="/pets/novo" element={<PetCreate />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/pets/:id/editar" element={<PetEdit />} />
          {/* <Route path="/dashboard/fotos" element={withSuspense(<Photos />)} />
          <Route
            path="/dashboard/fotos/nova"
            element={withSuspense(<PhotoCreate />)}
          /> */}

          {/* <Route
            path="/dashboard/vacinas"
            element={withSuspense(<Vaccines />)}
          />
          <Route
            path="/dashboard/vacinas/nova"
            element={withSuspense(<VaccineCreate />)}
          />
          <Route
            path="/dashboard/vacinas/:id"
            element={withSuspense(<VaccineDetail />)}
          />
          <Route
            path="/dashboard/vacinas/:id/editar"
            element={withSuspense(<VaccineEdit />)}
          /> */}

          <Route
            path="/dashboard/configuracoes"
            element={withSuspense(<Settings />)}
          />
        </Route>
      </Route>
    </>
  )
);
