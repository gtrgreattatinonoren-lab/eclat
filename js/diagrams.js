/* 自作の図解(正確さが必要な図はAIイラストではなくSVGで描く) */
(function () {
  const T = (x, y, s, cls) => `<text x="${x}" y="${y}" class="svg-txt ${cls || ''}">${s}</text>`;
  function point(x, y, lx, ly, label, sub, anchor) {
    const a = anchor || 'start';
    return `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" class="svg-soft"/>
      <circle cx="${x}" cy="${y}" r="4.5" class="svg-dot"/>
      <text x="${lx + (a === 'end' ? -4 : 4)}" y="${ly + 4}" text-anchor="${a}" class="svg-txt g">${label}<tspan class="svg-txt s" dx="5">${sub}</tspan></text>`;
  }
  const D = {};

  D.headpoints = {
    imgs: [{ label: '女性', src: 'img/diagram/headpoints-f.jpg' }, { label: '男性', src: 'img/diagram/headpoints-m.jpg' }],
    cap: '横から見た頭のおおよその位置(FSP・SP・EP・EBP・NSPは左右に1つずつある)',
    svg: `<svg viewBox="0 0 540 330" role="img" aria-label="頭部のポイントの図">
      <path class="svg-line" d="M107,130 A115,115 0 1 1 291,241 L286,318"/>
      <path class="svg-line" d="M107,130 C100,150 102,165 100,174 L84,201 L98,207 C93,216 101,222 98,229 C96,241 104,249 108,259 C122,274 152,274 178,262 L204,250 L214,318"/>
      <ellipse cx="222" cy="174" rx="13" ry="22" class="svg-line"/>
      <path class="svg-soft" d="M126,84 C150,100 170,120 190,142" stroke-dasharray="3 4"/>
      ${point(126, 84, 30, 52, 'CP', 'センター')}
      ${point(220, 35, 168, 14, 'TP', 'トップ')}
      ${point(301, 69, 352, 40, 'GP', 'ゴールデン')}
      ${point(335, 150, 372, 138, 'BP', 'バック')}
      ${point(294, 238, 352, 262, 'NP', 'ネープ')}
      ${point(142, 116, 22, 112, 'FSP', 'フロントサイド')}
      ${point(194, 146, 120, 300, 'SP', 'サイド')}
      ${point(222, 152, 250, 100, 'EP', 'イヤー')}
      ${point(237, 188, 312, 196, 'EBP', 'イヤーバック')}
      ${point(268, 236, 300, 300, 'NSP', 'ネープサイド')}
    </svg>` };

  D.hairlayers = {
    img: 'img/diagram/hairlayers.jpg',
    cap: '毛髪の断面(外から キューティクル → コルテックス → メデュラ)',
    svg: `<svg viewBox="0 0 500 220" role="img" aria-label="毛髪の断面図">
      <circle cx="120" cy="110" r="92" class="svg-line" stroke-width="10" opacity=".55"/>
      <circle cx="120" cy="110" r="82" class="svg-line"/>
      <circle cx="120" cy="110" r="22" class="svg-line" stroke-dasharray="4 3"/>
      ${Array.from({ length: 26 }, (_, i) => { const a = i / 26 * Math.PI * 2, r1 = 30 + (i % 3) * 14; return `<circle cx="${(120 + Math.cos(a) * r1).toFixed(1)}" cy="${(110 + Math.sin(a) * r1).toFixed(1)}" r="2" class="svg-dot" opacity=".5"/>`; }).join('')}
      <line x1="205" y1="60" x2="250" y2="44" class="svg-soft"/>${T(256, 48, 'キューティクル(毛小皮)', 'g')}${T(256, 66, 'うろこ状。内部を守る。アルカリで開く', 's')}
      <line x1="170" y1="110" x2="250" y2="110" class="svg-soft"/>${T(256, 114, 'コルテックス(毛皮質)', 'g')}${T(256, 132, '大部分を占める。メラニン(点)を含む', 's')}
      <line x1="135" y1="125" x2="250" y2="176" class="svg-soft"/>${T(256, 180, 'メデュラ(毛髄質)', 'g')}${T(256, 198, '中心部。細い毛にはないことも', 's')}
    </svg>` };

  D.elevation = {
    imgs: [{ label: '女性', src: 'img/diagram/elevation-f.jpg' }, { label: '男性', src: 'img/diagram/elevation-m.jpg' }],
    cap: '毛束を引き出す角度(エレベーション)と仕上がりの関係',
    svg: `<svg viewBox="0 0 500 300" role="img" aria-label="エレベーションの図">
      <circle cx="150" cy="140" r="96" class="svg-line"/>
      <circle cx="243" cy="164" r="5" class="svg-dot"/>
      <path class="svg-soft" d="M243,164 m0,40 A40,40 0 0 0 283,164" />
      <line x1="243" y1="164" x2="243" y2="286" class="svg-line"/>${T(250, 284, '0° ワンレングス', 'g')}
      <line x1="243" y1="164" x2="330" y2="251" class="svg-line"/>${T(334, 256, '45° グラデーション', 'g')}
      <line x1="243" y1="164" x2="360" y2="164" class="svg-line"/>${T(366, 160, '90°', 'g')}${T(366, 177, 'セイムレイヤー', 'g')}
      <line x1="243" y1="164" x2="330" y2="77" class="svg-line"/>${T(334, 74, '90°以上 レイヤー', 'g')}
      ${T(105, 145, '頭', 's')}
    </svg>` };

  D.colorwheel = {
    img: 'img/diagram/colorwheel.jpg',
    cap: '向かい合う色が補色。混ぜると打ち消しあう',
    svg: (() => {
      const cols = [['赤', '#b8473a'], ['オレンジ', '#d4823a'], ['黄', '#d6bf45'], ['緑', '#5a8f55'], ['青', '#3f64a3'], ['紫', '#7a55a0']];
      const cx = 150, cy = 150, R = 110, r = 58;
      let s = '';
      cols.forEach((c, i) => {
        const a0 = (i * 60 - 120) * Math.PI / 180, a1 = ((i + 1) * 60 - 120) * Math.PI / 180;
        const p = (rad, a) => `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
        s += `<path d="M${p(R, a0)} A${R},${R} 0 0 1 ${p(R, a1)} L${p(r, a1)} A${r},${r} 0 0 0 ${p(r, a0)} Z" fill="${c[1]}" stroke="var(--bg)" stroke-width="2"/>`;
        const am = (a0 + a1) / 2;
        s += `<text x="${(cx + Math.cos(am) * 84).toFixed(1)}" y="${(cy + Math.sin(am) * 84 + 4).toFixed(1)}" text-anchor="middle" class="svg-txt" style="fill:#fff;font-size:11px;font-weight:600">${c[0]}</text>`;
      });
      [[0, 3], [1, 4], [2, 5]].forEach(([i]) => {
        const am = ((i * 60 - 90) * Math.PI) / 180;
        s += `<line x1="${(cx + Math.cos(am) * 54).toFixed(1)}" y1="${(cy + Math.sin(am) * 54).toFixed(1)}" x2="${(cx - Math.cos(am) * 54).toFixed(1)}" y2="${(cy - Math.sin(am) * 54).toFixed(1)}" class="svg-line" stroke-dasharray="4 4"/>`;
      });
      return `<svg viewBox="0 0 460 300" role="img" aria-label="色相環と補色">${s}
        ${T(290, 92, '赤み → 緑で消す', 'g')}${T(290, 112, 'マット系', 's')}
        ${T(290, 150, 'オレンジ → 青で消す', 'g')}${T(290, 170, 'アッシュ系', 's')}
        ${T(290, 208, '黄み → 紫で消す', 'g')}${T(290, 228, 'バイオレット系', 's')}</svg>`;
    })() };

  D.perm = {
    img: 'img/diagram/perm.jpg',
    cap: 'パーマ:1剤でS-S結合を切り、巻いた形のまま2剤でつなぎ直す',
    svg: (() => {
      const col = (x, title, sub, body) => `<g transform="translate(${x},0)">${body}<text x="70" y="250" text-anchor="middle" class="svg-txt g">${title}</text><text x="70" y="268" text-anchor="middle" class="svg-txt s">${sub}</text></g>`;
      const straight = `<line x1="45" y1="30" x2="45" y2="220" class="svg-line"/><line x1="95" y1="30" x2="95" y2="220" class="svg-line"/>` +
        [60, 110, 160, 200].map(y => `<line x1="45" y1="${y}" x2="95" y2="${y}" class="svg-line" stroke-width="2.4"/>`).join('');
      const cut = `<line x1="45" y1="30" x2="45" y2="220" class="svg-line"/><line x1="95" y1="30" x2="95" y2="220" class="svg-line"/>` +
        [60, 110, 160, 200].map(y => `<line x1="45" y1="${y}" x2="63" y2="${y}" class="svg-line" stroke-width="2.4"/><line x1="77" y1="${y}" x2="95" y2="${y}" class="svg-line" stroke-width="2.4"/>`).join('');
      const curl = `<path d="M40,30 C10,80 80,100 40,150 C10,190 60,210 40,222" class="svg-line"/><path d="M90,30 C60,80 130,100 90,150 C60,190 110,210 90,222" class="svg-line"/>` +
        [[33, 62, 83, 62], [55, 122, 105, 122], [30, 178, 80, 178]].map(a => `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" class="svg-line" stroke-width="2.4"/>`).join('');
      return `<svg viewBox="0 0 460 280" role="img" aria-label="パーマの仕組み">
        ${col(0, '① はじめ', 'S-S結合でつながる', straight)}
        <path d="M140,125 l14,0 m-5,-5 l5,5 l-5,5" class="svg-line"/>
        ${col(160, '② 1剤(還元)', '結合が切れる', cut)}
        <path d="M300,125 l14,0 m-5,-5 l5,5 l-5,5" class="svg-line"/>
        ${col(316, '③ 2剤(酸化)', 'カールの形でつなぎ直す', curl)}</svg>`;
    })() };

  D.scissors = { img: 'img/diagram/scissors.jpg', cap: 'シザーズの各部の名前(親指で動かすのが動刃、薬指側が静刃)' };
  D.levels = { img: 'img/diagram/levels.jpg', cap: '明るくするにつれて出てくる色(アンダーカラー)と、打ち消す補色' };
  D.rodbase = { img: 'img/diagram/rodbase.jpg', cap: 'ロッドの位置(オンベース/ハーフオフ/オフベース)と根元の立ち上がり' };
  D.haircycle = { img: 'img/diagram/haircycle.jpg', cap: '毛周期:成長期 → 退行期 → 休止期 をくり返す' };

  D.slices = { imgs: [{ label: '女性', src: 'img/diagram/slice-f.jpg' }, { label: '男性', src: 'img/diagram/slice-m.jpg' }], cap: 'スライス(毛束を分け取る線)の種類と、仕上がりのライン' };
  D.blocking = { img: 'img/diagram/blocking.jpg', cap: 'カラー塗布の4ブロック(真上から見た図)と塗る順番の例' };
  D.fade = { img: 'img/diagram/fade.jpg', cap: 'フェード:下から上へ少しずつ長くして境目をぼかす(ミリ数は一例)' };

  D.skin = { img: 'img/diagram/skin.jpg', cap: '皮膚の構造(表皮・真皮・皮下組織と毛・皮脂腺・汗腺)' };

  D.iron = { imgs: [{ label: '女性', src: 'img/diagram/iron-f.jpg' }, { label: '男性', src: 'img/diagram/iron-m.jpg' }], cap: 'コテの巻き方向:フォワード巻き(顔の方へ)とリバース巻き(顔の外へ)' };

  D.brow = { imgs: [{ label: '女性', src: 'img/diagram/brow-f.jpg' }, { label: '男性', src: 'img/diagram/brow-m.jpg' }], cap: '眉の黄金比:眉頭・眉山・眉尻の位置の目安' };

  D.nail = { img: 'img/diagram/nail.jpg', cap: '爪の構造:見える部分(フリーエッジ・ネイルプレート・ルヌーラ・甘皮)と見えない部分' };

  window.DIAGRAMS = D;
})();
