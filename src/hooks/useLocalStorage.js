import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage
 * useState avec persistance automatique dans localStorage.
 * Si la clé n'existe pas encore, `defaultValue` (les données du fichier seoData)
 * est utilisé comme valeur initiale et immédiatement sauvegardé.
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`useLocalStorage: impossible de sauvegarder la clé "${key}"`);
    }
  }, [key, value]);

  // Reset vers la valeur par défaut (données initiales du fichier seoData)
  const reset = useCallback(() => setValue(defaultValue), [defaultValue]);

  return [value, setValue, reset];
}
