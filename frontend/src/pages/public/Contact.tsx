import { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Contact() {
  usePageMeta({
    title: 'Contact — Salon & SPA Management by Aveon Infotech',
    description: 'Talk to us on WhatsApp, email or phone. 2-hour response during business hours. Chennai, India.',
    keywords: 'contact salon software, aveon infotech contact, saloon software support India',
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', salon: '', message: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // MVP: open a pre-filled email + WhatsApp so the message reaches contact@aveoninfotech.com
    // even without a server-side action. Replace with a real backend endpoint later.
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nSalon: ${form.salon}\n\n${form.message}`
    );
    window.location.href = `mailto:contact@aveoninfotech.com?subject=New enquiry from ${form.name}&body=${body}`;
    setTimeout(() => { setSending(false); setSent(true); }, 700);
  };

  return (
    <>
      <section className="container-x py-16 sm:py-24 text-center">
        <div className="eyebrow mb-3">Contact</div>
        <h1 className="h-display text-5xl sm:text-6xl md:text-7xl">
          Say hello. <span className="text-brand-600">We reply in 2 hours.</span>
        </h1>
        <p className="mt-6 text-lg text-charcoal/70 max-w-2xl mx-auto">
          Prefer WhatsApp? Call? Email? Take your pick — we're on all of them.
        </p>
      </section>

      <section className="container-x pb-20">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact form */}
          <div className="lg:col-span-2 card-soft p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-display font-black text-2xl">Message on its way!</h2>
                <p className="text-charcoal/70 mt-2">We'll reply within 2 hours during business hours (Mon–Sat, 10 AM – 8 PM IST).</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', salon: '', message: '' }); }} className="btn-hero-secondary mt-6 text-sm">
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Your name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent" placeholder="Priya Sharma" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Salon name</label>
                    <input value={form.salon} onChange={(e) => setForm({ ...form, salon: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent" placeholder="Bloom Salon" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent" placeholder="you@salon.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Phone *</label>
                    <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent" placeholder="98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Message *</label>
                  <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent" placeholder="Tell us about your salon and what you're looking for." />
                </div>
                <button type="submit" disabled={sending} className="btn-hero w-full sm:w-auto">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send message
                </button>
              </form>
            )}
          </div>

          {/* Contact cards */}
          <div className="space-y-4">
            <ContactCard
              icon={MessageCircle}
              title="WhatsApp"
              text="+91 87540 06483"
              sub="Fastest — usually reply in minutes"
              href="https://wa.me/918754006483"
              color="bg-green-500"
            />
            <ContactCard
              icon={Mail}
              title="Email"
              text="contact@aveoninfotech.com"
              sub="For long questions and partnerships"
              href="mailto:contact@aveoninfotech.com"
              color="bg-blue-500"
            />
            <ContactCard
              icon={Phone}
              title="Phone"
              text="+91 87540 06483"
              sub="Mon–Sat, 10 AM – 8 PM IST"
              href="tel:+918754006483"
              color="bg-brand-600"
            />
            <div className="card-soft p-5">
              <MapPin className="w-6 h-6 text-brand-600 mb-2" />
              <div className="font-semibold">Chennai, India</div>
              <div className="text-sm text-charcoal/60 mt-1">
                Aveon Infotech Private Limited
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactCard({ icon: Icon, title, text, sub, href, color }: any) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="card-soft p-5 flex items-start gap-4 hover:-translate-y-1 hover:shadow-pop transition-all group">
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase font-semibold text-charcoal/50 tracking-widest">{title}</div>
        <div className="font-semibold text-charcoal group-hover:text-brand-600 truncate">{text}</div>
        <div className="text-xs text-charcoal/60 mt-0.5">{sub}</div>
      </div>
    </a>
  );
}
