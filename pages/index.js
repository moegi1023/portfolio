import Head from 'next/head';
import { useEffect } from 'react';

const EMAIL = 'ryuta.miyamoto2028@gmail.com';

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
        await navigator.clipboard.writeText(EMAIL);
      } catch {
        const ta = doc.createElement('textarea');
        ta.value = EMAIL;
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

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>宮本琉太 | Web制作・サービス企画</title>
        <meta
          name="description"
          content="福岡大学法学部の学生。AIを活用したWeb制作やサービス企画に取り組んでいます。新規事業企画「マチクエ」、歴史学研究会の運営などをまとめたポートフォリオです。"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="宮本琉太 | Web制作・サービス企画" />
        <meta
          property="og:description"
          content="福岡大学法学部の学生。AIを活用したWeb制作やサービス企画、新規事業企画「マチクエ」、歴史学研究会の運営などをまとめたポートフォリオ。"
        />
        <meta property="og:url" content="https://ryuta-miyamoto.lolipop-now.app/" />
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
            <a href="#work">Work</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <main id="top" tabIndex={-1}>
          {/* ===== Hero ===== */}
          <section className="hero">
            <p className="hero-eyebrow" data-reveal>
              福岡大学 法学部 3年
            </p>
            <h1 className="hero-name" data-reveal style={{ '--reveal-delay': '60ms' }}>
              宮本 琉太
            </h1>
            <p className="hero-desc" data-reveal style={{ '--reveal-delay': '120ms' }}>
              AIを活用したWeb制作やサービス企画に取り組んでいます。
              <br />
              ニコニコ生放送で顔出し配信も行っています。
            </p>
            <div className="hero-actions" data-reveal style={{ '--reveal-delay': '180ms' }}>
              <a href="#work-machiquest" className="hero-link">
                マチクエ
                <span className="arrow" aria-hidden="true" />
              </a>
              <a href="#work-oboeko" className="hero-link">
                おぼえこ（制作中）
                <span className="arrow" aria-hidden="true" />
              </a>
            </div>
          </section>

          {/* ===== 01 Key Results ===== */}
          <section id="highlights" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                01
              </span>
              <h2>Key Results</h2>
            </div>
            <div className="section-body">
              <div className="highlight-grid">
                <div className="highlight-card" data-reveal>
                  <span className="highlight-eyebrow">配信活動</span>
                  <strong className="highlight-stat">15位入賞</strong>
                  <p>
                    ニコニコ生放送の「年末年始 駅サイネージ出演イベント」（2025年開催）で15位に入賞し、駅のサイネージ広告に掲載されました。
                    <a
                      className="inline-link"
                      href="https://blog.nicovideo.jp/niconews/261898.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      イベントの結果発表ページ
                    </a>
                  </p>
                </div>
                <div className="highlight-card" data-reveal style={{ '--reveal-delay': '90ms' }}>
                  <span className="highlight-eyebrow">サービス企画</span>
                  <strong className="highlight-stat">優秀賞</strong>
                  <p>IT企業のサマーインターンで、商店街の集客を支援する「マチクエ」を企画・提案しました。</p>
                </div>
                <div className="highlight-card" data-reveal style={{ '--reveal-delay': '180ms' }}>
                  <span className="highlight-eyebrow">研究会の運営</span>
                  <strong className="highlight-stat">約5人 → 約30人</strong>
                  <p>部員と協力して新歓企画や活動内容を見直し、研究会の所属者を増やしました。</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 02 Featured Works ===== */}
          <section id="work" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                02
              </span>
              <h2>Featured Work</h2>
            </div>
            <div className="section-body">
              <div className="featured-list">
                {/* --- MachiQuest --- */}
                <article id="work-machiquest" className="featured expandable" data-reveal style={{ '--reveal-delay': '90ms' }}>
                  <div className="mock mock--machiquest" aria-hidden="true">
                    <div className="mock-topbar mock-topbar--dark">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="mock-mq-body">
                      <p className="mock-mq-kicker">IT企業 サマーインターン ／ 新規事業ワーク</p>
                      <p className="mock-mq-title">個人店の集客 × ゲーミフィケーション</p>
                      <p className="mock-mq-name">
                        マチクエ
                        <span>MACHI QUEST</span>
                      </p>
                      <ul className="mock-mq-icons">
                        <li>クエスト</li>
                        <li>経験値</li>
                        <li>制覇マップ</li>
                        <li>連続来街ボーナス</li>
                      </ul>
                    </div>
                  </div>
                  <div className="featured-body">
                    <div className="featured-top">
                      <span className="featured-no">01</span>
                      <h3>マチクエ（MachiQuest）</h3>
                      <span className="status-pill">新規事業の企画案</span>
                      <span className="status-pill status-pill--award">インターン優秀賞</span>
                    </div>
                    <p className="featured-tagline">
                      商店街の集客をテーマに、街歩きとゲーム要素を組み合わせたサービス「マチクエ」を企画しました。利用者だけでなく店舗や運営者の視点も踏まえ、対象顧客や収益モデル、実証方法を検討し、IT企業のサマーインターンで優秀賞を受賞しました。
                    </p>
                    <p className="featured-note">運営中のサービスではなく、実証実験も未実施の企画案です。数値や期間は計画上の想定です。</p>
                    <dl className="featured-facts">
                      <div>
                        <dt>想定顧客</dt>
                        <dd>来街者の減少に悩む商店街・中心市街地の運営者（商店街振興組合、中心市街地活性化協議会、DMOなど）。</dd>
                      </div>
                      <div>
                        <dt>課題</dt>
                        <dd>
                          集客施策がスタンプラリーなど単発で終わりやすい。新規の来街者数や再訪率を数字で示せない。毎回ゼロから準備する負担も大きい。
                        </dd>
                      </div>
                      <div>
                        <dt>サービス概要</dt>
                        <dd>
                          LINEミニアプリで、来街者ひとりひとりに合わせた「今日のクエスト」をAIが生成する設計。3〜4店舗を巡るルートを提示し、チェックインで来街データを可視化する想定。
                        </dd>
                      </div>
                      <div>
                        <dt>差別化</dt>
                        <dd>
                          地図アプリやSNSのように「知っている店に行く」のではなく、「まだ知らない個人店に今日行かせる」設計。値引きではなく発見を軸にする。
                        </dd>
                      </div>
                    </dl>
                    <div id="machiquest-detail" className="expandable-body" hidden>
                      <div className="expandable-inner">
                        <div className="proj-group">
                          <span className="featured-group-label">収益モデル（案）</span>
                          <p className="featured-detail-text">
                            商店街振興組合などとの年間ライセンス契約を本命に、立ち上げ期のPoC受託、単店向けの成果報酬型を組み合わせる案。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">実証実験の案（未実施）</span>
                          <p className="featured-detail-text">鹿児島・天文館エリアで20〜30店舗×6〜8週間の実証実験を行う計画。</p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">測定したい指標（案）</span>
                          <p className="featured-detail-text">
                            クエスト開始率、チェックイン完遂率、1人あたり訪問店舗数、初めて訪れた店の数、再び回遊した割合など。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">AI活用（想定）</span>
                          <p className="featured-detail-text">
                            利用者の好み・行動履歴と、店舗側の情報（来てほしい時間帯や特徴など）を掛け合わせ、個別のクエストとルートを自動生成する想定。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">担当</span>
                          <p className="featured-detail-text">課題設定・顧客像・収益モデル・PoC設計までの立案を担当。</p>
                        </div>
                      </div>
                    </div>
                    <div className="featured-actions">
                      <a
                        className="btn btn--solid"
                        href="https://machiquest.lolipop-now.app/#who"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        詳しい企画書を見る
                      </a>
                      <button
                        type="button"
                        className="btn btn--toggle"
                        data-toggle
                        data-label="詳しく見る"
                        aria-expanded="false"
                        aria-controls="machiquest-detail"
                      >
                        <span className="toggle-label">詳しく見る</span>
                        <span className="toggle-chevron" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 03 Experience ===== */}
          <section id="experience" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                03
              </span>
              <h2>Experience</h2>
            </div>
            <div className="section-body">
              <div className="exp-grid">
                <article className="exp-card expandable" data-reveal>
                  <h3>歴史学研究会</h3>
                  <p className="exp-summary">
                    部員と協力し、歴史初心者にも活動の楽しさが伝わるよう、新歓企画を見直しました。歴史クイズの難易度や進行を改善し、既存の史跡見学を入部前に参加できる日帰り体験として活用しました。
                  </p>
                  <ul className="exp-tags">
                    <li>企画</li>
                    <li>集客</li>
                    <li>コミュニティ運営</li>
                    <li>チーム運営</li>
                  </ul>
                  <div id="exp-history-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        研究発表中心の活動が新入生には堅く見えていたため、部員みんなで案を出し合って見直しました。所属者は、もともと約4〜5人でしたが、2年次の4月に約10人、3年次の4月に約30人になりました（部員全員で取り組んだ結果です）。
                      </p>
                      <ul className="mini-list">
                        <li>初心者も参加しやすいよう、クイズの難易度、進行、解説、広報を見直した</li>
                        <li>既存の史跡見学を、新入生が入部前に参加できる春の日帰り体験として活用した</li>
                        <li>QRコードのアンケートから、体験参加や入部申し込みにつなげた</li>
                        <li>夏の京都・奈良・大阪への2泊3日の旅行（別の企画）では、関心に応じた班ごとに行き先を考える形で行い、その魅力を新歓でも伝えた</li>
                      </ul>
                      <p className="featured-detail-text">
                        自分たちが良いと思うものを押し出すだけでなく、相手が参加しづらい理由を考え、実際の反応をもとに改善する重要性を学んだ。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-history-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>家庭教師</h3>
                  <p className="exp-summary">
                    生徒が解けない原因を「理解力不足」と決めつけず、どこでつまずいているのかを確認して伝え方を変えてきました。
                  </p>
                  <ul className="exp-tags">
                    <li>指導</li>
                    <li>コミュニケーション</li>
                  </ul>
                  <div id="exp-tutor-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        英語の前置詞でつまずいていた生徒には、本人が読んでいた漫画の英題（Attack on Titan）を例に、on
                        が持つ「〜への」というニュアンスを説明するなど、相手が興味を持てる題材に置き換えて伝えることを意識してきた。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-tutor-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>会社法ゼミ</h3>
                  <p className="exp-summary">
                    会社法の判例を2〜3人のグループで調査し発表。株主総会や取締役会の役割、取締役の責任などを学んでいます。
                  </p>
                  <ul className="exp-tags">
                    <li>法律</li>
                    <li>リサーチ</li>
                    <li>プレゼン</li>
                  </ul>
                  <div id="exp-corplaw-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        中でも印象に残っているのは、会社の政治献金が目的の範囲に含まれるかが争われた八幡製鉄政治献金事件で、企業活動は利益の追求だけでなく社会との関係の中でも考える必要があることを学んだ。質疑応答を通じて、根拠を示しながら説明する力を磨いている。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-corplaw-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>インターン</h3>
                  <p className="exp-summary">
                    IT分野のインターンに参加しました。サマーインターンでは、新規事業「
                    <a href="#work-machiquest">マチクエ</a>」を企画・提案し、優秀賞を受賞しました。
                  </p>
                  <ul className="exp-tags">
                    <li>IT</li>
                    <li>新規事業</li>
                  </ul>
                  <div id="exp-intern-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <ul className="companies">
                        <li>IT（Webサービス）</li>
                        <li>SIer</li>
                      </ul>
                      <p className="featured-detail-text">
                        参加したインターンの業種です（社名は伏せています）。企画の詳しい内容は、Featured Workの「マチクエ」にまとめています。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-intern-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 04 Other Works ===== */}
          <section id="other-works" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                04
              </span>
              <h2>Other Works</h2>
            </div>
            <div className="section-body">
              <p data-reveal className="section-note">
                制作中・試作中・構想段階のものです。完成したサービスではありません。
              </p>
              <div className="other-grid">
                <article id="work-oboeko" className="other-card other-card--wide expandable" data-reveal>
                  <div className="other-top">
                    <h3>おぼえこ</h3>
                    <span className="status-pill status-pill--sm">制作中</span>
                  </div>
                  <p>
                    AIを活用して制作中の暗記学習アプリです。授業などで覚えたい内容を、一問一答で繰り返し確認できる仕組みを目指しています。
                  </p>
                  <div id="oboeko-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <div className="proj-group">
                        <span className="featured-group-label">制作の進め方</span>
                        <p className="featured-detail-text">
                          コードの作成はAIに任せ、作りたい内容や変更点を自分で伝えながら制作しています。
                        </p>
                      </div>
                      <div className="proj-group">
                        <span className="featured-group-label">試作版でできること</span>
                        <ul className="mini-list">
                          <li>デッキの作成・編集・削除</li>
                          <li>問題の手入力（表・裏・補足）</li>
                          <li>苦手なカードを優先した確認モード</li>
                          <li>1日の目標枚数と連続学習日数の記録</li>
                          <li>学習データの書き出し・読み込み（バックアップ用ファイル）</li>
                        </ul>
                      </div>
                      <div className="proj-group">
                        <span className="featured-group-label">今後の構想（未実装）</span>
                        <ul className="mini-list">
                          <li>忘却のタイミングに合わせた復習日の自動計算</li>
                          <li>写真やPDFからの問題作成</li>
                          <li>SPI・CABなど適性検査形式への対応</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="other-links">
                    <a href="https://oboeko.lolipop-now.app/" target="_blank" rel="noopener noreferrer">
                      試作版を試す
                    </a>
                    <a href="https://github.com/Rita8300/oboeko" target="_blank" rel="noopener noreferrer">
                      GitHubでコードを見る
                    </a>
                    <button
                      type="button"
                      className="exp-toggle"
                      data-toggle
                      data-label="詳しく見る"
                      aria-expanded="false"
                      aria-controls="oboeko-detail"
                    >
                      <span className="toggle-label">詳しく見る</span>
                      <span className="toggle-chevron" aria-hidden="true" />
                    </button>
                  </div>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>TOEIC英単語学習ツール</h3>
                    <span className="status-pill status-pill--sm">試作中</span>
                  </div>
                  <p>Excelを使って英単語を反復学習できる仕組みを制作。自分の学習の不便を出発点にした個人用ツール。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>配信支援アプリ</h3>
                    <span className="status-pill status-pill--sm">試作中</span>
                  </div>
                  <p>ニコニコ生放送などを想定し、コメントやギフトのランキングを表示するアプリの試作。自分のパソコン上で動作を確認した段階です。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>大学授業・単位案内Bot</h3>
                    <span className="status-pill status-pill--sm">構想段階</span>
                  </div>
                  <p>大学の学修ガイドを読み込ませ、授業や単位に関する質問に答えるBotの構想。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>法学部学生向けDiscordコミュニティ</h3>
                    <span className="status-pill status-pill--sm">構想段階</span>
                  </div>
                  <p>法学部の学生が授業情報や過去問を共有できるコミュニティの設計。</p>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 05 Skills ===== */}
          <section id="skills" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                05
              </span>
              <h2>Tools</h2>
            </div>
            <div className="section-body">
              <div className="skill-groups">
                <div className="skill-group" data-reveal>
                  <h3>使用ツール</h3>
                  <ul className="chips">
                    <li>ChatGPT</li>
                    <li>Claude Code</li>
                  </ul>
                  <p className="skill-use">文章や企画の整理、Webサイトやアプリの制作に活用しています。</p>
                  <p className="skill-use">
                    コードの作成はAIに任せ、作りたい内容や変更点を伝えながら制作を進めています。
                  </p>
                  <p className="skill-use">
                    今後はプログラミングの基礎から学び、自分でもコードを理解し、書けるようになることを目指しています。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 06 About ===== */}
          <section id="about" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                06
              </span>
              <h2>About</h2>
            </div>
            <div className="section-body">
              <ul data-reveal className="fact-list">
                <li>福岡大学 法学部（会社法ゼミ）</li>
                <li>AIを活用したWeb制作やサービス企画に取り組んでいる</li>
                <li>大学では歴史学研究会の活動にも参加</li>
                <li>技術だけでなく、企画やユーザー体験にも関心がある</li>
                <li>趣味として、ニコニコ生放送で顔出し配信をしています</li>
              </ul>
              <p data-reveal className="about-note">
                IT業界を志望していて、まず手を動かして試すことを大事にしている。
              </p>
            </div>
          </section>

          {/* ===== 07 Contact ===== */}
          <section id="contact" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                07
              </span>
              <h2>Contact</h2>
            </div>
            <div className="section-body">
              <p data-reveal className="section-note">
                連絡はメールでお願いします。
              </p>
              <div data-reveal className="contact-box">
                <span className="contact-addr">{EMAIL}</span>
                <div className="contact-actions">
                  <a href={`mailto:${EMAIL}`} className="btn btn--solid">
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
          <span>© 2026 宮本琉太</span>
          <span>Fukuoka University</span>
        </footer>
      </div>

      <div role="status" aria-live="polite" className="toast">
        <span className="toast-inner">アドレスをコピーしました</span>
      </div>
    </>
  );
}
