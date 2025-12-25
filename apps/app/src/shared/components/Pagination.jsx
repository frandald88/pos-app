import React from 'react';

const Icons = {
  chevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  dotsHorizontal: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  )
};

/**
 * Componente de Paginación Profesional
 *
 * @param {object} pagination - Objeto con info de paginación { page, limit, total, pages }
 * @param {function} onPageChange - Callback cuando cambia la página
 * @param {function} onLimitChange - Callback cuando cambia el límite (opcional)
 * @param {array} limitOptions - Opciones para el límite (default: [25, 50, 100, 200])
 */
export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [25, 50, 100, 200]
}) {
  const { page = 1, limit = 100, total = 0, pages = 0 } = pagination;

  if (!total || pages <= 1) {
    // Si no hay suficientes resultados para paginar, solo mostrar info
    if (total === 0) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center text-sm text-gray-700">
          Mostrando <span className="font-medium mx-1">{total}</span>
          {total === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>
    );
  }

  // Calcular rango de resultados mostrados
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 7; // Mostrar máximo 7 números de página

    if (pages <= maxPagesToShow) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pageNumbers.push(1);

      if (page > 3) {
        pageNumbers.push('...');
      }

      // Mostrar páginas alrededor de la actual
      const start = Math.max(2, page - 1);
      const end = Math.min(pages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (page < pages - 2) {
        pageNumbers.push('...');
      }

      // Siempre mostrar última página
      pageNumbers.push(pages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Info de resultados */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Mostrando <span className="font-medium">{startIndex}</span> a{' '}
          <span className="font-medium">{endIndex}</span> de{' '}
          <span className="font-medium">{total}</span> resultados
        </span>

        {/* Selector de límite (opcional) */}
        {onLimitChange && (
          <div className="ml-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Por página:</label>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      <nav className="flex items-center gap-2">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`
            inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-200
            ${page === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          <Icons.chevronLeft />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-400"
                >
                  <Icons.dotsHorizontal />
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${pageNum === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Info de página actual (solo móvil) */}
        <div className="sm:hidden px-3 py-2 text-sm text-gray-700">
          Página <span className="font-medium">{page}</span> de{' '}
          <span className="font-medium">{pages}</span>
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className={`
            inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-200
            ${page === pages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <Icons.chevronRight />
        </button>
      </nav>
    </div>
  );
}
