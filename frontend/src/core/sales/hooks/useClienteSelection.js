import { useState, useEffect, useMemo } from 'react';

export const useClienteSelection = (clientes) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // Efecto para manejar cliente preseleccionado desde localStorage
  useEffect(() => {
    const preselectedCliente = localStorage.getItem('clienteSeleccionado');
    if (preselectedCliente && clientes.length > 0) {
      setClienteSeleccionado(preselectedCliente);
      const clienteInfo = clientes.find(c => c._id === preselectedCliente);
      if (clienteInfo) setClienteFiltro(clienteInfo.nombre);
      localStorage.removeItem('clienteSeleccionado');
    }
  }, [clientes]);

  // Manejar cambio en el filtro de clientes
  const handleClienteFilterChange = (e) => {
    setClienteFiltro(e.target.value);
    setShowClienteDropdown(true);
  };

  // Seleccionar cliente
  const selectCliente = (cliente) => {
    setClienteSeleccionado(cliente._id);
    setClienteFiltro(cliente.nombre);
    setShowClienteDropdown(false);
  };

  // Limpiar selección de cliente
  const clearClienteSelection = () => {
    setClienteSeleccionado('');
    setClienteFiltro('');
    setShowClienteDropdown(false);
  };

  // Clientes filtrados para el dropdown
  const filteredClientes = useMemo(() => {
    if (!clienteFiltro || !clientes.length) return [];
    
    return clientes
      .filter(c =>
        c.nombre.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
        c.telefono.includes(clienteFiltro) ||
        c.email.toLowerCase().includes(clienteFiltro.toLowerCase())
      )
      .slice(0, 5);
  }, [clientes, clienteFiltro]);

  // Información del cliente seleccionado
  const selectedClienteInfo = useMemo(() => {
    if (!clienteSeleccionado || !clientes.length) return null;
    return clientes.find(c => c._id === clienteSeleccionado);
  }, [clienteSeleccionado, clientes]);

  return {
    // State
    clienteSeleccionado,
    clienteFiltro,
    showClienteDropdown,
    filteredClientes,
    selectedClienteInfo,
    
    // Actions
    setClienteSeleccionado,
    setClienteFiltro,
    setShowClienteDropdown,
    handleClienteFilterChange,
    selectCliente,
    clearClienteSelection
  };
};