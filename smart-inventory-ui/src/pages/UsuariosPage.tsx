import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCcw, Search, Shield, Trash2, UserCog, X } from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type { RolUsuario, UsuarioOperativo } from '../types/inventory'

interface UsuarioForm {
  username: string
  passwordHash: string
  rol: RolUsuario
}

const emptyForm: UsuarioForm = {
  username: '',
  passwordHash: '',
  rol: 'BODEGUERO',
}

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [rolFiltro, setRolFiltro] = useState<'TODOS' | RolUsuario>('TODOS')
  const [form, setForm] = useState<UsuarioForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await inventoryService.getUsuarios()
      setUsuarios(res.data)
    } catch {
      setError('No se pudieron cargar los usuarios operativos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargarUsuarios()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase()
    return usuarios.filter((usuario) => {
      const coincideTexto = texto
        ? usuario.username.toLowerCase().includes(texto) ||
          usuario.rol.toLowerCase().includes(texto)
        : true

      const coincideRol = rolFiltro === 'TODOS' ? true : usuario.rol === rolFiltro

      return coincideTexto && coincideRol
    })
  }, [rolFiltro, search, usuarios])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const iniciarEdicion = (usuario: UsuarioOperativo) => {
    setEditingId(usuario.id ?? null)
    setForm({
      username: usuario.username,
      passwordHash: usuario.passwordHash,
      rol: usuario.rol,
    })
    setError(null)
    setSuccess(null)
  }

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload: UsuarioOperativo = {
      username: form.username.trim(),
      passwordHash: form.passwordHash,
      rol: form.rol,
    }

    if (!payload.username || !payload.passwordHash) {
      setError('Completa usuario y contraseña/hash')
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        await inventoryService.updateUsuario(editingId, payload)
        setSuccess('Usuario actualizado correctamente')
      } else {
        await inventoryService.createUsuario(payload)
        setSuccess('Usuario creado correctamente')
      }
      resetForm()
      await cargarUsuarios()
    } catch {
      setError('No se pudo guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const eliminarUsuario = async (id?: number) => {
    if (!id) return
    const ok = window.confirm('¿Eliminar este usuario operativo?')
    if (!ok) return

    try {
      await inventoryService.deleteUsuario(id)
      if (editingId === id) resetForm()
      setSuccess('Usuario eliminado correctamente')
      await cargarUsuarios()
    } catch {
      setError('No se pudo eliminar el usuario')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Shield size={14} />
              Seguridad operativa
            </p>
            <h2 className="text-2xl font-semibold">Gestión de usuarios y roles</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Administra cuentas operativas para inventario con roles ADMIN y BODEGUERO.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarUsuarios()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <RefreshCcw size={16} />
            Recargar
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? `Editar usuario #${editingId}` : 'Crear usuario operativo'}
              </h3>
              <p className="text-sm text-slate-500">
                Puedes ingresar contraseña en texto o hash, según tu flujo backend.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <X size={14} />
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={guardarUsuario} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Usuario</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                placeholder="usuario.operativo"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña / Password Hash</label>
              <input
                value={form.passwordHash}
                onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                placeholder="******** o $2a$..."
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="BODEGUERO">BODEGUERO</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
              >
                <Plus size={16} />
                {saving ? 'Guardando...' : editingId ? 'Actualizar usuario' : 'Crear usuario'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <label className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario o rol"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-slate-900"
              />
            </label>

            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value as 'TODOS' | RolUsuario)}
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="BODEGUERO">BODEGUERO</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No hay usuarios con esos filtros.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id ?? usuario.username}>
                        <td className="px-4 py-3 text-slate-600">{usuario.id}</td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                            <UserCog size={14} className="text-slate-500" />
                            {usuario.username}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            usuario.rol === 'ADMIN'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(usuario)}
                              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void eliminarUsuario(usuario.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{usuariosFiltrados.length} resultados</span>
            <button
              type="button"
              onClick={() => void cargarUsuarios()}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950"
            >
              <RefreshCcw size={12} />
              Actualizar tabla
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UsuariosPage