/**
 * Printable receipt shown right after a successful Sales checkout.
 * On print, an @media print stylesheet hides everything except the receipt.
 */
import { useEffect } from 'react';
import { Printer, MessageCircle, X, AlertCircle } from 'lucide-react';

export interface ReceiptLine {
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  amount: number;
}

export interface ReceiptData {
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  receiptNumber: string;
  date: string;                  // ISO
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  notes?: string;
  errors?: string[];             // per-line failures from checkout
}

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Receipt({ data, onClose, autoPrint = false }: { data: ReceiptData; onClose: () => void; autoPrint?: boolean }) {
  // Auto-fire the print dialog when the receipt is shown, for thermal-printer
  // workflows. Small delay lets the modal paint first.
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 250);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const dt = new Date(data.date);
  const dateStr = dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const waText = encodeURIComponent(
    `Receipt · ${data.salonName}\n` +
    `${data.receiptNumber}\n` +
    data.lines.map((l) => `• ${l.name} — ${money(l.amount)}`).join('\n') +
    `\nTotal: ${money(data.total)}\nPaid via ${data.paymentMethod}\nThank you!`
  );
  const waHref = data.customerPhone
    ? `https://wa.me/${data.customerPhone.replace(/[^\d]/g, '').padStart(12, '9')}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:static">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body > *:not(.receipt-print-root) { display: none !important; }
          .receipt-print-root { position: static !important; inset: auto !important; background: white !important; padding: 0 !important; display: block !important; }
          .receipt-print-root .no-print { display: none !important; }
          .receipt-print-root .receipt-paper {
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            max-width: none !important;
            width: 80mm !important;
            padding: 3mm !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            color: #000 !important;
          }
          .receipt-print-root .receipt-paper * { color: #000 !important; }
        }
      `}</style>
      <div className="receipt-print-root w-full flex flex-col items-center justify-center gap-3">
        {/* Receipt paper */}
        <div className="receipt-paper bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 font-mono text-xs text-gray-900">
          <div className="text-center mb-3">
            <h2 className="text-base font-bold uppercase tracking-wider">{data.salonName}</h2>
            {data.salonAddress && <p className="text-[10px] text-gray-600 mt-0.5">{data.salonAddress}</p>}
            {data.salonPhone && <p className="text-[10px] text-gray-600">Tel: {data.salonPhone}</p>}
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
            <div className="flex justify-between"><span>Receipt</span><span className="font-semibold">{data.receiptNumber}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{dateStr}</span></div>
            <div className="flex justify-between"><span>Customer</span><span className="truncate ml-2">{data.customerName || 'Walk-in'}</span></div>
            {data.customerPhone && <div className="flex justify-between"><span>Phone</span><span>{data.customerPhone}</span></div>}
          </div>

          {/* Lines */}
          <div className="space-y-1 my-2">
            {data.lines.map((l, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate mr-2">{l.type === 'SERVICE' ? '★ ' : ''}{l.name}</span>
                <span className="whitespace-nowrap">{money(l.amount)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-0.5">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(data.subtotal)}</span></div>
            {data.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{money(data.discount)}</span></div>}
            {data.taxRate > 0 && <div className="flex justify-between"><span>GST {data.taxRate}%</span><span>{money(data.tax)}</span></div>}
            <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-1 mt-1">
              <span>TOTAL</span><span>{money(data.total)}</span>
            </div>
            <div className="flex justify-between mt-1"><span>Paid via</span><span className="font-semibold">{data.paymentMethod}</span></div>
          </div>

          {data.notes && (
            <div className="border-t border-dashed border-gray-400 pt-2 mt-2 text-[10px] text-gray-700">
              {data.notes}
            </div>
          )}

          {data.errors && data.errors.length > 0 && (
            <div className="border border-red-400 bg-red-50 rounded p-2 mt-2 text-[10px] text-red-700 no-print">
              <div className="font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Some lines failed</div>
              <ul className="list-disc pl-4 mt-1">
                {data.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-500 mt-4">
            Thank you for visiting {data.salonName}!
          </p>
        </div>

        {/* Actions — hidden on print */}
        <div className="no-print flex gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
