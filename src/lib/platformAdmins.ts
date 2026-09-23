// Account che vedono la nuova piattaforma prima dello switch e le pagine admin
// (es. Costi AI). a@gmail.com = account di test: toglierlo prima dello switch.
export const PLATFORM_ADMIN_EMAILS = ['as.scirica@gmail.com', 'a@gmail.com'];

export const isPlatformAdmin = (email?: string | null) => !!email && PLATFORM_ADMIN_EMAILS.includes(email);
