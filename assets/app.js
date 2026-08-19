import {
  STAGES, JOURNEY_STAGES, PLATFORMS, SIGNALS, CLIENTS, SHOCKS, OBJECTIONS,
  HUMAN_SIGNALS, SAMPLE_JOURNEYS, SEED_AUDIT_ROWS, SOURCES
} from './data.js';
import { realtime, randomId, normalizeCode } from './realtime.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const slug = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const byPlatform = (id) => PLATFORMS.find((platform) => platform.id === id) || PLATFORMS.find((platform) => platform.name.toLowerCase().includes(String(id).toLowerCase()));
const byJourneyStage = (id) => JOURNEY_STAGES.find((stage) => stage.id === id || stage.label.toLowerCase() === String(id).toLowerCase());
const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
const scoreForPriority = { critical: 96, high: 86, medium: 70, low: 50 };
const initials = (name = '?') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const CONFIG = window.SE_CONFIG || {};
const memoryStorage = new Map();
const storageGet = (key) => {
  try { return window.localStorage?.getItem(key) ?? memoryStorage.get(key) ?? null; }
  catch { return memoryStorage.get(key) ?? null; }
};
const storageSet = (key, value) => {
  memoryStorage.set(key, String(value));
  try { window.localStorage?.setItem(key, String(value)); } catch { /* memory fallback */ }
};

const sceneRoot = $('#scene-root');
const stageRail = $('#stage-rail');
const appShell = $('#app');
const joinDialog = $('#join-dialog');
const participantsDialog = $('#participants-dialog');
const facilitatorDialog = $('#facilitator-dialog');
const cardEditorDialog = $('#card-editor-dialog');
const findingDialog = $('#finding-dialog');
const strategyDialog = $('#strategy-dialog');
const detailDialog = $('#detail-dialog');

const state = {
  stageIndex: 0,
  preview: true,
  connected: false,
  connectionMode: 'preview',
  room: null,
  profile: null,
  items: [],
  votes: [],
  presence: [],
  followFacilitator: true,
  selectedClient: storageGet('se-selected-client') || 'breezy',
  ecosystemPlatform: 'google',
  auditFilters: { client: 'all', platform: 'all', stage: 'all', priority: 'all', search: '' },
  auditSort: 'score-desc',
  auctionDraft: Object.fromEntries(SIGNALS.map((signal) => [signal.id, 0])),
  selectedHuman: null,
  selectedMachine: null,
  localShockIndex: 0,
  localObjectionIndex: 0,
  confidence: 70,
  strategyView: 'pillars',
  drag: null,
  lastRender: 0,
  renderQueued: false,
  auditSearchTimer: null,
  suppressRender: false,
  remoteCursors: new Map(),
  cursorCleanup: null,
  timerInterval: null
};

const currentUserId = () => realtime.user?.id || state.profile?.id || 'preview-user';
const isFacilitator = () => Boolean(
  state.profile?.role === 'facilitator' ||
  (state.room?.facilitator_id && state.room.facilitator_id === currentUserId())
);
const liveItems = (type) => state.items.filter((item) => item.item_type === type);
const payloadOf = (item) => item?.payload || {};
const voteTotals = () => {
  const totals = new Map();
  for (const vote of state.votes) totals.set(vote.target_key, (totals.get(vote.target_key) || 0) + Number(vote.value || 0));
  return totals;
};
const myVote = (target) => state.votes.find((vote) => vote.target_key === target && vote.user_id === currentUserId());
const stage = () => STAGES[state.stageIndex] || STAGES[0];

function optionMarkup(items, valueKey = 'id', labelKey = 'name', includeAll = false, allLabel = 'All') {
  const all = includeAll ? `<option value="all">${esc(allLabel)}</option>` : '';
  return all + items.map((item) => `<option value="${attr(item[valueKey])}">${esc(item[labelKey])}</option>`).join('');
}

function toast(title, message = '', tone = 'info') {
  const node = document.createElement('div');
  node.className = `toast ${tone}`;
  node.innerHTML = `<strong>${esc(title)}</strong>${message ? `<p>${esc(message)}</p>` : ''}`;
  $('#toast-region').append(node);
  setTimeout(() => node.remove(), 4600);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

function setConnectionLabel(status, mode = state.connectionMode) {
  const label = $('#connection-label');
  const messages = {
    connected: mode === 'supabase' ? 'Live room connected' : mode === 'local' ? 'Local live demo' : 'Preview mode',
    reconnecting: 'Reconnecting…',
    initializing: 'Initializing…',
    preview: 'Preview mode'
  };
  label.textContent = messages[status] || status;
  appShell.dataset.connection = status;
}

function scheduleRender() {
  if (state.suppressRender || state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(() => {
    state.renderQueued = false;
    renderStage();
  });
}

function getMyItem(type, predicate = () => true) {
  return liveItems(type).find((item) => item.owner_id === currentUserId() && predicate(item));
}

function populateStaticControls() {
  const colors = ['#2864dc', '#14775c', '#9a6a16', '#7657d8', '#c84f92', '#e05d2b', '#0f7c8c', '#38465b'];
  $('#color-options').innerHTML = colors.map((color, index) => `<button class="color-option${index === 0 ? ' is-active' : ''}" type="button" style="--color:${color}" data-color="${color}" aria-label="Choose ${color}"></button>`).join('');
  $('#card-editor-stage').innerHTML = optionMarkup(JOURNEY_STAGES, 'id', 'label');
  $('#card-editor-platform').innerHTML = optionMarkup(PLATFORMS);
  $('#finding-platform').innerHTML = optionMarkup(PLATFORMS);
  $('#finding-stage').innerHTML = optionMarkup(JOURNEY_STAGES, 'id', 'label');
  const roomFromUrl = new URLSearchParams(location.search).get('room');
  if (roomFromUrl) $('#room-code-input').value = normalizeCode(roomFromUrl);
  const savedName = storageGet('se-display-name');
  if (savedName) $('#display-name').value = savedName;
  $('#join-mode-note').textContent = CONFIG.supabaseUrl && CONFIG.supabaseAnonKey
    ? 'Cloud collaboration is configured. Participants may join from separate devices using the room code.'
    : 'Cloud credentials are not configured yet. The app will still synchronize separate tabs on this browser in local demo mode.';
}

function renderStageRail() {
  stageRail.innerHTML = `<div class="stage-rail-header"><small>LIVE WORKSHOP</small><strong>${STAGES.length} stages</strong></div>` + STAGES.map((item, index) => `
    <button class="stage-button${index === state.stageIndex ? ' is-active' : ''}${index < state.stageIndex ? ' is-complete' : ''}" type="button" data-stage-index="${index}" aria-current="${index === state.stageIndex ? 'step' : 'false'}">
      <span class="stage-number">${item.number}</span><span class="stage-copy"><small>${esc(item.kicker)}</small><strong>${esc(item.title)}</strong></span>
    </button>`).join('');
}

async function goToStage(index, broadcast = false) {
  const next = clamp(index, 0, STAGES.length - 1);
  state.stageIndex = next;
  clearRemoteCursors();
  renderStageRail();
  renderStage();
  sceneRoot.closest('.workshop-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  stageRail.classList.remove('is-open');
  await realtime.updatePresence?.({ stage: STAGES[next].id });
  if (broadcast && state.connected && isFacilitator()) {
    try { await realtime.updateRoom({ active_stage: next }); }
    catch (error) { toast('Stage could not be broadcast', error.message, 'error'); }
  }
}

function renderShellState() {
  const active = stage();
  $('#stage-kicker').textContent = `${active.kicker} · ${active.number}`;
  $('#stage-title').textContent = active.title;
  $('#previous-stage').classList.toggle('hidden', state.preview && state.stageIndex === 0);
  $('#next-stage').classList.remove('hidden');
  $('#previous-stage').disabled = state.stageIndex === 0;
  $('#next-stage').disabled = state.stageIndex === STAGES.length - 1;
  $('#next-stage').textContent = state.stageIndex === STAGES.length - 1 ? 'Complete' : 'Next';
  $('#reaction-button').classList.toggle('hidden', !state.connected);
  $('#open-facilitator').classList.toggle('hidden', !isFacilitator());
  $('.follow-toggle').classList.toggle('hidden', !state.connected || isFacilitator());
  $('#follow-facilitator').checked = state.followFacilitator;
  renderParticipants();
  updateTimer();
}

function renderParticipants() {
  const people = state.presence.length ? state.presence : (state.profile ? [state.profile] : []);
  const visible = people.slice(0, 6);
  $('#participant-avatars').innerHTML = visible.map((person) => `<span class="avatar${person.role === 'facilitator' ? ' is-facilitator' : ''}" style="background:${attr(person.color || '#38465b')}" title="${attr(person.name)}">${esc(initials(person.name))}</span>`).join('') + (people.length > 6 ? `<span class="avatar avatar-overflow">+${people.length - 6}</span>` : '');
  $('#participants-list').innerHTML = people.length ? people.map((person) => `
    <div class="participant-row"><span class="avatar${person.role === 'facilitator' ? ' is-facilitator' : ''}" style="background:${attr(person.color || '#38465b')}">${esc(initials(person.name))}</span><span><strong>${esc(person.name)}</strong><small>${esc(person.team || 'unassigned')} · ${esc((byJourneyStage(person.stage)?.label || STAGES.find((s) => s.id === person.stage)?.title || person.stage || 'Lobby'))}</small></span><span class="tag ${person.role === 'facilitator' ? 'high' : 'low'}">${esc(person.role || 'participant')}</span></div>`).join('') : '<div class="empty-state"><div><strong>No live participants yet</strong><span>Join a room to see the roster.</span></div></div>';
}

function renderFacilitatorControls() {
  const timer = state.room?.timer || {};
  $('#facilitator-controls').innerHTML = `
    <div class="stack">
      <section class="facilitator-section"><h3>Move the room</h3><label><span>Active stage</span><select id="facilitator-stage">${STAGES.map((item, index) => `<option value="${index}"${index === state.stageIndex ? ' selected' : ''}>${item.number} · ${esc(item.title)}</option>`).join('')}</select></label><p class="small muted">Participants with “Follow facilitator” enabled move with you.</p></section>
      <section class="facilitator-section"><h3>Activity timer</h3><div class="timer-presets">${[1,5,10,15,20].map((minutes) => `<button class="chip-button" type="button" data-timer-minutes="${minutes}">${minutes}m</button>`).join('')}</div><div class="button-row"><button id="timer-pause" class="secondary-button" type="button">${timer.running ? 'Pause' : 'Resume'}</button><button id="timer-clear" class="secondary-button" type="button">Clear</button></div></section>
      <section class="facilitator-section"><h3>Room access</h3><p class="mono small">${esc(state.room?.code || 'PREVIEW')}</p><button id="facilitator-copy-link" class="secondary-button" type="button">Copy invite link</button></section>
      <section class="facilitator-section"><h3>Session state</h3><p class="small muted">${state.presence.length} participant${state.presence.length === 1 ? '' : 's'} · ${state.items.length} live contribution${state.items.length === 1 ? '' : 's'} · ${state.votes.length} vote record${state.votes.length === 1 ? '' : 's'}</p></section>
    </div>`;
}

function updateTimer() {
  const display = $('#stage-timer');
  const timer = state.room?.timer;
  if (!timer || (!timer.running && !timer.remaining && !timer.endsAt)) {
    display.classList.add('hidden');
    return;
  }
  let remaining = Number(timer.remaining || 0);
  if (timer.running && timer.endsAt) remaining = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - Date.now()) / 1000));
  display.classList.remove('hidden');
  display.classList.toggle('is-low', remaining > 0 && remaining <= 30);
  display.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
}

function sceneHeader(kicker, title, description, actions = '') {
  return `<header class="scene-header"><div class="scene-header-copy"><p class="eyebrow">${esc(kicker)}</p><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>${actions ? `<div class="scene-actions">${actions}</div>` : ''}</header>`;
}

function clientSwitchMarkup() {
  return `<div class="client-switch" role="group" aria-label="Select client"><button type="button" data-action="switch-client" data-client="breezy" class="${state.selectedClient === 'breezy' ? 'is-active' : ''}">Breezy Golf</button><button type="button" data-action="switch-client" data-client="kp" class="${state.selectedClient === 'kp' ? 'is-active' : ''}">KP Attorney</button></div>`;
}

function renderStage() {
  renderShellState();
  const renderers = [
    renderWelcome, renderFracture, renderDefinition, renderEcosystem, renderJourney,
    renderPortals, renderAudit, renderWhiteboard, renderAuction, renderDualVision,
    renderShock, renderStrategy, renderChallenge, renderDebrief
  ];
  sceneRoot.innerHTML = renderers[state.stageIndex]?.() || renderWelcome();
  sceneRoot.dataset.stage = stage().id;
  bindStageSpecific();
  state.lastRender = Date.now();
}

