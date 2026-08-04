/**
 * Barcode-scanner hook.
 *
 * USB / Bluetooth barcode scanners emulate a keyboard — they "type" the code
 * at superhuman speed (<15ms between chars) and then press Enter. We detect
 * that speed signature and invoke the callback with the buffered code.
 *
 * Rules:
 *  - Ignore keystrokes when the user is typing in a real input / textarea /
 *    contenteditable so scanning doesn't interfere with normal typing.
 *  - Reset the buffer if two keystrokes are more than 40ms apart (human speed).
 *  - Only fire when the code is at least MIN_LENGTH characters, terminated by
 *    Enter (default scanner suffix).
 *
 * Usage:
 *   useBarcodeScanner((code) => addToCart(code));
 */
import { useEffect } from 'react';

const MAX_INTERVAL_MS = 40;   // faster than any human typist
const MIN_LENGTH = 4;         // don't fire on stray taps

export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let last = 0;

    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if ((t as HTMLElement).isContentEditable) return true;
      return false;
    };

    const handler = (e: KeyboardEvent) => {
      // Never fight the user in a form field.
      if (isTyping(e.target)) return;
      const now = Date.now();
      // Slow keystroke = new sequence
      if (now - last > MAX_INTERVAL_MS) buffer = '';
      last = now;

      if (e.key === 'Enter') {
        if (buffer.length >= MIN_LENGTH) {
          onScan(buffer);
          e.preventDefault();
        }
        buffer = '';
        return;
      }
      // Only printable single characters (barcodes are alphanumeric)
      if (e.key.length === 1) buffer += e.key;
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onScan, enabled]);
}
