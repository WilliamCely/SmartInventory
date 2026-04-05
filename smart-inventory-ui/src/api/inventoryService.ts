import api from './axiosConfig'
import type {
  Categoria,
  MovimientoInventario,
  MovimientoInventarioPayload,
  Producto,
  StockDataDTO,
  UsuarioOperativo,
} from '../types/inventory'

export const inventoryService = {
  getCategorias: () => api.get<Categoria[]>('/inventory/categorias'),

  getProductos: () => api.get<Producto[]>('/inventory'),
  createProducto: (producto: Producto) => api.post('/inventory', producto),
  updateProducto: (id: number, producto: Producto) =>
    api.put(`/inventory/${id}`, producto),
  deleteProducto: (id: number) => api.delete(`/inventory/${id}`),

  getMovimientos: () => api.get<MovimientoInventario[]>('/inventory/movimientos'),
  getMovimientosByProducto: (productoId: number) =>
    api.get<MovimientoInventario[]>(`/inventory/movimientos/producto/${productoId}`),
  createMovimiento: (movimiento: MovimientoInventarioPayload) =>
    api.post<MovimientoInventario>('/inventory/movimientos', movimiento),
  updateMovimiento: (id: number, movimiento: MovimientoInventarioPayload) =>
    api.put<MovimientoInventario>(`/inventory/movimientos/${id}`, movimiento),
  deleteMovimiento: (id: number) => api.delete(`/inventory/movimientos/${id}`),

  getUsuarios: () => api.get<UsuarioOperativo[]>('/inventory/usuarios'),
  createUsuario: (usuario: UsuarioOperativo) =>
    api.post<UsuarioOperativo>('/inventory/usuarios', usuario),
  updateUsuario: (id: number, usuario: UsuarioOperativo) =>
    api.put<UsuarioOperativo>(`/inventory/usuarios/${id}`, usuario),
  deleteUsuario: (id: number) => api.delete(`/inventory/usuarios/${id}`),

  analizarConIA: (data: StockDataDTO) => api.post('/ai/analyze-stock', data),
}
