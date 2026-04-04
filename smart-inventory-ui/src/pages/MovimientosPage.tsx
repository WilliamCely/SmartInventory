import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
  Filter,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { inventoryService } from '../api/inventoryService'
import type { MovimientoInventario, Producto, TipoMovimiento } from '../types/inventory'

interface MovimientoForm {
  productoId: string
  tipo: TipoMovimiento
  cantidad: string
}

const emptyForm: MovimientoForm = {
  productoId: '',
  tipo: 'ENTRADA',
  cantidad: '1',
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function movementDelta(tipo: TipoMovimiento, cantidad: number) {
  return tipo === 'ENTRADA' ? cantidad : -cantidad
}

function MovimientosPage() {
  const { user } = useAuth()

  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | TipoMovimiento>('TODOS')
  const [productoFiltro, setProductoFiltro] = useState('')
  const [form, setForm] = useState<MovimientoForm>(emptyForm)
  const [editingMovimientoId, setEditingMovimientoId] = useState<number | null>(null)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      const [resMovimientos, resProductos] = await Promise.all([
        inventoryService.getMovimientos(),
        inventoryService.getProductos(),
      ])
      setMovimientos(resMovimientos.data)
      setProductos(resProductos.data)
    } catch {
      setError('No se pudieron cargar los movimientos del inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  const productoSeleccionado = useMemo(
    () => productos.find((p) => String(p.id ?? '') === form.productoId),
    [form.productoId, productos],
  )

  const movimientoEnEdicion = useMemo(
    () => movimientos.find((movimiento) => movimiento.id === editingMovimientoId) ?? null,
    [editingMovimientoId, movimientos],
  )

  const movimientosFiltrados = useMemo(() => {
    return movimientos
      .filter((movimiento) => {
        const texto = search.trim().toLowerCase()
        const coincideTexto = texto
          ? [
              movimiento.producto?.nombre,
              movimiento.producto?.sku,
              movimiento.usuario?.username,
              movimiento.tipo,
            ]
              .filter(Boolean)
              .some((campo) => String(campo).toLowerCase().includes(texto))
          : true

        const coincideTipo =
          tipoFiltro === 'TODOS' ? true : movimiento.tipo === tipoFiltro

        const coincideProducto = productoFiltro
          ? String(movimiento.producto?.id ?? '') === productoFiltro
          : true

        return coincideTexto && coincideTipo && coincideProducto
      })
      .slice()
      .sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
        return fechaB - fechaA
      })
  }, [movimientos, productoFiltro, search, tipoFiltro])

  const resumen = useMemo(() => {
    const entradas = movimientos.filter((movimiento) => movimiento.tipo === 'ENTRADA').length
    const salidas = movimientos.filter((movimiento) => movimiento.tipo === 'SALIDA').length
    return {
      total: movimientos.length,
      entradas,
      salidas,
    }
  }, [movimientos])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingMovimientoId(null)
    setError(null)
    setSuccess(null)
  }

  const iniciarEdicion = (movimiento: MovimientoInventario) => {
    setEditingMovimientoId(movimiento.id ?? null)
    setForm({
      productoId: String(movimiento.producto?.id ?? ''),
      tipo: movimiento.tipo,
      cantidad: String(movimiento.cantidad ?? 1),
    })
    setError(null)
    setSuccess(null)
  }

  const sincronizarStocks = async (ajustes: Array<{ productoId: number; delta: number }>) => {
    const deltas = new Map<number, number>()
    for (const ajuste of ajustes) {
      deltas.set(ajuste.productoId, (deltas.get(ajuste.productoId) ?? 0) + ajuste.delta)
    }

    const productosAfectados = productos
      .filter((producto) => producto.id != null && deltas.has(producto.id))
      .map((producto) => {
        const delta = deltas.get(producto.id as number) ?? 0
        const stockObjetivo = Number(producto.stockActual ?? 0) + delta
        return { producto, stockObjetivo }
      })

    const invalido = productosAfectados.find(({ stockObjetivo }) => stockObjetivo < 0)
    if (invalido) {
      throw new Error(`El stock de ${invalido.producto.nombre} no puede quedar en negativo`)
    }

    await Promise.all(
      productosAfectados.map(({ producto, stockObjetivo }) => {
        if (producto.id == null) return Promise.resolve()
        return inventoryService.updateProducto(producto.id, {
          ...producto,
          stockActual: stockObjetivo,
        })
      }),
    )
  }

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user?.id) {
      setError('No se pudo identificar el usuario autenticado')
      return
    }

    const productoId = Number(form.productoId)
    const cantidad = Number(form.cantidad)

    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) {
      setError('Selecciona un producto y una cantidad válida')
      return
    }

    if (!productoSeleccionado) {
      setError('El producto seleccionado no existe en el catálogo')
      return
    }

    const payload = {
      producto: { id: productoId },
      usuario: { id: user.id },
      tipo: form.tipo,
      cantidad,
    }

    try {
      setSaving(true)

      if (editingMovimientoId) {
        if (!movimientoEnEdicion?.id) {
          setError('No se encontró el movimiento que estabas editando')
          return
        }

        const productoAnteriorId = Number(movimientoEnEdicion.producto?.id)
        const deltaAnterior = movementDelta(movimientoEnEdicion.tipo, movimientoEnEdicion.cantidad)
        const deltaNuevo = movementDelta(form.tipo, cantidad)

        await inventoryService.updateMovimiento(editingMovimientoId, payload)
        await sincronizarStocks([
          { productoId: productoAnteriorId, delta: -deltaAnterior },
          { productoId, delta: deltaNuevo },
        ])

        setSuccess(`Movimiento actualizado correctamente para ${productoSeleccionado.nombre}`)
      } else {
        const deltaNuevo = movementDelta(form.tipo, cantidad)

        await inventoryService.createMovimiento(payload)
        await sincronizarStocks([{ productoId, delta: deltaNuevo }])

        setSuccess(
          `${form.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente para ${productoSeleccionado.nombre}`,
        )
      }

      resetForm()
      await cargarDatos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento')
    } finally {
      setSaving(false)
    }
  }

  const eliminarMovimiento = async (movimiento: MovimientoInventario) => {
    if (!movimiento.id) return

    const confirmacion = window.confirm(
      '¿Eliminar este movimiento? El stock asociado se ajustará automáticamente.',
    )
    if (!confirmacion) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const productoId = Number(movimiento.producto?.id)
      const delta = movementDelta(movimiento.tipo, movimiento.cantidad)

      await inventoryService.deleteMovimiento(movimiento.id)
      await sincronizarStocks([{ productoId, delta: -delta }])

      if (editingMovimientoId === movimiento.id) {
        resetForm()
      }

      setSuccess('Movimiento eliminado correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el movimiento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Clock3 size={14} />
              Kardex operativo
            </p>
            <h2 className="text-2xl font-semibold">Movimientos de inventario</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Registra, edita y elimina entradas y salidas, con filtros por producto, usuario y tipo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarDatos()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <RefreshCcw size={16} />
            Recargar historial
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Movimientos', value: resumen.total },
          { label: 'Entradas', value: resumen.entradas },
          { label: 'Salidas', value: resumen.salidas },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingMovimientoId ? 'Editar movimiento' : 'Registrar entrada o salida'}
              </h3>
              <p className="text-sm text-slate-500">
                {user ? `Sesión activa: ${user.username} (${user.role})` : 'Sesión no disponible'}
              </p>
            </div>
            {editingMovimientoId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X size={14} />
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={guardarMovimiento} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Producto</label>
              <select
                value={form.productoId}
                onChange={(e) => setForm({ ...form, productoId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-900"
                required
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - {producto.sku}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMovimiento })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-900"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-900"
                />
              </div>
            </div>

            {productoSeleccionado && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Stock actual: {productoSeleccionado.stockActual}</p>
                <p>
                  Stock proyectado:{' '}
                  {form.tipo === 'ENTRADA'
                    ? Number(productoSeleccionado.stockActual ?? 0) + Number(form.cantidad || 0)
                    : Number(productoSeleccionado.stockActual ?? 0) - Number(form.cantidad || 0)}
                </p>
              </div>
            )}

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
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus size={16} />
                {saving
                  ? 'Guardando...'
                  : editingMovimientoId
                    ? 'Actualizar movimiento'
                    : 'Registrar movimiento'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Historial filtrable</h3>
              <p className="text-sm text-slate-500">
                Busca por producto, SKU, usuario o tipo de movimiento.
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr]">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto, SKU o usuario"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 outline-none transition focus:border-slate-900"
              />
            </label>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as 'TODOS' | TipoMovimiento)}
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-900"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SALIDA">Salidas</option>
            </select>

            <select
              value={productoFiltro}
              onChange={(e) => setProductoFiltro(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-900"
            >
              <option value="">Todos los productos</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Cargando movimientos...
                      </td>
                    </tr>
                  ) : movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No hay movimientos con esos filtros.
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((movimiento) => {
                      const isEntrada = movimiento.tipo === 'ENTRADA'
                      return (
                        <tr key={movimiento.id ?? `${movimiento.producto?.id}-${movimiento.fecha}`}>
                          <td className="px-4 py-3 text-slate-600">{formatDate(movimiento.fecha)}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {movimiento.producto?.nombre ?? 'Producto sin nombre'}
                            </div>
                            <div className="text-xs text-slate-500">SKU: {movimiento.producto?.sku ?? '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isEntrada
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isEntrada ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                              {movimiento.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {movimiento.cantidad}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {movimiento.usuario?.username ?? `Usuario #${movimiento.usuario?.id ?? '-'}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => iniciarEdicion(movimiento)}
                                className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void eliminarMovimiento(movimiento)}
                                className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              <Filter size={12} className="mr-1 inline" />
              {movimientosFiltrados.length} resultados
            </span>
            <button
              type="button"
              onClick={() => void cargarDatos()}
              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-950"
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

export default MovimientosPage