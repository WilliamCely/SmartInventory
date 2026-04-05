import { useEffect, useMemo, useState } from 'react'
import {
  BrainCircuit,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type {
  DetalleOrdenCompra,
  DetalleOrdenCompraPayload,
  EstadoOrdenCompra,
  OrdenCompraAi,
  OrdenCompraAiPayload,
  Producto,
  UsuarioOperativo,
} from '../types/inventory'

interface OrdenForm {
  estado: EstadoOrdenCompra
  promptUsado: string
  respuestaRawJson: string
  usuarioAprobadorId: string
}

interface DetalleForm {
  productoId: string
  cantidadSugerida: string
  costoEstimado: string
}

interface ParsedAiSuggestion {
  cantidadSugerida: number
  prioridad?: string
  razon?: string
}

const emptyOrdenForm: OrdenForm = {
  estado: 'SUGERIDA',
  promptUsado: '',
  respuestaRawJson: '',
  usuarioAprobadorId: '',
}

const emptyDetalleForm: DetalleForm = {
  productoId: '',
  cantidadSugerida: '1',
  costoEstimado: '',
}

function parseAiSuggestion(raw: string): ParsedAiSuggestion | null {
  const normalized = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const candidates = [normalized]
  const firstBrace = normalized.indexOf('{')
  const lastBrace = normalized.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(normalized.slice(firstBrace, lastBrace + 1))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>
      const rawCantidad = parsed.cantidad_sugerida ?? parsed.cantidadSugerida
      const cantidad = Number(rawCantidad)
      if (Number.isFinite(cantidad) && cantidad > 0) {
        return {
          cantidadSugerida: Math.round(cantidad),
          prioridad:
            typeof parsed.prioridad === 'string' ? parsed.prioridad : undefined,
          razon: typeof parsed.razon === 'string' ? parsed.razon : undefined,
        }
      }
    } catch {
      // Continue to regex fallback.
    }
  }

  const cantidadMatch = normalized.match(
    /['"]?cantidad[_\s-]*sugerida['"]?\s*[:=]\s*['"]?([0-9]+(?:\.[0-9]+)?)/i,
  )
  const cantidad = cantidadMatch ? Number(cantidadMatch[1]) : NaN
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return null
  }

  const prioridadMatch = normalized.match(
    /['"]?prioridad['"]?\s*[:=]\s*['"]([^'"\n\r]+)['"]/i,
  )
  const razonMatch = normalized.match(
    /['"]?razon['"]?\s*[:=]\s*['"]([^'"\n\r]+)['"]/i,
  )

  return {
    cantidadSugerida: Math.round(cantidad),
    prioridad: prioridadMatch?.[1],
    razon: razonMatch?.[1],
  }
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function badgeClass(estado?: EstadoOrdenCompra | string) {
  if (estado === 'APROBADA') return 'bg-emerald-50 text-emerald-700'
  if (estado === 'RECHAZADA') return 'bg-rose-50 text-rose-700'
  return 'bg-amber-50 text-amber-700'
}

function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompraAi[]>([])
  const [detalles, setDetalles] = useState<DetalleOrdenCompra[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingIa, setGeneratingIa] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | EstadoOrdenCompra>('TODOS')
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null)

  const [ordenForm, setOrdenForm] = useState<OrdenForm>(emptyOrdenForm)
  const [detalleForm, setDetalleForm] = useState<DetalleForm>(emptyDetalleForm)
  const [editingOrdenId, setEditingOrdenId] = useState<number | null>(null)
  const [editingDetalleId, setEditingDetalleId] = useState<number | null>(null)

  const cargarCatalogos = async () => {
    const [resProductos, resUsuarios] = await Promise.all([
      inventoryService.getProductos(),
      inventoryService.getUsuarios(),
    ])
    setProductos(resProductos.data)
    setUsuarios(resUsuarios.data)
  }

  const cargarOrdenes = async () => {
    const res = await inventoryService.getOrdenesCompra(
      estadoFiltro === 'TODOS' ? undefined : estadoFiltro,
    )
    setOrdenes(res.data)

    if (!selectedOrdenId && res.data.length > 0) {
      setSelectedOrdenId(Number(res.data[0].id))
    }

    if (
      selectedOrdenId &&
      !res.data.some((orden) => Number(orden.id) === selectedOrdenId)
    ) {
      setSelectedOrdenId(res.data.length > 0 ? Number(res.data[0].id) : null)
    }
  }

  const cargarDetalles = async (ordenId: number | null) => {
    if (!ordenId) {
      setDetalles([])
      return
    }
    const res = await inventoryService.getDetallesOrden(ordenId)
    setDetalles(res.data)
  }

  const cargarTodo = async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([cargarCatalogos(), cargarOrdenes()])
    } catch {
      setError('No se pudieron cargar las órdenes AI')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargarTodo()
  }, [])

  useEffect(() => {
    void cargarOrdenes()
  }, [estadoFiltro])

  useEffect(() => {
    void cargarDetalles(selectedOrdenId)
  }, [selectedOrdenId])

  const ordenesFiltradas = useMemo(() => {
    const texto = search.trim().toLowerCase()
    return ordenes
      .filter((orden) => {
        if (!texto) return true
        return (
          String(orden.id ?? '').includes(texto) ||
          (orden.promptUsado ?? '').toLowerCase().includes(texto) ||
          (orden.estado ?? '').toLowerCase().includes(texto)
        )
      })
      .slice()
      .sort((a, b) => {
        const fechaA = a.fechaGeneracion ? new Date(a.fechaGeneracion).getTime() : 0
        const fechaB = b.fechaGeneracion ? new Date(b.fechaGeneracion).getTime() : 0
        return fechaB - fechaA
      })
  }, [ordenes, search])

  const ordenSeleccionada = useMemo(
    () => ordenes.find((orden) => Number(orden.id) === selectedOrdenId) ?? null,
    [ordenes, selectedOrdenId],
  )

  const resetOrdenForm = () => {
    setOrdenForm(emptyOrdenForm)
    setEditingOrdenId(null)
  }

  const resetDetalleForm = () => {
    setDetalleForm(emptyDetalleForm)
    setEditingDetalleId(null)
  }

  const iniciarEdicionOrden = (orden: OrdenCompraAi) => {
    setEditingOrdenId(Number(orden.id))
    setOrdenForm({
      estado: orden.estado,
      promptUsado: orden.promptUsado ?? '',
      respuestaRawJson: orden.respuestaRawJson ?? '',
      usuarioAprobadorId: orden.usuarioAprobador?.id
        ? String(orden.usuarioAprobador.id)
        : '',
    })
    setSuccess(null)
    setError(null)
  }

  const iniciarEdicionDetalle = (detalle: DetalleOrdenCompra) => {
    setEditingDetalleId(Number(detalle.id))
    setDetalleForm({
      productoId: String(detalle.producto.id),
      cantidadSugerida: String(detalle.cantidadSugerida),
      costoEstimado: detalle.costoEstimado ?? '',
    })
    setSuccess(null)
    setError(null)
  }

  const guardarOrden = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    let rawJsonValue: string | undefined
    if (ordenForm.respuestaRawJson.trim()) {
      try {
        const parsed = JSON.parse(ordenForm.respuestaRawJson)
        rawJsonValue = JSON.stringify(parsed)
      } catch {
        setError('La respuesta raw JSON no tiene un formato JSON válido')
        return
      }
    }

    const payload: OrdenCompraAiPayload = {
      estado: ordenForm.estado,
      promptUsado: ordenForm.promptUsado || undefined,
      respuestaRawJson: rawJsonValue,
      usuarioAprobador: ordenForm.usuarioAprobadorId
        ? { id: Number(ordenForm.usuarioAprobadorId) }
        : undefined,
    }

    try {
      setSaving(true)
      if (editingOrdenId) {
        await inventoryService.updateOrdenCompra(editingOrdenId, payload)
        setSuccess('Orden actualizada correctamente')
      } else {
        const created = await inventoryService.createOrdenCompra(payload)
        setSuccess('Orden creada correctamente')
        if (created.data.id) {
          setSelectedOrdenId(Number(created.data.id))
        }
      }
      resetOrdenForm()
      await cargarOrdenes()
    } catch {
      setError('No se pudo guardar la orden')
    } finally {
      setSaving(false)
    }
  }

  const eliminarOrden = async (id?: number) => {
    if (!id) return
    const ok = window.confirm(
      '¿Eliminar esta orden? Borra también los detalles asociados si existen.',
    )
    if (!ok) return

    try {
      await inventoryService.deleteOrdenCompra(id)
      setSuccess('Orden eliminada correctamente')
      if (selectedOrdenId === id) {
        setSelectedOrdenId(null)
        setDetalles([])
      }
      await cargarOrdenes()
    } catch {
      setError('No se pudo eliminar la orden')
    }
  }

  const guardarDetalle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedOrdenId) {
      setError('Selecciona una orden antes de agregar detalles')
      return
    }

    const productoId = Number(detalleForm.productoId)
    const cantidad = Number(detalleForm.cantidadSugerida)

    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) {
      setError('Selecciona producto y cantidad válida')
      return
    }

    const payload: DetalleOrdenCompraPayload = {
      orden: { id: selectedOrdenId },
      producto: { id: productoId },
      cantidadSugerida: cantidad,
      costoEstimado: detalleForm.costoEstimado || undefined,
    }

    try {
      setSaving(true)
      if (editingDetalleId) {
        await inventoryService.updateDetalleOrden(editingDetalleId, payload)
        setSuccess('Detalle actualizado correctamente')
      } else {
        await inventoryService.createDetalleOrden(payload)
        setSuccess('Detalle agregado correctamente')
      }
      resetDetalleForm()
      await cargarDetalles(selectedOrdenId)
    } catch {
      setError('No se pudo guardar el detalle')
    } finally {
      setSaving(false)
    }
  }

  const eliminarDetalle = async (id?: number) => {
    if (!id || !selectedOrdenId) return
    const ok = window.confirm('¿Eliminar este detalle de la orden?')
    if (!ok) return

    try {
      await inventoryService.deleteDetalleOrden(id)
      setSuccess('Detalle eliminado correctamente')
      await cargarDetalles(selectedOrdenId)
    } catch {
      setError('No se pudo eliminar el detalle')
    }
  }

  const generarOrdenConIA = async () => {
    setError(null)
    setSuccess(null)

    const criticos = productos.filter(
      (producto) => Number(producto.stockActual) <= Number(producto.stockMinimo),
    )

    if (criticos.length === 0) {
      setError('No hay productos en stock crítico para generar una orden AI')
      return
    }

    try {
      setGeneratingIa(true)

      const sugerencias = [] as Array<{
        productoId: number
        nombre: string
        sku: string
        actual: number
        minimo: number
        cantidadSugerida: number
        costoEstimado: string
        prioridad?: string
        razon?: string
        rawAi: string
      }>

      for (const producto of criticos) {
        if (!producto.id) continue

        const fallbackCantidad = Math.max(
          Number(producto.stockMinimo) - Number(producto.stockActual),
          1,
        )

        let rawAi = ''
        let parsed: ParsedAiSuggestion | null = null

        try {
          const aiResponse = await inventoryService.analizarConIA({
            nombre: producto.nombre,
            actual: Number(producto.stockActual),
            minimo: Number(producto.stockMinimo),
          })
          rawAi =
            typeof aiResponse.data === 'string'
              ? aiResponse.data
              : JSON.stringify(aiResponse.data)
          parsed = parseAiSuggestion(rawAi)
        } catch {
          rawAi = 'AI_UNAVAILABLE'
          parsed = null
        }

        const cantidad = parsed?.cantidadSugerida ?? fallbackCantidad
        const precio = Number(producto.precio)
        const costoEstimado = Number.isFinite(precio)
          ? (precio * cantidad).toFixed(2)
          : '0.00'

        sugerencias.push({
          productoId: producto.id,
          nombre: producto.nombre,
          sku: producto.sku,
          actual: Number(producto.stockActual),
          minimo: Number(producto.stockMinimo),
          cantidadSugerida: cantidad,
          costoEstimado,
          prioridad: parsed?.prioridad,
          razon: parsed?.razon,
          rawAi,
        })
      }

      if (sugerencias.length === 0) {
        setError('No se pudo construir una orden AI con los productos actuales')
        return
      }

      const ordenPayload: OrdenCompraAiPayload = {
        estado: 'SUGERIDA',
        promptUsado: `Generación automática IA para ${sugerencias.length} productos críticos`,
        respuestaRawJson: JSON.stringify(
          {
            fuente: 'ai-service',
            generatedAt: new Date().toISOString(),
            sugerencias,
          },
          null,
          2,
        ),
      }

      const createdOrden = await inventoryService.createOrdenCompra(ordenPayload)
      const ordenId = Number(createdOrden.data.id)

      for (const item of sugerencias) {
        const detallePayload: DetalleOrdenCompraPayload = {
          orden: { id: ordenId },
          producto: { id: item.productoId },
          cantidadSugerida: item.cantidadSugerida,
          costoEstimado: item.costoEstimado,
        }
        await inventoryService.createDetalleOrden(detallePayload)
      }

      setSelectedOrdenId(ordenId)
      await cargarOrdenes()
      await cargarDetalles(ordenId)
      setSuccess(
        `Orden #${ordenId} generada con IA para ${sugerencias.length} productos críticos`,
      )
    } catch {
      setError('No se pudo generar la orden automática con IA')
    } finally {
      setGeneratingIa(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <BrainCircuit size={14} />
              Orquestación AI
            </p>
            <h2 className="text-2xl font-semibold">Órdenes de compra AI</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Gestiona cabecera y detalle de `ordenes_compra_ai` y `detalle_orden_compra` en una sola vista avanzada.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargarTodo()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            <RefreshCcw size={16} />
            Refrescar todo
          </button>
          <button
            type="button"
            onClick={() => void generarOrdenConIA()}
            disabled={generatingIa || saving || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <BrainCircuit size={16} />
            {generatingIa ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>
      </section>

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

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="space-y-6">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingOrdenId ? `Editar orden #${editingOrdenId}` : 'Nueva orden AI'}
              </h3>
              {editingOrdenId && (
                <button
                  type="button"
                  onClick={resetOrdenForm}
                  className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                >
                  <X size={14} />
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={guardarOrden} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
                <select
                  value={ordenForm.estado}
                  onChange={(e) =>
                    setOrdenForm({ ...ordenForm, estado: e.target.value as EstadoOrdenCompra })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="SUGERIDA">SUGERIDA</option>
                  <option value="APROBADA">APROBADA</option>
                  <option value="RECHAZADA">RECHAZADA</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Usuario aprobador</label>
                <select
                  value={ordenForm.usuarioAprobadorId}
                  onChange={(e) =>
                    setOrdenForm({ ...ordenForm, usuarioAprobadorId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Sin aprobador</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Prompt usado</label>
                <textarea
                  value={ordenForm.promptUsado}
                  onChange={(e) =>
                    setOrdenForm({ ...ordenForm, promptUsado: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Prompt enviado al modelo..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Respuesta raw JSON</label>
                <textarea
                  value={ordenForm.respuestaRawJson}
                  onChange={(e) =>
                    setOrdenForm({ ...ordenForm, respuestaRawJson: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                  placeholder='{"items":[...]}'
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
              >
                <Plus size={16} />
                {editingOrdenId ? 'Actualizar orden' : 'Crear orden'}
              </button>
            </form>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingDetalleId ? `Editar detalle #${editingDetalleId}` : 'Detalle de orden'}
              </h3>
              {editingDetalleId && (
                <button
                  type="button"
                  onClick={resetDetalleForm}
                  className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                >
                  <X size={14} />
                  Cancelar
                </button>
              )}
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Orden seleccionada:{' '}
              <span className="font-semibold text-slate-700">
                {selectedOrdenId ? `#${selectedOrdenId}` : 'ninguna'}
              </span>
            </p>

            <form onSubmit={guardarDetalle} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Producto</label>
                <select
                  value={detalleForm.productoId}
                  onChange={(e) =>
                    setDetalleForm({ ...detalleForm, productoId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={detalleForm.cantidadSugerida}
                    onChange={(e) =>
                      setDetalleForm({ ...detalleForm, cantidadSugerida: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Costo estimado</label>
                  <input
                    value={detalleForm.costoEstimado}
                    onChange={(e) =>
                      setDetalleForm({ ...detalleForm, costoEstimado: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !selectedOrdenId}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                <Plus size={16} />
                {editingDetalleId ? 'Actualizar detalle' : 'Agregar detalle'}
              </button>
            </form>
          </article>
        </section>

        <section className="space-y-6">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <label className="relative block">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar orden por id, estado o prompt"
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3"
                />
              </label>

              <select
                value={estadoFiltro}
                onChange={(e) =>
                  setEstadoFiltro(e.target.value as 'TODOS' | EstadoOrdenCompra)
                }
                className="rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="SUGERIDA">SUGERIDA</option>
                <option value="APROBADA">APROBADA</option>
                <option value="RECHAZADA">RECHAZADA</option>
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Aprobador</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Cargando órdenes...
                        </td>
                      </tr>
                    ) : ordenesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No hay órdenes para esos filtros.
                        </td>
                      </tr>
                    ) : (
                      ordenesFiltradas.map((orden) => {
                        const ordenId = Number(orden.id)
                        const active = selectedOrdenId === ordenId
                        return (
                          <tr
                            key={orden.id}
                            className={active ? 'bg-blue-50/60' : ''}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">#{orden.id}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(orden.fechaGeneracion)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(orden.estado)}`}
                              >
                                {orden.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {orden.usuarioAprobador?.username ?? orden.usuarioAprobador?.id ?? '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrdenId(ordenId)
                                    iniciarEdicionOrden(orden)
                                  }}
                                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                                  title="Editar"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrdenId(ordenId)}
                                  className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50"
                                  title="Seleccionar"
                                >
                                  <ShieldCheck size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void eliminarOrden(orden.id)}
                                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
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
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Detalles de orden {ordenSeleccionada ? `#${ordenSeleccionada.id}` : ''}
              </h3>
              <span className="text-xs text-slate-500">{detalles.length} ítems</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Cantidad</th>
                      <th className="px-4 py-3 font-medium">Costo estimado</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {!selectedOrdenId ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Selecciona una orden para ver sus detalles.
                        </td>
                      </tr>
                    ) : detalles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Esta orden no tiene detalles aún.
                        </td>
                      </tr>
                    ) : (
                      detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td className="px-4 py-3 text-slate-600">#{detalle.id}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {detalle.producto?.nombre ?? `Producto #${detalle.producto?.id ?? 'N/D'}`}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{detalle.cantidadSugerida}</td>
                          <td className="px-4 py-3 text-slate-700">{detalle.costoEstimado ?? '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => iniciarEdicionDetalle(detalle)}
                                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                                title="Editar detalle"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void eliminarDetalle(detalle.id)}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                title="Eliminar detalle"
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

            {ordenSeleccionada?.estado === 'APROBADA' && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Orden aprobada
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  )
}

export default OrdenesPage