function renderWelcome() {
  const connectedCopy = state.connected
    ? `<div class="system-note"><strong>Room ${esc(state.room?.code || '')}</strong><br>${state.presence.length || 1} participant${(state.presence.length || 1) === 1 ? '' : 's'} connected. Move through the lab together or turn off “Follow facilitator” to inspect a stage independently.</div>`
    : `<div class="button-row"><button class="primary-button" type="button" data-action="open-join">Create or join a live room</button><button class="secondary-button" type="button" data-action="start-preview">Begin preview</button></div>`;
  const nodes = [PLATFORMS[0], PLATFORMS[2], PLATFORMS[3], PLATFORMS[4], PLATFORMS[1], PLATFORMS[5]];
  return `<section class="scene hero-stage"><div class="hero-layout"><div>
    <p class="eyebrow">LAMARK SEO TEAM WORKSHOP</p>
    <h1 class="hero-title">Search is no longer a page.<span>It is a journey.</span></h1>
    <p class="lede">A live, collaborative lab for seeing where audiences ask, compare, validate, and act, then turning those moments into client strategy.</p>
    <div class="hero-meta"><div class="hero-stat"><strong>14</strong><small>interactive stages</small></div><div class="hero-stat"><strong>55</strong><small>worked audit findings</small></div><div class="hero-stat"><strong>6–8</strong><small>simultaneous participants</small></div></div>
    <div style="margin-top:28px">${connectedCopy}</div>
  </div><div class="hero-graphic" aria-label="Search Everywhere ecosystem">
    <div class="orbit-ring"></div><div class="orbit-ring two"></div>
    <div class="orbit-core"><div><strong>Unresolved<br>audience need</strong><small>Search continues until uncertainty is reduced.</small></div></div>
    ${nodes.map((platform, index) => `<div class="orbit-node" style="--angle:${index * 60}deg"><i style="background:${platform.color}">${esc(platform.icon)}</i><span>${esc(platform.short)}</span></div>`).join('')}
  </div></div></section>`;
}

function fractureChoices() {
  return liveItems('poll').filter((item) => payloadOf(item).question === 'fracture-first-platform');
}
function renderFracture() {
  const choices = fractureChoices();
  const counts = new Map();
  choices.forEach((item) => counts.set(payloadOf(item).choice, (counts.get(payloadOf(item).choice) || 0) + 1));
  const myChoice = choices.find((item) => item.owner_id === currentUserId())?.payload?.choice;
  const total = choices.length;
  const max = Math.max(1, ...counts.values());
  const results = [...PLATFORMS].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  return `<section class="scene">${sceneHeader('ACT I · MAKE THE FRACTURE VISIBLE','Where do you search first for an <em style="color:var(--lamark);font-style:normal">honest answer?</em>','Do not answer as an SEO professional. Answer as a person making a real decision.')}
    <div class="panel-grid">
      <section class="panel span-7"><div class="flex-between"><div><p class="eyebrow">LIVE TEAM POLL</p><h2>Choose your first move</h2></div><span class="tag ${state.connected ? 'present' : 'directional'}">${state.connected ? 'Live' : 'Preview'}</span></div><div class="divider"></div>
        <div class="poll-grid">${PLATFORMS.map((platform) => `<button class="poll-option${myChoice === platform.id ? ' is-selected' : ''}" type="button" data-action="fracture-choice" data-choice="${platform.id}"><span class="platform-icon" style="background:${platform.color}">${esc(platform.icon)}</span><strong>${esc(platform.name)}</strong><span class="vote-count">${counts.get(platform.id) || 0}</span></button>`).join('')}</div>
      </section>
      <aside class="panel span-5"><p class="eyebrow">THE FRACTURE, IN REAL TIME</p><h2>${total ? `${total} different search path${total === 1 ? '' : 's'} beginning to form` : 'The room has not answered yet'}</h2><div class="divider"></div>
        <div class="result-bars">${results.slice(0, 7).map((platform) => { const count = counts.get(platform.id) || 0; return `<div class="result-row"><label>${esc(platform.short)}</label><div class="result-track"><div class="result-fill" style="width:${count / max * 100}%;background:${platform.color}"></div></div><output>${count}</output></div>`; }).join('')}</div>
        <div class="callout" style="margin-top:20px"><strong>The lesson</strong><p>One audience need can begin on different platforms and continue through several more. Search Everywhere maps the complete decision path, not only the first click.</p></div>
      </aside>
      <section class="panel span-12"><div class="quote-stage"><div><blockquote>People do not think in channels.<br>They search until <em>uncertainty is gone.</em></blockquote><p>Ask the room what they would check second, and what evidence would finally make them act.</p></div></div></section>
    </div></section>`;
}

function renderDefinition() {
  return `<section class="scene">${sceneHeader('ACT I · THE OPERATING DEFINITION','Search Everywhere is <em style="color:var(--lamark);font-style:normal">decision visibility.</em>','It is the discipline of understanding every surface an audience uses to resolve uncertainty, then advising the client how to be findable, credible, and actionable in those moments.')}
    <div class="comparison-grid">
      <article class="model-card old"><header><p class="eyebrow">THE OLD MENTAL MODEL</p><h2>Keyword → Google → Website</h2></header><div class="model-graphic"><div class="linear-path"><i>QUERY</i><b>→</b><i>RANK</i><b>→</b><i>CLICK</i></div></div><footer><p class="muted small">Useful, but incomplete. It assumes the journey begins and ends in one search engine.</p></footer></article>
      <article class="model-card new"><header><p class="eyebrow">THE SEARCH EVERYWHERE MODEL</p><h2>Need → surfaces → signals → decision</h2></header><div class="model-graphic"><div class="network-mini"><span class="node center">NEED</span><span class="node">ASK</span><span class="node">SCAN</span><span class="node">PROVE</span><span class="node">ACT</span></div></div><footer><p class="muted small">The audience moves between search, social, video, community, local, AI, reviews, and owned properties.</p></footer></article>
    </div>
    <div class="panel" style="margin-top:18px"><p class="eyebrow">LAMARK'S CONSULTING BOUNDARY</p><div class="scope-boundary">
      <div class="scope-card"><strong>1. Diagnose</strong><p>Map audience moments, queries, surfaces, competitors, trust signals, and journey leaks.</p></div>
      <div class="scope-card"><strong>2. Advise</strong><p>Recommend owned content, local governance, reputation support, offsite proof, platform assets, and measurement.</p></div>
      <div class="scope-card"><strong>3. Coordinate</strong><p>Define the handoff to content, PR, organic social, creative, UX, analytics, development, and the client.</p></div>
    </div></div>
    <div class="panel-grid" style="margin-top:18px">
      <div class="card span-4"><p class="eyebrow">NOT THE GOAL</p><h3>Become an organic social publishing team</h3><p class="muted small">Search strategy can inform social execution without absorbing daily community management.</p></div>
      <div class="card span-4"><p class="eyebrow">THE GOAL</p><h3>Own the audience’s decision architecture</h3><p class="muted small">Know what question is being resolved, where, with which evidence, and toward which business action.</p></div>
      <div class="card span-4"><p class="eyebrow">THE DELIVERABLE</p><h3>A prioritized cross-surface operating plan</h3><p class="muted small">Every recommendation names the audience moment, evidence, execution owner, dependency, KPI, and business outcome.</p></div>
    </div></section>`;
}

function ecosystemPositions() {
  const width = 50, height = 40;
  return PLATFORMS.map((platform, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index / PLATFORMS.length);
    return { ...platform, left: 50 + Math.cos(angle) * width * .78, top: 50 + Math.sin(angle) * height * .92 };
  });
}
function renderEcosystem() {
  const selected = byPlatform(state.ecosystemPlatform) || PLATFORMS[0];
  const client = CLIENTS[state.selectedClient];
  const sample = SAMPLE_JOURNEYS[state.selectedClient];
  const nodes = ecosystemPositions();
  return `<section class="scene">${sceneHeader('ACT II · UNDERSTAND THE SYSTEM','Every surface has a different <em style="color:var(--lamark);font-style:normal">job.</em>','Click a search surface to see why a user goes there, what that environment can interpret, and how success should be measured.', clientSwitchMarkup())}
    <div class="panel-grid">
      <section class="span-8 ecosystem-shell" aria-label="Interactive search ecosystem">
        <svg class="ecosystem-svg" viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true"><g stroke="#ccd6e5" stroke-width="1">${nodes.map((node) => `<line x1="500" y1="325" x2="${node.left * 10}" y2="${node.top * 6.5}" />`).join('')}</g><circle cx="500" cy="325" r="190" fill="none" stroke="#dce2ea" stroke-dasharray="4 7"/></svg>
        <div class="ecosystem-core"><div><span>AUDIENCE NEED</span><strong>${esc(client.coreQuestions[0])}</strong></div></div>
        ${nodes.map((platform) => `<button class="ecosystem-node${selected.id === platform.id ? ' is-active' : ''}" type="button" data-action="ecosystem-platform" data-platform="${platform.id}" style="left:${platform.left}%;top:${platform.top}%;--node-color:${platform.color}"><i>${esc(platform.icon)}</i><strong>${esc(platform.short)}</strong></button>`).join('')}
      </section>
      <aside class="panel span-4 ecosystem-detail"><span class="platform-icon" style="background:${selected.color}">${esc(selected.icon)}</span><p class="eyebrow" style="margin-top:18px">${esc(selected.role)}</p><h2>${esc(selected.name)}</h2><p class="lede" style="font-size:15px">${esc(selected.intent)}</p><div class="divider"></div><h4>Signals this surface reads</h4><div class="signal-list">${selected.signals.map((signal) => `<span>${esc(signal)}</span>`).join('')}</div><h4 style="margin-top:18px">Practical KPIs</h4><div class="kpi-list">${selected.kpis.map((kpi) => `<span>${esc(kpi)}</span>`).join('')}</div><div class="callout" style="margin-top:20px"><strong>Consulting question</strong><p>What must be true on this surface for ${esc(client.name)} to reduce uncertainty and move the audience forward?</p></div></aside>
      <section class="panel span-12"><div class="flex-between"><div><p class="eyebrow">AN EXAMPLE PATH</p><h3>${esc(client.name)} does not need every platform to play the same role</h3></div><button class="secondary-button" type="button" data-action="animate-path">Replay path</button></div><div class="divider"></div><div id="sample-path" class="path-ribbon">${sample.map((step) => { const p = byPlatform(step.surface); return `<span data-path-step><i class="platform-icon" style="width:22px;height:22px;border-radius:6px;background:${p?.color || '#38465b'}">${esc(p?.icon || '')}</i>${esc(byJourneyStage(step.stage)?.label || step.stage)}</span>`; }).join('')}</div></section>
    </div></section>`;
}

function journeyItemsFor(clientKey) {
  return liveItems('journey').filter((item) => item.client === clientKey);
}
function renderJourney() {
  const client = CLIENTS[state.selectedClient];
  const live = journeyItemsFor(state.selectedClient);
  const sample = SAMPLE_JOURNEYS[state.selectedClient];
  return `<section class="scene">${sceneHeader('ACT II · BUILD THE DECISION PATH','Map the journey from <em style="color:var(--lamark);font-style:normal">trigger to advocacy.</em>','Each card must identify the audience’s question, the platform’s role, and the evidence required to move forward.', clientSwitchMarkup())}
    <section class="panel"><form id="journey-form" class="filter-bar" style="grid-template-columns:150px 160px 170px minmax(220px,1fr) minmax(240px,1.2fr) auto"><select name="stage" aria-label="Journey stage">${optionMarkup(JOURNEY_STAGES,'id','label')}</select><select name="platform" aria-label="Platform">${optionMarkup(PLATFORMS)}</select><select name="client" aria-label="Client"><option value="${state.selectedClient}">${esc(client.name)}</option></select><input name="query" required maxlength="180" placeholder="What is the user asking?"><input name="reason" required maxlength="240" placeholder="Why do they use this surface here?"><button class="primary-button" type="submit">Add live card</button></form></section>
    <div class="journey-board" style="margin-top:16px">${JOURNEY_STAGES.map((journeyStage, stageIndex) => {
      const sampleCards = sample.filter((item) => item.stage === journeyStage.id);
      const liveCards = live.filter((item) => item.stage === journeyStage.id);
      return `<section class="journey-column"><header class="journey-column-header"><span>${String(stageIndex + 1).padStart(2,'0')}</span><h3>${esc(journeyStage.label)}</h3><p>${esc(journeyStage.description)}</p></header>
        ${sampleCards.map((card) => journeyCardMarkup({ ...card, sample: true }, journeyStage)).join('')}
        ${liveCards.map((item) => journeyCardMarkup({ ...payloadOf(item), item, surface: item.platform }, journeyStage)).join('')}
        <button class="journey-add" type="button" data-action="focus-journey-form" data-stage="${journeyStage.id}">+ Add ${esc(journeyStage.label)} moment</button>
      </section>`;
    }).join('')}</div>
    <div class="panel-grid" style="margin-top:16px"><div class="callout span-6"><strong>Journey rule</strong><p>A platform earns a place only when it resolves a specific uncertainty. Popularity alone is not strategic fit.</p></div><div class="callout span-6" style="border-left-color:${client.accent}"><strong>${esc(client.name)} lens</strong><p>${esc(client.summary)}</p></div></div>
  </section>`;
}
function journeyCardMarkup(card, journeyStage) {
  const platform = byPlatform(card.surface) || PLATFORMS[0];
  const removable = card.item && (card.item.owner_id === currentUserId() || isFacilitator());
  return `<article class="journey-card" style="--platform-color:${platform.color}"><span class="tag">${esc(platform.short)}</span><strong>${esc(card.query)}</strong><p>${esc(card.reason)}</p><footer><small class="muted">${card.sample ? 'Worked example' : esc(card.item?.payload?.ownerName || 'Team contribution')}</small>${removable ? `<button class="text-button" type="button" data-action="remove-item" data-id="${card.item.id}">Remove</button>` : ''}</footer></article>`;
}

