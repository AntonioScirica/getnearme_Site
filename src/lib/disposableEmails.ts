// Domini di mail usa-e-getta bloccati alla registrazione (anti-abuso free trial).
// TENERE ALLINEATA con la migration 20260614130000 (funzione block_disposable_email):
// il DB e' il backstop hard, questa lista da' solo un messaggio piu' chiaro nella UI.

const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.org', 'guerrillamail.net', 'guerrillamailblock.com', 'sharklasers.com',
  'grr.la', '10minutemail.com', '10minutemail.net', '20minutemail.com', 'temp-mail.org',
  'tempmail.com', 'tempmailo.com', 'tempmail.plus', 'throwawaymail.com', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'getnada.com', 'nada.email', 'maildrop.cc', 'dispostable.com',
  'fakeinbox.com', 'trashmail.com', 'trashmail.de', 'mailnesia.com', 'mohmal.com',
  'emailondeck.com', 'mailcatch.com', 'spamgourmet.com', 'mintemail.com', 'mvrht.net',
  'mailsac.com', 'harakirimail.com', 'anonbox.net', 'tempr.email', 'discard.email',
  'spam4.me', 'fakemailgenerator.com', 'etempmail.com', 'luxusmail.org', 'mailpoof.com',
  'emailfake.com', '1secmail.com', '1secmail.org', '1secmail.net', 'dropmail.me',
  'minuteinbox.com', 'mail.tm', 'tmpmail.org', 'moakt.com', 'gufum.com', 'byom.de',
  'inboxbear.com', 'tmail.ws',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
