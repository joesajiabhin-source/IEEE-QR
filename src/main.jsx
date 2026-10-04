import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowDownToLine, ArrowUpRight, Check, Copy, Instagram, Linkedin, Link as LinkIcon, Mail, Phone, QrCode, Share2, X, Youtube } from 'lucide-react';
import './minimal.css';
import './spotlight.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
async function api(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function Logo() {
  return <a className="brand" href="/" aria-label="IEEE VJEC home"><span className="brand-mark"><img src="/ieee-vjec-logo.png" alt="" /></span><span className="brand-text">IEEE <strong>VJEC</strong><small>Student Branch</small></span></a>;
}
function Portrait({ profile }) {
  const isReferencePortrait = profile.slug === 'arjun';
  const src = isReferencePortrait ? '/abhinav-cutout.png' : profile.photo?.startsWith('/') && API_BASE ? `${API_BASE}${profile.photo}` : profile.photo;
  if (src) return <img className={`hero-person ${isReferencePortrait ? 'cutout' : 'profile-photo'}`} src={src} alt={profile.name} />;
  return <div className="hero-person portrait-fallback" aria-label={profile.name}>{profile.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>;
}
function PanelCutout({ slug }) {
  const svgRef = useRef(null);
  const [size, setSize] = useState({ width: 1600, height: 800 });
  useEffect(() => {
    const panel = svgRef.current?.parentElement;
    if (!panel || !('ResizeObserver' in window)) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize(current => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);
  const fontSize = Math.min(280, size.width * .165);
  const textLength = Math.min(size.width * .69, fontSize * 6.2);
  const maskId = `banner-cut-${slug.replace(/[^a-z0-9_-]/gi, '')}`;
  const gradientId = `banner-blue-${slug.replace(/[^a-z0-9_-]/gi, '')}`;
  return <svg ref={svgRef} className="panel-surface" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2=".25"><stop stopColor="#0e4fc9"/><stop offset=".55" stopColor="#2675f2"/><stop offset="1" stopColor="#155bdc"/></linearGradient>
      <mask id={maskId} x="0" y="0" width={size.width} height={size.height} maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
        <rect width={size.width} height={size.height} fill="white"/>
        <text x={size.width / 2} y={size.height * .42} textAnchor="middle" fill="black" fontFamily="Anton, Impact, sans-serif" fontSize={fontSize} fontWeight="900" textLength={textLength} lengthAdjust="spacingAndGlyphs">IEEE SB VJEC</text>
      </mask>
    </defs>
    <path d={`M 0 ${size.height * .11} Q ${size.width / 2} ${-size.height * .08} ${size.width} ${size.height * .11} V ${size.height} H 0 Z`} fill={`url(#${gradientId})`} mask={`url(#${maskId})`}/>
  </svg>;
}
function PublicProfile({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const aboutRef = useRef(null);
  const heroRef = useRef(null);
  useEffect(() => {
    let current = true;
    api(`/api/profiles/${encodeURIComponent(slug)}`).then(result => { if (current) setData(result); }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [slug]);
  useEffect(() => {
    if (!data?.profile) return;
    document.title = `${data.profile.name} | IEEE SB VJEC`;
  }, [data]);
  useEffect(() => {
    const section = aboutRef.current;
    if (!section || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { section.classList.add('in-view'); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [data]);
  useEffect(() => {
    if (!qrOpen) return;
    const onEscape = event => { if (event.key === 'Escape') setQrOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [qrOpen]);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let current = 0;
    let target = 0;
    const paint = () => {
      current += (target - current) * 0.13;
      if (Math.abs(target - current) < 0.0015) current = target;
      hero.style.setProperty('--type-y', `${Math.round(-95 * current)}px`);
      hero.style.setProperty('--person-y', `${Math.round(-42 * current)}px`);
      hero.style.setProperty('--panel-rise', `${Math.round(hero.querySelector('.hero-inner').clientHeight * .84 * current)}px`);
      hero.style.setProperty('--content-offset', `${Math.round(hero.querySelector('.hero-inner').clientHeight * .1 * current)}px`);
      hero.style.setProperty('--display-progress', String(Math.min(1, Math.max(0, (current - .18) / .45))));
      frame = current === target ? 0 : requestAnimationFrame(paint);
    };
    const update = () => {
      target = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight - hero.querySelector('.hero-inner').clientHeight)));
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); cancelAnimationFrame(frame); };
  }, [error]);
  const profile = data?.profile;
  const url = data?.url;
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(url); setNotice('Profile link copied'); }
    catch { setNotice('Copy unavailable in this browser'); }
    setTimeout(() => setNotice(''), 2800);
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: `${profile.name} | IEEE SB VJEC`, url }); } catch { /* User cancelled. */ } }
    else copyUrl();
  };
  const downloadVcard = () => {
    const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escape(profile.name)}\r\nTITLE:${escape(profile.designation)}\r\nORG:${escape(profile.organization)}\r\nEMAIL:${escape(profile.email)}\r\nTEL:${escape(profile.phone)}\r\nURL:${url}\r\nEND:VCARD\r\n`;
    const blobUrl = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' }));
    const anchor = document.createElement('a'); anchor.href = blobUrl; anchor.download = `${profile.slug}.vcf`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };
  // These come from editable admin profile fields. Missing URLs never render as links.
  const accounts = profile ? [
    profile.instagram && { label: 'Instagram', href: profile.instagram, icon: Instagram },
    profile.linkedin && { label: 'LinkedIn', href: profile.linkedin, icon: Linkedin },
    ...(profile.links || []).filter(link => link?.label && link?.url).map(link => ({ label: link.label, href: link.url, icon: /youtube/i.test(link.label) ? Youtube : LinkIcon })),
  ].filter(Boolean) : [];
  const contactLinks = profile ? [
    profile.email && { label: 'Email', href: `mailto:${profile.email}`, icon: Mail },
    profile.phone && { label: 'Call', href: `tel:${profile.phone.replace(/[^+\d]/g, '')}`, icon: Phone },
  ].filter(Boolean) : [];

  return <div className="site">
    <header className="site-header"><div className="shell header-inner"><Logo /><span className="header-label">COORDINATOR PROFILE <span className="header-dot" /></span></div></header>
    {error ? <main className="state-page shell"><span className="eyebrow">PROFILE UNAVAILABLE</span><h1>Profile not found.</h1><p>This profile may be inactive or the link may have changed.</p></main>
      : <main>
          <section className="hero-stage" ref={heroRef} aria-label="IEEE coordinator profile introduction">
            <div className="hero-beams" aria-hidden="true" />
            <div className="hero-inner">
              <p className="eyebrow hero-caption">IEEE STUDENT BRANCH · VJEC</p>
              <div className="hero-type-motion"><div className="hero-word" aria-hidden="true"><span>I</span><span>E</span><span>E</span><span>E</span></div></div>
              <div className="portrait-motion">{(profile || slug === 'arjun') && <Portrait profile={profile || { slug, name: '', photo: null }} />}</div>
              <div className="rising-panel">
              <PanelCutout slug={slug} />
              <div className="banner-content">
                <div><span className="banner-kicker">COORDINATOR PROFILE{profile ? ` / ${String(profile.id).padStart(4, '0')}` : ''}</span><h1>{profile?.name || 'Coordinator'}</h1>{profile && <span className="banner-role">{profile.designation}{profile.team_role ? ` · ${profile.team_role}` : ''}</span>}</div>
                <span className="banner-scroll">Scroll to connect <ArrowDown size={18} /></span>
              </div>
              </div>
            </div>
          </section>

          {profile ? <section className="about-section" id="sb-vjec" ref={aboutRef} aria-labelledby="branch-heading">
            <div className="shell">
              <p className="eyebrow about-kicker">CONNECT WITH {profile.name}</p>
              <h2 className="branch-heading" id="branch-heading">Find me online<span>.</span></h2>
              <div className="social-grid">{accounts.map(({ label, href, icon: Icon }, index) => <a className="social-card" key={`${label}-${index}`} href={href} target="_blank" rel="noreferrer" style={{ '--card-index': index }}><span className="social-card-icon"><Icon size={28} /></span><span className="social-card-name">{label}</span><ArrowUpRight size={25} /></a>)}</div>
              {!accounts.length && <p className="empty-accounts">Account links will appear here when added.</p>}
              <div className="profile-actions"><button onClick={downloadVcard}><ArrowDownToLine size={18} /> Save contact</button><button onClick={share}><Share2 size={18} /> Share profile</button><button onClick={() => setQrOpen(true)}><QrCode size={18} /> Show QR code</button><button onClick={copyUrl}><Copy size={18} /> Copy profile link</button>{contactLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href}><Icon size={18} /> {label}</a>)}</div>
            </div>
          </section> : <section className="loading-profile shell" aria-live="polite">Loading coordinator details…</section>}
        </main>}
    <footer className="site-footer"><div className="shell footer-inner"><Logo /><span>IEEE SB VJEC · {new Date().getFullYear()}</span></div></footer>
    {notice && <div className="toast" role="status"><Check size={17} />{notice}</div>}
    {qrOpen && profile && <div className="modal-overlay" onMouseDown={() => setQrOpen(false)}><div className="qr-dialog" role="dialog" aria-modal="true" aria-label={`QR code for ${profile.name}`} onMouseDown={event => event.stopPropagation()}><button className="dialog-close" onClick={() => setQrOpen(false)} aria-label="Close"><X size={20} /></button><span className="eyebrow">SCAN TO CONNECT / {profile.name}</span><h2>{profile.name}</h2><div className="qr-frame"><img src={`${API_BASE}/api/profiles/${encodeURIComponent(profile.slug)}/qr`} alt={`QR code for ${profile.name}`} /></div><p>Scan this code to open the coordinator profile.</p><button className="modal-copy" onClick={copyUrl}><Copy size={18} /> Copy profile link</button></div></div>}
  </div>;
}
const slug = window.location.pathname.startsWith('/profile/') ? decodeURIComponent(window.location.pathname.slice(9)) : 'arjun';
createRoot(document.getElementById('root')).render(<PublicProfile slug={slug} />);
