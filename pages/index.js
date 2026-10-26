import Head from 'next/head';
import { Fragment, useEffect } from 'react';
import content from '../content/active';

export default function Home() {
  useEffect(() => {
    const doc = document;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];
    const on = (el, ev, fn, opts) => {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      cleanups.push(() => el.removeEventListener(ev, fn, opts));
    };

    // --- スクロール表示アニメ + ジャンプ移動のフォールバック ---
    const revealEls = Array.from(doc.querySelectorAll('[data-reveal]'));
    const heads = Array.from(doc.querySelectorAll('.section-head'));
    const watched = [...revealEls, ...heads];
    const show = (el) => el.classList.add('is-visible');

    if ('IntersectionObserver' in window && !prefersReduced) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      );
      watched.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());

      const sweep = () => {
        const vh = window.innerHeight || doc.documentElement.clientHeight;
        watched.forEach((el) => {
          if (el.classList.contains('is-visible')) return;
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.95) {
            show(el);
            io.unobserve(el);
          }
        });
      };
      sweep();
      on(window, 'load', sweep);
      on(window, 'hashchange', () => setTimeout(sweep, 60));
      on(window, 'resize', sweep, { passive: true });
      setTimeout(sweep, 300);

      let lastSweep = 0;
      on(
        window,
        'scroll',
        () => {
          const now = Date.now();
          if (now - lastSweep < 90) return;
          lastSweep = now;
          sweep();
        },
        { passive: true }
      );
    } else {
      watched.forEach(show);
    }

    // --- 開閉トグル（Featured Works / Experience 共通） ---
    // 閉じた内容は hidden 属性でアクセシビリティツリーから外す。
    // 開くときは即座に hidden を外してからアニメーションし、閉じるときは
    // アニメーションが終わってから hidden を付ける（見た目のアニメーションを切らないため）。
    const hideTimers = new WeakMap();
    doc.querySelectorAll('[data-toggle]').forEach((btn) => {
      const wrap = btn.closest('.expandable');
      const body = wrap ? wrap.querySelector('.expandable-body') : null;
      on(btn, 'click', () => {
        if (!wrap) return;
        const open = wrap.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        const label = btn.querySelector('.toggle-label');
        if (label) label.textContent = open ? '閉じる' : btn.dataset.label || '詳しく見る';
        if (body) {
          const prevTimer = hideTimers.get(body);
          if (prevTimer) clearTimeout(prevTimer);
          if (open) {
            body.hidden = false;
          } else {
            const t = setTimeout(() => {
              body.hidden = true;
            }, prefersReduced ? 0 : 420);
            hideTimers.set(body, t);
          }
        }
      });
    });

    // --- ナビのスクロールスパイ（今見ているセクションをハイライト） ---
    // IntersectionObserver ではなく実座標で判定する。バックグラウンドタブ等で
    // オブザーバのコールバックが遅延・停止する環境でも確実に動くようにするため。
    const navItems = Array.from(doc.querySelectorAll('.topnav a'))
      .map((link) => ({ link, el: doc.getElementById(link.getAttribute('href').slice(1)) }))
      .filter((item) => item.el);
    if (navItems.length) {
      const setActiveNav = () => {
        const line = window.innerHeight * 0.4;
        let current = navItems[0];
        for (const item of navItems) {
          if (item.el.getBoundingClientRect().top - line <= 0) current = item;
        }
        navItems.forEach(({ link }) => link.classList.remove('is-active'));
        current.link.classList.add('is-active');
      };
      setActiveNav();
      on(window, 'load', setActiveNav);
      on(window, 'resize', setActiveNav, { passive: true });
      let lastSpyRun = 0;
      on(
        window,
        'scroll',
        () => {
          const now = Date.now();
          if (now - lastSpyRun < 90) return;
          lastSpyRun = now;
          setActiveNav();
        },
        { passive: true }
      );
    }

    // --- アドレスをコピー ---
    const copyBtn = doc.querySelector('[data-copy]');
    const toast = doc.querySelector('.toast-inner');
    let toastTimer;
    on(copyBtn, 'click', async () => {
      try {
        await navigator.clipboard.writeText(content.contact.email);
      } catch {
        const ta = doc.createElement('textarea');
        ta.value = content.contact.email;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        try {
          doc.execCommand('copy');
        } catch {
          /* noop */
        }
        doc.body.removeChild(ta);
      }
      if (toast) {
        toast.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
      }
    });

    return () => {
      clearTimeout(toastTimer);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const c = content;
  const extrasAfter = (id) => (c.extraSections || []).filter((s) => s.after === id);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{c.meta.title}</title>
        <meta name="description" content={c.meta.description} />
        {c.meta.noindex && <meta name="robots" content="noindex, nofollow" />}
        <meta name="theme-color" content="#fbfaf7" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={c.meta.title} />
        <meta property="og:description" content={c.meta.ogDescription} />
        <meta property="og:url" content={c.meta.url} />
        <meta name="twitter:card" content="summary" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="page">
        <header className="topbar">
          <a href="#top" className="wordmark">
            宮本琉太
          </a>
          <nav className="topnav">
            {c.nav.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
        </header>

        <main id="top" tabIndex={-1}>
          {/* ===== Hero ===== */}
          <section className="hero">
            <p className="hero-eyebrow" data-reveal>
              {c.hero.eyebrow}
            </p>
            <h1 className="hero-name" data-reveal style={{ '--reveal-delay': '60ms' }}>
              {c.hero.name}
            </h1>
            <p className="hero-desc" data-reveal style={{ '--reveal-delay': '120ms' }}>
              {c.hero.lines.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </p>
            <div className="hero-actions" data-reveal style={{ '--reveal-delay': '180ms' }}>
              {c.hero.links.map((l) => (
                <a key={l.href} href={l.href} className="hero-link">
                  {l.label}
                  <span className="arrow" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          {/* ===== 主な実績 ===== */}
          <section id="highlights" className="section">
            <div data-reveal className="section-head">
              <h2>{c.highlights.title}</h2>
            </div>
            <div className="section-body">
              <div className="highlight-grid">
                {c.highlights.items.map((h, i) => (
                  <div key={h.label} className="highlight-card" data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
                    <span className="highlight-eyebrow">{h.label}</span>
                    <strong className="highlight-stat">{h.stat}</strong>
                    <p>
                      {h.text}
                      {h.link && <ExtLink className="inline-link" link={h.link} />}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== 制作 ===== */}
          <section id="work" className="section">
            <div data-reveal className="section-head">
              <h2>{c.work.title}</h2>
            </div>
            <div className="section-body">
              <div className="featured-list">
                <article id={c.work.item.id} className="featured" data-reveal style={{ '--reveal-delay': '90ms' }}>
                  <div className="featured-body">
                    <div className="featured-top">
                      <h3>{c.work.item.title}</h3>
                      {c.work.item.pills.map((p) => (
                        <span key={p.text} className={p.award ? 'status-pill status-pill--award' : 'status-pill'}>
                          {p.text}
                        </span>
                      ))}
                    </div>
                    <p className="featured-tagline">{c.work.item.lead}</p>
                    <p className="featured-note">{c.work.item.note}</p>
                    <dl className="featured-facts">
                      {c.work.item.facts.map((f) => (
                        <div key={f.label}>
                          <dt>{f.label}</dt>
                          <dd>{f.text}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="featured-actions">
                      {c.work.item.links.map((l) => (
                        <ExtLink key={l.href} className={l.primary ? 'btn btn--solid' : 'btn'} link={l} bare />
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 経験 ===== */}
          <section id="experience" className="section">
            <div data-reveal className="section-head">
              <h2>{c.experience.title}</h2>
            </div>
            <div className="section-body">
              <div className="exp-grid">
                {c.experience.items.map((e) => (
                  <article key={e.id} className="exp-card expandable" data-reveal>
                    <h3>{e.title}</h3>
                    <p className="exp-summary">
                      {e.summary}
                      {e.link && <ExtLink className="inline-link" link={e.link} />}
                    </p>
                    <ul className="exp-tags">
                      {e.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <div id={`${e.id}-detail`} className="expandable-body" hidden>
                      <div className="expandable-inner">
                        <Blocks blocks={e.blocks} />
                      </div>
                    </div>
                    <Toggle controls={`${e.id}-detail`} />
                  </article>
                ))}
              </div>
            </div>
          </section>

          {extrasAfter('experience').map((s) => (
            <ExtraSection key={s.id} section={s} />
          ))}

          {/* ===== 試作・構想 ===== */}
          <section id="other-works" className="section">
            <div data-reveal className="section-head">
              <h2>{c.otherWorks.title}</h2>
            </div>
            <div className="section-body">
              <p data-reveal className="section-note">
                {c.otherWorks.note}
              </p>
              <div className="other-grid">
                {c.otherWorks.items.map((w) => (
                  <article
                    key={w.title}
                    id={w.id}
                    className={w.blocks ? 'other-card expandable' : 'other-card'}
                    data-reveal
                  >
                    <div className="other-top">
                      <h3>{w.title}</h3>
                      <span className="status-pill status-pill--sm">{w.status}</span>
                    </div>
                    <p>{w.text}</p>
                    {w.blocks && (
                      <div id={`${w.id}-detail`} className="expandable-body" hidden>
                        <div className="expandable-inner">
                          <Blocks blocks={w.blocks} />
                        </div>
                      </div>
                    )}
                    {(w.links || w.blocks) && (
                      <div className="other-links">
                        {(w.links || []).map((l) => (
                          <ExtLink key={l.href} link={l} bare />
                        ))}
                        {w.blocks && <Toggle controls={`${w.id}-detail`} />}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>

          {extrasAfter('other-works').map((s) => (
            <ExtraSection key={s.id} section={s} />
          ))}

          {/* ===== ツール ===== */}
          <section id="skills" className="section">
            <div data-reveal className="section-head">
              <h2>{c.tools.title}</h2>
            </div>
            <div className="section-body">
              <div data-reveal>
                <ul className="chips">
                  {c.tools.chips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <Blocks blocks={c.tools.blocks} plain />
              </div>
            </div>
          </section>

          {/* ===== 自己紹介 ===== */}
          <section id="about" className="section">
            <div data-reveal className="section-head">
              <h2>{c.about.title}</h2>
            </div>
            <div className="section-body">
              <ul data-reveal className="fact-list">
                {c.about.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p data-reveal className="about-note">
                {c.about.note}
              </p>
            </div>
          </section>

          {/* ===== 連絡先 ===== */}
          <section id="contact" className="section">
            <div data-reveal className="section-head">
              <h2>{c.contact.title}</h2>
            </div>
            <div className="section-body">
              <p data-reveal className="section-note">
                {c.contact.note}
              </p>
              <div data-reveal className="contact-box">
                <span className="contact-addr">{c.contact.email}</span>
                <div className="contact-actions">
                  <a href={`mailto:${c.contact.email}`} className="btn btn--solid">
                    メールを書く
                  </a>
                  <button type="button" className="btn" data-copy>
                    アドレスをコピー
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          {c.footer.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </footer>
      </div>

      <div role="status" aria-live="polite" className="toast">
        <span className="toast-inner">アドレスをコピーしました</span>
      </div>
    </>
  );
}

// ---- 共通の小さな部品（内容は持たない） ----

function ExtLink({ link, className, bare }) {
  const external = /^https?:/.test(link.href);
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <a className={className} href={link.href} {...props}>
      {link.label}
    </a>
  );
}

function Toggle({ controls }) {
  return (
    <button type="button" className="exp-toggle" data-toggle data-label="詳しく見る" aria-expanded="false" aria-controls={controls}>
      <span className="toggle-label">詳しく見る</span>
      <span className="toggle-chevron" aria-hidden="true" />
    </button>
  );
}

// p / list / chips / group の4種類だけを描画する
function Blocks({ blocks, plain }) {
  return blocks.map((b, i) => {
    if (b.type === 'p') {
      return (
        <p key={i} className={plain ? 'skill-use' : 'featured-detail-text'}>
          {b.text}
        </p>
      );
    }
    if (b.type === 'list') {
      return (
        <ul key={i} className="mini-list">
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    }
    if (b.type === 'chips') {
      return (
        <ul key={i} className="companies">
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    }
    if (b.type === 'group') {
      return (
        <div key={i} className="proj-group">
          <span className="featured-group-label">{b.label}</span>
          <Blocks blocks={b.blocks} plain={plain} />
        </div>
      );
    }
    return null;
  });
}

function ExtraSection({ section }) {
  return (
    <section id={section.id} className="section">
      <div data-reveal className="section-head">
        <h2>{section.title}</h2>
      </div>
      <div className="section-body" data-reveal>
        {section.lead && <p className="section-lead">{section.lead}</p>}
        <Blocks blocks={section.blocks} />
        {section.links && (
          <div className="other-links">
            {section.links.map((l) => (
              <ExtLink key={l.href} link={l} bare />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
