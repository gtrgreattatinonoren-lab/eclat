/* ÉCLAT アプリ本体:ハッシュルーター+描画。ビルド不要の素のJS */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls) => `<svg class="icon ${cls || ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const LESSONS = window.LESSONS, CATS = window.CATEGORIES, TRACKS = window.TRACKS, VIDEOS = window.VIDEOS;
  const UPDATES = (window.UPDATES || []).slice().sort((a, b) => b.month.localeCompare(a.month));
  const byId = Object.fromEntries(LESSONS.map(l => [l.id, l]));
  const vById = Object.fromEntries(VIDEOS.map(v => [v.id, v]));
  const catName = Object.fromEntries(CATS.map(c => [c.id, c.name]));
  const catField = Object.fromEntries(CATS.map(c => [c.id, c.field || 'hair']));

  /* ── 保存(ブラウザ内のみ。失敗しても動くように) ── */
  const KEY = 'eclat.state';
  let S = { track: null, field: 'hair', sub: 'makeup', done: {}, quiz: {}, saved: [] };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast fade'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

  /* ── 外部の最新検索リンク ── */
  const EXT = {
    yt: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D`,
    ig: t => `https://www.instagram.com/explore/tags/${encodeURIComponent(String(t).replace(/^#/, '').replace(/\s+/g, ''))}/`,
    news: q => `https://news.google.com/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`,
    hpb: q => `https://beauty.hotpepper.jp/catalog/ladys/word${encodeURIComponent(q)}/`,
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`
  };

  const illust = (key, alt) => `<img src="img/illust/${esc(key)}.jpg" alt="${esc(alt || '')}" loading="lazy" onerror="this.parentNode.classList.add('noimg');this.remove()">`;
  const ytThumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  /* ── ナビ ── */
  const NAV = [
    ['', 'home', 'ホーム'], ['learn', 'book', '学ぶ'], ['videos', 'play', '動画'],
    ['trends', 'sparkle', 'トレンド'], ['quiz', 'award', '国試クイズ'], ['search', 'search', '探す']
  ];
  function renderNav(route) {
    const cur = route.split('/')[0];
    $('#sidenav').innerHTML = NAV.map(([r, i, l]) => `<a href="#/${r}" class="${cur === r ? 'on' : ''}">${icon(i)}<span>${l}</span></a>`).join('') +
      `<a href="#/settings" class="${cur === 'settings' ? 'on' : ''}">${icon('gear')}<span>設定</span></a>`;
    $('#tabbar').innerHTML = NAV.filter(n => n[0] !== 'quiz').map(([r, i, l]) => `<a href="#/${r}" class="tab ${cur === r || (r === 'learn' && (cur === 'lesson' || cur === 'quiz')) ? 'on' : ''}">${icon(i)}<span>${l}</span></a>`).join('');
    const t = TRACKS[S.track];
    $('#trackcard').innerHTML = t ? `<span class="eyebrow">${esc(t.en)}</span><b>${esc(t.name)}</b>
      <div class="progress"><i style="width:${pathProgress()}%"></i></div>
      <div class="small muted" style="margin-top:6px">ステップ ${t.path.filter(id => S.done[id]).length} / ${t.path.length} 完了 · <a href="#/settings">変更</a></div>` : '';
  }
  function pathProgress(t) { t = t || TRACKS[S.track]; if (!t) return 0; return Math.round(t.path.filter(id => S.done[id]).length / t.path.length * 100); }

  /* ── ヘア/ビューティーの切り替え ── */
  const isBeauty = () => S.field === 'beauty';
  const fieldCats = () => CATS.filter(c => (c.field || 'hair') === (isBeauty() ? 'beauty' : 'hair'));
  const BCATS = () => CATS.filter(c => c.field === 'beauty');
  const sub = () => (BCATS().some(c => c.id === S.sub) ? S.sub : 'makeup');
  const setSub = c => { if (catField[c] === 'beauty' && (S.field !== 'beauty' || S.sub !== c)) { S.field = 'beauty'; S.sub = c; save(); } };
  const fieldBar = () => `<div class="field-bar" role="group" aria-label="カテゴリーの切り替え"><button type="button" class="${isBeauty() ? '' : 'on'}" data-field="hair">${icon('scissors')}ヘア</button>${BCATS().map(c => `<button type="button" class="${isBeauty() && sub() === c.id ? 'on' : ''}" data-field="b:${c.id}">${icon(c.icon)}${esc(c.name)}</button>`).join('')}</div>`;

  /* ── 部品 ── */
  function lessonCard(l) {
    return `<a class="card lcard" href="#/lesson/${l.id}">
      <div class="thumb">${illust(l.illust, '')}${S.done[l.id] ? '<span class="done-badge">DONE</span>' : ''}</div>
      <div class="body"><span class="eyebrow" style="font-size:10.5px">${esc(catName[l.cat])}</span><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p>
      <div class="meta">${icon('book')}<span>${l.min}分</span>${l.blocks.some(b => b.video) ? `<span>· 動画 ${l.blocks.filter(b => b.video).length}本</span>` : ''}</div></div></a>`;
  }
  function videoCard(v, extra) {
    if (!v) return '';
    return `<button class="card vcard" data-play="${v.id}">
      <div class="vthumb"><img src="${ytThumb(v.id)}" alt="" loading="lazy"><span class="play"><i><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></i></span>${v.len ? `<span class="len">${esc(v.len)}</span>` : ''}</div>
      <div class="vb"><b>${esc(v.title)}</b><span>${esc(v.ch)}${extra || ''}</span></div></button>`;
  }
  function playVideo(id) {
    const v = vById[id] || { id, title: '', ch: '' };
    const el = document.createElement('div');
    el.className = 'player fade';
    el.innerHTML = `<div class="box"><div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <div class="cap"><span>${esc(v.title)}<br><small style="opacity:.7">${esc(v.ch)} · YouTube</small></span><span style="display:flex;gap:8px;flex:none"><a class="btn sm" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">YouTubeで開く</a><button class="btn sm" data-close>閉じる</button></span></div></div>`;
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) el.remove(); });
    document.body.appendChild(el);
  }
  const srcs = list => list && list.length ? `<div class="srcs">出典:${list.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || s.url)}</a>`).join(' / ')}</div>` : '';
  const hashtags = tags => tags && tags.length ? `<div class="htags">${tags.map(t => `<a href="${EXT.ig(t)}" target="_blank" rel="noopener">${esc(t.startsWith('#') ? t : '#' + t)}</a>`).join('')}</div>` : '';

  /* ── 画面:オンボーディング ── */
  function onboarding(force) {
    if (S.track && !force) return;
    const el = document.createElement('div');
    el.className = 'onboard fade';
    const keys = ['student', 'exam', 'assistant', 'pro'];
    el.innerHTML = `<div class="in"><div class="eyebrow">Hair Academy for Beginners</div><div class="mark">ÉCLAT</div>
      <p class="lead">美容師をめざす人の、技術と知識のノート。<br>今のあなたに合わせて、学ぶ順番を用意します。</p>
      <div class="tracks">${keys.map((k, i) => `<button class="trk" data-track="${k}"><span class="no">0${i + 1}</span><span><em>${TRACKS[k].en}</em><b>${TRACKS[k].name}</b><p>${TRACKS[k].lead}</p></span></button>`).join('')}</div>
      <p class="small muted" style="margin-top:22px">あとから「設定」でいつでも変えられます。</p></div>`;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-track]'); if (!b) return;
      S.track = b.dataset.track; save(); el.remove(); location.hash = '#/'; route();
    });
    document.body.appendChild(el);
  }

  /* ── 画面:ホーム ── */
  function viewHome() {
    if (isBeauty()) return viewHomeBeauty();
    const t = TRACKS[S.track] || TRACKS.student;
    const path = t.path.map(id => byId[id]).filter(Boolean);
    const next = path.find(l => !S.done[l.id]) || path[0];
    const up = UPDATES[0];
    const doneCount = Object.keys(S.done).length;
    const best = Object.values(S.quiz).reduce((m, q) => Math.max(m, q.best || 0), 0);
    const recentVideos = VIDEOS.filter(v => v.cat === 'trend').concat(VIDEOS.filter(v => (next.blocks || []).some(b => b.video === v.id))).slice(0, 3);
    return `${fieldBar()}<section class="hero fade"><div class="hero-img">${illust(next.illust, '')}</div><div class="hero-in">
        <span class="eyebrow">${esc(t.en)} course</span><h1>${esc(t.name)}</h1><p>${esc(t.lead)}</p>
        <a class="btn gold" href="#/lesson/${next.id}">${S.done[next.id] ? '復習する' : '次のレッスン'}:${esc(next.title)}</a>
        <div class="stat-row"><div class="stat"><b>${pathProgress()}%</b><span>コース進み具合</span></div><div class="stat"><b>${doneCount}</b><span>読んだレッスン</span></div><div class="stat"><b>${best}%</b><span>クイズ最高点</span></div></div>
      </div></section>
      <div class="home-cols"><div>
        <section class="section"><div class="section-head"><div><div class="eyebrow">Your path</div><h2>あなたの学ぶ順番</h2></div><a href="#/learn">すべてのレッスン</a></div>
          <div class="path">${path.map((l, i) => `<a class="path-item ${S.done[l.id] ? 'done' : ''}" href="#/lesson/${l.id}"><span class="path-no">${S.done[l.id] ? icon('check') : i + 1}</span><span class="t"><b>${esc(l.title)}</b><span>${esc(catName[l.cat])} · ${l.min}分</span></span></a>`).join('')}</div></section>
      </div><div>
        ${up ? `<section class="section"><div class="section-head"><div><div class="eyebrow">Monthly update</div><h2>${monthLabel(up.month)}のトレンド</h2></div><a href="#/trends">すべて見る</a></div>
          <div class="grid">${(up.trends || []).slice(0, 3).map(tr => `<a class="card trend" href="#/trends"><span class="tag">${kindLabel(tr.kind)}</span><h3>${esc(tr.title)}</h3><p class="muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(tr.summary)}</p></a>`).join('')}</div></section>` : ''}
        <section class="section"><div class="section-head"><div><div class="eyebrow">Watch</div><h2>おすすめ動画</h2></div><a href="#/videos">動画一覧</a></div>
          <div class="grid">${recentVideos.map(v => videoCard(v)).join('')}</div></section>
        <section class="section card pad"><div class="eyebrow">Daily quiz</div><h2 style="margin:4px 0 8px">国家試験の一問一答</h2><p class="muted small" style="margin:0 0 14px">10問ずつ。間違えた問題は解説で確認しよう。</p><a class="btn gold" href="#/quiz/all">今日の10問をはじめる</a></section>
      </div></div>`;
  }
  function viewHomeBeauty() {
    const c = sub();
    const t = Object.assign({}, window.BEAUTY_TRACK, { name: catName[c], path: LESSONS.filter(l => l.cat === c).map(l => l.id) });
    const path = t.path.map(id => byId[id]).filter(Boolean);
    const next = path.find(l => !S.done[l.id]) || path[0];
    const doneCount = path.filter(l => S.done[l.id]).length;
    return `${fieldBar()}<section class="hero fade"><div class="hero-img">${illust(next.illust, '')}</div><div class="hero-in">
        <span class="eyebrow">${esc(t.en)} course</span><h1>${esc(t.name)}</h1><p>${esc(t.lead)}</p>
        <a class="btn gold" href="#/lesson/${next.id}">${S.done[next.id] ? '復習する' : '次のレッスン'}:${esc(next.title)}</a>
        <div class="stat-row"><div class="stat"><b>${pathProgress(t)}%</b><span>コース進み具合</span></div><div class="stat"><b>${doneCount}</b><span>読んだレッスン</span></div><div class="stat"><b>${path.length}</b><span>レッスン数</span></div></div>
      </div></section>
      <div class="home-cols"><div>
        <section class="section"><div class="section-head"><div><div class="eyebrow">Your path</div><h2>学ぶ順番</h2></div><a href="#/learn/${c}">一覧で見る</a></div>
          <div class="path">${path.map((l, i) => `<a class="path-item ${S.done[l.id] ? 'done' : ''}" href="#/lesson/${l.id}"><span class="path-no">${S.done[l.id] ? icon('check') : i + 1}</span><span class="t"><b>${esc(l.title)}</b><span>${esc(catName[l.cat])} · ${l.min}分</span></span></a>`).join('')}</div></section>
      </div><div>
        <section class="section"><div class="section-head"><div><div class="eyebrow">Categories</div><h2>分野から選ぶ</h2></div></div>
          <div class="catgrid">${fieldCats().map(c => `<a class="cat" href="#/learn/${c.id}">${icon(c.icon)}<b>${c.name}</b><span>${c.en}</span></a>`).join('')}</div></section>
        ${(() => { const up = UPDATES.find(u => catTrends(u, c).length); const l = catTrends(up, c); return l.length ? `<section class="section"><div class="section-head"><div><div class="eyebrow">Trend</div><h2>${esc(catName[c])}の最新トレンド</h2></div><a href="#/trends/c-${c}">すべて見る</a></div><div class="grid">${l.slice(0, 2).map(trendCard).join('')}</div></section>` : ''; })()}
        <section class="section card pad"><div class="eyebrow">Watch</div><h2 style="margin:4px 0 8px">動画で見る</h2><p class="muted small" style="margin:0 0 14px">メイク・ネイル・まつ毛の新しい動画をYouTubeで探せます。</p><a class="btn gold" href="#/videos">動画を探す</a></section>
      </div></div>`;
  }
  const monthLabel = m => { const [y, mo] = m.split('-'); return `${y}年${+mo}月`; };
  const kindLabel = k => ({ style: 'ヘアスタイル', color: 'カラー', technique: '技術', business: '業界', makeup: 'メイク', nail: 'ネイル', lash: 'まつ毛・眉', skin: 'スキンケア', kitsuke: '着付け・ブライダル' }[k] || 'トレンド');

  /* ── 画面:学ぶ ── */
  function viewLearn(cat) {
    const t = S.track;
    if (cat && catField[cat] === 'beauty') setSub(cat);
    else if (cat && catField[cat] && catField[cat] !== S.field) { S.field = catField[cat]; save(); }
    if (isBeauty() && !cat) cat = sub();
    const fc = fieldCats(), fids = fc.map(c => c.id);
    const list = LESSONS.filter(l => fids.includes(l.cat)).filter(l => !cat || cat === 'mine' ? (cat === 'mine' ? l.tracks.includes(t) : true) : l.cat === cat);
    return `<div class="fade">${fieldBar()}<div class="eyebrow">Lessons</div><h1>学ぶ${isBeauty() ? ':' + esc(catName[cat]) : ''}</h1>
      <p class="muted">${isBeauty() ? 'メイク・ネイル・まつ毛・スキンケア・着付けを、ヘアとは別枠でまとめています。' : '図解と動画で、ひとつずつ。'}読み終えたら「読んだ」を押すと進み具合に反映されます。</p>
      ${isBeauty() ? '<div style="height:18px"></div>' : `<div class="chips" style="margin:18px 0 22px"><a class="chip ${!cat ? 'on' : ''}" href="#/learn">すべて</a>${`<a class="chip ${cat === 'mine' ? 'on' : ''}" href="#/learn/mine">${esc((TRACKS[t] || {}).name || 'マイコース')}向け</a>`}${fc.map(c => `<a class="chip ${cat === c.id ? 'on' : ''}" href="#/learn/${c.id}">${c.name}</a>`).join('')}</div>`}
      ${!cat ? `<div class="catgrid" style="margin-bottom:28px">${fc.map(c => `<a class="cat" href="#/learn/${c.id}">${icon(c.icon)}<b>${c.name}</b><span>${c.en}</span></a>`).join('')}</div>` : ''}
      ${(() => { if (!cat || cat === 'mine') return ''; const up = UPDATES.find(u => catTrends(u, cat).length); const l = catTrends(up, cat); return l.length ? `<section class="section" style="margin-top:0"><div class="section-head"><div><div class="eyebrow">Trend · ${monthLabel(up.month)}</div><h2>${esc(catName[cat])}の最新トレンド</h2></div><a href="#/trends/c-${cat}/${up.month}">すべて見る</a></div><div class="grid c2">${l.slice(0, 2).map(trendCard).join('')}</div></section>` : ''; })()}
      <div class="grid c3">${list.map(lessonCard).join('')}</div>
      ${isBeauty() ? '' : `<section class="section card pad"><div class="eyebrow">License exam</div><h2 style="margin:4px 0 8px">国家試験クイズ</h2><p class="muted small" style="margin:0 0 14px">学科5科目の練習問題(オリジナル)。</p><a class="btn gold" href="#/quiz">科目を選ぶ</a></section>`}</div>`;
  }

  /* ── 画面:レッスン ── */
  function block(b) {
    if (b.h) return `<h3>${esc(b.h)}</h3>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.list) return `<ul>${b.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (b.steps) return `<ol class="steps">${b.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;
    if (b.table) return `<div class="tablewrap"><table><thead><tr>${b.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (b.tip) return `<div class="note tip">${icon('bulb')}<b>POINT</b>${esc(b.tip)}</div>`;
    if (b.ng) return `<div class="note ng">${icon('alert')}<b>CAUTION</b>${esc(b.ng)}</div>`;
    if (b.diagram && window.DIAGRAMS[b.diagram]) {
      const d = window.DIAGRAMS[b.diagram];
      const imgs = d.imgs || (d.img ? [{ src: d.img }] : null);
      if (imgs) {
        const sw = imgs.length > 1 ? `<div class="dg-switch" role="group" aria-label="イラストの切り替え">${imgs.map((m, i) => `<button type="button" class="${i ? '' : 'on'}" data-dg="${i}" aria-pressed="${i ? 'false' : 'true'}">${esc(m.label)}</button>`).join('')}</div>` : '';
        return `<figure class="diagram has-img">${sw}${imgs.map((m, i) => `<img src="${m.src}" alt="${esc(d.cap)}${m.label ? '(' + esc(m.label) + ')' : ''}" data-dgi="${i}"${i ? ' hidden' : ' loading="lazy"'} onerror="this.dataset.err=1;var f=this.parentNode;if(![].some.call(f.querySelectorAll('img'),function(x){return !x.dataset.err})){f.classList.remove('has-img');f.querySelectorAll('img,.dg-switch').forEach(function(x){x.remove()})}">`).join('')}<figcaption>${esc(d.cap)}</figcaption>${d.svg ? `<details class="diagram-line"><summary>線の図でも見る</summary>${d.svg}</details>` : ''}</figure>`;
      }
      return `<figure class="diagram">${d.svg}<figcaption>${esc(d.cap)}</figcaption></figure>`;
    }
    return '';
  }
  function viewLesson(id) {
    const l = byId[id]; if (!l) return `<div class="empty">レッスンが見つかりません。<br><a href="#/learn">一覧へ</a></div>`;
    if (catField[l.cat] === 'beauty') setSub(l.cat); else if (catField[l.cat] !== S.field) { S.field = catField[l.cat]; save(); }
    const vids = l.blocks.filter(b => b.video).map(b => vById[b.video]).filter(Boolean);
    const related = LESSONS.filter(x => x.cat === l.cat && x.id !== l.id).slice(0, 3);
    const saved = S.saved.includes(l.id);
    return `<div class="fade"><a class="back" href="#/learn/${l.cat}">${icon('arrow')}${esc(catName[l.cat])}</a>
      <div class="lesson"><article>
        <div class="lesson-hero">${illust(l.illust, l.title)}</div>
        <div style="margin:22px 0 18px"><span class="eyebrow">${esc(catName[l.cat])} · ${l.min} min</span><h1 style="margin-top:6px">${esc(l.title)}</h1><p class="muted" style="margin:8px 0 0">${esc(l.summary)}</p></div>
        <div class="prose">${l.blocks.filter(b => !b.video).map(block).join('')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
          <button class="btn ${S.done[l.id] ? '' : 'gold'}" data-done="${l.id}">${S.done[l.id] ? icon('check') + '読んだ(取り消す)' : '読んだ'}</button>
          <button class="btn" data-save="${l.id}">${icon('bookmark')}${saved ? '保存済み' : 'あとで見る'}</button>
          <a class="btn" href="${EXT.yt(l.title + (catField[l.cat] === 'beauty' ? '' : ' 美容師'))}" target="_blank" rel="noopener">${icon('yt')}YouTubeで新着を探す</a>
        </div>
      </article>
      <aside>
        ${vids.length ? `<div class="eyebrow" style="margin-bottom:10px">Videos</div><div class="grid">${vids.map(v => videoCard(v)).join('')}</div>` : ''}
        ${related.length ? `<div class="eyebrow" style="margin:26px 0 10px">Related</div><div class="grid">${related.map(r => `<a class="card result" href="#/lesson/${r.id}"><b>${esc(r.title)}</b><span>${esc(r.summary)}</span></a>`).join('')}</div>` : ''}
      </aside></div></div>`;
  }

  /* ── 画面:動画 ── */
  const VCATS = [['', 'すべて'], ['trend', 'トレンド'], ['exam', '国家試験'], ['shampoo', 'シャンプー'], ['dry', 'ドライ'], ['cut', 'カット'], ['color', 'カラー'], ['perm', 'パーマ'], ['set', 'ヘアセット'], ['service', '接客']];
  const BVIDS = [['makeup', 'ベースメイク', 'ベースメイク やり方'], ['makeup', 'アイメイク', 'アイシャドウ 塗り方 基本'], ['makeup', 'メンズ美容', 'メンズ 眉 スキンケア'], ['makeup', 'パーソナルカラー', 'パーソナルカラー メイク 似合う色'],
    ['nail', 'ネイルケア', 'ネイルケア やり方 甘皮'], ['nail', 'ジェルネイル', 'ジェルネイル やり方 初心者'], ['nail', 'ネイリスト検定', 'ネイリスト技能検定 3級'],
    ['lash', '眉の整え方', '眉毛 書き方 整え方'], ['lash', 'まつ毛エクステ', 'まつげエクステ 施術 基本'], ['lash', 'まつ毛パーマ', 'まつげパーマ 施術'],
    ['skin', 'スキンケア', 'スキンケア 順番 基本'], ['skin', 'フェイシャル', 'フェイシャル マッサージ やり方'],
    ['kitsuke', '振袖の着付け', '振袖 着付け 手順'], ['kitsuke', '浴衣の着付け', '浴衣 着付け 手順'], ['kitsuke', 'ブライダルヘアメイク', 'ブライダル ヘアメイク'],
    ['bcareer', 'アイリストの仕事', 'アイリスト 仕事 1日'], ['bcareer', 'ヘアメイクの仕事', 'ヘアメイクアーティスト 仕事']];
  function viewVideos(cat) {
    if (isBeauty()) return `<div class="fade">${fieldBar()}<div class="eyebrow">Video library</div><h1>動画で学ぶ:${esc(catName[sub()])}</h1>
      <p class="muted">テーマを選ぶと、YouTubeの新しい動画を検索して開きます。</p>
      <div class="grid c3" style="margin-top:20px">${BVIDS.filter(v => v[0] === sub()).map(([, n, q]) => `<a class="card ext" href="${EXT.yt(q)}" target="_blank" rel="noopener">${icon('yt')}<span><b>${n}</b><span>${esc(q)} の新着動画</span></span></a>`).join('')}</div></div>`;
    const list = VIDEOS.filter(v => !cat || v.cat === cat);
    return `<div class="fade">${fieldBar()}<div class="eyebrow">Video library</div><h1>動画で学ぶ</h1>
      <p class="muted">YouTubeの解説動画を分野別に。アプリの中でそのまま再生できます。</p>
      <div class="chips" style="margin:18px 0 22px">${VCATS.map(([k, n]) => `<a class="chip ${cat === k || (!cat && !k) ? 'on' : ''}" href="#/videos/${k}">${n}</a>`).join('')}</div>
      <div class="grid c3">${list.map(v => videoCard(v)).join('')}</div>
      <p class="small muted" style="margin-top:24px">動画の著作権は各チャンネルに帰属します。毎月の更新で新しい動画を追加しています。</p></div>`;
  }

  /* ── 画面:トレンド ── */
  const TTABS = [['trends', 'トレンド'], ['instagram', 'Instagramまとめ'], ['techniques', '新しい技術'], ['exam', '国家試験'], ['salonWork', '業界・働き方'], ['styles', 'スタイル図鑑']];
  function viewTrends(tab, month) {
    const tcat = tab && tab.startsWith('c-') ? tab.slice(2) : null;
    if (tcat && catField[tcat] && catField[tcat] !== S.field) { S.field = catField[tcat]; save(); }
    if (tab === 'beauty' && !isBeauty()) { S.field = 'beauty'; save(); }
    if (tcat && catField[tcat] === 'beauty') setSub(tcat);
    if (isBeauty()) return viewTrendsBeauty(month, tcat);
    tab = tab || 'trends';
    const up = UPDATES.find(u => u.month === month) || UPDATES[0];
    let body = '';
    if (tcat) {
      const l = catTrends(up, tcat);
      body = l.length ? `<h2 style="margin:20px 0 12px">${esc(catName[tcat] || '')}のトレンド</h2><div class="grid c2">${l.map(trendCard).join('')}</div>` : '<div class="empty">このカテゴリのトレンドはまだありません。</div>';
    } else if (tab === 'styles') {
      const L = { veryshort: 'ベリーショート', short: 'ショート', bob: 'ボブ', medium: 'ミディアム', semi: 'セミロング', long: 'ロング' };
      body = Object.keys(L).map(k => { const st = window.STYLES.filter(s => s.len === k); return st.length ? `<h2 style="margin:26px 0 12px">${L[k]}</h2><div class="stylegrid">${st.map(s => `<button class="card style" data-style="${s.id}"><img src="img/styles/${s.id}.jpg" alt="${esc(s.name)}のイラスト" loading="lazy"><div class="sb"><b>${esc(s.name)}</b><span>${esc(s.en)}</span></div></button>`).join('')}</div>` : ''; }).join('');
    } else if (!up) {
      body = `<div class="empty">まだ更新データがありません。</div>`;
    } else if (tab === 'trends') {
      body = `<div class="grid c2">${(up.trends || []).map(t => `<article class="card trend"><span class="tag">${kindLabel(t.kind)}</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
        ${t.points && t.points.length ? `<ul class="pts">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${hashtags(t.hashtags)}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" href="${EXT.yt(t.title)}" target="_blank" rel="noopener">${icon('yt')}動画</a><a class="btn sm" href="${EXT.hpb(t.title.replace(/[（(].*?[）)]/g, '').split(/[・/／]/)[0])}" target="_blank" rel="noopener">${icon('ext')}スタイル写真</a></div>${srcs(t.sources)}</article>`).join('')}</div>`;
    } else if (tab === 'instagram') {
      body = `<p class="muted small" style="margin:0 0 16px">Instagramの投稿は自動取り込みできないため、ハッシュタグと公開情報から話題をまとめています。気になったら最後のリンクから本物の投稿を見てください。</p>
        <div class="grid c2">${(up.instagram || []).map(t => `<article class="card trend"><span class="tag">${icon('ig').replace('class="icon ', 'style="width:12px;height:12px;vertical-align:-2px" class="icon ')} Instagram</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
          <div class="ig-links">${(t.tags || []).map(tag => `<a class="btn sm" href="${EXT.ig(tag)}" target="_blank" rel="noopener">${esc(tag.startsWith('#') ? tag : '#' + tag)}</a>`).join('')}${(t.accounts || []).map(a => `<a class="btn sm" href="${esc(a.url)}" target="_blank" rel="noopener">@ ${esc(a.name)}</a>`).join('')}</div>${srcs(t.sources)}</article>`).join('')}</div>`;
    } else if (tab === 'techniques' || tab === 'salonWork') {
      const lv = { student: '学生向け', exam: '国試', assistant: 'アシスタント', pro: 'スタイリスト' };
      body = `<div class="grid c2">${(up[tab] || []).map(t => `<article class="card trend">${t.level ? `<span class="tag">${lv[t.level] || t.level}</span>` : ''}<h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
        <div><a class="btn sm" href="${EXT.yt(t.title)}" target="_blank" rel="noopener">${icon('yt')}新着動画</a> <a class="btn sm" href="${EXT.news(t.title)}" target="_blank" rel="noopener">${icon('news')}ニュース</a></div>${srcs(t.sources)}</article>`).join('')}</div>`;
    } else if (tab === 'exam') {
      const ex = up.exam || {};
      body = `<div class="card pad"><p style="margin-top:0">${esc(ex.summary || '')}</p>${ex.facts && ex.facts.length ? `<div class="tablewrap"><table><tbody>${ex.facts.map(f => `<tr><td>${esc(f.label)}</td><td>${esc(f.value)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        <a class="btn gold" href="https://www.rbc.or.jp/" target="_blank" rel="noopener">${icon('ext')}理容師美容師試験研修センター</a>${srcs(ex.sources)}</div>`;
    }
    return `<div class="fade">${fieldBar()}<div class="eyebrow">Monthly update${up ? ' · ' + monthLabel(up.month) : ''}</div><h1>トレンドと新しい技術</h1>
      <p class="muted">ネット・YouTube・Instagramの話題を毎月まとめて更新しています。${up && up.updated ? `最終更新 ${esc(up.updated)}` : ''}</p>
      ${UPDATES.length > 1 ? `<div class="chips" style="margin-top:12px">${UPDATES.map(u => `<a class="chip ${u === up ? 'on' : ''}" href="#/trends/${tab}/${u.month}">${monthLabel(u.month)}</a>`).join('')}</div>` : ''}
      <div class="chips" style="margin:14px 0 4px">${TTABS.map(([k, n]) => `<a class="chip ${tab === k ? 'on' : ''}" href="#/trends/${k}${up ? '/' + up.month : ''}">${n}</a>`).join('')}</div>${catChips(up, tcat)}<div style="height:16px"></div>${body}</div>`;
  }
  const TSRC = { trends: 'トレンド', techniques: '新しい技術', salonWork: '業界・働き方', beauty: 'トレンド' };
  const catTrends = (up, cat) => up ? ['trends', 'techniques', 'salonWork', 'beauty'].flatMap(k => (up[k] || []).map(t => ({ ...t, src: k }))).filter(t => t.cat === cat) : [];
  function trendCard(t) {
    const tag = t.src === 'techniques' || t.src === 'salonWork' ? TSRC[t.src] : kindLabel(t.kind);
    const q = t.title.replace(/[（(].*?[）)]/g, '');
    return `<article class="card trend"><span class="tag">${esc(tag)}</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
        ${t.points && t.points.length ? `<ul class="pts">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${hashtags(t.hashtags)}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" href="${EXT.yt(q)}" target="_blank" rel="noopener">${icon('yt')}動画</a><a class="btn sm" href="${EXT.ig((t.hashtags || [q])[0])}" target="_blank" rel="noopener">${icon('ig')}Instagram</a></div>${srcs(t.sources)}</article>`;
  }
  const catChips = (up, cur) => { const cs = fieldCats().filter(c => catTrends(up, c.id).length); return cs.length ? `<div class="chips" style="margin:6px 0 4px"><span class="chip-label">カテゴリ別</span>${cs.map(c => `<a class="chip ${cur === c.id ? 'on' : ''}" href="#/trends/c-${c.id}${up ? '/' + up.month : ''}">${c.name} ${catTrends(up, c.id).length}</a>`).join('')}</div>` : ''; };
  function viewTrendsBeauty(month, cat) {
    cat = cat || sub(); setSub(cat);
    const ups = UPDATES.filter(u => catTrends(u, cat).length);
    const up = ups.find(u => u.month === month) || ups[0];
    const sec = c => { const l = catTrends(up, c.id); return l.length ? `<h2 style="margin:26px 0 12px">${esc(c.name)}</h2><div class="grid c2">${l.map(trendCard).join('')}</div>` : ''; };
    const shown = fieldCats().filter(c => !cat || c.id === cat);
    return `<div class="fade">${fieldBar()}<div class="eyebrow">Monthly update${up ? ' · ' + monthLabel(up.month) : ''}</div><h1>${esc(catName[cat])}のトレンド</h1>
      <p class="muted">美容メディアやサロンの公開情報から、カテゴリーごとに話題をまとめています。上のボタンでカテゴリーを切り替えられます。${up && up.updated ? `最終更新 ${esc(up.updated)}` : ''}</p>
      ${ups.length > 1 ? `<div class="chips" style="margin-top:12px">${ups.map(u => `<a class="chip ${u === up ? 'on' : ''}" href="#/trends/c-${cat}/${u.month}">${monthLabel(u.month)}</a>`).join('')}</div>` : ''}
      ${up ? shown.map(sec).join('') : '<div class="empty">このカテゴリーのトレンドはまだありません。毎週の更新で追加していきます。</div>'}</div>`;
  }
  function openStyle(id) {
    const s = window.STYLES.find(x => x.id === id); if (!s) return;
    const el = document.createElement('div'); el.className = 'sheet fade';
    el.innerHTML = `<div class="in"><div class="style-detail"><img src="img/styles/${s.id}.jpg" alt="${esc(s.name)}"><div>
      <span class="eyebrow">${esc(s.en)}</span><h2 style="margin:4px 0 10px">${esc(s.name)}</h2><p style="margin:0 0 14px">${esc(s.catch)}</p>
      <div class="note tip">${icon('scissors')}<b>CUT</b>${esc(s.tech)}</div><div class="note tip">${icon('wind')}<b>STYLING</b>${esc(s.styling)}</div>
      <p class="small muted">メンテナンスの目安:${esc(s.cycle || '')}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" href="${EXT.yt(s.name + ' カット 切り方')}" target="_blank" rel="noopener">${icon('yt')}切り方の動画</a><a class="btn sm" href="${EXT.ig(s.name.replace(/\s/g, ''))}" target="_blank" rel="noopener">${icon('ig')}Instagram</a><a class="btn sm" href="${EXT.hpb(s.name)}" target="_blank" rel="noopener">${icon('ext')}写真カタログ</a><button class="btn sm" data-close>閉じる</button></div>
      </div></div></div>`;
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) el.remove(); });
    document.body.appendChild(el);
  }

  /* ── 画面:クイズ ── */
  let Q = null;
  function viewQuiz(sub) {
    const SUB = window.QUIZ_SUBJECTS;
    if (!sub) {
      return `<div class="fade"><div class="eyebrow">License exam</div><h1>国家試験クイズ</h1><p class="muted">学科の練習問題(オリジナル)。1回10問、選んだ科目からランダムに出題します。</p>
        <div class="grid c3" style="margin-top:20px">${[['all', '全科目ミックス']].concat(Object.entries(SUB)).map(([k, n]) => { const r = S.quiz[k]; const cnt = k === 'all' ? window.QUIZ.length : window.QUIZ.filter(q => q.s === k).length;
          return `<a class="card pad" href="#/quiz/${k}"><span class="eyebrow" style="font-size:10.5px">${cnt}問</span><h3 style="margin:4px 0 8px">${n}</h3><div class="progress"><i style="width:${r ? r.best : 0}%"></i></div><div class="small muted" style="margin-top:6px">${r ? `最高 ${r.best}% · 前回 ${r.last}%` : 'まだ挑戦していません'}</div></a>`; }).join('')}</div>
        <p class="small muted" style="margin-top:22px">法令や数値は改正されることがあります。最新の教科書と公式情報で確認してください。</p></div>`;
    }
    if (!Q || Q.sub !== sub) {
      const pool = window.QUIZ.filter(q => sub === 'all' || q.s === sub).slice();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      Q = { sub, list: pool.slice(0, 10), i: 0, ok: 0, answered: false };
    }
    if (Q.i >= Q.list.length) {
      const pct = Math.round(Q.ok / Q.list.length * 100);
      const r = S.quiz[sub] || { best: 0 }; S.quiz[sub] = { best: Math.max(r.best, pct), last: pct }; save();
      const html = `<div class="fade card score"><div class="eyebrow">Result</div><b>${pct}<small style="font-size:24px">%</small></b><p>${Q.list.length}問中 ${Q.ok}問正解。${pct >= 60 ? '合格ライン(6割)を超えています!' : 'まずは6割をめざそう。'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn gold" data-retry="${sub}">もう一度</button><a class="btn" href="#/quiz">科目を選ぶ</a></div></div>`;
      Q = null; return html;
    }
    const q = Q.list[Q.i];
    return `<div class="fade" style="max-width:760px"><a class="back" href="#/quiz">${icon('arrow')}科目を選ぶ</a>
      <div class="qbar"><span>${esc(window.QUIZ_SUBJECTS[q.s])}</span><span>${Q.i + 1} / ${Q.list.length}</span></div>
      <div class="progress" style="margin-top:8px"><i style="width:${Q.i / Q.list.length * 100}%"></i></div>
      <p class="quiz-q">${esc(q.q)}</p>
      <div class="opts" id="opts">${q.c.map((c, i) => `<button class="opt" data-ans="${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>
      <div id="explain"></div></div>`;
  }
  function answer(i) {
    if (!Q || Q.answered) return;
    const q = Q.list[Q.i]; Q.answered = true;
    const right = i === q.a; if (right) Q.ok++;
    document.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    $('#explain').innerHTML = `<div class="explain fade"><b style="color:var(${right ? '--ok' : '--ng'})">${right ? '正解' : '不正解'}</b> — ${esc(q.e)}</div>
      <div style="margin-top:16px"><button class="btn gold" data-next>${Q.i + 1 < Q.list.length ? '次の問題' : '結果を見る'}</button></div>`;
  }

  /* ── 画面:探す ── */
  function viewSearch(q) {
    q = (q || '').trim();
    const hit = s => s && s.toLowerCase().includes(q.toLowerCase());
    const mark = s => q ? esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`) : esc(s);
    let results = '';
    if (q) {
      const ls = LESSONS.filter(l => hit(l.title) || hit(l.summary) || JSON.stringify(l.blocks).includes(q));
      const vs = VIDEOS.filter(v => hit(v.title) || hit(v.ch));
      const ts = UPDATES.flatMap(u => ['trends', 'instagram', 'techniques', 'salonWork', 'beauty'].flatMap(k => (u[k] || []).map(t => ({ ...t, month: u.month, k })))).filter(t => hit(t.title) || hit(t.summary));
      const ss = window.STYLES.filter(s => hit(s.name) || hit(s.tech) || hit(s.catch));
      const total = ls.length + vs.length + ts.length + ss.length;
      results = `<section class="section"><div class="eyebrow">In this app</div><h2 style="margin-bottom:12px">アプリ内の結果 ${total}件</h2>
        ${total ? '' : '<p class="muted">アプリ内には見つかりませんでした。下のボタンでネットの最新情報を探せます。</p>'}
        <div class="grid c2">${ls.map(l => `<a class="card result" href="#/lesson/${l.id}"><span class="tag">レッスン</span> <b>${mark(l.title)}</b><span>${mark(l.summary)}</span></a>`).join('')}
        ${ts.map(t => `<a class="card result" href="#/trends/${t.k}/${t.month}"><span class="tag">${monthLabel(t.month)}</span> <b>${mark(t.title)}</b><span>${mark(t.summary.slice(0, 80))}…</span></a>`).join('')}
        ${ss.map(s => `<button class="card result" style="text-align:left" data-style="${s.id}"><span class="tag">スタイル図鑑</span> <b>${mark(s.name)}</b><span>${mark(s.catch)}</span></button>`).join('')}</div>
        ${vs.length ? `<div class="grid c3" style="margin-top:14px">${vs.map(v => videoCard(v)).join('')}</div>` : ''}</section>`;
    }
    const term = q || '美容師 新技術';
    const ext = [
      ['yt', 'YouTube(新着順)', '投稿が新しい順に動画を探す', EXT.yt(term)],
      ['ig', 'Instagram ハッシュタグ', '#' + term.replace(/\s+/g, '') + ' の投稿を見る', EXT.ig(term)],
      ['news', 'Google ニュース', '業界ニュース・新商品・制度の話題', EXT.news(term)],
      ['ext', 'ホットペッパービューティー', 'スタイル写真カタログ', EXT.hpb(q || 'トレンド')],
      ['search', 'Google 検索', 'メーカー資料や解説記事まで広く', EXT.google(term)]
    ];
    return `<div class="fade"><div class="eyebrow">Search</div><h1>探す</h1><p class="muted">アプリ内のレッスン・動画・トレンドを検索。働き始めてからも、ネットの最新情報へすぐ飛べます。</p>
      <form class="searchbox" id="sform" style="margin-top:18px" role="search">${icon('search')}<input id="sq" type="search" value="${esc(q)}" placeholder="例:酸性ストレート、ウルフ、消毒、補色" enterkeyhint="search"><button class="btn gold sm" type="submit">検索</button></form>
      <div class="chips" style="margin-top:12px">${['ハイライト', 'くびれヘア', '酸性ストレート', '消毒', 'ワインディング', 'ヘッドスパ', 'メンズ', 'カウンセリング', 'メイク', 'ネイル', 'まつ毛', '着付け'].map(w => `<a class="chip" href="#/search/${encodeURIComponent(w)}">${w}</a>`).join('')}</div>
      ${results}
      <section class="section"><div class="eyebrow">Latest on the web</div><h2 style="margin-bottom:12px">ネットで最新を探す${q ? `:「${esc(q)}」` : ''}</h2>
        <div class="grid c3">${ext.map(([i, n, d, u]) => `<a class="card ext" href="${u}" target="_blank" rel="noopener">${icon(i)}<span><b>${n}</b><span>${esc(d)}</span></span></a>`).join('')}</div></section></div>`;
  }

  /* ── 画面:設定 ── */
  function viewSettings() {
    const theme = document.documentElement.dataset.theme || 'dark';
    return `<div class="fade" style="max-width:760px"><div class="eyebrow">Settings</div><h1>設定</h1>
      <div class="card" style="margin-top:20px">
        <div class="setting"><div><b>コース</b><div class="small muted">${esc((TRACKS[S.track] || {}).name || '未選択')}</div></div><button class="btn sm" data-reonboard>変更する</button></div>
        <div class="setting"><div><b>テーマ</b><div class="small muted">ノワール(黒×ゴールド)/アイボリー</div></div><div class="seg"><button class="${theme === 'dark' ? 'on' : ''}" data-theme="dark">Noir</button><button class="${theme === 'light' ? 'on' : ''}" data-theme="light">Ivory</button></div></div>
        <div class="setting"><div><b>学習記録を消す</b><div class="small muted">読んだレッスンとクイズの記録(この端末だけに保存)</div></div><button class="btn sm" data-reset>消す</button></div>
      </div>
      <div class="card pad" style="margin-top:18px"><h3>ホーム画面に追加する</h3>
        <p class="small muted" style="margin:6px 0 0"><b>iPhone・iPad</b>:Safariで開き、共有ボタン →「ホーム画面に追加」<br><b>Android</b>:Chromeのメニュー →「ホーム画面に追加」または「アプリをインストール」<br><b>PC</b>:Chrome/Edgeのアドレスバー右のインストールボタン</p></div>
      <div class="card pad" style="margin-top:18px"><h3>このアプリについて</h3>
        <p class="small muted" style="margin:6px 0 0">内容は一般的な教科書・メーカー資料・公開情報をもとにしたまとめです。法令・試験・薬剤の数値は改正されることがあるため、最新の教科書と公式発表で確認してください。トレンドとInstagramまとめは毎月更新しています(最新:${UPDATES[0] ? monthLabel(UPDATES[0].month) : '—'})。動画・投稿の著作権は各投稿者に帰属します。イラストはCanvaで作成。</p></div></div>`;
  }

  /* ── ルーター ── */
  function route() {
    const raw = decodeURIComponent((location.hash || '#/').slice(2));
    const [name, a, b] = raw.split('/');
    let html;
    switch (name) {
      case '': html = viewHome(); break;
      case 'learn': html = viewLearn(a); break;
      case 'lesson': html = viewLesson(a); break;
      case 'videos': html = viewVideos(a); break;
      case 'trends': html = viewTrends(a, b); break;
      case 'quiz': html = viewQuiz(a); break;
      case 'search': html = viewSearch(a); break;
      case 'settings': html = viewSettings(); break;
      default: html = viewHome();
    }
    document.querySelectorAll('.player,.sheet').forEach(x => x.remove());
    $('#view').innerHTML = html;
    renderNav(name);
    window.scrollTo(0, 0);
    const fb = $('.field-bar'), fo = fb && fb.querySelector('.on'); if (fo) fb.scrollLeft = fo.offsetLeft - (fb.clientWidth - fo.offsetWidth) / 2;
    document.title = 'ÉCLAT 美容師の学び';
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-dg],[data-play],[data-style],[data-done],[data-save],[data-ans],[data-next],[data-retry],[data-theme],[data-reset],[data-reonboard],[data-field]');
    if (!t) return;
    const d = t.dataset;
    if (d.dg !== undefined) {
      const f = t.closest('figure');
      f.querySelectorAll('[data-dg]').forEach(b => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      f.querySelectorAll('img[data-dgi]').forEach(im => { im.hidden = im.dataset.dgi !== d.dg; });
    }
    else if (d.field) {
      const b = d.field.startsWith('b:') ? d.field.slice(2) : null;
      S.field = b ? 'beauty' : 'hair'; if (b) S.sub = b; save();
      const n = location.hash.slice(2).split('/')[0];
      const to = n === 'learn' ? (b ? '#/learn/' + b : '#/learn') : n === 'trends' ? (b ? '#/trends/c-' + b : '#/trends') : n === 'videos' ? '#/videos' : null;
      if (to && location.hash !== to) location.hash = to; else route();
    }
    else if (d.play) playVideo(d.play);
    else if (d.style) openStyle(d.style);
    else if (d.done) { if (S.done[d.done]) delete S.done[d.done]; else S.done[d.done] = Date.now(); save(); toast(S.done[d.done] ? '読んだレッスンに追加しました' : '取り消しました'); route(); }
    else if (d.save) { const i = S.saved.indexOf(d.save); if (i >= 0) S.saved.splice(i, 1); else S.saved.push(d.save); save(); route(); }
    else if (d.ans !== undefined) answer(+d.ans);
    else if (d.next !== undefined) { Q.i++; Q.answered = false; route(); }
    else if (d.retry) { Q = null; route(); }
    else if (d.theme) { document.documentElement.dataset.theme = d.theme; try { localStorage.setItem('eclat.theme', d.theme); } catch (er) { } document.querySelector('meta[name=theme-color]').content = d.theme === 'light' ? '#f6f1e8' : '#0d0c0a'; route(); }
    else if (d.reset !== undefined) { if (confirm('学習記録を消しますか?')) { S.done = {}; S.quiz = {}; S.saved = []; save(); route(); } }
    else if (d.reonboard !== undefined) onboarding(true);
  });
  document.addEventListener('submit', e => { if (e.target.id === 'sform') { e.preventDefault(); location.hash = '#/search/' + encodeURIComponent($('#sq').value.trim()); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.player,.sheet').forEach(x => x.remove()); });
  window.addEventListener('hashchange', route);
  route();
  onboarding(false);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
