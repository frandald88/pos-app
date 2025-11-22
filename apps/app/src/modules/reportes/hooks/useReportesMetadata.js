import { useState, useEffect } from 'react';
import axios from 'axios';
import apiBaseUrl from '../../../config/api';

export const useReportesMetadata = () => {
  const [tiendas, setTiendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadMetadata = async () => {
      try {
        setLoading(true);

        // Cargar tiendas
        const tiendasResponse = await axios.get(`${apiBaseUrl}/api/tiendas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTiendas(tiendasResponse.data.data.tiendas || []);

        // Cargar categorías
        const categoriasResponse = await axios.get(`${apiBaseUrl}/api/products/categories-with-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(categoriasResponse.data) && categoriasResponse.data[0]?._id) {
          const sortedCategories = categoriasResponse.data.map(item => item._id);
          setCategorias(sortedCategories);
        } else {
          setCategorias(categoriasResponse.data.sort());
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  return {
    tiendas,
    categorias,
    loading
  };
};
