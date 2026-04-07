import { useMemo, useState } from 'react'
import { FileUp, RefreshCcw, ShieldAlert } from 'lucide-react'
import { inventoryService } from '../api/inventoryService'
import type { ProductosImportResult } from '../types/inventory'

function sampleCsv() {
  return [
    'sku,nombre,descripcion,precio,stock_actual,stock_minimo,categoria,categoria_descripcion',
    'SKU-001,Teclado mecanico,Switch blue,120000,20,5,Perifericos,Accesorios de computo',
    'SKU-002,Mouse inalambrico,Conexion 2.4G,65000,35,10,Perifericos,Accesorios de computo',
  ].join('\n')
}

function ImportacionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProductosImportResult | null>(null)

  const hasErrors = useMemo(() => (result?.errors?.length ?? 0) > 0, [result])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Selecciona un archivo CSV para continuar')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await inventoryService.importProductosCsv(file, dryRun)
      setResult(res.data)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'No se pudo importar el archivo'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setDryRun(true)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
          <FileUp size={14} />
          Carga inicial masiva
        </p>
        <h2 className="text-2xl font-semibold">Importación de productos y categorías (CSV)</h2>
        <p className="mt-2 text-sm text-slate-300">
          Sube archivos estructurados para migrar datos legados. Usa modo simulación para validar antes de aplicar.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Archivo CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <p className="mt-2 text-xs text-slate-500">
              Columnas requeridas: sku, nombre, precio, stock_actual, stock_minimo, categoria.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4"
            />
            Ejecutar en modo simulación (dry-run)
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              <FileUp size={16} />
              {loading ? 'Procesando...' : 'Importar CSV'}
            </button>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Reiniciar
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Formato recomendado</h3>
        <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{sampleCsv()}</pre>
      </section>

      {result && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Resultado de importación</h3>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase text-slate-500">Filas leídas</p>
              <p className="text-2xl font-semibold text-slate-900">{result.totalRows}</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase text-slate-500">Filas procesadas</p>
              <p className="text-2xl font-semibold text-slate-900">{result.processedRows}</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase text-slate-500">Errores</p>
              <p className="text-2xl font-semibold text-slate-900">{result.errors.length}</p>
            </article>
          </div>

          <div className="mt-3 text-sm text-slate-700">
            <p>Modo: <strong>{result.dryRun ? 'Simulación' : 'Aplicado en base de datos'}</strong></p>
            <p>Productos creados: <strong>{result.createdProductos}</strong></p>
            <p>Productos actualizados: <strong>{result.updatedProductos}</strong></p>
            <p>Categorías nuevas: <strong>{result.createdCategorias}</strong></p>
          </div>

          {hasErrors && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
                <ShieldAlert size={16} />
                Errores por fila
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-amber-900">
                    <tr>
                      <th className="px-2 py-1">Fila</th>
                      <th className="px-2 py-1">SKU</th>
                      <th className="px-2 py-1">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, idx) => (
                      <tr key={`${e.row}-${idx}`} className="border-t border-amber-200">
                        <td className="px-2 py-1">{e.row}</td>
                        <td className="px-2 py-1">{e.sku || '-'}</td>
                        <td className="px-2 py-1">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default ImportacionPage
