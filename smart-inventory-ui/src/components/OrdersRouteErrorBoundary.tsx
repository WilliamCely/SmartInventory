import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class OrdersRouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h2 className="text-xl font-semibold">La pantalla de órdenes tuvo un error</h2>
          <p className="mt-2 text-sm">
            La vista se protegió para evitar una pantalla en blanco. Vuelve a cargar la página.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default OrdersRouteErrorBoundary
