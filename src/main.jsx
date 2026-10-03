import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowDownToLine, ArrowUpRight, Check, Copy, Instagram, Linkedin, Link as LinkIcon, Mail, Phone, QrCode, Share2, X, Youtube } from 'lucide-react';
import './minimal.css';

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
function PublicProfile({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const aboutRef = useRef(null);
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
          <section className="hero-stage" aria-label="IEEE coordinator profile introduction">
            <div className="shell hero-inner">
              <div className="hero-copy">
                <p className="eyebrow hero-caption">IEEE STUDENT BRANCH · VJEC</p>
                <span className="hero-rule" aria-hidden="true" />
                <p className="hero-intro-label">Coordinator profile</p>
                <h1>{profile?.name || 'Coordinator'}</h1>
                {profile && <><p className="hero-role">{profile.designation}{profile.team_role ? ` · ${profile.team_role}` : ''}</p><p className="hero-affiliation">{profile.organization || 'IEEE SB VJEC'}{profile.society ? ` / ${profile.society}` : ''}</p></>}
                <div className="hero-actions"><a className="primary-action" href="#sb-vjec">View profile <ArrowDown size={18} /></a>{profile && <button className="quiet-action" onClick={downloadVcard}>Save contact <ArrowDownToLine size={18} /></button>}</div>
                {profile && <p className="hero-number">COORDINATOR ID&nbsp; {String(profile.id).padStart(4, '0')}</p>}
              </div>
              <div className="hero-visual">
                <span className="portrait-watermark" aria-hidden="true">IEEE</span>
                {(profile || slug === 'arjun') && <Portrait profile={profile || { slug, name: '', photo: null }} />}
                <div className="visual-caption"><span>IEEE SB VJEC</span><span>PEOPLE BEHIND THE BRANCH</span></div>
              </div>
            </div>
          </section>

          {profile ? <section className="about-section" id="sb-vjec" ref={aboutRef} aria-labelledby="branch-heading">
            <div className="shell">
              <p className="eyebrow about-kicker">IEEE SB VJEC / PEOPLE</p>
              <h2 className="branch-heading" id="branch-heading">Profile &amp; contact</h2>
              <div className="branch-grid">
                <div className="branch-intro"><p className="branch-note">ABOUT</p><h3>{profile.name}</h3><p className="branch-role">{profile.designation}{profile.team_role ? ` · ${profile.team_role}` : ''}</p><p className="branch-bio">{profile.bio || `${profile.name} is a coordinator at ${profile.organization || 'IEEE SB VJEC'}.`}</p></div>
                <div className="accounts-panel"><div className="panel-label"><span>CONNECT ONLINE</span><span>{String(accounts.length).padStart(2, '0')} ACCOUNTS</span></div>{accounts.length ? <div className="account-list">{accounts.map(({ label, href, icon: Icon }, index) => <a className="account-link" key={`${label}-${index}`} href={href} target="_blank" rel="noreferrer" style={{ '--index': index }}><span className="account-icon"><Icon size={22} /></span><span>{label}</span><ArrowUpRight className="account-arrow" size={20} /></a>)}</div> : <p className="empty-accounts">Official account links will appear here when added.</p>}</div>
              </div>
              <div className="profile-details"><div><span>ORGANIZATION</span><strong>{profile.organization || 'IEEE SB VJEC'}</strong></div>{profile.society && <div><span>SOCIETY</span><strong>{profile.society}</strong></div>}{profile.department && <div><span>ACADEMIC DEPARTMENT</span><strong>{profile.department}</strong></div>}</div>
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