function renderPortals() {
  return `<section class="scene">${sceneHeader('ACT III · APPLY THE FRAMEWORK','Two clients. Two entirely different <em style="color:var(--lamark);font-style:normal">search systems.</em>','The framework stays consistent, but audience risk, platform roles, proof requirements, and business outcomes change.')}
    <div class="portal-grid">${Object.values(CLIENTS).map((client) => `<article class="client-portal ${client.key}"><header><p class="portal-label">${esc(client.label)}</p><h2>${esc(client.name)}</h2><p>${esc(client.summary)}</p></header><div><h4>Core audience questions</h4><div class="question-list" style="margin-top:10px">${client.coreQuestions.map((question) => `<div>${esc(question)}</div>`).join('')}</div></div><footer><h4>Primary search surfaces</h4><div class="platform-constellation" style="margin-top:10px">${client.primaryPlatforms.map((id) => `<span>${esc(byPlatform(id)?.short || id)}</span>`).join('')}</div><button class="primary-button" style="margin-top:18px;background:${client.accent}" type="button" data-action="enter-client" data-client="${client.key}">Enter ${esc(client.name)} audit</button></footer></article>`).join('')}</div>
    <section class="panel" style="margin-top:18px"><p class="eyebrow">WHY THIS CONTRAST MATTERS</p><div class="audit-shell"><div class="audit-scroll" style="max-height:none"><table class="audit-table" style="min-width:900px"><thead><tr><th>Dimension</th><th>Breezy Golf</th><th>KP Attorney</th><th>Strategic implication</th></tr></thead><tbody>
      <tr><td><strong>Decision risk</strong></td><td>Style, fit, value, delivery, social identity</td><td>Urgency, credibility, legal consequence, cost, locality</td><td>The proof burden and conversion path are not interchangeable.</td></tr>
      <tr><td><strong>Discovery engine</strong></td><td>Creators, social search, Shopping, visual content</td><td>Google, AI orientation, local search, referral validation</td><td>Start with the audience’s natural first surface, not a universal checklist.</td></tr>
      <tr><td><strong>Validation</strong></td><td>Reviews, customer photos, YouTube, Reddit, creator fit</td><td>Reviews, attorney credentials, firm facts, local legitimacy, third-party mentions</td><td>Independent proof must answer the category’s specific fear.</td></tr>
      <tr><td><strong>Primary action</strong></td><td>Product-page visit and purchase</td><td>Call, consultation form, or local office contact</td><td>Success metrics must follow the business action.</td></tr>
      <tr><td><strong>Governance</strong></td><td>Product, creative, merchandising, social, content</td><td>SEO, legal, local, reputation, intake, content</td><td>Search Everywhere defines cross-functional handoffs instead of absorbing every execution task.</td></tr>
    </tbody></table></div></div></section>
  </section>`;
}

