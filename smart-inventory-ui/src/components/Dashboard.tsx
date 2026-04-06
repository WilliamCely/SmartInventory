import { useEffect, useState } from 'react'
import { AlertTriangle, BrainCircuit, Boxes } from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type { Producto } from '../types/inventory'

function Dashboard() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await inventoryService.getProductos()
      setProductos(res.data)
    } catch {
      setError('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const pedirSugerenciaIA = async (p: Producto) => {
    try {
      const res = await inventoryService.analizarConIA({
        nombre: p.nombre,
        actual: p.stockActual,
        minimo: p.stockMinimo,
      })
      const respuesta =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      window.alert(`Sugerencia de Gemini:\n${respuesta}`)
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'No se pudo obtener sugerencia de IA'

      window.alert(`No se pudo obtener sugerencia de IA: ${backendMessage}`)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  return (
    <main className="text-slate-900">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Boxes size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SmartInventory Dashboard</h1>
              <p className="text-sm text-slate-500">
                Control de stock y asistencia inteligente
              </p>
            </div>
          </div>
          <button
            onClick={() => void cargarDatos()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
            Cargando inventario...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((p) => {
              const stockCritico = p.stockActual <= p.stockMinimo
              return (
                <article
                  key={p.id ?? p.sku}
                  className="rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{p.nombre}</h2>
                      <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      Min: {p.stockMinimo}
                    </span>
                  </div>

                  <p className="text-3xl font-bold">{p.stockActual}</p>
                  <p className="mb-4 text-sm text-slate-500">Stock actual</p>

                  {stockCritico ? (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700">
                      <AlertTriangle size={16} />
                      <span className="text-xs font-medium">Stock crítico</span>
                      <button
                        onClick={() => void pedirSugerenciaIA(p)}
                        className="ml-auto rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                        title="Pedir sugerencia IA"
                      >
                        <BrainCircuit size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center text-xs font-medium text-emerald-700">
                      Stock saludable
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard
