'use client';

import { useState } from 'react';

// Foto in un riquadro fisso: orizzontale = riempie il riquadro; verticale = intera al centro, con dietro la
// stessa foto ingrandita e sfocata (niente teste tagliate, niente bande vuote). Come negli annunci dei portali.
export default function FitImage({ src, alt = '', imgClassName = '' }: { src: string; alt?: string; imgClassName?: string }) {
  const [portrait, setPortrait] = useState(false);
  return (
    <>
      {portrait && <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />}
      <img src={src} alt={alt} loading="lazy" onLoad={e => setPortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth * 1.05)}
        className={`absolute inset-0 h-full w-full ${portrait ? 'object-contain' : 'object-cover'} ${imgClassName}`} />
    </>
  );
}