function inferPlatformId(name = '') {
  const value = String(name).toLowerCase();
  if (value.includes('google business') || value.includes('maps') || value.includes('local')) return 'maps';
  if (value.includes('reddit') || value.includes('community')) return 'reddit';
  if (value.includes('youtube') || value.includes('video')) return 'youtube';
  if (value.includes('tiktok') || value.includes('instagram') || value.includes('social')) return 'social';
  if (value.includes('ai') || value.includes('llm') || value.includes('answer')) return 'ai';
  if (value.includes('review') || value.includes('directory') || value.includes('reputation')) return 'reviews';
  if (value.includes('shopping') || value.includes('product feed') || value.includes('merchant')) return 'shopping';
  if (value.includes('site') || value.includes('content') || value.includes('schema') || value.includes('technical') || value.includes('governance') || value.includes('cro')) return 'site';
  return 'google';
}
function normalizeStageId(value = '') {
  const exact = byJourneyStage(value);
  if (exact) return exact.id;
  const v = String(value).toLowerCase();
  if (v.includes('trigger')) return 'trigger';
  if (v.includes('ask')) return 'ask';
  if (v.includes('scan') || v.includes('discover')) return 'scan';
  if (v.includes('compare')) return 'compare';
  if (v.includes('valid')) return 'validate';
  if (v.includes('act') || v.includes('transaction')) return 'act';
  return 'share';
}
function normalizePriority(value = '') {
  const v = String(value).toLowerCase();
  if (v.includes('critical')) return 'critical';
  if (v.includes('high')) return 'high';
  if (v.includes('low')) return 'low';
  return 'medium';
}
function auditRows() {
  const seeds = SEED_AUDIT_ROWS.map((row) => ({
    id: row.id, clientKey: row.clientKey, client: row.client, platformId: inferPlatformId(row.platform), platform: row.platform,
    stageId: normalizeStageId(row.stage), stage: row.stage, audience: row.audience || row.moment || '', query: row.query || row.moment,
    observation: row.evidence || row.currentState || '', currentState: row.currentState || '', gap: row.gap || '', recommendation: row.recommendation || '',
    outcome: row.kpi || '', score: Number(row.score || 0), priority: normalizePriority(row.priority), confidence: 'confirmed', owner: row.owner || 'SEO',
    sourceUrls: row.sourceUrls || [], live: false, seed: true, status: row.status || 'Recommended'
  }));
  const live = liveItems('audit').map((item) => {
    const p = payloadOf(item);
    const priority = normalizePriority(p.priority);
    return {
      id: item.id, clientKey: item.client || p.client, client: CLIENTS[item.client || p.client]?.name || p.client,
      platformId: item.platform || p.platform || inferPlatformId(p.platformName), platform: byPlatform(item.platform || p.platform)?.name || p.platformName || 'Other',
      stageId: item.stage || p.stage || 'scan', stage: byJourneyStage(item.stage || p.stage)?.label || item.stage,
      audience: p.audience || '', query: p.query || '', observation: p.observation || '', currentState: p.currentState || '', gap: p.gap || '', recommendation: p.recommendation || '',
      outcome: p.outcome || '', score: Number(p.score || scoreForPriority[priority]), priority, confidence: p.confidence || 'directional', owner: p.owner || 'SEO',
      sourceUrls: p.source ? [p.source] : [], live: true, item, status: p.status || 'Team finding'
    };
  });
  return [...seeds, ...live];
}
function filteredAuditRows() {
  const filters = state.auditFilters;
  let rows = auditRows().filter((row) =>
    (filters.client === 'all' || row.clientKey === filters.client) &&
    (filters.platform === 'all' || row.platformId === filters.platform) &&
    (filters.stage === 'all' || row.stageId === filters.stage) &&
    (filters.priority === 'all' || row.priority === filters.priority) &&
    (!filters.search || [row.query,row.observation,row.gap,row.recommendation,row.owner,row.platform,row.client].join(' ').toLowerCase().includes(filters.search.toLowerCase()))
  );
  rows.sort((a,b) => {
    if (state.auditSort === 'score-asc') return a.score - b.score;
    if (state.auditSort === 'client') return a.client.localeCompare(b.client) || b.score - a.score;
    if (state.auditSort === 'platform') return a.platform.localeCompare(b.platform) || b.score - a.score;
    if (state.auditSort === 'priority') return priorityRank[b.priority] - priorityRank[a.priority] || b.score - a.score;
    return b.score - a.score;
  });
  return rows;
}
function renderAudit() {
  const rows = filteredAuditRows();
  const all = auditRows();
  const totals = voteTotals();
  const high = all.filter((row) => ['critical','high'].includes(row.priority)).length;
  const platforms = new Set(all.map((row) => row.platformId)).size;
  const live = all.filter((row) => row.live).length;
  const avg = all.length ? Math.round(all.reduce((sum,row) => sum + row.score,0) / all.length) : 0;
  return `<section class="scene">${sceneHeader('ACT III · THE LIVE AUDIT','Turn a fragmented ecosystem into a <em style="color:var(--lamark);font-style:normal">managed evidence system.</em>','Filter, sort, inspect, vote, and add findings. The worked example contains 55 Breezy and KP observations before the team contributes anything.', `<button class="secondary-button" type="button" data-action="audit-export">Export filtered CSV</button><button class="primary-button" type="button" data-action="audit-add">Add live finding</button>`)}
    <div class="metrics-grid"><div class="metric-card"><small>Total findings</small><strong>${all.length}</strong><p>${live} added live</p></div><div class="metric-card"><small>High-priority</small><strong>${high}</strong><p>Critical and high</p></div><div class="metric-card"><small>Search surfaces</small><strong>${platforms}</strong><p>Across the ecosystem</p></div><div class="metric-card"><small>Average score</small><strong>${avg}</strong><p>Out of 100</p></div><div class="metric-card"><small>Visible now</small><strong>${rows.length}</strong><p>After filters</p></div></div>
    <div class="filter-bar" style="margin-top:12px"><select data-audit-filter="client"><option value="all">All clients</option><option value="breezy"${state.auditFilters.client === 'breezy' ? ' selected':''}>Breezy Golf</option><option value="kp"${state.auditFilters.client === 'kp' ? ' selected':''}>KP Attorney</option></select><select data-audit-filter="platform">${optionMarkup(PLATFORMS,'id','name',true,'All platforms').replace(`value="${state.auditFilters.platform}"`,`value="${state.auditFilters.platform}" selected`)}</select><select data-audit-filter="stage">${optionMarkup(JOURNEY_STAGES,'id','label',true,'All journey stages').replace(`value="${state.auditFilters.stage}"`,`value="${state.auditFilters.stage}" selected`)}</select><select data-audit-filter="priority"><option value="all">All priorities</option>${['critical','high','medium','low'].map((p) => `<option value="${p}"${state.auditFilters.priority === p ? ' selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join('')}</select><select data-audit-sort><option value="score-desc"${state.auditSort === 'score-desc'?' selected':''}>Highest score first</option><option value="score-asc"${state.auditSort === 'score-asc'?' selected':''}>Lowest score first</option><option value="priority"${state.auditSort === 'priority'?' selected':''}>Priority</option><option value="client"${state.auditSort === 'client'?' selected':''}>Client</option><option value="platform"${state.auditSort === 'platform'?' selected':''}>Platform</option></select><input data-audit-filter="search" value="${attr(state.auditFilters.search)}" placeholder="Search findings…"></div>
    <section class="audit-shell" style="margin-top:12px"><div class="audit-toolbar"><span class="status">Showing <strong>${rows.length}</strong> of ${all.length}. Click any row for the full evidence chain.</span><div class="inline-meta"><span class="tag confirmed">Confirmed</span><span class="tag directional">Directional</span><span class="tag hypothesis">Hypothesis</span></div></div><div class="audit-scroll"><table class="audit-table"><thead><tr><th>Client</th><th>Surface</th><th>Journey</th><th>Query / moment</th><th>Gap</th><th>Recommendation</th><th>Owner</th><th>Score</th><th>Priority</th><th>Vote</th></tr></thead><tbody>
      ${rows.map((row) => { const target = `audit:${row.id}`; const votes = totals.get(target) || 0; return `<tr data-action="audit-detail" data-id="${attr(row.id)}"><td><span class="tag ${row.clientKey}">${esc(row.clientKey === 'kp' ? 'KP' : 'Breezy')}</span></td><td><strong>${esc(row.platform)}</strong></td><td>${esc(byJourneyStage(row.stageId)?.label || row.stage)}</td><td class="query-cell">${esc(row.query)}</td><td>${esc(row.gap)}</td><td class="recommend-cell">${esc(row.recommendation)}</td><td>${esc(row.owner)}</td><td class="score-cell"><strong>${row.score}</strong></td><td><span class="tag ${row.priority}">${esc(row.priority)}</span></td><td><button class="vote-button${myVote(target) ? ' is-active':''}" type="button" data-action="audit-vote" data-target="${target}" aria-label="Vote for finding">▲ ${votes}</button></td></tr>`; }).join('') || `<tr><td colspan="10"><div class="empty-state"><div><strong>No findings match these filters</strong><span>Clear a filter or add a live finding.</span></div></div></td></tr>`}
    </tbody></table></div></section>
    <div class="panel-grid" style="margin-top:16px"><div class="callout span-4"><strong>Evidence discipline</strong><p>Separate confirmed observations, directional platform signals, and hypotheses requiring client data.</p></div><div class="callout span-4"><strong>Scope discipline</strong><p>Every action names an execution owner. SEO may diagnose and advise without owning daily social or reputation operations.</p></div><div class="callout span-4"><strong>Business discipline</strong><p>Rank opportunities by audience relevance, intent, visibility gap, feasibility, trust risk, and measurable outcome.</p></div></div>
  </section>`;
}

function boardItems() {
  return liveItems('board').filter((item) => state.selectedClient === 'both' || item.client === state.selectedClient || item.client === 'both');
}
function renderWhiteboard() {
  const cards = boardItems();
  return `<section class="scene">${sceneHeader('ACT III · SHARED EVIDENCE MAP','Put every finding on the <em style="color:var(--lamark);font-style:normal">audience journey.</em>','Drag cards between stages. Everyone sees cards, movement, and cursors live, without refreshing.', `<div class="client-switch" role="group"><button type="button" data-action="board-client" data-client="breezy" class="${state.selectedClient === 'breezy'?'is-active':''}">Breezy</button><button type="button" data-action="board-client" data-client="kp" class="${state.selectedClient === 'kp'?'is-active':''}">KP</button><button type="button" data-action="board-client" data-client="both" class="${state.selectedClient === 'both'?'is-active':''}">Both</button></div>`)}
    <div class="whiteboard-shell" id="whiteboard"><div class="whiteboard-lanes">${JOURNEY_STAGES.map((item) => `<div class="whiteboard-lane"><span>${esc(item.label)}</span></div>`).join('')}</div><div class="board-toolbar"><button class="primary-button" type="button" data-action="board-add">+ Add evidence</button><button class="secondary-button" type="button" data-action="board-arrange">Auto-arrange</button></div>
      ${cards.map(boardCardMarkup).join('')}
      ${!cards.length ? `<div class="empty-state" style="position:absolute;inset:80px 20px 20px"><div><strong>The shared board is empty</strong><span>Add an observation, gap, question, or action, then place it where it affects the search journey.</span><div style="margin-top:14px"><button class="primary-button" type="button" data-action="board-add">Add the first card</button></div></div></div>` : ''}
    </div>
    <div class="panel-grid" style="margin-top:16px"><div class="card span-6"><p class="eyebrow">RED-TEAM PROMPT</p><h3>Where is the user still uncertain?</h3><p class="muted small">Place red-risk cards where a missing answer, conflicting signal, weak proof point, or platform absence can stop progression.</p></div><div class="card span-6"><p class="eyebrow">SYNTHESIS PROMPT</p><h3>Which single asset can help more than one surface?</h3><p class="muted small">Look for reusable evidence such as reviews, expert proof, product data, local facts, creator demonstrations, and source-of-truth statements.</p></div></div>
  </section>`;
}
function boardCardMarkup(item) {
  const p = payloadOf(item); const platform = byPlatform(item.platform || p.platform) || PLATFORMS[0];
  const x = clamp(item.x ?? p.x ?? 5, 0, 90), y = clamp(item.y ?? p.y ?? 12, 0, 84);
  return `<article class="board-card" data-board-id="${item.id}" style="left:${x}%;top:${y}%;--card-color:${platform.color}"><span class="tag ${item.client}">${esc(item.client === 'kp' ? 'KP' : item.client === 'breezy' ? 'Breezy' : 'Both')}</span><strong>${esc(p.headline)}</strong><p>${esc(p.detail)}</p><footer><small class="muted">${esc(platform.short)} · ${esc(p.evidence || 'directional')}</small><button class="text-button" type="button" data-action="board-edit" data-id="${item.id}">Edit</button></footer></article>`;
}

function auctionItems() { return liveItems('auction'); }
function auctionTotal() { return Object.values(state.auctionDraft).reduce((sum, value) => sum + Number(value || 0), 0); }
function renderAuction() {
  const submissions = auctionItems();
  const aggregate = Object.fromEntries(SIGNALS.map((signal) => [signal.id, 0]));
  submissions.forEach((item) => SIGNALS.forEach((signal) => { aggregate[signal.id] += Number(payloadOf(item).allocations?.[signal.id] || 0); }));
  const denom = Math.max(1, submissions.length);
  const max = Math.max(1, ...Object.values(aggregate).map((value) => value / denom));
  const total = auctionTotal();
  const mine = getMyItem('auction');
  return `<section class="scene">${sceneHeader('ACT IV · RESOURCE TRADEOFFS','You have 100 visibility credits.<br><em style="color:var(--lamark);font-style:normal">Spend them deliberately.</em>','Allocate resources across the signals you believe matter most. The team’s aggregate model appears live.')}
    <div class="credit-meter${total === 100 ? '' : ' is-invalid'}"><div><span>YOUR REMAINING CREDITS</span><strong>${100-total}</strong></div><div class="button-row"><button class="secondary-button" type="button" data-action="auction-reset">Reset</button><button class="primary-button" type="button" data-action="auction-submit" ${total === 100 ? '' : 'disabled'}>${mine ? 'Update allocation' : 'Lock allocation'}</button></div></div>
    <div class="auction-grid" style="margin-top:14px">${SIGNALS.map((signal) => `<article class="auction-signal"><header><strong>${esc(signal.name)}</strong><output id="auction-output-${signal.id}">${Number(state.auctionDraft[signal.id] || 0)}</output></header><p>${esc(signal.description)}</p><input type="range" min="0" max="40" step="1" value="${Number(state.auctionDraft[signal.id] || 0)}" data-auction-signal="${signal.id}" aria-label="Allocate credits to ${attr(signal.name)}"></article>`).join('')}</div>
    <div class="panel-grid" style="margin-top:16px"><section class="panel span-7"><div class="flex-between"><div><p class="eyebrow">TEAM ALLOCATION</p><h2>${submissions.length} locked response${submissions.length === 1 ? '' : 's'}</h2></div><span class="tag present">Live aggregate</span></div><div class="divider"></div><div class="aggregate-chart">${SIGNALS.map((signal) => { const avg = aggregate[signal.id] / denom; return `<div class="aggregate-row"><label>${esc(signal.name)}</label><div class="result-track"><div class="result-fill" style="width:${avg/max*100}%;background:var(--lamark)"></div></div><output>${avg.toFixed(1)}</output></div>`; }).join('')}</div></section>
      <aside class="panel span-5"><p class="eyebrow">THE REVEAL</p><h2>There is no universal signal mix</h2><div class="stack" style="margin-top:20px">${PLATFORMS.slice(0,6).map((platform) => `<div class="card" style="border-left:4px solid ${platform.color}"><strong>${esc(platform.name)}</strong><p class="muted small">${esc(platform.signals.slice(0,4).join(' · '))}</p></div>`).join('')}</div><div class="callout" style="margin-top:14px"><strong>Planning rule</strong><p>Prioritize signals that influence multiple high-value moments, but never assume every platform ranks, recommends, or converts in the same way.</p></div></aside>
    </div></section>`;
}

function renderDualVision() {
  const machine = state.selectedMachine ? SIGNALS.find((signal) => signal.id === state.selectedMachine) : null;
  const human = state.selectedHuman ? HUMAN_SIGNALS.find((signal) => signal.id === state.selectedHuman) : null;
  const connections = liveItems('connection');
  const canConnect = human && machine;
  return `<section class="scene">${sceneHeader('ACT IV · THE SEARCH PERCEPTION ENGINE','Connect what humans feel to what systems can <em style="color:var(--lamark);font-style:normal">interpret.</em>','A strong Search Everywhere strategy works at both layers. Select one human perception and one machine-readable signal, then save the connection.')}
    <div class="dual-vision"><section class="vision-column human"><p class="eyebrow">WHAT THE USER EXPERIENCES</p><h2>Human perception</h2>${HUMAN_SIGNALS.map((item) => `<button class="vision-item${state.selectedHuman === item.id ? ' is-selected':''}" type="button" data-action="select-human" data-id="${item.id}"><strong>${esc(item.name)}</strong><p>Business effect: ${esc(item.outcome)}</p></button>`).join('')}</section><div class="vision-bridge"><span>TRANSLATE THE EXPERIENCE</span></div><section class="vision-column machine"><p class="eyebrow">WHAT SYSTEMS CAN READ</p><h2>Machine-readable signals</h2>${SIGNALS.map((item) => `<button class="vision-item${state.selectedMachine === item.id ? ' is-selected':''}" type="button" data-action="select-machine" data-id="${item.id}"><strong>${esc(item.name)}</strong><p>${esc(item.description)}</p></button>`).join('')}</section></div>
    <section class="panel" style="margin-top:16px"><div class="flex-between"><div><p class="eyebrow">CREATE A CONNECTION</p><h3>${canConnect ? `${esc(human.name)} → ${esc(machine.name)}` : 'Select one item from each side'}</h3></div><button class="primary-button" type="button" data-action="save-connection" ${canConnect ? '' : 'disabled'}>Save connection</button></div><div class="divider"></div><div class="connection-log">${connections.map((item) => { const p=payloadOf(item); return `<div class="connection-card"><span>${esc(p.humanName)}</span><b>↔</b><span>${esc(p.machineName)} <small class="muted">by ${esc(p.ownerName || 'team')}</small></span></div>`; }).join('') || '<div class="empty-state"><div><strong>No team connections yet</strong><span>Build the bridge between user trust and system visibility.</span></div></div>'}</div></section>
  </section>`;
}

function currentShock() {
  const id = state.room?.settings?.shockId;
  return SHOCKS.find((shock) => shock.id === id) || SHOCKS[state.localShockIndex % SHOCKS.length];
}
function renderShock() {
  const shock = currentShock();
  const responses = liveItems('shock').filter((item) => payloadOf(item).shockId === shock.id);
  return `<section class="scene">${sceneHeader('ACT IV · DISRUPTION SIMULATION','The ecosystem changed.<br><em style="color:var(--lamark);font-style:normal">Adapt before the journey leaks.</em>','Teams have five minutes to identify the affected moment, diagnose the signal failure, assign ownership, and redefine measurement.', isFacilitator() ? `<button class="secondary-button" type="button" data-action="shock-next">Draw a different shock</button>` : '')}
    <div class="shock-stage"><article class="shock-card"><header><p class="eyebrow">SEARCH SHOCK ${String(SHOCKS.indexOf(shock)+1).padStart(2,'0')}</p><h2>${esc(shock.title)}</h2></header><div><p>${esc(shock.description)}</p><div class="stack" style="margin-top:20px">${shock.questions.map((question,index) => `<div class="system-note" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#fff"><strong>${index+1}.</strong> ${esc(question)}</div>`).join('')}</div></div><footer><span class="tag" style="background:rgba(255,255,255,.12);color:white">Five-minute response</span></footer></article>
      <section class="panel"><p class="eyebrow">TEAM RESPONSE</p><h2>Stabilize the decision journey</h2><form id="shock-form" class="stack" style="margin-top:20px"><div class="form-grid"><label><span>Client</span><select name="client"><option value="breezy">Breezy Golf</option><option value="kp">KP Attorney</option></select></label><label><span>Affected journey stage</span><select name="stage">${optionMarkup(JOURNEY_STAGES,'id','label')}</select></label></div><label><span>What changed and why does it matter?</span><textarea name="diagnosis" rows="3" required maxlength="600"></textarea></label><label><span>What should Lamark recommend first?</span><textarea name="action" rows="3" required maxlength="600"></textarea></label><div class="form-grid"><label><span>Execution owner</span><select name="owner"><option>SEO</option><option>Content</option><option>PR / Offsite</option><option>Organic Social</option><option>Local</option><option>UX / CRO</option><option>Development</option><option>Client</option><option>Cross-functional</option></select></label><label><span>Success measure</span><input name="measure" required maxlength="180" placeholder="What changes if the response works?"></label></div><button class="primary-button" type="submit">Submit live response</button></form></section></div>
    <section class="panel" style="margin-top:16px"><div class="flex-between"><div><p class="eyebrow">RESPONSE WALL</p><h3>${responses.length} response${responses.length===1?'':'s'} for this shock</h3></div><span class="tag direction">Compare assumptions</span></div><div class="divider"></div><div class="response-grid">${responses.map((item) => { const p=payloadOf(item); return `<article class="response-card"><div class="inline-meta"><span class="tag ${item.client}">${esc(item.client === 'kp' ? 'KP' : 'Breezy')}</span><span class="tag">${esc(byJourneyStage(item.stage)?.label || item.stage)}</span></div><strong style="margin-top:10px">${esc(p.diagnosis)}</strong><p><b>First response:</b> ${esc(p.action)}</p><footer class="flex-between"><small class="muted">Owner: ${esc(p.executionOwner)} · Measure: ${esc(p.measure)}</small><small class="muted">${esc(p.ownerName)}</small></footer></article>`; }).join('') || '<div class="empty-state"><div><strong>No responses yet</strong><span>Submit a response, then compare how each team frames the same disruption.</span></div></div>'}</div></section>
  </section>`;
}

function strategyScore(p) {
  return Math.round(((Number(p.impact||0)*.30)+(Number(p.audience||0)*.25)+(Number(p.gap||0)*.20)+(Number(p.feasibility||0)*.15)+(Number(p.measurement||0)*.10))*20);
}
function strategyItems() {
  return liveItems('strategy').map((item) => ({ ...item, computedScore: strategyScore(payloadOf(item)) })).sort((a,b) => b.computedScore - a.computedScore);
}
function renderStrategy() {
  const items = strategyItems();
  const totals = voteTotals();
  const pillars = [
    { id:'capture', title:'Capture demand', description:'Win explicit searches and high-intent discovery moments.' },
    { id:'prove', title:'Prove value and trust', description:'Supply the independent evidence required to reduce risk.' },
    { id:'connect', title:'Connect signals and systems', description:'Make facts, entities, listings, assets, and measurement consistent.' }
  ];
  return `<section class="scene">${sceneHeader('ACT V · PRIORITIZE THE WORK','A strategy is not a list.<br>It is a set of <em style="color:var(--lamark);font-style:normal">defensible choices.</em>','Propose initiatives, score them with a weighted model, vote, and limit each client to the work that should move first.', `<div class="client-switch"><button type="button" data-action="strategy-view" data-view="pillars" class="${state.strategyView==='pillars'?'is-active':''}">Pillars</button><button type="button" data-action="strategy-view" data-view="matrix" class="${state.strategyView==='matrix'?'is-active':''}">Matrix</button></div><button class="primary-button" type="button" data-action="strategy-add">Propose initiative</button>`)}
    <div class="metrics-grid"><div class="metric-card"><small>Initiatives</small><strong>${items.length}</strong><p>Team proposals</p></div><div class="metric-card"><small>Top score</small><strong>${items[0]?.computedScore || 0}</strong><p>Weighted out of 100</p></div><div class="metric-card"><small>Capture</small><strong>${items.filter((i)=>payloadOf(i).pillar==='capture').length}</strong><p>Demand actions</p></div><div class="metric-card"><small>Prove</small><strong>${items.filter((i)=>payloadOf(i).pillar==='prove').length}</strong><p>Trust actions</p></div><div class="metric-card"><small>Connect</small><strong>${items.filter((i)=>payloadOf(i).pillar==='connect').length}</strong><p>System actions</p></div></div>
    ${state.strategyView === 'pillars' ? `<div class="strategy-grid" style="margin-top:16px">${pillars.map((pillar) => `<section class="strategy-column"><header><span>${esc(pillar.id.toUpperCase())}</span><h3>${esc(pillar.title)}</h3><p>${esc(pillar.description)}</p></header>${items.filter((item) => payloadOf(item).pillar===pillar.id).map((item) => strategyCardMarkup(item,totals)).join('') || '<div class="empty-state"><span>No initiatives here yet.</span></div>'}</section>`).join('')}</div>` : strategyMatrixMarkup(items)}
    <section class="panel" style="margin-top:16px"><p class="eyebrow">THE DECISION RULE</p><div class="scope-boundary"><div class="scope-card"><strong>30% Business impact</strong><p>Does the work change revenue, qualified leads, conversion, trust, or retention?</p></div><div class="scope-card"><strong>25% Audience relevance</strong><p>Does it resolve a real audience need at a meaningful decision stage?</p></div><div class="scope-card"><strong>20% Visibility gap</strong><p>Is the client absent, weak, inconsistent, or losing to a competitor?</p></div><div class="scope-card"><strong>15% Feasibility</strong><p>Can the client and agency execute within realistic constraints?</p></div><div class="scope-card"><strong>10% Measurement confidence</strong><p>Can leading and business outcomes be monitored honestly?</p></div></div></section>
  </section>`;
}
function strategyCardMarkup(item, totals) {
  const p = payloadOf(item); const target=`strategy:${item.id}`; const votes=totals.get(target)||0; const canEdit=item.owner_id===currentUserId()||isFacilitator();
  return `<article class="strategy-card"><header><h4>${esc(p.name)}</h4><span class="strategy-score">${item.computedScore}</span></header><div class="inline-meta" style="margin-top:8px"><span class="tag ${item.client}">${esc(item.client==='kp'?'KP':'Breezy')}</span><span class="tag">${esc(p.owner)}</span></div><p>${esc(p.rationale)}</p><p><b>First move:</b> ${esc(p.action)}</p><footer><button class="vote-button${myVote(target)?' is-active':''}" type="button" data-action="strategy-vote" data-target="${target}">▲ ${votes}</button>${canEdit?`<button class="text-button" type="button" data-action="strategy-edit" data-id="${item.id}">Edit</button>`:''}</footer></article>`;
}
function strategyMatrixMarkup(items) {
  return `<div class="matrix" style="margin-top:16px"><span class="matrix-label top">HIGH BUSINESS IMPACT</span><span class="matrix-label bottom">LOW BUSINESS IMPACT</span><span class="matrix-label left">LOW FEASIBILITY</span><span class="matrix-label right">HIGH FEASIBILITY</span>${items.map((item,index) => { const p=payloadOf(item); const left=12+(Number(p.feasibility||1)-1)/4*76; const top=88-(Number(p.impact||1)-1)/4*76; return `<button class="matrix-dot" type="button" data-action="strategy-edit" data-id="${item.id}" style="left:${left}%;top:${top}%;--dot-color:${CLIENTS[item.client]?.accent||'#2864dc'};z-index:${10+index}"><strong>${esc(p.name)}</strong><span>${item.computedScore} · ${esc(item.client==='kp'?'KP':'Breezy')}</span></button>`; }).join('')}</div>`;
}

function currentObjection() {
  const index = Number(state.room?.settings?.objectionIndex ?? state.localObjectionIndex) % OBJECTIONS.length;
  return { index, text: OBJECTIONS[index] };
}
function challengeRatings() { return liveItems('rating'); }
function renderChallenge() {
  const objection = currentObjection();
  const ratings = challengeRatings();
  const people = state.presence.length ? state.presence : [{ userId:currentUserId(),name:state.profile?.name||'Participant',color:state.profile?.color||'#2864dc' }];
  const scores = new Map();
  ratings.forEach((item) => { const p=payloadOf(item); const current=scores.get(p.speakerId)||{name:p.speakerName,total:0,count:0,color:p.speakerColor}; current.total+=Number(p.score||0); current.count+=1; scores.set(p.speakerId,current); });
  const leaders=[...scores.entries()].map(([id,v])=>({id,...v,avg:v.total/v.count})).sort((a,b)=>b.avg-a.avg);
  return `<section class="scene">${sceneHeader('ACT V · TEACH IT BACK','Can you explain the model when a client <em style="color:var(--lamark);font-style:normal">pushes back?</em>','One participant answers in 45 seconds. Everyone else rates accuracy, clarity, business relevance, confidence, and scope discipline.', isFacilitator()?`<button class="secondary-button" type="button" data-action="challenge-next">New objection</button>`:'')}
    <div class="challenge-layout"><article class="objection-card"><header><p class="eyebrow">CLIENT OBJECTION ${String(objection.index+1).padStart(2,'0')}</p></header><blockquote>“${esc(objection.text)}”</blockquote><footer><div class="system-note"><strong>Response structure</strong><br>Clarify the misconception → connect it to audience behavior → define Lamark’s role → name the business value.</div></footer></article>
      <section class="panel"><p class="eyebrow">RATE THE TEACH-BACK</p><h2>How well did the answer land?</h2><form id="challenge-form" class="stack" style="margin-top:20px"><label><span>Speaker</span><select name="speaker">${people.map((person) => `<option value="${attr(person.userId)}" data-name="${attr(person.name)}" data-color="${attr(person.color||'#38465b')}">${esc(person.name)}</option>`).join('')}</select></label><div class="form-grid"><label><span>Accuracy, 1–5</span><input name="accuracy" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Clarity, 1–5</span><input name="clarity" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Business relevance, 1–5</span><input name="business" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Scope discipline, 1–5</span><input name="scope" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label></div><label><span>One coaching note</span><input name="note" maxlength="240" placeholder="What would make the response stronger?"></label><button class="primary-button" type="submit">Submit rating</button></form></section></div>
    <section class="panel" style="margin-top:16px"><div class="flex-between"><div><p class="eyebrow">LIVE LEADERBOARD</p><h3>${ratings.length} rating${ratings.length===1?'':'s'} submitted</h3></div><span class="tag present">Team learning, not performance review</span></div><div class="divider"></div><div class="leaderboard">${leaders.map((leader,index) => `<div class="leader-row"><span class="rank">${String(index+1).padStart(2,'0')}</span><span class="avatar" style="background:${attr(leader.color||'#38465b')}">${esc(initials(leader.name))}</span><strong>${esc(leader.name)}</strong><output>${leader.avg.toFixed(1)}/5</output></div>`).join('') || '<div class="empty-state"><div><strong>No ratings yet</strong><span>Run the first 45-second client response.</span></div></div>'}</div></section>
  </section>`;
}

function renderDebrief() {
  const takeaways = liveItems('takeaway');
  const avgConfidence = takeaways.length ? Math.round(takeaways.reduce((sum,item)=>sum+Number(payloadOf(item).confidence||0),0)/takeaways.length) : state.confidence;
  return `<section class="scene">${sceneHeader('FINAL ACT · LOCK IN THE MODEL','Search Everywhere becomes real when the team can <em style="color:var(--lamark);font-style:normal">repeat the operating system.</em>','Capture confidence, commit to one behavior change, and export the workshop’s evidence and strategy.', `<a class="secondary-button" href="./assets/search-everywhere-operating-model.svg" download>Download operating model</a><button class="secondary-button" type="button" data-action="print-session">Print summary</button><button class="primary-button" type="button" data-action="export-session">Export workshop CSVs</button>`)}
    <div class="operating-model"><div class="operating-step"><span>01</span><strong>Map the audience</strong><p>Need states, language, risk, context, and desired action.</p></div><div class="operating-step"><span>02</span><strong>Map the surfaces</strong><p>Where the audience asks, scans, compares, validates, and acts.</p></div><div class="operating-step"><span>03</span><strong>Collect evidence</strong><p>Brand visibility, competitors, result types, proof, gaps, and conflicts.</p></div><div class="operating-step"><span>04</span><strong>Prioritize action</strong><p>Impact, audience relevance, gap, feasibility, measurement, and ownership.</p></div><div class="operating-step"><span>05</span><strong>Measure the system</strong><p>Platform-native leading signals plus traffic, leads, revenue, trust, and retention.</p></div></div>
    <div class="debrief-grid" style="margin-top:18px"><section class="panel confidence-panel"><p class="eyebrow">TEAM CONFIDENCE</p><div class="confidence-number" id="confidence-number">${state.confidence}</div><p class="muted">How confident are you explaining and applying Search Everywhere to a client?</p><input id="confidence-slider" type="range" min="0" max="100" value="${state.confidence}"><form id="takeaway-form" class="stack"><label><span>One behavior you will change on your next account</span><textarea name="takeaway" required rows="4" maxlength="500"></textarea></label><button class="primary-button" type="submit">Commit to the operating model</button></form></section>
      <section class="panel"><div class="flex-between"><div><p class="eyebrow">COMMITMENT WALL</p><h2>${takeaways.length ? `${takeaways.length} team commitment${takeaways.length===1?'':'s'}` : 'The wall is ready'}</h2></div><span class="tag present">Average confidence ${avgConfidence}</span></div><div class="divider"></div><div class="takeaway-wall">${takeaways.map((item) => {const p=payloadOf(item);return `<article class="takeaway-card"><p>“${esc(p.takeaway)}”</p><footer>${esc(p.ownerName)} · confidence ${esc(p.confidence)}/100</footer></article>`;}).join('') || '<div class="empty-state" style="grid-column:1/-1"><div><strong>No commitments submitted yet</strong><span>Everyone contributes one practical behavior change.</span></div></div>'}</div></section></div>
    <section class="panel" style="margin-top:18px"><div class="flex-between"><div><p class="eyebrow">SOURCE REGISTER</p><h3>Evidence used in the worked audit</h3></div><span class="tag">${SOURCES.length} sources</span></div><div class="divider"></div><div class="source-grid">${SOURCES.map((source) => `<article class="source-card"><strong>${esc(source.title)}</strong><p>${esc(source.use)}</p><a href="${attr(source.url)}" target="_blank" rel="noopener">Open source</a></article>`).join('')}</div></section>
  </section>`;
}

async function upsertItem(item) {
  if (state.connected) return realtime.upsertItem(item);
  const row = {
    id: item.id || randomId(), room_id: 'preview', item_type: item.item_type,
    owner_id: item.owner_id || currentUserId(), client: item.client || null, stage: item.stage || null,
    platform: item.platform || null, x: item.x ?? null, y: item.y ?? null, payload: item.payload || {},
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  const index = state.items.findIndex((existing) => existing.id === row.id);
  if (index >= 0) state.items.splice(index, 1, row); else state.items.push(row);
  scheduleRender();
  return row;
}
async function removeItem(id) {
  if (state.connected) return realtime.removeItem(id);
  state.items = state.items.filter((item) => item.id !== id);
  scheduleRender();
}
async function castVote(target, value = 1) {
  if (state.connected) return realtime.castVote(target, value);
  const key = `${target}:${currentUserId()}`;
  const index = state.votes.findIndex((vote) => `${vote.target_key}:${vote.user_id}` === key);
  if (index >= 0 && Number(state.votes[index].value) === Number(value)) state.votes.splice(index, 1);
  else {
    const row = { room_id:'preview',target_key:target,user_id:currentUserId(),value };
    if (index >= 0) state.votes.splice(index, 1, row); else state.votes.push(row);
  }
  scheduleRender();
}
async function updateRoom(patch) {
  if (state.connected) return realtime.updateRoom(patch);
  state.room = { ...(state.room || { id:'preview',code:'PREVIEW',settings:{},timer:{} }), ...patch };
  scheduleRender();
  return state.room;
}
async function safeAction(action, successMessage = '') {
  try {
    const result = await action();
    if (successMessage) toast(successMessage);
    return result;
  } catch (error) {
    console.error(error);
    toast('Action could not be completed', error?.message || String(error), 'error');
    return null;
  }
}

function bindStageSpecific() {
  if (stage().id === 'auction') {
    const mine = getMyItem('auction');
    const allZero = Object.values(state.auctionDraft).every((value) => Number(value) === 0);
    if (mine && allZero) {
      state.auctionDraft = { ...state.auctionDraft, ...(payloadOf(mine).allocations || {}) };
      scheduleRender();
    }
  }
  if (stage().id === 'whiteboard') bindBoardDragging();
  if (stage().id === 'ecosystem') animatePath(false);
}

async function handleSceneClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'open-join') return openDialog(joinDialog);
  if (action === 'start-preview') return goToStage(1);
  if (action === 'switch-client') {
    state.selectedClient = target.dataset.client;
    storageSet('se-selected-client', state.selectedClient);
    return renderStage();
  }
  if (action === 'fracture-choice') {
    const existing = getMyItem('poll', (item) => payloadOf(item).question === 'fracture-first-platform');
    await safeAction(() => upsertItem({
      id: existing?.id, item_type:'poll', dedupe_key:`fracture:${currentUserId()}`,
      payload:{ question:'fracture-first-platform', choice:target.dataset.choice, ownerName:state.profile?.name || 'Preview participant' }
    }));
    return;
  }
  if (action === 'ecosystem-platform') { state.ecosystemPlatform = target.dataset.platform; return renderStage(); }
  if (action === 'animate-path') return animatePath(true);
  if (action === 'focus-journey-form') {
    const form = $('#journey-form'); form?.querySelector('[name=stage]')?.setAttribute('data-selected',target.dataset.stage);
    if (form) { form.elements.stage.value = target.dataset.stage; form.elements.query.focus(); }
    return;
  }
  if (action === 'remove-item') return safeAction(() => removeItem(target.dataset.id), 'Contribution removed');
  if (action === 'enter-client') {
    state.selectedClient = target.dataset.client; state.auditFilters.client = target.dataset.client;
    storageSet('se-selected-client', state.selectedClient); return goToStage(6, isFacilitator());
  }
  if (action === 'audit-add') return openFindingDialog();
  if (action === 'audit-export') return exportAuditCsv();
  if (action === 'audit-vote') { event.stopPropagation(); return safeAction(() => castVote(target.dataset.target)); }
  if (action === 'audit-detail') return openAuditDetail(target.dataset.id);
  if (action === 'audit-edit') return openFindingDialog(target.dataset.id);
  if (action === 'board-client') { state.selectedClient = target.dataset.client; return renderStage(); }
  if (action === 'board-add') return openBoardDialog();
  if (action === 'board-edit') { event.stopPropagation(); return openBoardDialog(target.dataset.id); }
  if (action === 'board-arrange') return autoArrangeBoard();
  if (action === 'auction-reset') { state.auctionDraft = Object.fromEntries(SIGNALS.map((signal) => [signal.id,0])); return renderStage(); }
  if (action === 'auction-submit') return submitAuction();
  if (action === 'select-human') { state.selectedHuman = target.dataset.id; return renderStage(); }
  if (action === 'select-machine') { state.selectedMachine = target.dataset.id; return renderStage(); }
  if (action === 'save-connection') return saveConnection();
  if (action === 'shock-next') return nextShock();
  if (action === 'strategy-view') { state.strategyView = target.dataset.view; return renderStage(); }
  if (action === 'strategy-add') return openStrategyDialog();
  if (action === 'strategy-edit') return openStrategyDialog(target.dataset.id);
  if (action === 'strategy-vote') return safeAction(() => castVote(target.dataset.target));
  if (action === 'challenge-next') return nextObjection();
  if (action === 'print-session') return window.print();
  if (action === 'export-session') return exportSessionCsv();
}

async function handleSceneSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'journey-form') {
    const data = Object.fromEntries(new FormData(form));
    await safeAction(() => upsertItem({ item_type:'journey', client:data.client, stage:data.stage, platform:data.platform, payload:{ query:data.query, reason:data.reason, ownerName:state.profile?.name || 'Preview participant' } }), 'Journey moment added');
    form.reset(); form.elements.client.value = state.selectedClient; return;
  }
  if (form.id === 'shock-form') {
    const data = Object.fromEntries(new FormData(form)); const shock = currentShock();
    const existing = getMyItem('shock', (item) => payloadOf(item).shockId === shock.id);
    await safeAction(() => upsertItem({ id:existing?.id, item_type:'shock', client:data.client, stage:data.stage, dedupe_key:`${shock.id}:${currentUserId()}`, payload:{ shockId:shock.id, diagnosis:data.diagnosis, action:data.action, executionOwner:data.owner, measure:data.measure, ownerName:state.profile?.name || 'Preview participant' } }), 'Shock response submitted');
    form.reset(); return;
  }
  if (form.id === 'challenge-form') {
    const data = Object.fromEntries(new FormData(form));
    const select = form.elements.speaker; const option = select.selectedOptions[0];
    const dimensions = ['accuracy','clarity','business','scope'];
    const score = dimensions.reduce((sum,key)=>sum+Number(data[key]),0)/dimensions.length;
    const objection=currentObjection();
    const existing = getMyItem('rating', (item) => Number(payloadOf(item).objectionIndex) === objection.index && payloadOf(item).speakerId === data.speaker);
    await safeAction(() => upsertItem({ id:existing?.id, item_type:'rating', dedupe_key:`${objection.index}:${data.speaker}:${currentUserId()}`, payload:{ objectionIndex:objection.index, speakerId:data.speaker, speakerName:option.dataset.name || option.textContent, speakerColor:option.dataset.color, score, dimensions:Object.fromEntries(dimensions.map((key)=>[key,Number(data[key])])), note:data.note, raterName:state.profile?.name || 'Preview participant' } }), 'Rating submitted');
    form.reset(); $$('input[type=range]',form).forEach((input)=>{input.value=4; input.nextElementSibling.textContent='4';}); return;
  }
  if (form.id === 'takeaway-form') {
    const data = Object.fromEntries(new FormData(form));
    const existing = getMyItem('takeaway');
    await safeAction(() => upsertItem({ id:existing?.id,item_type:'takeaway',dedupe_key:`takeaway:${currentUserId()}`,payload:{ takeaway:data.takeaway,confidence:state.confidence,ownerName:state.profile?.name || 'Preview participant' } }), 'Commitment added');
    form.reset(); celebrate(); return;
  }
}

function handleSceneInput(event) {
  const target = event.target;
  if (target.matches('[data-audit-filter]')) {
    const key = target.dataset.auditFilter;
    state.auditFilters[key] = target.value;
    if (key === 'search') {
      clearTimeout(state.auditSearchTimer);
      const caret = target.selectionStart ?? target.value.length;
      state.auditSearchTimer = setTimeout(() => {
        renderStage();
        const replacement = $('[data-audit-filter=search]');
        replacement?.focus();
        replacement?.setSelectionRange?.(caret, caret);
      }, 220);
      return;
    }
    return renderStage();
  }
  if (target.matches('[data-audit-sort]')) { state.auditSort = target.value; return renderStage(); }
  if (target.matches('[data-auction-signal]')) {
    const signal = target.dataset.auctionSignal;
    state.auctionDraft[signal] = Number(target.value);
    const output = $(`#auction-output-${CSS.escape(signal)}`); if (output) output.textContent = target.value;
    const meter = $('.credit-meter'); const remaining = 100-auctionTotal();
    if (meter) { meter.classList.toggle('is-invalid',remaining!==0); const strong=$('strong',meter); if(strong)strong.textContent=remaining; const submit=$('[data-action=auction-submit]',meter); if(submit)submit.disabled=remaining!==0; }
    return;
  }
  if (target.id === 'confidence-slider') {
    state.confidence = Number(target.value); const number=$('#confidence-number'); if(number)number.textContent=target.value; return;
  }
  if (target.closest('#challenge-form') && target.type === 'range') {
    target.nextElementSibling.textContent = target.value;
  }
}

function animatePath(restart = false) {
  const steps = $$('[data-path-step]');
  if (!steps.length) return;
  steps.forEach((step) => { step.style.opacity = '.24'; step.style.transform = 'translateY(4px)'; });
  if (restart) void sceneRoot.offsetWidth;
  steps.forEach((step,index) => setTimeout(() => { step.style.transition='.35s var(--ease)'; step.style.opacity='1'; step.style.transform='none'; }, 120 + index*220));
}

function openBoardDialog(id = '') {
  const item = id ? state.items.find((candidate)=>candidate.id===id) : null;
  const p = payloadOf(item);
  $('#card-editor-id').value = item?.id || '';
  $('#card-editor-headline').value = p.headline || '';
  $('#card-editor-detail').value = p.detail || '';
  $('#card-editor-stage').value = item?.stage || p.stage || 'scan';
  $('#card-editor-platform').value = item?.platform || p.platform || 'google';
  $('#card-editor-client').value = item?.client || (state.selectedClient === 'both' ? 'both' : state.selectedClient);
  $('#card-editor-evidence').value = p.evidence || 'directional';
  $('#card-editor-source').value = p.source || '';
  $('#card-editor-delete').classList.toggle('hidden', !item);
  openDialog(cardEditorDialog);
}
async function saveBoardCard(event) {
  event.preventDefault();
  const id=$('#card-editor-id').value; const existing=state.items.find((item)=>item.id===id);
  const stageId=$('#card-editor-stage').value; const stageIndex=JOURNEY_STAGES.findIndex((item)=>item.id===stageId);
  const x=existing?.x ?? Math.max(2,(stageIndex/7*100)+2); const y=existing?.y ?? (14+Math.random()*58);
  await safeAction(() => upsertItem({ id:id||undefined,item_type:'board',client:$('#card-editor-client').value,stage:stageId,platform:$('#card-editor-platform').value,x,y,payload:{ headline:$('#card-editor-headline').value,detail:$('#card-editor-detail').value,evidence:$('#card-editor-evidence').value,source:$('#card-editor-source').value,ownerName:state.profile?.name||'Preview participant' } }), 'Evidence card saved');
  closeDialog(cardEditorDialog);
}
async function deleteBoardCard() {
  const id=$('#card-editor-id').value; if(!id)return;
  await safeAction(()=>removeItem(id),'Evidence card deleted'); closeDialog(cardEditorDialog);
}

