import {
  BrainCircuit,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Upload,
  UserCog,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/productos', label: 'Productos', icon: Package },
  { to: '/app/categorias', label: 'Categorías', icon: ClipboardCheck },
  { to: '/app/importacion', label: 'Importación', icon: Upload, adminOnly: true },
  { to: '/app/ordenes', label: 'Ordenes AI', icon: BrainCircuit },
  { to: '/app/movimientos', label: 'Movimientos', icon: ClipboardList },
  { to: '/app/usuarios', label: 'Usuarios', icon: UserCog, adminOnly: true },
]

function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="notranslate min-h-screen bg-slate-100 text-slate-900" translate="no">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-900 px-4 py-6 text-slate-100">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-300">
              <Boxes size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold">SmartInventory</p>
              <p className="text-xs text-slate-400">Panel Operativo</p>
            </div>
          </div>

          <nav className="space-y-1">
            {links
              .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
              .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-8 flex w-full items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </aside>

        <section>
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">SmartInventory UI</h1>
              <p className="text-xs text-slate-500">
                Integrado con API Gateway y microservicios
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {user?.username} ({user?.role})
            </div>
          </header>

          <main className="p-6">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  )
}

export default AppLayout
