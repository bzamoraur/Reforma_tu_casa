/** Minimal DOM construction helper — no framework, no dependencies. */

type Child = Node | string | null | undefined | false;

export interface ElAttrs {
  class?: string;
  text?: string;
  type?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  dataset?: Record<string, string>;
  onClick?: (ev: MouseEvent) => void;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElAttrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs.class) node.className = attrs.class;
  if (attrs.text !== undefined) node.textContent = attrs.text;
  if (attrs.type && 'type' in node) (node as HTMLInputElement).type = attrs.type;
  if (attrs.disabled !== undefined && 'disabled' in node) {
    (node as HTMLButtonElement).disabled = attrs.disabled;
  }
  if (attrs.title) node.title = attrs.title;
  if (attrs.ariaLabel) node.setAttribute('aria-label', attrs.ariaLabel);
  if (attrs.dataset) {
    for (const [key, value] of Object.entries(attrs.dataset)) {
      node.dataset[key] = value;
    }
  }
  if (attrs.onClick) node.addEventListener('click', attrs.onClick as EventListener);
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}
