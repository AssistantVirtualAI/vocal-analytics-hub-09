
import { useState, useEffect } from 'react';

/**
 * Hook to manage the last updated timestamp
 */
export function useLastUpdated(isLoading: boolean, hasError: boolean, hasData: boolean) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!isLoading && !hasError && hasData) {
      setLastUpdated(new Date());
    }
  }, [isLoading, hasData, hasError]);

  // Format the "last updated" text
  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins === 1) return 'il y a 1 minute';
    if (diffMins < 60) return `il y a ${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'il y a 1 heure';
    return `il y a ${diffHours} heures`;
  };

  return {
    setLastUpdated,
    lastUpdated: formatLastUpdated()
  };
}
