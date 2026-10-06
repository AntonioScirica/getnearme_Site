// crypto.randomUUID esiste solo in https/localhost: aprendo il dev server dal telefono (http://192.168...) manca.
// getRandomValues c'e' ovunque, quindi si ricostruisce un UUID v4.
export const uid = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));
