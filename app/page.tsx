import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Menu,
  Network,
  ShieldCheck,
} from 'lucide-react';

const capabilities = [
  {
    number: '01',
    title: 'One operating picture',
    description: 'Give every team a shared view of rooms, equipment, events, and the people responsible for them.',
    icon: Network,
  },
  {
    number: '02',
    title: 'Bookings that hold',
    description: 'Live availability and instant slot locking keep busy spaces moving without double bookings.',
    icon: Clock3,
  },
  {
    number: '03',
    title: 'Events with a clear door',
    description: 'Create polished events, issue secure tickets, and keep check-in simple for every attendee.',
    icon: CalendarDays,
  },
];

export default function Home() {
  return (
    <main className="site-shell overflow-hidden">
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/" className="brand-mark">
          <span className="brand-mark__symbol">B</span>
          <span>blockspace</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#platform" className="site-nav__link">Platform</a>
          <a href="#about" className="site-nav__link">About</a>
          <a href="#security" className="site-nav__link">Security</a>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/sign-in" className="site-nav__login">Sign in</Link>
          <Link href="/sign-up" className="site-nav__cta">Start free <ArrowUpRight size={15} /></Link>
        </div>
        <details className="relative sm:hidden">
          <summary className="site-nav__menu" aria-label="Open menu"><Menu size={20} /></summary>
          <div className="site-nav__drawer">
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
            <a href="#security">Security</a>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/sign-up" className="site-nav__drawer-cta">Start free <ArrowRight size={15} /></Link>
          </div>
        </details>
      </nav>

      <section className="site-hero page-width">
        <div className="site-hero__copy">
          <p className="eyebrow"><span /> The operating system for shared spaces</p>
          <h1>Make room for <em>better work.</em></h1>
          <p className="site-hero__lede">Blockspace brings the people, places, and plans behind your organization into one calm, connected workspace.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="button-primary">Build your workspace <ArrowRight size={17} /></Link>
            <a href="#about" className="button-text">See how it works <ArrowRight size={16} /></a>
          </div>
          <div className="site-hero__proof"><Check size={16} /> No credit card required <span /> <Check size={16} /> Setup in minutes</div>
        </div>
        <div className="workspace-preview" aria-label="Blockspace workspace preview">
          <div className="workspace-preview__top"><span className="preview-dots"><i /><i /><i /></span><span className="preview-title">Monday, October 14</span><span className="preview-avatar">AM</span></div>
          <div className="workspace-preview__body">
            <div className="preview-sidebar"><div className="preview-logo">B</div><span className="active" /><span /><span /><span /><span className="preview-sidebar__bottom" /></div>
            <div className="preview-main"><div className="preview-heading"><div><small>OVERVIEW</small><h2>Good morning, Aaryan</h2></div><span className="preview-date">This week <ArrowUpRight size={13} /></span></div><div className="preview-stats"><div><small>ACTIVE SPACES</small><strong>24</strong><b>+12.5%</b></div><div><small>UPCOMING EVENTS</small><strong>08</strong><b>+04.2%</b></div></div><div className="preview-schedule"><div className="schedule-head"><span>LIVE AVAILABILITY</span><span>View calendar <ArrowRight size={12} /></span></div><div className="schedule-row"><span className="schedule-time">09:00</span><span className="schedule-line" /><span className="schedule-event schedule-event--green"><b>Design sync</b><small>Studio 04 · 6 people</small></span></div><div className="schedule-row"><span className="schedule-time">11:30</span><span className="schedule-line" /><span className="schedule-event schedule-event--coral"><b>All-hands</b><small>Auditorium · 48 people</small></span></div><div className="schedule-row"><span className="schedule-time">14:00</span><span className="schedule-line" /><span className="schedule-event schedule-event--blue"><b>Client workshop</b><small>Boardroom · 12 people</small></span></div></div></div>
          </div>
        </div>
      </section>

      <section id="platform" className="platform-section page-width"><div className="section-intro"><p className="eyebrow"><span /> The platform</p><h2>From scattered logistics<br />to <em>shared momentum.</em></h2></div><div className="capability-grid">{capabilities.map((item) => { const Icon = item.icon; return <article key={item.number} className="capability"><div className="capability__top"><span>{item.number}</span><Icon size={20} /></div><h3>{item.title}</h3><p>{item.description}</p><ArrowUpRight className="capability__arrow" size={19} /></article>; })}</div></section>

      <section id="about" className="about-section"><div className="page-width about-grid"><div><p className="eyebrow"><span /> Why Blockspace</p><h2>Space is more than a room. It is where <em>culture happens.</em></h2></div><div className="about-copy"><p>Every organization has a rhythm. People gather, ideas collide, and plans become real. Blockspace gives that rhythm a reliable home, so teams can spend less time coordinating the details and more time doing the work that matters.</p><Link href="/sign-up" className="button-text">Meet your new workspace <ArrowRight size={16} /></Link></div></div></section>

      <section id="security" className="security-section page-width"><div className="security-badge"><ShieldCheck size={25} /></div><div><p className="eyebrow"><span /> Built for trust</p><h2>Your work deserves a <em>secure foundation.</em></h2><p>Role-based access, protected ticketing, and organization-level controls keep the right people in the right places.</p></div><Link href="/sign-up" className="button-primary button-primary--dark">Get started <ArrowRight size={17} /></Link></section>

      <footer className="site-footer page-width"><Link href="/" className="brand-mark"><span className="brand-mark__symbol">B</span><span>blockspace</span></Link><span>Workspace infrastructure for teams that move.</span><div><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div></footer>
    </main>
  );
}