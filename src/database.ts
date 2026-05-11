export interface Producto {
  id: string;
  nombre: string;
  precio_unidad: number;
  stock: number;
  vendedor_id: string;
  imagen_url?: string;
}

export interface Perfil {
  id: string;
  nombre_empresa: string;
  tipo_negocio: 'Mayorista' | 'Minorista' | 'Distribuidor';
}