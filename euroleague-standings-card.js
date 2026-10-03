const CARD_VERSION = "1.0.0";

const DEFAULT_CONFIG = {
  entity: "sensor.euroleague_standings",
  title: "EuroLeague",
  count: 10,
  favorite_team: "ZAL",
  always_show_favorite: true,
  show_zones: true,
  show_logos: true,
  show_round: true,
  show_gp: false,
  compact: false,
  highlight_favorite: true,
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const asInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const zoneFor = (position) => {
  if (position >= 1 && position <= 6) return "playoff";
  if (position >= 7 && position <= 10) return "playin";
  return "outside";
};

class EuroleagueStandingsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getConfigElement() {
    return document.createElement("euroleague-standings-card-editor");
  }

  static getStubConfig() {
    return { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    if (!config) throw new Error("Kortos konfigūracija nepateikta");
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const count = Math.max(1, Math.min(20, asInt(this._config?.count, 10)));
    return Math.max(3, Math.ceil((count + 2) / 2));
  }

  _stateObject() {
    return this._hass?.states?.[this._config?.entity];
  }

  _teams(stateObj) {
    const raw = Array.isArray(stateObj?.attributes?.teams) ? stateObj.attributes.teams : [];
    return raw
      .map((team) => ({
        position: asInt(team?.position, 0),
        code: String(team?.code ?? "").toUpperCase(),
        name: String(team?.name ?? team?.code ?? ""),
        logo: team?.logo ? String(team.logo) : "",
        games_played: asInt(team?.games_played, 0),
        wins: asInt(team?.wins, 0),
        losses: asInt(team?.losses, 0),
      }))
      .filter((team) => team.position > 0)
      .sort((a, b) => a.position - b.position);
  }

  _visibleTeams(allTeams) {
    const count = Math.max(1, Math.min(20, asInt(this._config.count, 10)));
    const top = allTeams.slice(0, count);
    const favoriteCode = String(this._config.favorite_team ?? "").toUpperCase();
    const favorite = favoriteCode ? allTeams.find((team) => team.code === favoriteCode) : null;
    const favoriteAlreadyVisible = favorite && top.some((team) => team.code === favorite.code);
    const appendFavorite = Boolean(
      favorite &&
      this._config.always_show_favorite !== false &&
      !favoriteAlreadyVisible
    );

    return { top, favorite: appendFavorite ? favorite : null };
  }

  _row(team, options = {}) {
    const cfg = this._config;
    const favoriteCode = String(cfg.favorite_team ?? "").toUpperCase();
    const isFavorite = Boolean(favoriteCode && team.code === favoriteCode);
    const zone = zoneFor(team.position);
    const compactClass = cfg.compact ? " compact" : "";
    const favoriteClass = isFavorite && cfg.highlight_favorite !== false ? " favorite" : "";
    const appendedClass = options.appended ? " appended" : "";

    const logo = cfg.show_logos !== false
      ? `<div class="logo-wrap">${team.logo
          ? `<img class="logo" src="${escapeHtml(team.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"><span class="logo-fallback">${escapeHtml(team.code.slice(0, 3))}</span>`
          : `<span class="logo-fallback" style="display:grid">${escapeHtml(team.code.slice(0, 3))}</span>`}
         </div>`
      : "";

    return `
      <div class="team-row zone-${cfg.show_zones === false ? "none" : zone}${compactClass}${favoriteClass}${appendedClass}">
        <div class="rank">${team.position}</div>
        ${logo}
        <div class="team-name" title="${escapeHtml(team.name)}">
          <span>${escapeHtml(team.name)}</span>
          ${isFavorite && cfg.highlight_favorite !== false ? '<span class="favorite-star" title="Mėgstama komanda">★</span>' : ""}
        </div>
        ${cfg.show_gp === true ? `<div class="stat gp">${team.games_played}</div>` : ""}
        <div class="stat wins">${team.wins}</div>
        <div class="stat losses">${team.losses}</div>
      </div>`;
  }

  _zoneDivider(position) {
    if (this._config.show_zones === false) return "";
    if (position === 7) return '<div class="zone-divider playin-label"><span>PLAY-IN</span></div>';
    if (position === 11) return '<div class="zone-divider outside-label"><span>UŽ PLAY-IN</span></div>';
    return "";
  }

  _rows(teams) {
    let html = "";
    for (const team of teams) {
      html += this._zoneDivider(team.position);
      html += this._row(team);
    }
    return html;
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) return;

    const cfg = this._config;
    const stateObj = this._stateObject();
    if (!stateObj) {
      this.shadowRoot.innerHTML = `
        <style>${EuroleagueStandingsCard.styles}</style>
        <ha-card><div class="empty">Sensorius nerastas: ${escapeHtml(cfg.entity)}</div></ha-card>`;
      return;
    }

    const allTeams = this._teams(stateObj);
    if (!allTeams.length) {
      this.shadowRoot.innerHTML = `
        <style>${EuroleagueStandingsCard.styles}</style>
        <ha-card><div class="empty">Turnyrinės lentelės duomenų nėra</div></ha-card>`;
      return;
    }

    const { top, favorite } = this._visibleTeams(allTeams);
    const round = stateObj.attributes?.round;
    const roundName = stateObj.attributes?.round_name;
    const season = stateObj.attributes?.season;
    const headerRound = cfg.show_round !== false && round
      ? `<div class="round">${escapeHtml(roundName || `${round} turas`)}</div>`
      : "";

    const gridColumns = cfg.show_logos === false
      ? `34px minmax(0,1fr) ${cfg.show_gp === true ? "34px " : ""}34px 34px`
      : `34px 38px minmax(0,1fr) ${cfg.show_gp === true ? "34px " : ""}34px 34px`;

    const favoriteBlock = favorite
      ? `<div class="favorite-divider"><span>MĖGSTAMA KOMANDA</span></div>${this._row(favorite, { appended: true })}`
      : "";

    this.shadowRoot.innerHTML = `
      <style>${EuroleagueStandingsCard.styles}</style>
      <ha-card style="--el-grid:${gridColumns}">
        <div class="card-head">
          <div>
            <div class="title">${escapeHtml(cfg.title || "EuroLeague")}</div>
            ${season ? `<div class="season">SEZONAS ${escapeHtml(season)}</div>` : ""}
          </div>
          ${headerRound}
        </div>

        <div class="table-head">
          <div>#</div>
          ${cfg.show_logos !== false ? "<div></div>" : ""}
          <div>KOMANDA</div>
          ${cfg.show_gp === true ? '<div class="center">GP</div>' : ""}
          <div class="center">W</div>
          <div class="center">L</div>
        </div>

        <div class="rows">${this._rows(top)}${favoriteBlock}</div>

        ${cfg.show_zones !== false ? `
          <div class="legend">
            <span><i class="dot playoff"></i>1–6 Playoff</span>
            <span><i class="dot playin"></i>7–10 Play-In</span>
          </div>` : ""}
      </ha-card>`;
  }

  static get styles() {
    return `
      :host{display:block;font-family:var(--primary-font-family,Arial,sans-serif)}
      ha-card{overflow:hidden;padding:0;background:var(--ha-card-background,var(--card-background-color,#111));color:var(--primary-text-color,#fff)}
      .card-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 16px 12px;border-bottom:1px solid var(--divider-color,rgba(255,255,255,.12))}
      .title{font-size:20px;line-height:1.1;font-weight:800;letter-spacing:.02em}
      .season{margin-top:4px;font-size:10px;font-weight:700;letter-spacing:.12em;color:var(--secondary-text-color,#aaa)}
      .round{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--secondary-text-color,#bbb);white-space:nowrap}
      .table-head,.team-row{display:grid;grid-template-columns:var(--el-grid);align-items:center;column-gap:6px}
      .table-head{min-height:34px;padding:0 12px;font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--secondary-text-color,#aaa);background:rgba(0,0,0,.08)}
      .team-row{position:relative;min-height:48px;margin:0 8px 4px;padding:0 8px 0 5px;border-radius:8px;background:rgba(127,127,127,.08);border-left:4px solid transparent;box-sizing:border-box}
      .team-row.compact{min-height:40px;margin-bottom:3px}
      .team-row.zone-playoff{border-left-color:#24a148;background:linear-gradient(90deg,rgba(36,161,72,.12),rgba(127,127,127,.06) 34%)}
      .team-row.zone-playin{border-left-color:#ff8a00;background:linear-gradient(90deg,rgba(255,138,0,.12),rgba(127,127,127,.06) 34%)}
      .team-row.zone-outside{border-left-color:rgba(160,160,160,.4)}
      .team-row.zone-none{border-left-color:transparent}
      .team-row.favorite{outline:1px solid rgba(36,161,72,.58);box-shadow:inset 0 0 0 1px rgba(36,161,72,.10)}
      .team-row.appended{margin-bottom:8px}
      .rank{font-size:13px;font-weight:800;text-align:center;color:var(--secondary-text-color,#c8c8c8)}
      .logo-wrap{width:34px;height:34px;display:grid;place-items:center}
      .logo{display:block;max-width:30px;max-height:30px;width:auto;height:auto;object-fit:contain}
      .logo-fallback{display:none;place-items:center;width:28px;height:28px;border-radius:50%;font-size:8px;font-weight:800;background:rgba(127,127,127,.18);color:var(--secondary-text-color,#ddd)}
      .team-name{min-width:0;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700}
      .team-name>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .favorite-star{flex:0 0 auto;font-size:12px;color:#32c766}
      .stat{text-align:center;font-size:13px;font-variant-numeric:tabular-nums}
      .wins{font-weight:800}
      .losses{color:var(--secondary-text-color,#bbb)}
      .gp{color:var(--secondary-text-color,#aaa)}
      .center{text-align:center}
      .rows{padding:6px 0 2px}
      .zone-divider,.favorite-divider{display:flex;align-items:center;gap:8px;margin:7px 12px 6px;font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--secondary-text-color,#999)}
      .zone-divider:before,.zone-divider:after,.favorite-divider:before,.favorite-divider:after{content:"";height:1px;flex:1;background:var(--divider-color,rgba(255,255,255,.12))}
      .playin-label span{color:#ff9b28}
      .outside-label span{color:var(--secondary-text-color,#999)}
      .favorite-divider span{color:#32c766;white-space:nowrap}
      .legend{display:flex;flex-wrap:wrap;gap:14px;padding:7px 14px 12px;font-size:9px;color:var(--secondary-text-color,#999)}
      .legend span{display:flex;align-items:center;gap:5px}
      .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
      .dot.playoff{background:#24a148}.dot.playin{background:#ff8a00}
      .empty{padding:20px;color:var(--secondary-text-color,#999);text-align:center}
      @media(max-width:360px){
        .card-head{padding-left:12px;padding-right:12px}.title{font-size:18px}.team-row{margin-left:6px;margin-right:6px}.team-name{font-size:12px}.legend{gap:9px}
      }
    `;
  }
}

class EuroleagueStandingsCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.addEventListener("change", (event) => this._changed(event));
    this.shadowRoot.addEventListener("input", (event) => {
      if (event.target?.dataset?.key === "title") this._changed(event);
    });
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _stateObject() {
    return this._hass?.states?.[this._config?.entity];
  }

  _teams() {
    const teams = this._stateObject()?.attributes?.teams;
    return Array.isArray(teams)
      ? teams
          .filter((team) => team?.code)
          .map((team) => ({ code: String(team.code).toUpperCase(), name: String(team.name || team.code), position: asInt(team.position, 999) }))
          .sort((a, b) => a.position - b.position)
      : [];
  }

  _changed(event) {
    if (!this._config) return;
    const input = event.target;
    const key = input?.dataset?.key;
    const allowed = new Set([
      "entity", "title", "count", "favorite_team", "always_show_favorite",
      "show_zones", "show_logos", "show_round", "show_gp", "compact", "highlight_favorite",
    ]);
    if (!allowed.has(key)) return;

    let value = input.type === "checkbox" ? input.checked : input.value;
    if (key === "count") {
      value = Math.max(1, Math.min(20, asInt(value, 10)));
    }

    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config } },
      bubbles: true,
      composed: true,
    }));

    if (key === "entity") this._render();
  }

  _checkbox(key, label, checked) {
    return `<label class="check"><input data-key="${key}" type="checkbox" ${checked ? "checked" : ""}><span>${label}</span></label>`;
  }

  _render() {
    if (!this._config) return;
    const cfg = this._config;
    const sensors = Object.keys(this._hass?.states || {})
      .filter((entityId) => entityId.startsWith("sensor."))
      .sort();
    const teams = this._teams();
    const favoriteOptions = [
      '<option value="">– Nepasirinkta –</option>',
      ...teams.map((team) => `<option value="${escapeHtml(team.code)}" ${team.code === String(cfg.favorite_team || "").toUpperCase() ? "selected" : ""}>${team.position}. ${escapeHtml(team.name)}</option>`),
    ].join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;color:var(--primary-text-color);font-family:var(--primary-font-family,Arial,sans-serif)}
        .form{display:grid;gap:16px;padding:8px 0}
        label.field{display:grid;gap:6px;font-size:14px}
        input:not([type=checkbox]),select{box-sizing:border-box;width:100%;padding:10px;font:inherit;color:var(--primary-text-color);background:var(--card-background-color,white);border:1px solid var(--divider-color,#888);border-radius:6px}
        .section{display:grid;gap:10px;padding:12px;border:1px solid var(--divider-color,#888);border-radius:8px}
        .section-title{font-size:12px;font-weight:800;letter-spacing:.05em;color:var(--secondary-text-color)}
        .check{display:flex;align-items:center;gap:9px;font-size:14px}
        input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#00642f)}
        small{color:var(--secondary-text-color);line-height:1.4}
      </style>
      <div class="form">
        <label class="field">Sensorius
          <input data-key="entity" list="el-sensors" value="${escapeHtml(cfg.entity || "")}" placeholder="sensor.euroleague_standings">
        </label>
        <datalist id="el-sensors">${sensors.map((id) => `<option value="${escapeHtml(id)}"></option>`).join("")}</datalist>

        <label class="field">Pavadinimas
          <input data-key="title" value="${escapeHtml(cfg.title || "EuroLeague")}">
        </label>

        <label class="field">Kiek komandų rodyti
          <input data-key="count" type="number" min="1" max="20" step="1" value="${escapeHtml(cfg.count ?? 10)}">
        </label>

        <label class="field">Mėgstama komanda
          <select data-key="favorite_team">${favoriteOptions}</select>
        </label>

        <div class="section">
          <div class="section-title">MĖGSTAMA KOMANDA</div>
          ${this._checkbox("always_show_favorite", "Visada rodyti mėgstamą komandą, jei ji nepatenka į TOP N", cfg.always_show_favorite !== false)}
          ${this._checkbox("highlight_favorite", "Išryškinti mėgstamą komandą", cfg.highlight_favorite !== false)}
        </div>

        <div class="section">
          <div class="section-title">IŠVAIZDA</div>
          ${this._checkbox("show_zones", "Rodyti Playoff / Play-In zonas", cfg.show_zones !== false)}
          ${this._checkbox("show_logos", "Rodyti komandų logotipus", cfg.show_logos !== false)}
          ${this._checkbox("show_round", "Rodyti turą", cfg.show_round !== false)}
          ${this._checkbox("show_gp", "Rodyti GP stulpelį", cfg.show_gp === true)}
          ${this._checkbox("compact", "Kompaktiškas režimas", cfg.compact === true)}
        </div>

        <small>Komandų sąrašas mėgstamos komandos pasirinkime užsipildo iš pasirinkto sensoriaus atributų.</small>
      </div>`;
  }
}

if (!customElements.get("euroleague-standings-card-editor")) {
  customElements.define("euroleague-standings-card-editor", EuroleagueStandingsCardEditor);
}

if (!customElements.get("euroleague-standings-card")) {
  customElements.define("euroleague-standings-card", EuroleagueStandingsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "euroleague-standings-card")) {
  window.customCards.push({
    type: "euroleague-standings-card",
    name: "EuroLeague Standings Card",
    description: "EuroLeague turnyrinė lentelė su logotipais, Playoff / Play-In zonomis ir mėgstama komanda",
    preview: true,
  });
}

console.info(`%c EUROLEAGUE-STANDINGS-CARD ${CARD_VERSION} įdiegta`, "color:#24a148;font-weight:bold");
