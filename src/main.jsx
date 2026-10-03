import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, Copy, Instagram, Linkedin, Link as LinkIcon, Mail, Phone, QrCode, Share2, X } from 'lucide-react';
import './style.css';

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
function Avatar({ profile }) {
  if (profile.photo) {
    const src = profile.photo.startsWith('/') && API_BASE ? `${API_BASE}${profile.photo}` : profile.photo;
    return <img className="portrait" src={src} alt={profile.name} />;
  }
  const initials = profile.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  return <div className="portrait portrait-fallback" aria-label={profile.name}>{initials}</div>;
}
function PublicProfile({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let current = true;
    api(`/api/profiles/${encodeURIComponent(slug)}`).then(result => { if (current) setData(result); }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [slug]);
  useEffect(() => {
    if (!qrOpen) return;
    const onEscape = event => { if (event.key === 'Escape') setQrOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [qrOpen]);
  const profile = data?.profile;
  const url = data?.url;
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(url); setNotice('Profile link copied'); }
    catch { setNotice('Copy unavailable in this browser'); }
    setTimeout(() => setNotice(''), 2800);
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: `${profile.name} | ${profile.organization}`, url }); } catch { /* Sharing was cancelled. */ } }
    else copyUrl();
  };
  const downloadVcard = () => {
    const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escape(profile.name)}\r\nTITLE:${escape(profile.designation)}\r\nORG:${escape(profile.organization)}\r\nEMAIL:${escape(profile.email)}\r\nTEL:${escape(profile.phone)}\r\nURL:${url}\r\nEND:VCARD\r\n`;
    const blobUrl = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${profile.slug}.vcf`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };
  const links = profile ? [
    profile.instagram && { label: 'Instagram', href: profile.instagram, icon: Instagram, external: true },
    profile.linkedin && { label: 'LinkedIn', href: profile.linkedin, icon: Linkedin, external: true },
    profile.email && { label: 'Email', href: `mailto:${profile.email}`, icon: Mail },
    profile.phone && { label: 'Phone', href: `tel:${profile.phone.replace(/[^+\d]/g, '')}`, icon: Phone },
    ...(profile.links || []).map(link => ({ label: link.label, href: link.url, icon: LinkIcon, external: true })),
  ].filter(Boolean) : [];
  return <div className="site">
    <header className="site-header"><div className="shell header-inner"><Logo /><div className="header-label"><span className="status-dot" /> OFFICIAL COORDINATOR PROFILE</div></div></header>
    {error ? <main className="state-page shell"><span className="section-kicker">PROFILE UNAVAILABLE</span><h1>Profile not found.</h1><p>This profile may be inactive or the link may have changed.</p><a className="button button-primary" href="/">Return to home <ArrowRight size={18} /></a></main>
      : !profile ? <main className="state-page shell" aria-live="polite"><span className="loading-indicator" />Loading coordinator profile…</main>
        : <main className="shell profile-page">
          <div className="page-heading"><span>IEEE VJEC / PEOPLE DIRECTORY</span><span>PROFILE {String(profile.id).padStart(4, '0')}</span></div>
          <div className="hero">
            <section className="hero-content">
              <div className="identity-label"><span className="status-dot" /> OFFICIAL COORDINATOR PROFILE</div>
              <p className="eyebrow">MEET THE PERSON BEHIND THE ID</p>
              <h1>{profile.name}</h1>
              <p className="designation">{profile.designation}</p>
              <p className="bio">{profile.bio || `${profile.name} is a coordinator at ${profile.organization || 'IEEE VJEC'}.`}</p>
              <div className="primary-actions"><button className="button button-primary" onClick={downloadVcard}><ArrowDownToLine size={18} /> Save contact</button><button className="button button-outline" onClick={() => setQrOpen(true)}><QrCode size={18} /> View QR code</button></div>
              <div className="utility-actions"><button onClick={share}><Share2 size={16} /> Share profile</button><span aria-hidden="true" /><button onClick={copyUrl}><Copy size={16} /> Copy profile link</button></div>
            </section>
            <div className="portrait-panel"><div className="portrait-frame"><Avatar profile={profile} /></div><div className="portrait-caption"><span>IEEE VJEC</span><span>COORDINATOR ID · {String(profile.id).padStart(4, '0')}</span></div></div>
          </div>
          <section className="details-section" aria-labelledby="details-title">
            <div className="section-heading"><div><span className="section-kicker">PROFILE DETAILS</span><h2 id="details-title">At a glance</h2></div><span className="section-rule" /></div>
            <div className="details-grid">
              {profile.organization && <div className="detail"><span>ORGANIZATION</span><strong>{profile.organization}</strong></div>}
              {profile.society && <div className="detail"><span>SOCIETY</span><strong>{profile.society}</strong></div>}
              {profile.team_role && <div className="detail"><span>TEAM ROLE</span><strong>{profile.team_role}</strong></div>}
              {profile.department && <div className="detail"><span>ACADEMIC DEPARTMENT</span><strong>{profile.department}</strong></div>}
            </div>
          </section>
          {links.length > 0 && <section className="connect-section" aria-labelledby="connect-title">
            <div className="section-heading"><div><span className="section-kicker">GET IN TOUCH</span><h2 id="connect-title">Connect with {profile.name.split(' ')[0]}</h2></div><span className="section-rule" /></div>
            <div className="links-grid">{links.map(({ label, href, icon: Icon, external }, index) => <a className="contact-link" href={href} key={`${label}-${index}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}><span className="link-icon"><Icon size={21} /></span><span>{label}</span><ArrowUpRight className="link-arrow" size={18} /></a>)}</div>
          </section>}
          <div className="closing-note"><span className="closing-mark" />This digital profile is linked to an IEEE VJEC coordinator ID card.</div>
        </main>}
    <footer className="site-footer"><div className="shell footer-inner"><Logo /><p>IEEE VJEC Student Branch<br /><span>Connect with the people behind the work.</span></p><span>© {new Date().getFullYear()} IEEE VJEC</span></div></footer>
    {notice && <div className="toast" role="status"><Check size={17} />{notice}</div>}
    {qrOpen && profile && <div className="modal-overlay" onMouseDown={() => setQrOpen(false)}><div className="qr-dialog" role="dialog" aria-modal="true" aria-label={`QR code for ${profile.name}`} onMouseDown={event => event.stopPropagation()}><button className="dialog-close" onClick={() => setQrOpen(false)} aria-label="Close"><X size={20} /></button><span className="section-kicker">SCAN TO CONNECT / {profile.name}</span><h2>{profile.name}</h2><div className="qr-frame"><img src={`${API_BASE}/api/profiles/${encodeURIComponent(profile.slug)}/qr`} alt={`QR code for ${profile.name}`} /></div><p>Scan this code to open the coordinator profile.</p><button className="button button-primary" onClick={copyUrl}><Copy size={18} /> Copy profile link</button></div></div>}
  </div>;
}
const slug = window.location.pathname.startsWith('/profile/') ? decodeURIComponent(window.location.pathname.slice(9)) : 'arjun';
createRoot(document.getElementById('root')).render(<PublicProfile slug={slug} />);
