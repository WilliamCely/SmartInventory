import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/Dashboard'
import LoginPage from './pages/LoginPage'
import ModulePlaceholder from './pages/ModulePlaceholder'
import ProductosPage from './pages/ProductosPage'

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
        <Route
          path="ordenes"
          element={
            <ModulePlaceholder
              title="Modulo Ordenes AI"
              description="Pendiente de conectar UI avanzada con ordenes_compra_ai y detalle_orden_compra."
            />
          }
        />
        <Route
          path="movimientos"
          element={
            <ModulePlaceholder
              title="Modulo Movimientos"
              description="Pendiente de integrar tabla filtrable y formularios de entradas/salidas."
            />
          }
        />
        <Route
          path="usuarios"
          element={
            <ModulePlaceholder
              title="Modulo Usuarios"
              description="Pendiente de integrar gestion de usuarios y roles operativos."
            />
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
