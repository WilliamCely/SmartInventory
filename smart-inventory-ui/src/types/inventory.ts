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
