import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import logoImage from '../assets/inventory-logo.svg'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await login({ username, password })
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <img
          src={logoImage}
          alt="Logo de inventario"
          className="absolute right-4 top-4 h-10 w-10 rounded-md border border-slate-200 bg-slate-50 p-1"
        />

        <h1 className="mb-2 pr-16 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-slate-500">Ingresa tus credenciales para continuar.</p>

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Usuario
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Tu usuario"
        />

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="••••••••"
        />

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
