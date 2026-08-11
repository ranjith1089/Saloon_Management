import { MessageCircle } from 'lucide-react';

export default function WhatsAppBubble() {
  const text = encodeURIComponent("Hi! I'd like to know more about Salon software.");
  return (
    <a
      href={`https://wa.me/918754006483?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl px-4 py-3 flex items-center gap-2 font-semibold text-sm transition-all hover:-translate-y-0.5"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
