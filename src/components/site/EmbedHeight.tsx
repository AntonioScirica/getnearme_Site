'use client';

import { useEffect } from 'react';

// Scheda incorporata in un altro sito: manda al sito che la ospita l'altezza del contenuto, cosi' il riquadro
// (iframe) si allunga da solo senza barre di scorrimento (vedi il codice da incollare in piattaforma, scheda immobile).
export default function EmbedHeight({ id }: { id: string }) {
  useEffect(() => {
    const send = () => window.parent.postMessage({ agenteimmoEmbed: id, h: Math.ceil(document.documentElement.scrollHeight) }, '*');
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    send();
    return () => ro.disconnect();
  }, [id]);
  return null;
}
