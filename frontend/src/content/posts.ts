export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;      // YYYY-MM-DD
  readMin: number;
  cover: string;     // emoji for now
  body: string;      // simple markdown-ish text
}

export const POSTS: Post[] = [
  {
    slug: 'reduce-salon-no-shows-with-whatsapp',
    title: 'How to reduce salon no-shows by 60% with WhatsApp reminders',
    excerpt: 'The single change that saved one Coimbatore salon ₹42,000 last month.',
    category: 'Growth',
    author: 'Parvathi Gurusamy',
    date: '2026-07-28',
    readMin: 5,
    cover: '📱',
    body: `
No-shows are the silent killer of salon revenue. Every empty chair for a scheduled slot is a triple loss — the missed service, the wasted staff hour, and the walk-in you turned away.

## The number nobody talks about

For an average Indian salon doing 30 bookings a day, a 20% no-show rate = 6 empty chairs. At an average ticket of ₹700, that's ₹4,200 lost every single day. Over a month, ₹1.26 lakh. Over a year, over ₹15 lakh.

## Why customers no-show

It's rarely malicious. The three real reasons:

1. **They forgot.** Booked on WhatsApp 4 days ago, life happened.
2. **They changed their mind.** But felt awkward cancelling on WhatsApp.
3. **They didn't get a confirmation.** They think the booking didn't go through.

## The 60% fix

Send THREE messages:

- **On booking:** "Confirmed for Saturday 3 PM with Priya. Reply CANCEL if needed."
- **24 hours before:** "Reminder: tomorrow at 3 PM. Reply YES to confirm."
- **2 hours before:** "See you at 3! Reply RESCHEDULE if you can't make it."

Coimbatore's Trendy Trims did exactly this. No-show rate dropped from 22% to 8% in 30 days. That's ₹42,000 in one month.

## Why WhatsApp beats SMS

- Open rate: 98% vs 45% for SMS
- Reply-rate: 40% vs 3%
- Cost per message: ₹0.12 vs ₹0.25

## How to set it up

If you're using Salon, this is one toggle in Settings > Messaging. Configure WhatsApp Cloud API once (free tier: 1,000 conversations/month) and the reminders fire automatically.

No cron. No zapier. Nothing to maintain.

## What NOT to do

- **Don't over-message.** Three touches max. Five and they mute you.
- **Don't send promotions in the same thread.** Keep transactional and marketing separate.
- **Don't ignore replies.** If they reply CANCEL, actually cancel the slot.

## The bigger picture

WhatsApp reminders aren't just about no-shows — they're the cheapest customer retention tool you have. Every reminder is a touchpoint. Every touchpoint keeps you top-of-mind.

Start there. Then layer in birthday wishes, win-back messages, and referral prompts. Compounding starts.
    `,
  },
  {
    slug: 'kpis-every-salon-owner-should-track',
    title: 'The 7 KPIs every Indian salon owner should track',
    excerpt: 'Forget vanity metrics. These seven numbers tell you if your salon is actually healthy.',
    category: 'Running a salon',
    author: 'Parvathi Gurusamy',
    date: '2026-07-15',
    readMin: 6,
    cover: '📊',
    body: `
Most salon owners track revenue and profit. That's like a doctor checking only your temperature.

Here are the seven KPIs that actually matter.

## 1. Rebook rate

**What:** % of customers who book their next appointment before leaving.
**Target:** >50%.
**Why:** A first-time customer who rebooks is 6× more valuable than one who doesn't.

## 2. Average ticket size

**What:** Total revenue ÷ number of bookings for the period.
**Target:** Grows month-over-month.
**Why:** Growing average ticket = successful upsell + membership pricing working.

## 3. No-show rate

**What:** % of bookings that don't turn up.
**Target:** <10%.
**Why:** Above 15% = your reminders aren't working. Above 25% = your booking process is broken.

## 4. Staff utilisation

**What:** Hours worked ÷ hours available per staff.
**Target:** 70–85%.
**Why:** Below 70% = you're over-staffed. Above 90% = customers are waiting too long.

## 5. Product-to-service ratio

**What:** Product revenue ÷ service revenue.
**Target:** 15–25%.
**Why:** Below 10% = you're not upselling retail. This is pure margin left on the table.

## 6. New customer acquisition cost

**What:** Marketing spend ÷ new customers acquired.
**Target:** Less than 30% of first ticket value.
**Why:** If you spend ₹200 to get a customer who spends ₹500, you're paying too much unless they come back 3+ times.

## 7. Membership take-up rate

**What:** % of active customers on a paid membership plan.
**Target:** 20–30%.
**Why:** Memberships = predictable revenue. Every % point here derisks your business.

## What to do if you don't track these

Most salons don't — they can't, because their software doesn't compute them. This is one of the reasons we built Salon: every one of these seven is on the Reports page out of the box.

Start with the top three (rebook, ticket size, no-show). Get those right and the others follow.
    `,
  },
  {
    slug: 'instagram-to-bookings',
    title: 'Instagram to bookings: turn followers into paying customers',
    excerpt: 'The link-in-bio strategy that quietly compounds into a full appointment book.',
    category: 'Growth',
    author: 'Parvathi Gurusamy',
    date: '2026-07-02',
    readMin: 4,
    cover: '📸',
    body: `
Your Instagram followers already like you. They're already looking at your work. The gap between "liking a reel" and "booking an appointment" is one link.

## The three-step Instagram funnel

**Step 1: Bio link → booking widget.**
Not your website. Not linktr.ee. A direct link to your public booking page. Customers should be able to book in 5 taps without leaving the flow.

**Step 2: Every post CTA is "link in bio".**
"Loved this cut? Book yours — link in bio."
"Trial our monsoon facial — link in bio."
"Available slots this weekend — link in bio."

**Step 3: Reels showing the booking process.**
30 seconds. Show a phone tapping through the booking widget, ending with the "Booking confirmed" screen. Caption: "Book in 30 seconds. Link in bio."

## Why this works

- Instagram limits bio links to 1 (unless you have a business account)
- One link with one purpose beats a link tree with 10 dead-ends
- The public booking widget doesn't require customers to sign up — massive friction removal

## The numbers

Urban Cuts, Coimbatore, tried this exact playbook. In 30 days:
- 47 new Instagram-sourced bookings
- ₹34,000 in first-visit revenue
- 22 rebooked for a second visit

Cost: ₹0. Just changed the bio link.

## Setting this up

If you're on Salon, every branch already has a public booking widget URL. Copy it. Paste in Instagram bio. Done.

If you're on Frezka or MioSalon or paper — this is the single biggest reason to switch.
    `,
  },
  {
    slug: 'salon-pos-vs-generic-pos',
    title: 'Salon POS vs generic POS — what actually matters',
    excerpt: 'Why the payment terminal at the grocery store is wrong for your salon.',
    category: 'Product',
    author: 'Parvathi Gurusamy',
    date: '2026-06-20',
    readMin: 5,
    cover: '💳',
    body: `
Generic POS systems (Square, MSwipe, PayU) look tempting. They're cheap, they take cards, they print receipts. Why pay more for salon-specific software?

Because a salon isn't a grocery store.

## Six things a salon POS needs that generic POS can't do

**1. Split a ticket between service and product.**
Customer gets a haircut (₹500) and buys a shampoo (₹800). Generic POS treats it as one ₹1,300 sale. Salon POS attributes ₹500 to the stylist for commission, ₹800 to product revenue, and applies member pricing if the customer has a membership.

**2. Attach a payment to an existing booking.**
Priya booked yesterday for ₹1,200. She shows up today, pays, and leaves. Generic POS creates a fresh unrelated transaction. Salon POS flips her booking from PENDING to COMPLETED + PAID in one action.

**3. Handle walk-ins without an account.**
A walk-in customer wants a beard trim. Generic POS forces a customer record. Salon POS lets you record the sale with just a name (optional) and the service — no account bloat.

**4. Member pricing.**
If a customer is on a Gold Membership, their haircut is ₹400 instead of ₹500. This has to apply automatically at checkout, based on the customer's active membership. Generic POS has no concept of memberships.

**5. Staff commission attribution.**
Every sale needs to know which staff performed it, so commission can be calculated at month-end. Generic POS doesn't ask.

**6. Product stock deduction per branch.**
A shampoo sold at your Anna Nagar branch should deduct from Anna Nagar's stock, not the salon's total. Generic POS is single-location by default.

## What you lose with generic POS

- ~15% revenue leak (no upsell, no membership pricing enforced)
- Commission disputes at month-end
- Stock drift between branches
- No booking-to-sale traceability

## The math

A salon doing ₹4 lakh/month revenue loses ~₹60K to the above. Salon software costs ₹2,499/month. That's a 24× payback.

Generic POS is fine for a chai stall. Not for a salon.
    `,
  },
  {
    slug: 'gst-for-salons-made-simple',
    title: 'GST for salons made simple',
    excerpt: 'What to charge, when to charge, and what to do at year end.',
    category: 'Running a salon',
    author: 'Parvathi Gurusamy',
    date: '2026-06-05',
    readMin: 4,
    cover: '🧾',
    body: `
GST is confusing until it isn't. Here's what you actually need to know for a salon.

## Do you need to register?

If your annual turnover crosses **₹20 lakh** (₹10 lakh in special-category states), yes. If not, you're exempt.

Most salons doing ₹2 lakh+/month should register. It's usually worth it — you can claim input tax credit on products, rent, and utilities.

## What rate do you charge?

- **Services (haircut, facial, massage, spa):** 18% GST
- **Products (shampoo, cream, retail):** typically 18%, some at 28%
- **Membership packages:** 18% (treated as a service)

Always show GST separately on the bill. Do not include it in the sticker price.

## What if my customer doesn't want GST?

You can't skip it. If you're registered, you must charge and remit. Trying to under-invoice creates a much bigger problem later.

## Input tax credit

You can claim GST paid on:
- Products purchased for retail sale
- Salon supplies (chairs, tools, dryers)
- Rent (if landlord charges GST)
- Utilities (some)
- Marketing spend (Google/Facebook ads charge GST)

Save every purchase invoice. Your CA can only claim what you can show.

## Filing

- **GSTR-1** every month (outward sales)
- **GSTR-3B** every month (summary + payment)
- **GSTR-9** once a year (annual return)

Most salons hire a CA to do this — costs ₹1,500–3,000/month. Worth it. Doing it yourself is a rabbit hole.

## The software angle

Salon has a GST toggle at every checkout. Turn it on globally in Settings and the app handles the math server-side. At month-end, export a CSV of all sales and hand it to your CA. Done.
    `,
  },
];
