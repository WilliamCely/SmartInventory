# Checklist UAT - SmartInventory (RF01 a RF05)

## Precondiciones
1. Levantar eureka-server, auth-service, inventory-service, ai-service, api-gateway y base de datos.
2. Verificar que API Gateway responda en http://localhost:8080.
3. Contar con usuarios de prueba:
- ADMIN: admin / admin123
- BODEGUERO: bodeguero / bodega123

## RF01 - Gestión CRUD (Productos y Categorías)
### RF01.1 Crear categoría
1. Iniciar sesión como ADMIN.
2. Ir a Categorías.
3. Crear categoría con nombre nuevo.
4. Resultado esperado: categoría visible en listado.

### RF01.2 Editar categoría
1. Editar descripción de categoría existente.
2. Resultado esperado: cambios persistidos al recargar.

### RF01.3 Eliminar categoría
1. Eliminar categoría sin dependencias críticas.
2. Resultado esperado: desaparece del listado.

### RF01.4 Crear producto
1. Ir a Productos.
2. Crear producto con SKU único y categoría asociada.
3. Resultado esperado: producto visible en tabla.

### RF01.5 Leer producto por id
1. Consumir GET /api/v1/inventory/{id} con token válido.
2. Resultado esperado: retorna el producto correcto.

### RF01.6 Actualizar producto
1. Editar nombre/descripción/precio/stock_minimo de producto.
2. Resultado esperado: cambios visibles en tabla y backend.

### RF01.7 Eliminar producto
1. Eliminar producto.
2. Resultado esperado: no aparece en listado.

## RF02 - Carga Inicial (Importación masiva)
### RF02.1 Dry-run válido
1. Iniciar sesión como ADMIN.
2. Ir a Importación.
3. Cargar CSV válido en modo simulación.
4. Resultado esperado:
- processedRows > 0
- errors = 0
- dryRun = true
- No cambios persistidos en DB.

### RF02.2 Importación real válida
1. Desactivar modo simulación.
2. Repetir con CSV válido.
3. Resultado esperado:
- Productos creados/actualizados > 0
- Categorías creadas según corresponda
- Datos visibles en UI de Productos y Categorías.

### RF02.3 CSV inválido
1. Subir archivo sin columnas requeridas o con datos inválidos.
2. Resultado esperado: errores por fila con mensaje claro.

## RF03 - Control de Movimientos (Auditoría obligatoria)
### RF03.1 Entrada incrementa stock
1. Registrar ENTRADA para producto.
2. Resultado esperado: stock sube en backend y queda movimiento auditado.

### RF03.2 Salida decrementa stock
1. Registrar SALIDA para producto.
2. Resultado esperado: stock baja y queda movimiento auditado.

### RF03.3 Edición de movimiento recalcula stock
1. Editar cantidad/tipo de movimiento existente.
2. Resultado esperado: stock recalculado correctamente.

### RF03.4 Eliminación de movimiento revierte stock
1. Eliminar movimiento.
2. Resultado esperado: stock revierte su impacto.

### RF03.5 Protección de stock negativo
1. Intentar SALIDA que deje stock < 0.
2. Resultado esperado: operación rechazada (400) y stock sin cambios.

## RF04 - Análisis IA (Sugerencia automática)
### RF04.1 Disparo automático por stock crítico
1. Llevar producto a stock_actual <= stock_minimo mediante movimientos.
2. Resultado esperado:
- Se crea orden en ordenes_compra_ai estado SUGERIDA.
- Se crea detalle asociado en detalle_orden_compra.

### RF04.2 No duplicar sugerencias activas
1. Repetir movimientos críticos sobre mismo producto con sugerencia activa.
2. Resultado esperado: no crear duplicado SUGERIDA para ese producto.

### RF04.3 Fallback cuando IA no responde
1. Simular indisponibilidad de ai-service.
2. Resultado esperado: se crea sugerencia con fallback automático.

## RF05 - Seguridad por roles
### RF05.1 Autenticación JWT
1. Login con admin.
2. Resultado esperado: access token válido.

### RF05.2 ADMIN accede a Usuarios e Importación
1. Navegar a /app/usuarios y /app/importacion como ADMIN.
2. Resultado esperado: acceso permitido.

### RF05.3 BODEGUERO restringido en rutas ADMIN
1. Login como BODEGUERO.
2. Intentar /app/usuarios y /app/importacion.
3. Resultado esperado: redirección a dashboard o denegación.

### RF05.4 Acceso API con token inválido
1. Llamar /api/v1/inventory/** sin token o token inválido.
2. Resultado esperado: 401/403.

## Criterio de salida
1. Todos los casos críticos RF03, RF04, RF05 en estado OK.
2. RF01 y RF02 sin errores bloqueantes.
3. Evidencia capturada: capturas UI + respuestas API clave.
