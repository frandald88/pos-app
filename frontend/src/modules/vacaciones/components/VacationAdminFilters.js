import React from 'react';

export default function VacationAdminFilters({
  filters,
  onFilterChange,
  onApply
}) {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded">
      <h3 className="font-medium mb-2">Filtros</h3>
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Límite</label>
          <select
            value={filters.limit}
            onChange={(e) => onFilterChange({ limit: e.target.value })}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <button
          onClick={onApply}
          className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
