import React from 'react';

export default function VacationStats({ requests, showDeleted, deletedRequests }) {
  if (showDeleted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 p-3 rounded shadow border">
          <p className="text-sm text-gray-600">Total Eliminadas</p>
          <p className="text-xl font-bold text-red-800">{deletedRequests.length}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded shadow border">
          <p className="text-sm text-gray-600">Pueden Restaurarse</p>
          <p className="text-xl font-bold text-orange-800">{deletedRequests.length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div className="bg-white p-3 rounded shadow border">
        <p className="text-sm text-gray-600">Total</p>
        <p className="text-xl font-bold">{requests.length}</p>
      </div>
      <div className="bg-yellow-50 p-3 rounded shadow border">
        <p className="text-sm text-gray-600">Pendientes</p>
        <p className="text-xl font-bold text-yellow-800">
          {requests.filter(r => r.status === 'pendiente').length}
        </p>
      </div>
      <div className="bg-green-50 p-3 rounded shadow border">
        <p className="text-sm text-gray-600">Aprobadas</p>
        <p className="text-xl font-bold text-green-800">
          {requests.filter(r => r.status === 'aprobada').length}
        </p>
      </div>
      <div className="bg-red-50 p-3 rounded shadow border">
        <p className="text-sm text-gray-600">Rechazadas</p>
        <p className="text-xl font-bold text-red-800">
          {requests.filter(r => r.status === 'rechazada').length}
        </p>
      </div>
    </div>
  );
}