function bindBoardDragging() {
  $$('.board-card').forEach((card) => card.addEventListener('pointerdown',(event) => {
    if (event.target.closest('button,a')) return;
    const board=$('#whiteboard'); const item=state.items.find((candidate)=>candidate.id===card.dataset.boardId); if(!board||!item)return;
    const boardRect=board.getBoundingClientRect(); const cardRect=card.getBoundingClientRect();
    state.drag={card,item,board,boardRect,offsetX:event.clientX-cardRect.left,offsetY:event.clientY-cardRect.top};
    card.classList.add('is-dragging'); card.setPointerCapture?.(event.pointerId); state.suppressRender=true;
  }));
}
async function handlePointerMove(event) {
  if (state.connected && event.pointerType !== 'touch') realtime.sendCursor({ x:event.clientX/innerWidth,y:event.clientY/innerHeight,stage:stage().id });
  if (!state.drag) return;
  const {card,boardRect}=state.drag;
  const x=clamp((event.clientX-boardRect.left-state.drag.offsetX)/boardRect.width*100,0,88);
  const y=clamp((event.clientY-boardRect.top-state.drag.offsetY)/boardRect.height*100,5,82);
  card.style.left=`${x}%`; card.style.top=`${y}%`; state.drag.x=x;state.drag.y=y;
  if(state.connected&&(!state.drag.lastBroadcast||performance.now()-state.drag.lastBroadcast>45)){state.drag.lastBroadcast=performance.now();realtime.broadcast('card_move',{id:state.drag.item.id,x,y});}
}
async function handlePointerUp() {
  if(!state.drag)return;
  const {item,card,x,y}=state.drag; card.classList.remove('is-dragging'); state.drag=null; state.suppressRender=false;
  const lane=clamp(Math.floor((Number(x||item.x||0)/100)*7),0,6); const stageId=JOURNEY_STAGES[lane].id;
  await safeAction(()=>upsertItem({...item,id:item.id,stage:stageId,x:Number(x??item.x),y:Number(y??item.y),payload:{...payloadOf(item)}}));
  scheduleRender();
}
async function autoArrangeBoard() {
  const cards=boardItems(); const counters={};
  for(const item of cards){ const idx=Math.max(0,JOURNEY_STAGES.findIndex((stage)=>stage.id===item.stage)); counters[idx]=(counters[idx]||0)+1; const x=idx/7*100+2; const y=10+((counters[idx]-1)%5)*17; await upsertItem({...item,id:item.id,x,y,payload:{...payloadOf(item)}}); }
  toast('Board arranged','Cards were aligned to their journey stages.');
}

