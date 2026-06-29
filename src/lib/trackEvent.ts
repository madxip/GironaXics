/**
 * trackEvent — Helper de tracking d'analytics client-side.
 * Crida fire-and-forget: no bloqueja la UI si falla.
 */
export function trackEvent(
  event_type: string,
  event_label?: string,
  event_value?: string,
  activitat_id?: string
) {
  if (typeof window === 'undefined') return; // Seguretat SSR

  const ua = window.navigator.userAgent.toLowerCase();
  const isBot = /bot|crawl|spider|lighthouse|ahrefs|semrush|yandex|bing|google|yahoo|duckduckgo|facebook|twitter|linkedin|slack/i.test(ua);
  if (isBot) return;

  const device = window.innerWidth <= 768 ? 'mobile' : 'desktop';

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type, event_label, event_value, device, activitat_id }),
    keepalive: true, // Permet que la petició acabi fins i tot si l'usuari navega
  }).catch(() => {
    // Silent fail: mai bloquejem la UI per errors de tracking
  });
}
