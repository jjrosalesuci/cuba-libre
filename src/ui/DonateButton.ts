/**
 * Botón de donación de PayPal ("Cómprame un café") como enlace HTML sobre el canvas.
 * Solo se muestra en la portada.
 */
const DONATE_URL = 'https://www.paypal.com/donate/?business=jjrosalesuci%40gmail.com&currency_code=USD';

let link: HTMLAnchorElement | null = null;

function create(): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'donate';
  a.href = DONATE_URL;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.innerHTML = '<span class="donate-title">☕ Cómprame un café</span><span class="donate-sub">Donación</span>';
  document.body.appendChild(a);
  return a;
}

export function showDonate(): void {
  link ??= create();
  link.style.display = '';
}

export function hideDonate(): void {
  if (link) link.style.display = 'none';
}
