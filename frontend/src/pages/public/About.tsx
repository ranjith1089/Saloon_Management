import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Building2, Heart, Rocket, Users } from 'lucide-react';
import SectionHeading from '@/components/public/SectionHeading';

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="container-x py-20 sm:py-28 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow mb-3">About Us</div>
          <h1 className="h-display text-5xl sm:text-6xl md:text-7xl">
            Built for salons. <span className="text-brand-600">By people who've watched one struggle.</span>
          </h1>
          <p className="mt-6 text-lg text-charcoal/70 max-w-2xl mx-auto">
            Salon is a product from Aveon Infotech, built out of Chennai and shipped to salons across India.
          </p>
        </motion.div>
      </section>

      {/* Founder story */}
      <section className="container-x pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-brand-100 via-cream to-brand-50 flex items-center justify-center relative overflow-hidden">
            <div className="font-display font-black text-9xl text-brand-600 opacity-20">R</div>
            <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-4 shadow-pop">
              <div className="text-xs uppercase font-semibold text-brand-600 tracking-widest">Founder</div>
              <div className="font-display font-black text-2xl mt-1">Ranjith Kumar R</div>
              <div className="text-sm text-charcoal/60 mt-1">Aveon Infotech Private Limited</div>
            </div>
          </div>
          <div>
            <div className="eyebrow mb-3">Our story</div>
            <h2 className="h-display text-3xl sm:text-4xl mb-5">
              Every salon owner I met was drowning in WhatsApp.
            </h2>
            <div className="space-y-4 text-charcoal/80 leading-relaxed">
              <p>
                It started with a family salon. Bookings on WhatsApp. A paper diary. Half the customers forgot to show up. The other half showed up when we didn't expect them.
              </p>
              <p>
                We looked at existing salon software and found two categories: enterprise tools built for chains with 50 branches, priced at ₹15,000/month; or basic diary apps that couldn't handle a walk-in without breaking.
              </p>
              <p>
                Neither fit the salon that mattered most — the neighbourhood salon in Coimbatore or Nashik doing ₹3–8 lakh a month, with 3–10 staff, wanting to grow without hiring a receptionist.
              </p>
              <p>
                So we built Salon. Priced for real Indian salons. Built for the way they actually operate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white border-y border-charcoal/5">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="What we believe"
            title="Three things we won't compromise on."
          />
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Heart,  title: 'Salons first',       desc: 'Every feature is built after talking to a real salon owner. If our pilot salons don\'t need it, we don\'t ship it.' },
              { icon: Rocket, title: 'Ship, don\'t plan',  desc: 'We push updates weekly, not quarterly. If something breaks, you can WhatsApp us and we\'ll fix it same day.' },
              { icon: Users,  title: 'Own your customers', desc: 'You keep 100% of your booking data. No marketplace fees. No commission on your revenue. Ever.' },
            ].map((v) => (
              <div key={v.title} className="card-soft p-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">{v.title}</h3>
                <p className="text-charcoal/70 mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company card */}
      <section className="container-x py-20">
        <div className="card-soft p-8 sm:p-12 max-w-3xl mx-auto text-center">
          <Building2 className="w-10 h-10 text-brand-600 mx-auto mb-3" />
          <div className="font-display font-black text-2xl">Aveon Infotech Private Limited</div>
          <p className="text-charcoal/70 mt-3">
            A product engineering studio based in Chennai. We build software for
            small-and-medium Indian businesses.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <a href="mailto:contact@aveoninfotech.com" className="btn-hero-secondary">
              contact@aveoninfotech.com
            </a>
            <a href="https://wa.me/918754006483" target="_blank" rel="noreferrer" className="btn-hero">
              <MessageCircle className="w-4 h-4" /> WhatsApp us
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-charcoal/50">
            <MapPin className="w-3 h-3" /> Chennai, India
          </div>
        </div>
      </section>
    </>
  );
}