function openFindingDialog(id = '') {
  const item=id?state.items.find((candidate)=>candidate.id===id&&candidate.item_type==='audit'):null; const p=payloadOf(item);
  $('#finding-id').value=item?.id||'';
  $('#finding-client').value = item?.client || (state.selectedClient === 'kp' ? 'kp' : 'breezy');
  $('#finding-platform').value=item?.platform||p.platform||'google'; $('#finding-stage').value=item?.stage||p.stage||'scan';
  $('#finding-audience').value=p.audience||''; $('#finding-query').value=p.query||''; $('#finding-visibility').value=p.visibility||'unknown';
  $('#finding-observation').value=p.observation||''; $('#finding-gap').value=p.gap||''; $('#finding-recommendation').value=p.recommendation||'';
  $('#finding-outcome').value=p.outcome||'visibility'; $('#finding-priority').value=p.priority||'medium'; $('#finding-confidence').value=p.confidence||'directional'; $('#finding-owner').value=p.owner||'SEO'; $('#finding-source').value=p.source||'';
  $('#finding-delete').classList.toggle('hidden',!item); openDialog(findingDialog);
}
async function saveFinding(event) {
  event.preventDefault(); const id=$('#finding-id').value; const priority=$('#finding-priority').value;
  await safeAction(()=>upsertItem({id:id||undefined,item_type:'audit',client:$('#finding-client').value,platform:$('#finding-platform').value,stage:$('#finding-stage').value,payload:{audience:$('#finding-audience').value,query:$('#finding-query').value,visibility:$('#finding-visibility').value,observation:$('#finding-observation').value,gap:$('#finding-gap').value,recommendation:$('#finding-recommendation').value,outcome:$('#finding-outcome').value,priority,score:scoreForPriority[priority],confidence:$('#finding-confidence').value,owner:$('#finding-owner').value,source:$('#finding-source').value,ownerName:state.profile?.name||'Preview participant'}}),'Audit finding saved'); closeDialog(findingDialog);
}
async function deleteFinding(){const id=$('#finding-id').value;if(!id)return;await safeAction(()=>removeItem(id),'Audit finding deleted');closeDialog(findingDialog);}

function openAuditDetail(id) {
  const row=auditRows().find((candidate)=>candidate.id===id); if(!row)return;
  $('#detail-title').textContent=row.query||'Audit finding';
  const canEdit=row.live&&(row.item.owner_id===currentUserId()||isFacilitator());
  $('#detail-content').innerHTML=`<div class="inline-meta"><span class="tag ${row.clientKey}">${esc(row.client)}</span><span class="tag ${row.priority}">${esc(row.priority)}</span><span class="tag ${row.confidence}">${esc(row.confidence)}</span><span class="strategy-score">${row.score}</span></div><div class="detail-grid" style="margin-top:16px"><div class="detail-block"><small>Search surface</small><p>${esc(row.platform)}</p></div><div class="detail-block"><small>Journey stage</small><p>${esc(byJourneyStage(row.stageId)?.label||row.stage)}</p></div><div class="detail-block"><small>Audience / moment</small><p>${esc(row.audience)}</p></div><div class="detail-block"><small>Execution owner</small><p>${esc(row.owner)}</p></div><div class="detail-block full"><small>Observation</small><p>${esc(row.observation)}</p></div>${row.currentState?`<div class="detail-block full"><small>Current state</small><p>${esc(row.currentState)}</p></div>`:''}<div class="detail-block full"><small>Gap or risk</small><p>${esc(row.gap)}</p></div><div class="detail-block full"><small>Recommendation</small><p>${esc(row.recommendation)}</p></div><div class="detail-block full"><small>Success measure</small><p>${esc(row.outcome)}</p></div>${row.sourceUrls.length?`<div class="detail-block full"><small>Evidence sources</small>${row.sourceUrls.map((url)=>`<p><a href="${attr(url)}" target="_blank" rel="noopener">${esc(url)}</a></p>`).join('')}</div>`:''}</div>${canEdit?`<div class="modal-actions"><button class="secondary-button" type="button" data-action="audit-edit" data-id="${row.id}">Edit live finding</button></div>`:''}`;
  openDialog(detailDialog);
}

async function submitAuction() {
  const total=auctionTotal(); if(total!==100){toast('Allocation must total 100',`You currently allocated ${total} credits.`,'error');return;}
  const existing=getMyItem('auction');
  await safeAction(()=>upsertItem({id:existing?.id,item_type:'auction',dedupe_key:`auction:${currentUserId()}`,payload:{allocations:{...state.auctionDraft},ownerName:state.profile?.name||'Preview participant'}}),'Allocation locked');
  celebrate();
}
async function saveConnection() {
  const human=HUMAN_SIGNALS.find((item)=>item.id===state.selectedHuman); const machine=SIGNALS.find((item)=>item.id===state.selectedMachine); if(!human||!machine)return;
  const existing=getMyItem('connection',(item)=>payloadOf(item).humanId===human.id&&payloadOf(item).machineId===machine.id);
  await safeAction(()=>upsertItem({id:existing?.id,item_type:'connection',dedupe_key:`${human.id}:${machine.id}:${currentUserId()}`,payload:{humanId:human.id,humanName:human.name,machineId:machine.id,machineName:machine.name,outcome:human.outcome,ownerName:state.profile?.name||'Preview participant'}}),'Connection saved');
  state.selectedHuman=null;state.selectedMachine=null;
}
async function nextShock() {
  state.localShockIndex=(SHOCKS.indexOf(currentShock())+1)%SHOCKS.length; const next=SHOCKS[state.localShockIndex];
  const settings={...(state.room?.settings||{}),shockId:next.id}; await safeAction(()=>updateRoom({settings}));
}
async function nextObjection() {
  state.localObjectionIndex=(currentObjection().index+1)%OBJECTIONS.length;
  const settings={...(state.room?.settings||{}),objectionIndex:state.localObjectionIndex}; await safeAction(()=>updateRoom({settings}));
}

function openStrategyDialog(id='') {
  const item=id?state.items.find((candidate)=>candidate.id===id&&candidate.item_type==='strategy'):null; const p=payloadOf(item);
  $('#strategy-id').value=item?.id||''; $('#strategy-client').value=item?.client||(state.selectedClient==='kp'?'kp':'breezy'); $('#strategy-pillar').value=p.pillar||'capture';
  $('#strategy-name').value=p.name||''; $('#strategy-rationale').value=p.rationale||''; $('#strategy-impact').value=p.impact||4; $('#strategy-audience').value=p.audience||4; $('#strategy-gap').value=p.gap||4; $('#strategy-feasibility').value=p.feasibility||3; $('#strategy-measurement').value=p.measurement||3; $('#strategy-owner').value=p.owner||'SEO'; $('#strategy-action').value=p.action||'';
  $('#strategy-delete').classList.toggle('hidden',!item); openDialog(strategyDialog);
}
async function saveStrategy(event) {
  event.preventDefault(); const id=$('#strategy-id').value;
  await safeAction(()=>upsertItem({id:id||undefined,item_type:'strategy',client:$('#strategy-client').value,payload:{pillar:$('#strategy-pillar').value,name:$('#strategy-name').value,rationale:$('#strategy-rationale').value,impact:Number($('#strategy-impact').value),audience:Number($('#strategy-audience').value),gap:Number($('#strategy-gap').value),feasibility:Number($('#strategy-feasibility').value),measurement:Number($('#strategy-measurement').value),owner:$('#strategy-owner').value,action:$('#strategy-action').value,ownerName:state.profile?.name||'Preview participant'}}),'Initiative saved'); closeDialog(strategyDialog);
}
async function deleteStrategy(){const id=$('#strategy-id').value;if(!id)return;await safeAction(()=>removeItem(id),'Initiative deleted');closeDialog(strategyDialog);}

