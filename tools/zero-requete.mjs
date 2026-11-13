// Contrôle « zéro requête » : APIs réseau interdites dans le code de l'app (sw.js est exclu par l'appelant).
const INTERDITES = [
  { nom: 'fetch(', motif: /\bfetch\s*\(/ },
  { nom: 'XMLHttpRequest', motif: /\bXMLHttpRequest\b/ },
  { nom: 'sendBeacon', motif: /\bsendBeacon\b/ },
  { nom: 'WebSocket', motif: /\bWebSocket\b/ },
  { nom: 'EventSource', motif: /\bEventSource\b/ },
];

export function appelsReseau(code) {
  return INTERDITES.filter(({ motif }) => motif.test(code)).map(({ nom }) => nom);
}
