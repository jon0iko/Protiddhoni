'use client';

import { useEffect } from 'react';
import { initializeBengaliNumbers } from '@/lib/numberFormatter';

/**
 * Component to initialize Bengali number formatting globally
 * This should be included once at the app root level
 */
export default function BengaliNumberInit() {
  useEffect(() => {
    // Initialize Bengali number formatting when app mounts
    initializeBengaliNumbers();
  }, []);

  return null; // This component doesn't render anything
}
