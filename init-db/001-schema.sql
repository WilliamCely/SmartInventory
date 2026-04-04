-- Estructura para el Sistema de Inventario Inteligente "SmartInventory"

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL CHECK (precio >= 0),
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'BODEGUERO'))
);

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ordenes_compra_ai (
    id SERIAL PRIMARY KEY,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prompt_usado TEXT,
    respuesta_raw_json JSONB,
    estado VARCHAR(20) DEFAULT 'SUGERIDA' CHECK (estado IN ('SUGERIDA', 'APROBADA', 'RECHAZADA')),
    usuario_aprobador_id INTEGER REFERENCES usuarios(id)
);

CREATE TABLE detalle_orden_compra (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL REFERENCES ordenes_compra_ai(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad_sugerida INTEGER NOT NULL CHECK (cantidad_sugerida > 0),
    costo_estimado DECIMAL(12, 2)
);

-- Índices de Rendimiento
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);
