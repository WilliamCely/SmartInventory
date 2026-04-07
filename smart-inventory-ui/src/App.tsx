import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import OrdersRouteErrorBoundary from './components/OrdersRouteErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import Dashboard from './components/Dashboard'
import CategoriasPage from './pages/CategoriasPage'
import LoginPage from './pages/LoginPage'
import MovimientosPage from './pages/MovimientosPage'
import OrdenesPage from './pages/OrdenesPage'
import ProductosPage from './pages/ProductosPage'
import ImportacionPage from './pages/ImportacionPage'
import UsuariosPage from './pages/UsuariosPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="categorias" element={<CategoriasPage />} />
        <Route
          path="importacion"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <ImportacionPage />
            </RoleGuard>
          }
        />
        <Route
          path="ordenes"
          element={
            <OrdersRouteErrorBoundary>
              <OrdenesPage />
            </OrdersRouteErrorBoundary>
          }
        />
        <Route path="movimientos" element={<MovimientosPage />} />
        <Route
          path="usuarios"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <UsuariosPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
