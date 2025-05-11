
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/components/ui/sidebar';

export function useMobile() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile nav when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  return {
    isMobile,
    mobileOpen,
    setMobileOpen
  };
}
