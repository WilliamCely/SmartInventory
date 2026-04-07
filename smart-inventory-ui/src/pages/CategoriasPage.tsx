import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCcw, Search, Tags, Trash2, X } from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type { Categoria } from '../types/inventory'

interface CategoriaForm {
  nombre: string
  descripcion: string
}

const emptyForm: CategoriaForm = {
  nombre: '',
  descripcion: '',
}

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [form, setForm] = useState<CategoriaForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await inventoryService.getCategorias()
      setCategorias(res.data)
    } catch {
      setError('No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargarCategorias()
  }, [])

  const filtradas = useMemo(() => {
    const texto = search.trim().toLowerCase()
    if (!texto) return categorias

    return categorias.filter((categoria) => {
      const nombre = String(categoria.nombre ?? '').toLowerCase()
      const descripcion = String(categoria.descripcion ?? '').toLowerCase()
      return nombre.includes(texto) || descripcion.includes(texto)
    })
  }, [categorias, search])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const iniciarEdicion = (categoria: Categoria) => {
    setEditingId(categoria.id ?? null)
    setForm({
      nombre: categoria.nombre ?? '',
      descripcion: categoria.descripcion ?? '',
    })
    setError(null)
    setSuccess(null)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload: Categoria = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
    }

    if (!payload.nombre) {
      setError('El nombre de categoría es obligatorio')
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        await inventoryService.updateCategoria(editingId, payload)
        setSuccess('Categoría actualizada correctamente')
      } else {
        await inventoryService.createCategoria(payload)
        setSuccess('Categoría creada correctamente')
      }
      resetForm()
      await cargarCategorias()
    } catch {
      setError('No se pudo guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id?: number) => {
    if (!id) return
    const ok = window.confirm('¿Eliminar esta categoría?')
    if (!ok) return

    try {
      await inventoryService.deleteCategoria(id)
      if (editingId === id) {
        resetForm()
      }
      setSuccess('Categoría eliminada correctamente')
      await cargarCategorias()
    } catch {
      setError('No se pudo eliminar la categoría')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
          <Tags size={14} />
          Maestro de categorías
        </p>
        <h2 className="text-2xl font-semibold">Gestión de categorías</h2>
        <p className="mt-2 text-sm text-slate-300">
          Crea, edita y elimina categorías para clasificar productos.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? `Editar categoría #${editingId}` : 'Nueva categoría'}
              </h3>
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

          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Ej: Electrónica"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Opcional"
              />
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
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
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
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3"
              />
            </label>

            <button
              type="button"
              onClick={() => void cargarCategorias()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={14} />
              Recargar
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Cargando categorías...
                      </td>
                    </tr>
                  ) : filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No hay categorías para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filtradas.map((categoria) => (
                      <tr key={categoria.id ?? categoria.nombre}>
                        <td className="px-4 py-3 text-slate-600">{categoria.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{categoria.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{categoria.descripcion ?? '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(categoria)}
                              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void eliminar(categoria.id)}
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

          <div className="mt-3 text-xs text-slate-500">{filtradas.length} resultados</div>
        </section>
      </div>
    </div>
  )
}

export default CategoriasPage
