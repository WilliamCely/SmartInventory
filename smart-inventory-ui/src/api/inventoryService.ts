import api from './axiosConfig'
import type {
  Categoria,
  DetalleOrdenCompra,
  DetalleOrdenCompraPayload,
  EstadoOrdenCompra,
  MovimientoInventario,
  MovimientoInventarioPayload,
  OrdenCompraAi,
  OrdenCompraAiPayload,
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

  getOrdenesCompra: (estado?: EstadoOrdenCompra) =>
    api.get<OrdenCompraAi[]>('/inventory/ordenes-compra', {
      params: estado ? { estado } : undefined,
    }),
  createOrdenCompra: (orden: OrdenCompraAiPayload) =>
    api.post<OrdenCompraAi>('/inventory/ordenes-compra', orden),
  updateOrdenCompra: (id: number, orden: OrdenCompraAiPayload) =>
    api.put<OrdenCompraAi>(`/inventory/ordenes-compra/${id}`, orden),
  deleteOrdenCompra: (id: number) => api.delete(`/inventory/ordenes-compra/${id}`),

  getDetallesOrden: (ordenId?: number) =>
    api.get<DetalleOrdenCompra[]>('/inventory/detalles-orden', {
      params: ordenId ? { ordenId } : undefined,
    }),
  createDetalleOrden: (detalle: DetalleOrdenCompraPayload) =>
    api.post<DetalleOrdenCompra>('/inventory/detalles-orden', detalle),
  updateDetalleOrden: (id: number, detalle: DetalleOrdenCompraPayload) =>
    api.put<DetalleOrdenCompra>(`/inventory/detalles-orden/${id}`, detalle),
  deleteDetalleOrden: (id: number) => api.delete(`/inventory/detalles-orden/${id}`),

  getUsuarios: () => api.get<UsuarioOperativo[]>('/inventory/usuarios'),
  createUsuario: (usuario: UsuarioOperativo) =>
    api.post<UsuarioOperativo>('/inventory/usuarios', usuario),
  updateUsuario: (id: number, usuario: UsuarioOperativo) =>
    api.put<UsuarioOperativo>(`/inventory/usuarios/${id}`, usuario),
  deleteUsuario: (id: number) => api.delete(`/inventory/usuarios/${id}`),

  analizarConIA: (data: StockDataDTO) => api.post('/ai/analyze-stock', data),
}
