export interface Categoria {
  id: number
  nombre?: string
  descripcion?: string
}

export interface Producto {
  id?: number
  sku: string
  nombre: string
  descripcion?: string
  precio: string
  stockActual: number
  stockMinimo: number
  categoria?: Categoria
}

export interface StockDataDTO {
  nombre: string
  actual: number
  minimo: number
}

export interface SugerenciaIA {
  cantidad_sugerida?: number
  prioridad?: string
  razon?: string
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA'

export interface MovimientoProductoRef {
  id: number
  sku?: string
  nombre?: string
  stockActual?: number
}

export interface MovimientoUsuarioRef {
  id: number
  username?: string
  role?: string
}

export interface MovimientoInventario {
  id?: number
  producto: MovimientoProductoRef
  usuario: MovimientoUsuarioRef
  tipo: TipoMovimiento
  cantidad: number
  fecha?: string
}

export interface MovimientoInventarioPayload {
  producto: { id: number }
  usuario: { id: number }
  tipo: TipoMovimiento
  cantidad: number
}

export type RolUsuario = 'ADMIN' | 'BODEGUERO'

export interface UsuarioOperativo {
  id?: number
  username: string
  passwordHash: string
  rol: RolUsuario
}
