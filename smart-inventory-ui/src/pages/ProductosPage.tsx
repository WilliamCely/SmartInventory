import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, Pencil, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type { Categoria, Producto } from '../types/inventory'

interface ProductoForm {
  sku: string
  nombre: string
  descripcion: string
  precio: string
  stockActual: number
  stockMinimo: number
  categoriaId: string
}

const emptyForm: ProductoForm = {
  sku: '',
  nombre: '',
  descripcion: '',
  precio: '0.00',
  stockActual: 0,
  stockMinimo: 0,
  categoriaId: '',
}

function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [soloCritico, setSoloCritico] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductoForm>(emptyForm)

  const cargar = async () => {
    try {
      setLoading(true)
      setError(null)
      const [resProductos, resCategorias] = await Promise.all([
        inventoryService.getProductos(),
        inventoryService.getCategorias(),
      ])
      setProductos(resProductos.data)
      setCategorias(resCategorias.data)
    } catch {
      setError('No se pudo cargar el módulo de productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const matchTexto =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())

      const matchCritico = soloCritico ? p.stockActual <= p.stockMinimo : true

      const matchCategoria = categoriaFiltro
        ? String(p.categoria?.id ?? '') === categoriaFiltro
        : true

      return matchTexto && matchCritico && matchCategoria
    })
  }, [productos, search, soloCritico, categoriaFiltro])

  const prepararEdicion = (p: Producto) => {
    setEditingId(p.id ?? null)
    setForm({
      sku: p.sku,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      categoriaId: p.categoria?.id ? String(p.categoria.id) : '',
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const saveProducto = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: Producto = {
      sku: form.sku,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: form.precio,
      stockActual: Number(form.stockActual),
      stockMinimo: Number(form.stockMinimo),
      categoria: form.categoriaId ? { id: Number(form.categoriaId) } : undefined,
    }

    try {
      if (editingId) {
        await inventoryService.updateProducto(editingId, payload)
      } else {
        await inventoryService.createProducto(payload)
      }
      resetForm()
      await cargar()
    } catch {
      setError('No se pudo guardar el producto')
    }
  }

  const eliminar = async (id: number) => {
    const ok = window.confirm('¿Eliminar este producto?')
    if (!ok) return
    try {
      await inventoryService.deleteProducto(id)
      await cargar()
    } catch {
      setError('No se pudo eliminar el producto')
    }
  }

  const analizar = async (p: Producto) => {
    setError(null)
    setSuccess(null)

    try {
      const res = await inventoryService.analizarConIA({
        nombre: p.nombre,
        actual: p.stockActual,
        minimo: p.stockMinimo,
      })

      const contenido =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      setSuccess(`Analisis IA completado para ${p.nombre}`)
      window.alert(`Sugerencia IA:\n${contenido}`)
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'No fue posible analizar con IA'

      setError(`No fue posible analizar con IA: ${backendMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Productos</h2>
        <p className="text-sm text-slate-500">
          CRUD con filtros avanzados y análisis inteligente de stock
        </p>
      </div>

      <form onSubmit={saveProducto} className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {editingId ? `Editar producto #${editingId}` : 'Nuevo producto'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="SKU"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            placeholder="Precio"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            required
            value={form.stockActual}
            onChange={(e) =>
              setForm({ ...form, stockActual: Number(e.target.value) })
            }
            placeholder="Stock actual"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            required
            value={form.stockMinimo}
            onChange={(e) =>
              setForm({ ...form, stockMinimo: Number(e.target.value) })
            }
            placeholder="Stock mínimo"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre ?? `Categoría ${c.id}`}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3"
            />
          </label>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre ?? `Categoría ${c.id}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSoloCritico((s) => !s)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              soloCritico
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-slate-300 text-slate-700'
            }`}
          >
            {soloCritico ? 'Mostrando críticos' : 'Solo stock crítico'}
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Mínimo</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id ?? p.sku} className="border-t border-slate-100">
                    <td className="px-3 py-2">{p.sku}</td>
                    <td className="px-3 py-2">{p.nombre}</td>
                    <td className="px-3 py-2">{p.precio}</td>
                    <td className="px-3 py-2">{p.stockActual}</td>
                    <td className="px-3 py-2">{p.stockMinimo}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => prepararEdicion(p)}
                          className="rounded border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => p.id && void eliminar(p.id)}
                          className="rounded border border-red-300 p-1.5 text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => void analizar(p)}
                          className="rounded border border-blue-300 p-1.5 text-blue-600 hover:bg-blue-50"
                          title="Analizar con IA"
                        >
                          <BrainCircuit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{filtrados.length} resultados</span>
          <button
            onClick={() => void cargar()}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            <RefreshCcw size={14} />
            Recargar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductosPage
