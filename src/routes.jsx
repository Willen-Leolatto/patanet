import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import FeedLayout from "./layouts/FeedLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Feed from "./pages/Feed";
import DashboardHome from "./pages/DashboardHome";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { RequireManage } from "./components/RouteGuards";

// Listas
import Pets from "./pages/Pets";
import Vacinas from "./pages/Vacinas";
import Fotos from "./pages/Fotos";
import Familia from "./pages/Familia";

// Pets CRUD
import PetCreate from "./pages/PetCreate";
import PetDetail from "./pages/PetDetail";
import PetEdit from "./pages/PetEdit";

// Vacinas CRUD
import VacinaCreate from "./pages/VacinaCreate";
import VacinaDetail from "./pages/VacinaDetail";
import VacinaEdit from "./pages/VacinaEdit";

// Outros
import FotoCreate from "./pages/FotoCreate";
import FamiliaInvite from "./pages/FamiliaInvite";
import Configuracoes from "./pages/configuracoes";
import Forbidden from "./pages/Forbidden";

// no topo permanece igual…

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Feed com layout */}
      <Route path="/" element={<FeedLayout />}>
        <Route index element={<Feed />} />          {/* / */}
        <Route path="feed" element={<Feed />} />    {/* /feed */}
      </Route>

      <Route path="/login" element={<Login />} />

      {/* Dashboard protegido */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />

        <Route path="/dashboard/pets" element={<Pets />} />
        <Route path="/dashboard/pets/novo" element={<PetCreate />} />
        <Route path="/dashboard/pets/:id" element={<PetDetail />} />
        <Route path="/dashboard/pets/:id/editar" element={<PetEdit />} />

        <Route path="/dashboard/vacinas" element={<Vacinas />} />
        <Route path="/dashboard/vacinas/nova" element={<VacinaCreate />} />
        <Route path="/dashboard/vacinas/:id" element={<VacinaDetail />} />
        <Route path="/dashboard/vacinas/:id/editar" element={<VacinaEdit />} />

        <Route path="/dashboard/fotos" element={<Fotos />} />
        <Route path="/dashboard/fotos/nova" element={<FotoCreate />} />

        <Route path="/dashboard/familia" element={<Familia />} />
        <Route path="/dashboard/familia/novo" element={<FamiliaInvite />} />

        <Route path="/dashboard/configuracoes" element={<Configuracoes />} />
        <Route path="/dashboard/forbidden" element={<Forbidden />} />
        
      </Route>

      <Route path="*" element={<NotFound />} />
    </>
  )
);

