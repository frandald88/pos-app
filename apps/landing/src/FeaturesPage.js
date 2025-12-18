import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SVG Icons for categories
  const categoryIcons = {
    all: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"/></svg>,
    sales: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    inventory: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    staff: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    restaurant: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
    delivery: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    reports: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
  };

  const categories = [
    { id: 'all', name: 'Todas', icon: categoryIcons.all },
    { id: 'sales', name: 'Ventas', icon: categoryIcons.sales },
    { id: 'inventory', name: 'Inventario', icon: categoryIcons.inventory },
    { id: 'staff', name: 'Personal', icon: categoryIcons.staff },
    { id: 'restaurant', name: 'Restaurante', icon: categoryIcons.restaurant },
    { id: 'delivery', name: 'Delivery', icon: categoryIcons.delivery },
    { id: 'reports', name: 'Reportes', icon: categoryIcons.reports }
  ];

  const features = [
    // Ventas y Punto de Venta
    {
      category: 'sales',
      title: 'Punto de Venta Intuitivo',
      description: 'Interfaz moderna y rápida diseñada para agilizar cada transacción. Reduce tiempos de espera y mejora la experiencia del cliente.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
      benefits: [
        'Diseño minimalista y fácil de usar',
        'Teclado numérico optimizado',
        'Búsqueda rápida de productos',
        'Atajos de teclado personalizables'
      ]
    },
    {
      category: 'sales',
      title: 'Múltiples Métodos de Pago',
      description: 'Acepta efectivo, tarjetas, transferencias y pagos mixtos. Flexibilidad total para tus clientes.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>,
      benefits: [
        'Efectivo con cálculo automático de cambio',
        'Terminal de tarjetas integrada',
        'Transferencias bancarias',
        'Pagos mixtos (combina métodos)'
      ]
    },
    {
      category: 'sales',
      title: 'Corte de Caja Automático',
      description: 'Cierra tu día en segundos. Concilia ventas, pagos y efectivo con precisión absoluta.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
      benefits: [
        'Pre-corte durante el turno',
        'Corte final automático',
        'Detalle de ingresos y egresos',
        'Exportación a PDF'
      ]
    },
    {
      category: 'sales',
      title: 'Gestión de Clientes (CRM)',
      description: 'Perfil completo de cada cliente, historial de compras y programas de lealtad integrados.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      benefits: [
        'Registro rápido de clientes',
        'Historial de compras completo',
        'Notas y preferencias',
        'Segmentación por consumo'
      ]
    },
    {
      category: 'sales',
      title: 'Devoluciones Simplificadas',
      description: 'Procesa cambios y reembolsos manteniendo tu inventario y caja siempre actualizados.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
      benefits: [
        'Devolución parcial o total',
        'Reintegro automático al inventario',
        'Nota de crédito automática',
        'Trazabilidad completa'
      ]
    },

    // Inventario y Compras
    {
      category: 'inventory',
      title: 'Control de Inventario en Tiempo Real',
      description: 'Gestiona tus productos, stock y alertas de forma automática. Nunca más te quedes sin stock.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
      benefits: [
        'Actualización automática con cada venta',
        'Alertas de stock bajo personalizables',
        'Categorización flexible',
        'SKU automático o personalizado'
      ]
    },
    {
      category: 'inventory',
      title: 'Gestión de Compras y Proveedores',
      description: 'Crea órdenes de compra, gestiona proveedores y mantén tu inventario siempre optimizado.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      benefits: [
        'Órdenes de compra automatizadas',
        'Registro de proveedores',
        'Reabastecimiento inteligente',
        'Historial de compras'
      ]
    },
    {
      category: 'inventory',
      title: 'Transferencias entre Tiendas',
      description: 'Mueve inventario entre sucursales manteniendo trazabilidad completa de cada movimiento.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      benefits: [
        'Solicitudes de transferencia',
        'Aprobación y seguimiento',
        'Ajuste automático de inventarios',
        'Reportes de movimientos'
      ]
    },

    // Gestión de Personal
    {
      category: 'staff',
      title: 'Control de Asistencia Automatizado',
      description: 'Registra entradas, salidas, horas extras y tardanzas sin esfuerzo. Todo en un solo lugar.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      benefits: [
        'Registro de entrada/salida',
        'Cálculo automático de horas',
        'Control de tardanzas',
        'Exportación para nómina'
      ]
    },
    {
      category: 'staff',
      title: 'Gestión de Horarios y Turnos',
      description: 'Planifica turnos, evita conflictos y optimiza la distribución de tu equipo.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      benefits: [
        'Calendario visual de turnos',
        'Asignación por tienda',
        'Notificaciones automáticas',
        'Prevención de sobrelapamiento'
      ]
    },
    {
      category: 'staff',
      title: 'Administración de Vacaciones',
      description: 'Gestión inteligente de vacaciones. Aprueba solicitudes, calcula días disponibles y evita conflictos.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 1 0-9.78 2.096A4.001 4.001 0 0 0 3 15z"/></svg>,
      benefits: [
        'Cálculo automático según antigüedad',
        'Workflow de aprobación',
        'Calendario de ausencias',
        'Gestión de reemplazos'
      ]
    },
    {
      category: 'staff',
      title: 'Historial y Evaluaciones',
      description: 'Mantén un registro completo de cada empleado: evaluaciones, incidencias y rendimiento.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
      benefits: [
        'Perfil completo del empleado',
        'Historial de incidencias',
        'Evaluaciones de desempeño',
        'Documentos adjuntos'
      ]
    },

    // Operación de Restaurante
    {
      category: 'restaurant',
      title: 'Gestión de Mesas y Salón',
      description: 'Administra las mesas de tu restaurante con mapas visuales, asignación de meseros y control de ocupación.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      benefits: [
        'Mapa visual del salón',
        'Estados de mesa en tiempo real',
        'Asignación de meseros',
        'Unión y división de mesas'
      ]
    },
    {
      category: 'restaurant',
      title: 'División Inteligente de Cuentas',
      description: 'Separa las cuentas de tus comensales con un clic. Por persona, por consumo o personalizado.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
      benefits: [
        'División equitativa automática',
        'División por productos',
        'División personalizada',
        'Múltiples métodos de pago por cuenta'
      ]
    },
    {
      category: 'restaurant',
      title: 'Sistema de Comandas (KDS)',
      description: 'Da seguimiento a preparación y entrega en tiempo real. Cocina y servicio sincronizados.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      benefits: [
        'Comandas digitales a cocina',
        'Estados de preparación',
        'Priorización de órdenes',
        'Notificaciones en tiempo real'
      ]
    },
    {
      category: 'restaurant',
      title: 'Gestión de Reservaciones',
      description: 'Administra reservas, optimiza ocupación y mejora la experiencia de tus clientes.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>,
      benefits: [
        'Calendario de reservaciones',
        'Confirmación automática',
        'Gestión de lista de espera',
        'Notas especiales por mesa'
      ]
    },

    // Delivery y Logística
    {
      category: 'delivery',
      title: 'Seguimiento de Entregas en Tiempo Real',
      description: 'Asignación de repartidores, seguimiento de estados y optimización de rutas.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
      benefits: [
        'Asignación automática o manual',
        'Estados: preparando, en camino, entregado',
        'Historial completo de entregas',
        'Métricas de rendimiento'
      ]
    },
    {
      category: 'delivery',
      title: 'Gestión de Zonas de Entrega',
      description: 'Define áreas de cobertura, tarifas por zona y tiempos estimados de entrega.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      benefits: [
        'Mapa de zonas de cobertura',
        'Costos de envío por zona',
        'Tiempo estimado por área',
        'Restricciones de horario'
      ]
    },
    {
      category: 'delivery',
      title: 'Panel de Repartidores',
      description: 'Seguimiento individual de cada repartidor: órdenes asignadas, ubicación y estadísticas.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
      benefits: [
        'Vista de órdenes activas',
        'Historial de entregas',
        'Métricas de desempeño',
        'Tiempos promedio'
      ]
    },

    // Reportes y Analytics
    {
      category: 'reports',
      title: 'Reportes en Tiempo Real',
      description: 'Visualiza tus ventas, gastos y ganancias al instante con dashboards intuitivos y personalizables.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
      benefits: [
        'Dashboard ejecutivo en tiempo real',
        'Gráficas interactivas',
        'KPIs personalizables',
        'Actualización automática'
      ]
    },
    {
      category: 'reports',
      title: 'Análisis de Ventas Avanzado',
      description: 'Reportes detallados por producto, categoría, vendedor, tienda y período de tiempo.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      benefits: [
        'Top productos vendidos',
        'Análisis por categoría',
        'Comparativas de períodos',
        'Tendencias de venta'
      ]
    },
    {
      category: 'reports',
      title: 'Reportes de Rentabilidad',
      description: 'Analiza márgenes, costos y utilidades. Identifica tus productos más rentables.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      benefits: [
        'Análisis de márgenes por producto',
        'Productos más rentables',
        'Costo vs precio de venta',
        'Recomendaciones de precios'
      ]
    },
    {
      category: 'reports',
      title: 'Exportación Multi-formato',
      description: 'Exporta todos tus reportes a Excel, PDF o CSV para análisis externos.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
      benefits: [
        'Exportación a Excel',
        'Generación de PDF',
        'Formato CSV para importar',
        'Programación de reportes automáticos'
      ]
    },

    // Multi-tienda
    {
      category: 'sales',
      title: 'Gestión Multi-tienda',
      description: 'Administra múltiples sucursales desde un solo lugar. Control centralizado, operación independiente.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      benefits: [
        'Vista consolidada de todas las tiendas',
        'Inventarios independientes',
        'Reportes por tienda o consolidados',
        'Configuración individual por sucursal'
      ]
    }
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.category === activeCategory);

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <a href="#/">
                <img src="/astrodishlogo1.png" alt="AstroDish" style={{height: '40px'}} />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="nav-links">
              <a href="#/">Inicio</a>
              <a href="#/features">Características</a>
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="#contact">Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary">Iniciar Sesión</a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{display: 'none'}}
              aria-label="Toggle menu"
            >
              <span style={{transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none'}}></span>
              <span style={{opacity: mobileMenuOpen ? 0 : 1}}></span>
              <span style={{transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'}}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem 0',
              borderTop: '1px solid var(--gray-200)',
              marginTop: '1rem'
            }}>
              <a href="#/" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Inicio</a>
              <a href="#/features" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Características</a>
              <a href={`${APP_URL}/pricing`} onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Precios</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary" onClick={() => setMobileMenuOpen(false)} style={{marginTop: '0.5rem'}}>Iniciar Sesión</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{paddingTop: '120px', paddingBottom: '60px'}}>
        <div className="container">
          <div className="hero-content">
            <h1>Todas las Características que Necesitas</h1>
            <p className="hero-subtitle">
              Descubre cómo AstroDish POS puede transformar la gestión de tu negocio con herramientas profesionales y fáciles de usar.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section style={{background: 'var(--bg-light)', padding: '2rem 0'}}>
        <div className="container">
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            justifyContent: 'center',
            padding: '0.5rem 0',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--gray-300) transparent'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeCategory === cat.id ? 'var(--primary)' : 'white',
                  color: activeCategory === cat.id ? 'white' : 'var(--gray-700)',
                  border: activeCategory === cat.id ? 'none' : '2px solid var(--gray-200)',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: activeCategory === cat.id ? 'var(--shadow)' : 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.id) {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.id) {
                    e.target.style.borderColor = 'var(--gray-200)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{display: 'flex', alignItems: 'center', width: '16px', height: '16px'}}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{padding: '4rem 0'}}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {filteredFeatures.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--gray-100)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: 'white'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  color: 'var(--gray-800)'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: 'var(--gray-600)',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  {feature.description}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--gray-600)'
                    }}>
                      <span style={{
                        color: 'var(--success)',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        lineHeight: '1'
                      }}>✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              ¿Listo para transformar tu negocio?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '2rem',
              opacity: 0.95
            }}>
              Agenda una demostración personalizada y descubre cómo AstroDish POS puede ayudarte a crecer
            </p>
            <a
              href="#contact"
              className="btn-secondary btn-large"
              style={{
                background: 'white',
                color: 'var(--primary)',
                display: 'inline-block'
              }}
            >
              Solicitar Demo Gratuita
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <img src="/Astrodish_logo_2.png" alt="AstroDish" style={{height: '50px', marginBottom: '1rem'}} />
              <p>AstroDish POS - El sistema en la nube que impulsa tu negocio.</p>
            </div>
            <div className="footer-section">
              <h4>Producto</h4>
              <a href="#/features">Características</a>
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="#contact">Contacto</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#/terms">Términos de Servicio</a>
              <a href="#/privacy">Privacidad</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AstroDish. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default FeaturesPage;
