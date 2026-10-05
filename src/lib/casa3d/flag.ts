// Casa 3D accesa solo dove NEXT_PUBLIC_CASA3D=1 (in locale per le prove; online spenta finche' non e' pronta, 06/10/2026).
// Spenta: niente template in chat, niente sezione nella scheda, niente "Vedi in 3D" sul sito, rotte 404.
export const CASA3D_ON = process.env.NEXT_PUBLIC_CASA3D === '1'
