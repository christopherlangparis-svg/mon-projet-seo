import { useState, useCallback } from 'react';

/**
 * useCopyToClipboard
 * Copie une chaîne dans le presse-papiers et expose un état "copié" temporaire.
 * @param {number} resetDelay - Délai en ms avant de réinitialiser l'état (défaut: 2000)
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    if (!navigator.clipboard) {
      // Fallback pour navigateurs anciens
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelay);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelay);
    } catch (err) {
      console.error('Erreur lors de la copie :', err);
    }
  }, [resetDelay]);

  return { copied, copy };
}
