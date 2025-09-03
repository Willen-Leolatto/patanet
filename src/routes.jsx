import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

// Layouts
import FeedLayout from '@layouts/FeedLayout.jsx'
import DashboardLayout from '@layouts/DashboardLayout.jsx'

// Lazy pages por feature (code-splitting)
const Feed = lazy(() => import('@features/feed/pages/Feed.jsx'))
const Login = lazy(() => import('@features/auth/pages/Login.jsx'))

const DashboardHome = lazy(() => import('@features/dashboard/pages/DashboardHome.jsx'))
const Settings = lazy(() => import('@features/dashboard/pages/Settings.jsx'))

const Photos = lazy(() => import('@features/photos/pages/Fotos.jsx'))
const PhotoCreate = lazy(() => import('@features/photos/pages/FotoCreate.jsx'))

const Family = lazy(() => import('@features/family/pages/Family.jsx'))
const FamilyInvite = lazy(() => import('@features/family/pages/FamilyInvite.jsx'))

const Pets = lazy(() => import('@features/pets/pages/Pets.jsx'))
const PetCreate = lazy(() => import('@features/pets/pages/PetCreate.jsx'))
const PetDetail = lazy(() => import('@features/pets/pages/PetDetail.jsx'))
const PetEdit = lazy(() => import('@features/pets/pages/PetEdit.jsx'))

const Vacinas = lazy(() => import('@features/vaccines/pages/Vacinas.jsx'))
const VacinaCreate = lazy(() => import('@features/vaccines/pages/VacinaCreate.jsx'))
const VacinaDetail = lazy(() => import('@features/vaccines/pages/VacinaDetail.jsx'))
const VacinaEdit = lazy(() => import('@features/vaccines/pages/VacinaEdit.jsx'))

import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from '@components/ProtectedRoute.jsx'

const withSuspense = (el) => <Suspense fallback={null}>{el}</Suspense>

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<FeedLayout />}>
        <Route index element={withSuspense(<Feed />)} />
        <Route path="feed" element={withSuspense(<Feed />)} />
      </Route>

      <Route path="/login" element={withSuspense(<Login />)} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={withSuspense(<DashboardHome />)} />

        <Route path="/dashboard/pets" element={withSuspense(<Pets />)} />
        <Route path="/dashboard/pets/novo" element={withSuspense(<PetCreate />)} />
        <Route path="/dashboard/pets/:id" element={withSuspense(<PetDetail />)} />
        <Route path="/dashboard/pets/:id/editar" element={withSuspense(<PetEdit />)} />

        <Route path="/dashboard/vacinas" element={withSuspense(<Vacinas />)} />
        <Route path="/dashboard/vacinas/nova" element={withSuspense(<VacinaCreate />)} />
        <Route path="/dashboard/vacinas/:id" element={withSuspense(<VacinaDetail />)} />
        <Route path="/dashboard/vacinas/:id/editar" element={withSuspense(<VacinaEdit />)} />

        <Route path="/dashboard/fotos" element={withSuspense(<Photos />)} />
        <Route path="/dashboard/fotos/nova" element={withSuspense(<PhotoCreate />)} />

        <Route path="/dashboard/familia" element={withSuspense(<Family />)} />
        <Route path="/dashboard/familia/novo" element={withSuspense(<FamilyInvite />)} />

        <Route path="/dashboard/configuracoes" element={withSuspense(<Settings />)} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </>
  )
)
