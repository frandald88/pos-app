export default function OrderStats({ statusOptions, statusStats }) {
  return (
    <div className="flex gap-4">
      {statusOptions.map((status) => {
        const count = statusStats[status.value] || 0;
        return (
          <div 
            key={status.value}
            className="text-center p-3 bg-white rounded-lg shadow-sm border"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="text-xl">{status.icon}</div>
            <div className="text-lg font-bold" style={{ color: '#23334e' }}>
              {count}
            </div>
            <div className="text-xs" style={{ color: '#697487' }}>
              {status.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}