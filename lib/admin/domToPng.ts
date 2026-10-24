/**
 * Draws a DOM element (HTML and inline SVG) to a PNG, so charts can be placed in
 * a Word file. The element is cloned with every computed style written inline,
 * wrapped in an SVG foreignObject, and painted onto a canvas. It needs no
 * library and sends nothing off the page.
 */

export interface PngImage {
  bytes: Uint8Array;
  /** Size in CSS pixels. */
  width: number;
  height: number;
}

function inlineStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);
  let text = '';
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    text += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  target.setAttribute('style', text);
  const sourceKids = Array.from(source.children);
  const targetKids = Array.from(target.children);
  sourceKids.forEach((child, index) => {
    const twin = targetKids[index];
    if (twin) inlineStyles(child, twin);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The chart could not be drawn.'));
    image.src = url;
  });
}

export async function nodeToPng(node: HTMLElement, scale = 2): Promise<PngImage> {
  const rect = node.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));

  const clone = node.cloneNode(true) as HTMLElement;
  inlineStyles(node, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.margin = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject></svg>`;
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A canvas is not available in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The chart image could not be created.');
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}
