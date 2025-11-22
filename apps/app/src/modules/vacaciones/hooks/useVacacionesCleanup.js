import { useState } from 'react';

export default function useVacacionesCleanup() {
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState({
    months: 12,
    status: 'all',
    action: 'soft'
  });

  const updateCleanupOptions = (newOptions) => {
    setCleanupOptions(prev => ({ ...prev, ...newOptions }));
  };

  const resetCleanupOptions = () => {
    setCleanupOptions({
      months: 12,
      status: 'all',
      action: 'soft'
    });
  };

  return {
    showCleanupModal,
    setShowCleanupModal,
    cleanupOptions,
    updateCleanupOptions,
    resetCleanupOptions
  };
}
