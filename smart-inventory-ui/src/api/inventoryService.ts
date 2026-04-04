import api from './axiosConfig'
import type { Categoria, Producto, StockDataDTO } from '../types/inventory'

export const inventoryService = {
  getCategorias: () => api.get<Categoria[]>('/inventory/categorias'),

  getProductos: () => api.get<Producto[]>('/inventory'),
  createProducto: (producto: Producto) => api.post('/inventory', producto),
  updateProducto: (id: number, producto: Producto) =>
    api.put(`/inventory/${id}`, producto),
  deleteProducto: (id: number) => api.delete(`/inventory/${id}`),

  analizarConIA: (data: StockDataDTO) => api.post('/ai/analyze-stock', data),
}