function csvCell(value) { const text=Array.isArray(value)?value.join(' | '):String(value??''); return `"${text.replace(/"/g,'""')}"`; }
function downloadFile(name,content,type='text/csv;charset=utf-8') {
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportAuditCsv() {
  const rows=filteredAuditRows(); const headers=['Client','Platform','Journey Stage','Audience','Query','Observation','Current State','Gap','Recommendation','Outcome / KPI','Score','Priority','Confidence','Owner','Sources'];
  const lines=[headers,...rows.map((row)=>[row.client,row.platform,byJourneyStage(row.stageId)?.label||row.stage,row.audience,row.query,row.observation,row.currentState,row.gap,row.recommendation,row.outcome,row.score,row.priority,row.confidence,row.owner,row.sourceUrls])].map((line)=>line.map(csvCell).join(','));
  downloadFile(`search-everywhere-audit-${new Date().toISOString().slice(0,10)}.csv`,lines.join('\n')); toast('Audit exported',`${rows.length} filtered findings were downloaded.`);
}
function exportSessionCsv() {
  const rows=[];
  auditRows().forEach((row)=>rows.push({recordType:'audit',client:row.client,stage:byJourneyStage(row.stageId)?.label||row.stage,platform:row.platform,title:row.query,detail:row.recommendation,score:row.score,owner:row.owner,participant:'',source:row.sourceUrls.join(' | ')}));
  liveItems('journey').forEach((item)=>{const p=payloadOf(item);rows.push({recordType:'journey',client:CLIENTS[item.client]?.name||item.client,stage:byJourneyStage(item.stage)?.label||item.stage,platform:byPlatform(item.platform)?.name||item.platform,title:p.query,detail:p.reason,score:'',owner:'',participant:p.ownerName,source:''});});
  liveItems('board').forEach((item)=>{const p=payloadOf(item);rows.push({recordType:'evidence-board',client:CLIENTS[item.client]?.name||item.client,stage:byJourneyStage(item.stage)?.label||item.stage,platform:byPlatform(item.platform)?.name||item.platform,title:p.headline,detail:p.detail,score:'',owner:'',participant:p.ownerName,source:p.source});});
  strategyItems().forEach((item)=>{const p=payloadOf(item);rows.push({recordType:'strategy',client:CLIENTS[item.client]?.name||item.client,stage:p.pillar,platform:'',title:p.name,detail:`${p.rationale} First action: ${p.action}`,score:item.computedScore,owner:p.owner,participant:p.ownerName,source:''});});
  liveItems('shock').forEach((item)=>{const p=payloadOf(item);rows.push({recordType:'shock-response',client:CLIENTS[item.client]?.name||item.client,stage:byJourneyStage(item.stage)?.label||item.stage,platform:'',title:SHOCKS.find((s)=>s.id===p.shockId)?.title||p.shockId,detail:`${p.diagnosis} Response: ${p.action}`,score:'',owner:p.executionOwner,participant:p.ownerName,source:''});});
  liveItems('takeaway').forEach((item)=>{const p=payloadOf(item);rows.push({recordType:'takeaway',client:'',stage:'Debrief',platform:'',title:p.takeaway,detail:'',score:p.confidence,owner:'',participant:p.ownerName,source:''});});
  const headers=['Record Type','Client','Stage / Pillar','Platform','Title / Query','Detail / Recommendation','Score','Execution Owner','Participant','Source'];
  const lines=[headers,...rows.map((row)=>[row.recordType,row.client,row.stage,row.platform,row.title,row.detail,row.score,row.owner,row.participant,row.source])].map((line)=>line.map(csvCell).join(','));
  downloadFile(`search-everywhere-workshop-${state.room?.code||'preview'}-${new Date().toISOString().slice(0,10)}.csv`,lines.join('\n')); toast('Workshop exported',`${rows.length} records were compiled into one manageable CSV.`);
}

function copyInviteLink() {
  const url=new URL(location.href); if(state.room?.code)url.searchParams.set('room',state.room.code); navigator.clipboard?.writeText(url.href).then(()=>toast('Invite link copied',url.href)).catch(()=>toast('Copy unavailable','Select the address bar and copy the URL manually.','error'));
}
function openReactionMenu() {
  $('.reaction-menu')?.remove(); const button=$('#reaction-button'); const rect=button.getBoundingClientRect(); const menu=document.createElement('div'); menu.className='reaction-menu'; menu.style.left=`${Math.max(10,rect.right-220)}px`;menu.style.top=`${rect.top-54}px`; menu.innerHTML=['👏','💡','🔥','✅','🤔','🎯'].map((emoji)=>`<button type="button" data-reaction="${emoji}">${emoji}</button>`).join(''); document.body.append(menu);
  menu.addEventListener('click',async(event)=>{const target=event.target.closest('[data-reaction]');if(!target)return;await realtime.broadcast('reaction',{emoji:target.dataset.reaction,x:.5,y:.78});showReaction({emoji:target.dataset.reaction,x:.5,y:.78,senderId:currentUserId()});menu.remove();});
  setTimeout(()=>document.addEventListener('pointerdown',(event)=>{if(!menu.contains(event.target))menu.remove();},{once:true}),0);
}
function showReaction(payload) {
  const node=document.createElement('div');node.className='floating-reaction';node.textContent=payload.emoji||'👏';node.style.setProperty('--x',`${clamp((payload.x||.5)*100,3,97)}%`);node.style.setProperty('--y',`${clamp((payload.y||.75)*100,10,95)}%`);$('#reaction-layer').append(node);setTimeout(()=>node.remove(),2400);
}
function renderRemoteCursor(payload) {
  if(!payload||payload.senderId===currentUserId())return;
  if(payload.stage && payload.stage !== stage().id){const stale=state.remoteCursors.get(payload.senderId);if(stale){stale.node.remove();state.remoteCursors.delete(payload.senderId);}return;}
  let node=state.remoteCursors.get(payload.senderId)?.node;
  if(!node){node=document.createElement('div');node.className='remote-cursor';node.innerHTML=`<div class="remote-cursor-pointer"></div><span class="remote-cursor-label"></span>`;$('#remote-cursors').append(node);state.remoteCursors.set(payload.senderId,{node,lastSeen:Date.now()});}
  node.style.left=`${clamp(payload.x*100,0,100)}%`;node.style.top=`${clamp(payload.y*100,0,100)}%`;node.style.setProperty('--cursor-color',payload.senderColor||'#2864dc');$('.remote-cursor-label',node).textContent=payload.senderName||'Participant';state.remoteCursors.get(payload.senderId).lastSeen=Date.now();
}
function clearRemoteCursors(){for(const entry of state.remoteCursors.values())entry.node.remove();state.remoteCursors.clear();}
function cleanupRemoteCursors(){for(const [id,entry] of state.remoteCursors){if(Date.now()-entry.lastSeen>3500){entry.node.remove();state.remoteCursors.delete(id);}}}
function applyRemoteCardMove(payload){if(!payload||payload.senderId===currentUserId())return;const card=$(`[data-board-id="${CSS.escape(payload.id)}"]`);if(card){card.style.left=`${payload.x}%`;card.style.top=`${payload.y}%`;}}

function celebrate() {
  const canvas=$('#celebration-canvas'); const ctx=canvas.getContext('2d'); const dpr=Math.min(devicePixelRatio||1,2); canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.scale(dpr,dpr);
  const particles=Array.from({length:80},()=>({x:innerWidth/2,y:innerHeight*.72,vx:(Math.random()-.5)*12,vy:-6-Math.random()*9,g:.24+Math.random()*.16,size:3+Math.random()*5,life:90+Math.random()*40,color:['#2864dc','#14775c','#9a6a16','#7657d8','#c84f92'][Math.floor(Math.random()*5)]}));
  function frame(){ctx.clearRect(0,0,innerWidth,innerHeight);let alive=false;for(const p of particles){if(p.life<=0)continue;alive=true;p.life--;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;ctx.globalAlpha=Math.min(1,p.life/25);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;if(alive)requestAnimationFrame(frame);else ctx.clearRect(0,0,innerWidth,innerHeight);}frame();
}

async function handleJoin(event) {
  event.preventDefault(); const submit=$('#join-submit'); const original=submit.textContent; submit.disabled=true;submit.textContent='Connecting…';
  const name=$('#display-name').value.trim(); const code=normalizeCode($('#room-code-input').value); const create=!code; let team=$('#team-select').value;
  if(!create&&team==='facilitator')team='auto';
  if(team==='auto')team=Math.random()<.5?'breezy':'kp';
  const color=$('.color-option.is-active')?.dataset.color||'#2864dc';
  const profile={id:randomId(),name,team,role:create?'facilitator':'participant',color,stage:stage().id,joinedAt:Date.now()};
  try{
    const snapshot=await realtime.connect({roomCode:code,profile,create});
    state.profile={...profile,...snapshot.profile};state.room=snapshot.room;state.connected=true;state.preview=false;state.connectionMode=snapshot.mode;state.followFacilitator=true;
    storageSet('se-display-name',name);
    const url=new URL(location.href);url.searchParams.set('room',snapshot.room.code);history.replaceState({},'',url);
    $('#room-code-label').textContent=snapshot.room.code;$('#room-code-button').classList.remove('hidden');setConnectionLabel('connected',snapshot.mode);closeDialog(joinDialog);
    if(team==='breezy'||team==='kp'){state.selectedClient=team;storageSet('se-selected-client',team);}
    await goToStage(Number(snapshot.room.active_stage||0));
    toast(create?'Workshop room created':'Workshop joined',`Room ${snapshot.room.code} is live in ${snapshot.mode==='supabase'?'cloud':'local demo'} mode.`);
  }catch(error){console.error(error);toast('Could not enter the room',error?.message||String(error),'error');}
  finally{submit.disabled=false;submit.textContent=original;}
}

async function setTimer(minutes) {
  const seconds=Math.round(Number(minutes)*60);const timer={running:true,remaining:seconds,endsAt:new Date(Date.now()+seconds*1000).toISOString(),label:'Activity timer'};await safeAction(()=>updateRoom({timer}));renderFacilitatorControls();
}
async function toggleTimer() {
  const timer=state.room?.timer||{};
  if(timer.running){const remaining=Math.max(0,Math.ceil((new Date(timer.endsAt).getTime()-Date.now())/1000));await safeAction(()=>updateRoom({timer:{...timer,running:false,remaining,endsAt:null}}));}
  else{const remaining=Number(timer.remaining||stage().duration||300);await safeAction(()=>updateRoom({timer:{...timer,running:true,remaining,endsAt:new Date(Date.now()+remaining*1000).toISOString()}}));}
  renderFacilitatorControls();
}
async function clearTimer(){await safeAction(()=>updateRoom({timer:{running:false,remaining:0,endsAt:null,label:'Activity timer'}}));renderFacilitatorControls();}

function wireRealtime() {
  realtime.on('connection',(snapshot)=>{state.connectionMode=snapshot.mode;setConnectionLabel(snapshot.status,snapshot.mode);});
  realtime.on('room',(room)=>{
    state.room=room;
    if(room?.code){$('#room-code-label').textContent=room.code;$('#room-code-button').classList.remove('hidden');}
    const requested=Number(room?.active_stage);
    if(state.connected&&state.followFacilitator&&!isFacilitator()&&Number.isFinite(requested)&&requested!==state.stageIndex)goToStage(requested,false);
    else scheduleRender();
  });
  realtime.on('items',(items)=>{state.items=items||[];scheduleRender();});
  realtime.on('votes',(votes)=>{state.votes=votes||[];scheduleRender();});
  realtime.on('presence',(presence)=>{state.presence=(presence||[]).sort((a,b)=>Number(a.joinedAt||0)-Number(b.joinedAt||0));renderParticipants();if(stage().id==='challenge')scheduleRender();});
  realtime.on('cursor',renderRemoteCursor);
  realtime.on('reaction',showReaction);
  realtime.on('card_move',applyRemoteCardMove);
  realtime.on('activity',(payload)=>toast(payload?.title||'Workshop activity',payload?.message||''));
  realtime.on('warning',(warning)=>toast(warning.title,warning.message,'warning'));
}

function wireGlobalEvents() {
  sceneRoot.addEventListener('click',handleSceneClick);
  sceneRoot.addEventListener('submit',handleSceneSubmit);
  sceneRoot.addEventListener('input',handleSceneInput);
  sceneRoot.addEventListener('focusin',(event)=>{if(event.target.matches('input,textarea,select')&&!event.target.matches('[data-audit-filter],[data-audit-sort],[data-auction-signal],#confidence-slider,#challenge-form input[type=range]'))state.suppressRender=true;});
  sceneRoot.addEventListener('focusout',(event)=>{if(event.target.matches('input,textarea,select'))setTimeout(()=>{state.suppressRender=false;scheduleRender();},80);});
  stageRail.addEventListener('click',(event)=>{const button=event.target.closest('[data-stage-index]');if(button)goToStage(Number(button.dataset.stageIndex),isFacilitator());});
  $('#previous-stage').addEventListener('click',()=>goToStage(state.stageIndex-1,isFacilitator()));
  $('#next-stage').addEventListener('click',()=>{if(state.stageIndex<STAGES.length-1)goToStage(state.stageIndex+1,isFacilitator());else celebrate();});
  $('#mobile-menu').addEventListener('click',()=>stageRail.classList.toggle('is-open'));
  $('#open-participants').addEventListener('click',()=>{renderParticipants();openDialog(participantsDialog);});
  $('#close-participants').addEventListener('click',()=>closeDialog(participantsDialog));
  $('#open-facilitator').addEventListener('click',()=>{renderFacilitatorControls();openDialog(facilitatorDialog);});
  $('#close-facilitator').addEventListener('click',()=>closeDialog(facilitatorDialog));
  $('#room-code-button').addEventListener('click',copyInviteLink);
  $('#reaction-button').addEventListener('click',openReactionMenu);
  $('#follow-facilitator').addEventListener('change',(event)=>{state.followFacilitator=event.target.checked;if(state.followFacilitator&&Number.isFinite(Number(state.room?.active_stage)))goToStage(Number(state.room.active_stage));});
  $('#join-form').addEventListener('submit',handleJoin);
  $('#join-cancel').addEventListener('click',()=>{state.preview=true;state.profile=state.profile||{id:'preview-user',name:'Preview participant',team:'preview',role:'facilitator',color:'#2864dc'};closeDialog(joinDialog);setConnectionLabel('preview','preview');renderStage();});
  $('#color-options').addEventListener('click',(event)=>{const button=event.target.closest('[data-color]');if(!button)return;$$('.color-option').forEach((item)=>item.classList.remove('is-active'));button.classList.add('is-active');});
  $('#card-editor-form').addEventListener('submit',saveBoardCard);$('#card-editor-cancel').addEventListener('click',()=>closeDialog(cardEditorDialog));$('#card-editor-delete').addEventListener('click',deleteBoardCard);
  $('#finding-form').addEventListener('submit',saveFinding);$('#finding-cancel').addEventListener('click',()=>closeDialog(findingDialog));$('#finding-delete').addEventListener('click',deleteFinding);
  $('#strategy-form').addEventListener('submit',saveStrategy);$('#strategy-cancel').addEventListener('click',()=>closeDialog(strategyDialog));$('#strategy-delete').addEventListener('click',deleteStrategy);
  $('#detail-close').addEventListener('click',()=>closeDialog(detailDialog));
  $('#detail-content').addEventListener('click',(event)=>{const target=event.target.closest('[data-action=audit-edit]');if(target){closeDialog(detailDialog);openFindingDialog(target.dataset.id);}});
  facilitatorDialog.addEventListener('change',(event)=>{if(event.target.id==='facilitator-stage')goToStage(Number(event.target.value),true);});
  facilitatorDialog.addEventListener('click',(event)=>{const timerButton=event.target.closest('[data-timer-minutes]');if(timerButton)return setTimer(timerButton.dataset.timerMinutes);if(event.target.closest('#timer-pause'))return toggleTimer();if(event.target.closest('#timer-clear'))return clearTimer();if(event.target.closest('#facilitator-copy-link'))return copyInviteLink();});
  document.addEventListener('pointermove',handlePointerMove,{passive:true});document.addEventListener('pointerup',handlePointerUp);document.addEventListener('pointercancel',handlePointerUp);
  document.addEventListener('keydown',(event)=>{if(event.target.matches('input,textarea,select')||document.querySelector('dialog[open]'))return;if(event.key==='ArrowRight')goToStage(state.stageIndex+1,isFacilitator());if(event.key==='ArrowLeft')goToStage(state.stageIndex-1,isFacilitator());});
  window.addEventListener('beforeunload',()=>realtime.disconnect());
}

function initialize() {
  state.profile={id:'preview-user',name:'Preview participant',team:'preview',role:'facilitator',color:'#2864dc'};
  state.room={id:'preview',code:'PREVIEW',facilitator_id:'preview-user',active_stage:0,settings:{},timer:{running:false,remaining:0,endsAt:null}};
  populateStaticControls();wireRealtime();wireGlobalEvents();renderStageRail();renderStage();setConnectionLabel('preview','preview');
  const stageParam=new URLSearchParams(location.search).get('stage');const stageIndex=STAGES.findIndex((item)=>item.id===stageParam);if(stageIndex>=0)goToStage(stageIndex);
  state.timerInterval=setInterval(updateTimer,1000);state.cursorCleanup=setInterval(cleanupRemoteCursors,1200);
  if(!new URLSearchParams(location.search).has('preview'))setTimeout(()=>openDialog(joinDialog),120);
}

initialize();
