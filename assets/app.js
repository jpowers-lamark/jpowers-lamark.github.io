import {
  STAGES, JOURNEY_STAGES, PLATFORMS, SIGNALS, CLIENTS, SHOCKS, OBJECTIONS,
  HUMAN_SIGNALS, SAMPLE_JOURNEYS, SEED_AUDIT_ROWS, SOURCES, COGNITIVE_STATES,
  COGNITIVE_SCENARIOS, KNOWLEDGE_CHECKS, WHEEL_CHALLENGES
} from './data.js?v=3.1.1';
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
const workshopMain = $('#workshop-main');
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
  cognitiveState: 'gap',
  cognitiveScenario: 'breezy-fit',
  cognitiveDraft: { risk:2, urgency:3, familiarity:2, next:'youtube' },
  journeyScenario: 'breezy-fit',
  journeyStageDetail: 'trigger',
  wheelCategory: 'psychology',
  auctionClient: storageGet('se-auction-client') || 'breezy',
  auctionDirty: false,
  auctionLoadedClient: null,
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
  pendingRender: false,
  auditSearchTimer: null,
  suppressRender: false,
  remoteCursors: new Map(),
  cursorCleanup: null,
  timerInterval: null,
  applyingHostScroll: false,
  scrollBroadcastFrame: null,
  pendingHostView: null,
  pendingHostViewNotice: false
};

const currentUserId = () => realtime.user?.id || state.profile?.id || 'preview-user';
const isFacilitator = () => Boolean(
  state.profile?.role === 'facilitator' ||
  (state.room?.facilitator_id && state.room.facilitator_id === currentUserId())
);
const PRESENTATION_DEFAULTS = Object.freeze({
  mode: 'workshop',
  navigationLocked: true,
  scrollSync: false,
  pointersVisible: true,
  reactionsEnabled: true,
  focusMode: false,
  contributionsPaused: false
});
const presentationSettings = (room = state.room) => ({
  ...PRESENTATION_DEFAULTS,
  ...(room?.settings?.presentation || {})
});
const participantNavigationLocked = () => Boolean(
  state.connected && !isFacilitator() && presentationSettings().navigationLocked
);
const participantContributionsPaused = () => Boolean(
  state.connected && !isFacilitator() && presentationSettings().contributionsPaused
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
  setTimeout(flushPendingHostView, 0);
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

const EDITABLE_SELECTOR = 'input,textarea,select,[contenteditable="true"]';
const SELF_RENDERING_CONTROL_SELECTOR = '[data-audit-filter],[data-audit-sort]';

function isProtectedSceneEditor(node = document.activeElement) {
  return Boolean(
    node instanceof Element &&
    sceneRoot.contains(node) &&
    node.matches(EDITABLE_SELECTOR) &&
    !node.matches(SELF_RENDERING_CONTROL_SELECTOR)
  );
}

function participantIsBusy() {
  if (!state.connected || isFacilitator()) return false;
  const active = document.activeElement;
  return Boolean(
    (active instanceof Element && active.matches(EDITABLE_SELECTOR)) ||
    document.querySelector('dialog[open]')
  );
}

function scheduleRender() {
  if (state.suppressRender || isProtectedSceneEditor()) {
    state.pendingRender = true;
    return;
  }
  if (state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(() => {
    state.renderQueued = false;
    // A realtime event can queue a render just before a participant focuses a field.
    // Recheck here so the queued frame cannot replace the active form control.
    if (state.suppressRender || isProtectedSceneEditor()) {
      state.pendingRender = true;
      return;
    }
    state.pendingRender = false;
    renderStage();
  });
}

function updateSceneEditingLock() {
  const stillEditing = isProtectedSceneEditor();
  state.suppressRender = stillEditing;
  if (!stillEditing && state.pendingHostView) {
    state.pendingRender = false;
    flushPendingHostView();
    return;
  }
  if (!stillEditing && state.pendingRender) {
    state.pendingRender = false;
    scheduleRender();
  }
}

const INLINE_DRAFT_FORMS = new Set(['cognition-profile-form','journey-insight-form','wheel-response-form','signal-chain-form','shock-form','challenge-form','takeaway-form']);
const renderContext = () => `${stage().id}:${state.selectedClient}`;

function readDraftControl(control) {
  if (control.type === 'checkbox' || control.type === 'radio') return { checked: control.checked };
  if (control instanceof HTMLSelectElement && control.multiple) {
    return { values: [...control.selectedOptions].map((option) => option.value) };
  }
  return { value: control.value };
}

function writeDraftControl(control, snapshot) {
  if (!snapshot) return;
  if ('checked' in snapshot) control.checked = Boolean(snapshot.checked);
  else if ('values' in snapshot && control instanceof HTMLSelectElement) {
    const values = new Set(snapshot.values || []);
    [...control.options].forEach((option) => { option.selected = values.has(option.value); });
  } else if ('value' in snapshot) control.value = snapshot.value;
}

function captureSceneDraft() {
  const forms = {};
  INLINE_DRAFT_FORMS.forEach((formId) => {
    const form = document.getElementById(formId);
    if (!form || !sceneRoot.contains(form)) return;
    const controls = {};
    [...form.elements].forEach((control, index) => {
      if (!control.matches?.('input, textarea, select')) return;
      if (['submit', 'button', 'reset', 'image'].includes(control.type)) return;
      const key = control.name || control.id || `field-${index}`;
      controls[key] = readDraftControl(control);
    });
    forms[formId] = controls;
  });

  const active = document.activeElement;
  let focus = null;
  if (isProtectedSceneEditor(active)) {
    focus = {
      formId: active.form?.id || '',
      key: active.name || active.id || '',
      selectionStart: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      selectionEnd: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
      selectionDirection: active.selectionDirection || 'none'
    };
  }

  return {
    context: sceneRoot.dataset.renderContext || '',
    forms,
    focus
  };
}

function restoreSceneDraft(snapshot) {
  if (!snapshot || snapshot.context !== renderContext()) return;
  Object.entries(snapshot.forms || {}).forEach(([formId, controls]) => {
    const form = document.getElementById(formId);
    if (!form || !sceneRoot.contains(form)) return;
    Object.entries(controls).forEach(([key, value]) => {
      const control = [...form.elements].find((candidate) => (candidate.name || candidate.id) === key);
      if (control) writeDraftControl(control, value);
    });
  });

  const focus = snapshot.focus;
  if (!focus?.formId || !focus.key) return;
  const form = document.getElementById(focus.formId);
  const control = form ? [...form.elements].find((candidate) => (candidate.name || candidate.id) === focus.key) : null;
  if (!control) return;
  control.focus({ preventScroll: true });
  if (focus.selectionStart != null && control.setSelectionRange) {
    const max = String(control.value || '').length;
    control.setSelectionRange(
      Math.min(focus.selectionStart, max),
      Math.min(focus.selectionEnd ?? focus.selectionStart, max),
      focus.selectionDirection
    );
  }
}

function getMyItem(type, predicate = () => true) {
  return liveItems(type).find((item) => item.owner_id === currentUserId() && predicate(item));
}

function populateStaticControls() {
  const colors = ['#2864dc', '#0b9fe8', '#5b4ee8', '#8f5de7', '#c84f92', '#e05d2b', '#9a6a16', '#38465b'];
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
  const locked = participantNavigationLocked();
  stageRail.innerHTML = `<div class="stage-rail-header"><div><small>LIVE WORKSHOP</small><strong>${STAGES.length} stages</strong></div>${locked ? '<span class="rail-lock">HOST CONTROLLED</span>' : ''}</div>` + STAGES.map((item, index) => `
    <button class="stage-button${index === state.stageIndex ? ' is-active' : ''}${index < state.stageIndex ? ' is-complete' : ''}${locked ? ' is-locked' : ''}" type="button" data-stage-index="${index}" aria-current="${index === state.stageIndex ? 'step' : 'false'}"${locked ? ' disabled aria-disabled="true"' : ''}>
      <span class="stage-number">${item.number}</span><span class="stage-copy"><small>${esc(item.kicker)}</small><strong>${esc(item.title)}</strong></span>
    </button>`).join('');
}

async function goToStage(index, broadcast = false, options = {}) {
  const { forced = false, preserveScroll = false } = options;
  if (participantNavigationLocked() && !forced) {
    toast('Host-guided navigation is active', 'The facilitator controls the current workshop stage.');
    return false;
  }
  const next = clamp(index, 0, STAGES.length - 1);
  state.stageIndex = next;
  clearRemoteCursors();
  renderStageRail();
  renderStage();
  if (!preserveScroll) {
    workshopMain?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  stageRail.classList.remove('is-open');
  await realtime.updatePresence?.({ stage: STAGES[next].id });
  if (broadcast && state.connected && isFacilitator()) {
    try { await realtime.updateRoom({ active_stage: next }); }
    catch (error) { toast('Stage could not be broadcast', error.message, 'error'); }
  }
  return true;
}

function renderShellState() {
  const active = stage();
  const settings = presentationSettings();
  const locked = participantNavigationLocked();
  const isHost = isFacilitator();
  appShell.dataset.role = isHost ? 'facilitator' : 'participant';
  appShell.dataset.focusMode = !isHost && settings.focusMode ? 'true' : 'false';
  appShell.dataset.contributionsPaused = !isHost && settings.contributionsPaused ? 'true' : 'false';
  $('#stage-kicker').textContent = `${active.kicker} · ${active.number}`;
  $('#stage-title').textContent = active.title;
  $('#previous-stage').classList.toggle('hidden', locked || (state.preview && state.stageIndex === 0));
  $('#next-stage').classList.toggle('hidden', locked);
  $('#previous-stage').disabled = locked || state.stageIndex === 0;
  $('#next-stage').disabled = locked || state.stageIndex === STAGES.length - 1;
  $('#next-stage').textContent = state.stageIndex === STAGES.length - 1 ? 'Complete' : 'Next';
  $('#reaction-button').classList.toggle('hidden', !state.connected || !settings.reactionsEnabled);
  $('#open-facilitator').classList.toggle('hidden', !isHost);
  $('.follow-toggle').classList.toggle('hidden', !state.connected || isHost || settings.navigationLocked);
  $('#follow-facilitator').checked = state.followFacilitator;
  $('#remote-cursors').classList.toggle('hidden', !settings.pointersVisible);
  if (!settings.pointersVisible) clearRemoteCursors();

  const status = $('#presentation-status');
  if (status) {
    const labels = [];
    if (isHost) labels.push('HOST');
    labels.push(settings.navigationLocked ? 'GUIDED' : (state.followFacilitator ? 'FOLLOWING' : 'OPEN REVIEW'));
    if (settings.scrollSync) labels.push('SCREEN SYNC');
    if (settings.contributionsPaused) labels.push('SUBMISSIONS PAUSED');
    status.textContent = labels.join(' · ');
    status.title = settings.navigationLocked
      ? 'The facilitator controls stage navigation.'
      : 'Participants may move independently between stages.';
    status.classList.toggle('is-host', isHost);
    status.classList.toggle('is-paused', settings.contributionsPaused);
    status.classList.toggle('hidden', !state.connected);
  }
  renderStageRail();
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
  const settings = presentationSettings();
  const toggle = (key, title, description, checked, icon) => `
    <label class="host-setting-row">
      <span class="host-setting-icon" aria-hidden="true">${icon}</span>
      <span class="host-setting-copy"><strong>${esc(title)}</strong><small>${esc(description)}</small></span>
      <input class="host-switch" type="checkbox" data-host-setting="${key}"${checked ? ' checked' : ''}>
    </label>`;
  $('#facilitator-controls').innerHTML = `
    <div class="stack host-console">
      <section class="facilitator-section host-console-hero">
        <div><p class="eyebrow">PRESENTATION AUTHORITY</p><h3>Host controls are available only to the room creator.</h3><p class="small muted">Manage the shared stage, screen synchronization, participation rules, and visibility settings for the full room. Supabase policies reject participant changes.</p></div>
        <div class="host-state-readout"><span>${state.presence.length}</span><small>connected</small><span>${state.stageIndex + 1}/${STAGES.length}</span><small>current stage</small></div>
      </section>

      <section class="facilitator-section">
        <div class="host-section-heading"><span>01</span><div><h3>Operating mode</h3><p>Apply a tested preset, then adjust individual controls as needed.</p></div></div>
        <div class="host-preset-grid">
          <button class="host-preset" type="button" data-host-preset="workshop"><strong>Workshop</strong><small>Host-guided stages, live inputs, cursors, and reactions.</small></button>
          <button class="host-preset" type="button" data-host-preset="presentation"><strong>Presentation</strong><small>Follow the host screen, reduce distractions, and pause inputs.</small></button>
          <button class="host-preset" type="button" data-host-preset="review"><strong>Open Review</strong><small>Release navigation so participants can revisit any section.</small></button>
        </div>
      </section>

      <section class="facilitator-section">
        <div class="host-section-heading"><span>02</span><div><h3>Navigation and screen control</h3><p>Control where the room is and whether participant screens follow your scroll position.</p></div></div>
        <label><span>Active stage</span><select id="facilitator-stage">${STAGES.map((item, index) => `<option value="${index}"${index === state.stageIndex ? ' selected' : ''}>${item.number} · ${esc(item.title)}</option>`).join('')}</select></label>
        <div class="host-toggle-list">
          ${toggle('navigationLocked','Host-only navigation','Participants cannot use the stage rail, Previous, Next, or keyboard arrows. They automatically follow stage changes.',settings.navigationLocked,'↔')}
          ${toggle('scrollSync','Follow my screen','Synchronize participant pages to the host’s vertical position.',settings.scrollSync,'⇅')}
          ${toggle('focusMode','Participant focus mode','Hide the stage rail and secondary room controls on participant screens.',settings.focusMode,'◉')}
        </div>
        <div class="host-action-grid">
          <button id="host-bring-everyone" class="primary-button" type="button">Bring everyone here</button>
          <button id="host-send-top" class="secondary-button" type="button">Send everyone to top</button>
        </div>
        <p class="small muted">Screen synchronization waits until an active field or form is complete.</p>
      </section>

      <section class="facilitator-section">
        <div class="host-section-heading"><span>03</span><div><h3>Participation and visibility</h3><p>Reduce visual noise or temporarily hold room input during instruction.</p></div></div>
        <div class="host-toggle-list">
          ${toggle('pointersVisible','Show live pointers','Display remote participant cursors and names on the current stage.',settings.pointersVisible,'⌁')}
          ${toggle('reactionsEnabled','Allow reactions','Show the shared reaction control and room-wide reaction animations.',settings.reactionsEnabled,'✦')}
          ${toggle('contributionsPaused','Pause participant submissions','Temporarily block new votes, cards, responses, allocations, and edits while preserving unfinished text.',settings.contributionsPaused,'Ⅱ')}
        </div>
        <button id="host-clear-pointers" class="secondary-button" type="button">Clear visible pointers now</button>
      </section>

      <section class="facilitator-section">
        <div class="host-section-heading"><span>04</span><div><h3>Activity timer</h3><p>Set a room-wide countdown for the current exercise.</p></div></div>
        <div class="timer-presets">${[1,5,10,15,20].map((minutes) => `<button class="chip-button" type="button" data-timer-minutes="${minutes}">${minutes}m</button>`).join('')}</div>
        <div class="button-row"><button id="timer-pause" class="secondary-button" type="button">${timer.running ? 'Pause' : 'Resume'}</button><button id="timer-clear" class="secondary-button" type="button">Clear</button></div>
      </section>

      <section class="facilitator-section">
        <div class="host-section-heading"><span>05</span><div><h3>Room access and state</h3><p>Invite participants and verify the current collaboration record.</p></div></div>
        <p class="mono small host-room-code">${esc(state.room?.code || 'PREVIEW')}</p>
        <button id="facilitator-copy-link" class="secondary-button" type="button">Copy invite link</button>
        <p class="small muted">${state.presence.length} participant${state.presence.length === 1 ? '' : 's'} · ${state.items.length} live contribution${state.items.length === 1 ? '' : 's'} · ${state.votes.length} vote record${state.votes.length === 1 ? '' : 's'}</p>
      </section>
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

function renderStage({ preserveDraft = true } = {}) {
  const draft = preserveDraft ? captureSceneDraft() : null;
  renderShellState();
  const renderers = [
    renderWelcome, renderFracture, renderCognition, renderDefinition, renderEcosystem,
    renderJourney, renderPortals, renderAudit, renderWhiteboard, renderWheel,
    renderAuction, renderDualVision, renderShock, renderStrategy, renderChallenge, renderDebrief
  ];
  sceneRoot.innerHTML = renderers[state.stageIndex]?.() || renderWelcome();
  sceneRoot.dataset.stage = stage().id;
  sceneRoot.dataset.renderContext = renderContext();
  bindStageSpecific();
  restoreSceneDraft(draft);
  state.lastRender = Date.now();
}

function renderWelcome() {
  const connectedCopy = state.connected
    ? `<div class="system-note mission-note"><strong>Room ${esc(state.room?.code || '')}</strong><br>${state.presence.length || 1} participant${(state.presence.length || 1) === 1 ? '' : 's'} connected. The facilitator can synchronize the room while each participant contributes independently.</div>`
    : `<div class="button-row"><button class="primary-button" type="button" data-action="open-join">Create or join a live room</button><button class="secondary-button" type="button" data-action="start-preview">Open standalone preview</button></div>`;
  const nodes = ['google','ai','maps','reddit','youtube','social','reviews','site'].map(byPlatform).filter(Boolean);
  return `<section class="scene hero-stage v3-hero"><div class="hero-layout"><div>
    <p class="eyebrow">LAMARK SEARCH EVERYWHERE EXPERIENCE LAB</p>
    <h1 class="hero-title">Search behavior is a <span>decision system.</span></h1>
    <p class="lede">A live simulation of how people recognize uncertainty, choose a search surface, refine their questions, test credibility, and act. Follow the decision across Google, AI, local, video, communities, reviews, social search, and owned experiences.</p>
    <div class="hero-meta"><div class="hero-stat"><strong>16</strong><small>interactive stages</small></div><div class="hero-stat"><strong>7</strong><small>cognitive search states</small></div><div class="hero-stat"><strong>55</strong><small>worked audit findings</small></div><div class="hero-stat"><strong>6–8</strong><small>live participants</small></div></div>
    <div style="margin-top:28px">${connectedCopy}</div>
  </div><div class="mission-orbit" aria-label="Search Everywhere decision system">
    <div class="mission-grid"></div><div class="mission-scan"></div>
    <div class="mission-core"><small>UNRESOLVED NEED</small><strong>Search continues while the expected value of more information exceeds the cost of getting it.</strong><span>Risk, urgency, familiarity, evidence, and effort change the path.</span></div>
    ${nodes.map((platform,index)=>`<div class="mission-node" style="--i:${index};--count:${nodes.length};--node:${platform.color}"><i>${esc(platform.icon)}</i><span>${esc(platform.short)}</span></div>`).join('')}
  </div></div><div class="system-band"><span>COGNITION</span><i></i><span>SURFACES</span><i></i><span>EVIDENCE</span><i></i><span>DECISIONS</span><i></i><span>BUSINESS OUTCOMES</span></div></section>`;
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
  return `<section class="scene">${sceneHeader('ACT I · MAKE THE FRACTURE VISIBLE','Where do you search first for an <em style="color:var(--lamark);font-style:normal">honest answer?</em>','Answer from your own behavior as a shopper, traveler, claimant, or customer.')}
    <div class="panel-grid">
      <section class="panel span-7"><div class="flex-between"><div><p class="eyebrow">LIVE TEAM POLL</p><h2>Choose your first move</h2></div><span class="tag ${state.connected ? 'present' : 'directional'}">${state.connected ? 'Live' : 'Preview'}</span></div><div class="divider"></div>
        <div class="poll-grid">${PLATFORMS.map((platform) => `<button class="poll-option${myChoice === platform.id ? ' is-selected' : ''}" type="button" data-action="fracture-choice" data-choice="${platform.id}"><span class="platform-icon" style="background:${platform.color}">${esc(platform.icon)}</span><strong>${esc(platform.name)}</strong><span class="vote-count">${counts.get(platform.id) || 0}</span></button>`).join('')}</div>
      </section>
      <aside class="panel span-5"><p class="eyebrow">THE FRACTURE, IN REAL TIME</p><h2>${total ? `${total} different search path${total === 1 ? '' : 's'} beginning to form` : 'Awaiting the first response'}</h2><div class="divider"></div>
        <div class="result-bars">${results.slice(0, 7).map((platform) => { const count = counts.get(platform.id) || 0; return `<div class="result-row"><label>${esc(platform.short)}</label><div class="result-track"><div class="result-fill" style="width:${count / max * 100}%;background:${platform.color}"></div></div><output>${count}</output></div>`; }).join('')}</div>
        <div class="callout" style="margin-top:20px"><strong>Strategic implication</strong><p>The same need can begin on different platforms and move across several more. Search Everywhere maps the full decision path from first question to final action.</p></div>
      </aside>
      <section class="panel span-12"><div class="quote-stage"><div><blockquote>People do not think in channels.<br>They search until <em>uncertainty is gone.</em></blockquote><p>What would you check second, and what evidence would finally make you act?</p></div></div></section>
    </div></section>`;
}

function peopleInRoom() {
  return state.presence.length ? state.presence : [{ userId:currentUserId(), name:state.profile?.name || 'Preview participant', color:state.profile?.color || '#2864dc', role:state.profile?.role || 'facilitator' }];
}
function personById(id) {
  return peopleInRoom().find((person) => person.userId === id) || { userId:id, name:'Participant', color:'#2864dc' };
}
function roomSettingsPatch(patch) {
  return updateRoom({ settings:{ ...(state.room?.settings || {}), ...patch } });
}
function presentationPreset(name) {
  const presets = {
    workshop: {
      mode: 'workshop',
      navigationLocked: true,
      scrollSync: false,
      pointersVisible: true,
      reactionsEnabled: true,
      focusMode: false,
      contributionsPaused: false
    },
    presentation: {
      mode: 'presentation',
      navigationLocked: true,
      scrollSync: true,
      pointersVisible: false,
      reactionsEnabled: false,
      focusMode: true,
      contributionsPaused: true
    },
    review: {
      mode: 'review',
      navigationLocked: false,
      scrollSync: false,
      pointersVisible: true,
      reactionsEnabled: true,
      focusMode: false,
      contributionsPaused: false
    }
  };
  return presets[name] || presets.workshop;
}
async function updatePresentationSettings(patch, successMessage = '') {
  if (!isFacilitator()) return null;
  const next = { ...presentationSettings(), ...patch };
  const result = await safeAction(
    () => roomSettingsPatch({ presentation: next }),
    successMessage
  );
  if (!result) return null;
  if (!next.pointersVisible) {
    clearRemoteCursors();
    await realtime.broadcast('clear_pointers', { reason:'host-setting' });
  }
  if (!next.reactionsEnabled) $('.reaction-menu')?.remove();
  renderFacilitatorControls();
  renderShellState();
  if (next.scrollSync && patch.scrollSync) await broadcastHostView({ reason:'scroll-sync-enabled' });
  return result;
}
function activeScrollMetrics() {
  const mainMax = workshopMain ? Math.max(0, workshopMain.scrollHeight - workshopMain.clientHeight) : 0;
  const documentNode = document.scrollingElement || document.documentElement;
  const documentMax = Math.max(0, documentNode.scrollHeight - window.innerHeight);
  if (mainMax > 2) return { kind:'main', node:workshopMain, max:mainMax, top:workshopMain.scrollTop };
  return { kind:'document', node:documentNode, max:documentMax, top:window.scrollY || documentNode.scrollTop || 0 };
}
function currentScrollRatio() {
  const metrics = activeScrollMetrics();
  return metrics.max ? clamp(metrics.top / metrics.max, 0, 1) : 0;
}
function trustedHostPayload(payload) {
  return Boolean(
    payload &&
    payload.senderId &&
    state.room?.facilitator_id &&
    payload.senderId === state.room.facilitator_id
  );
}
function hostViewPayload(ratio = currentScrollRatio(), reason = 'manual') {
  return {
    stageIndex: state.stageIndex,
    stageId: stage().id,
    ratio: clamp(ratio, 0, 1),
    reason,
    viewId: randomId()
  };
}
async function broadcastHostView({ ratio = currentScrollRatio(), reason = 'manual', announce = true } = {}) {
  if (!state.connected || !isFacilitator()) return;
  if (Number(state.room?.active_stage) !== state.stageIndex) {
    await safeAction(() => realtime.updateRoom({ active_stage: state.stageIndex }));
  }
  await realtime.broadcast('host_view', hostViewPayload(ratio, reason));
  if (announce) toast(reason === 'top' ? 'Room sent to the top' : 'Room synchronized', 'Participant screens were aligned to the host view.');
}
function scrollParticipantToRatio(ratio, smooth = false) {
  const metrics = activeScrollMetrics();
  state.applyingHostScroll = true;
  const top = metrics.max * clamp(ratio, 0, 1);
  if (metrics.kind === 'main') workshopMain.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  else window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  setTimeout(() => { state.applyingHostScroll = false; }, smooth ? 420 : 40);
}
async function applyHostView(payload, { requireContinuousSync = false, smooth = false } = {}) {
  if (isFacilitator() || !trustedHostPayload(payload)) return;
  const settings = presentationSettings();
  if (requireContinuousSync && !settings.scrollSync) return;
  if (participantIsBusy()) {
    state.pendingHostView = { payload, requireContinuousSync, smooth };
    if (!state.pendingHostViewNotice) {
      state.pendingHostViewNotice = true;
      toast('Host view queued', 'Your active field is protected. Screen synchronization resumes when you finish editing.');
    }
    return;
  }
  state.pendingHostView = null;
  state.pendingHostViewNotice = false;
  const requested = Number(payload.stageIndex);
  if (Number.isFinite(requested) && requested !== state.stageIndex) {
    await goToStage(requested, false, { forced:true, preserveScroll:true });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  scrollParticipantToRatio(payload.ratio, smooth);
}
function flushPendingHostView() {
  if (!state.pendingHostView || participantIsBusy()) return;
  const pending = state.pendingHostView;
  state.pendingHostView = null;
  state.pendingHostViewNotice = false;
  void applyHostView(pending.payload, {
    requireContinuousSync: pending.requireContinuousSync,
    smooth: pending.smooth
  });
}
function handleWorkshopScroll() {
  if (
    !state.connected ||
    !isFacilitator() ||
    state.applyingHostScroll ||
    !presentationSettings().scrollSync ||
    state.scrollBroadcastFrame
  ) return;
  state.scrollBroadcastFrame = requestAnimationFrame(async () => {
    state.scrollBroadcastFrame = null;
    await realtime.broadcast('host_scroll', hostViewPayload(currentScrollRatio(), 'continuous-scroll'));
  });
}
async function clearPointersRoomWide() {
  if (!isFacilitator()) return;
  clearRemoteCursors();
  await realtime.broadcast('clear_pointers', { reason:'host-action' });
  toast('Pointers cleared', 'Existing pointer markers were removed from participant screens.');
}
function average(values) {
  const nums=values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum,value)=>sum+value,0)/nums.length : 0;
}
function knowledgeQuestion(id) { return KNOWLEDGE_CHECKS.find((question)=>question.id===id); }
function knowledgeAnswers(id) { return liveItems('knowledge_answer').filter((item)=>payloadOf(item).questionId===id); }
function knowledgeCheckMarkup(id) {
  const question=knowledgeQuestion(id); if(!question)return '';
  const answers=knowledgeAnswers(id); const mine=answers.find((item)=>item.owner_id===currentUserId());
  const counts=question.options.map((_,index)=>answers.filter((item)=>Number(payloadOf(item).answer)===index).length);
  const max=Math.max(1,...counts);
  const correct=mine ? Number(payloadOf(mine).answer)===question.correct : false;
  return `<section class="panel knowledge-check"><div class="flex-between"><div><p class="eyebrow">COGNITIVE SYSTEMS CHECK</p><h3>${esc(question.question)}</h3></div><span class="knowledge-score ${mine ? (correct?'is-correct':'is-wrong') : ''}">${mine ? (correct?'100 pts':'0 pts') : '100 pts'}</span></div><div class="knowledge-options">${question.options.map((option,index)=>`<button type="button" class="knowledge-option${mine && Number(payloadOf(mine).answer)===index?' is-selected':''}${mine && index===question.correct?' is-correct':''}" data-action="knowledge-answer" data-question="${id}" data-answer="${index}"><span>${String.fromCharCode(65+index)}</span><strong>${esc(option)}</strong><output>${counts[index]}</output></button>`).join('')}</div>${mine?`<div class="knowledge-explanation"><strong>${correct?'Correct reasoning':'Review the reasoning'}</strong><p>${esc(question.explanation)}</p><div class="mini-result-bars">${question.options.map((option,index)=>`<div><label>${String.fromCharCode(65+index)}</label><span><i style="width:${counts[index]/max*100}%"></i></span><output>${counts[index]}</output></div>`).join('')}</div></div>`:''}</section>`;
}
function currentCognitiveScenario() { return COGNITIVE_SCENARIOS.find((item)=>item.id===state.cognitiveScenario) || COGNITIVE_SCENARIOS[0]; }
function cognitiveProfiles() { return liveItems('cognitive_profile').filter((item)=>payloadOf(item).scenarioId===state.cognitiveScenario); }
function syncCognitiveScenario(force=false) {
  const scenario=currentCognitiveScenario();
  if(force || state.cognitiveDraft.scenarioId!==scenario.id) state.cognitiveDraft={ scenarioId:scenario.id, risk:scenario.defaultRisk, urgency:scenario.defaultUrgency, familiarity:scenario.defaultFamiliarity, next:scenario.next };
}
function cognitivePathMarkup(scenario) {
  return scenario.path.map((id,index)=>{const platform=byPlatform(id);return `<span><i class="platform-icon" style="background:${platform?.color||'#2864dc'}">${esc(platform?.icon||'?')}</i>${esc(platform?.short||id)}</span>${index<scenario.path.length-1?'<b>→</b>':''}`}).join('');
}
function renderCognition() {
  syncCognitiveScenario();
  const selected=COGNITIVE_STATES.find((item)=>item.id===state.cognitiveState) || COGNITIVE_STATES[0];
  const scenario=currentCognitiveScenario(); const profiles=cognitiveProfiles();
  const avgRisk=average(profiles.map((item)=>payloadOf(item).risk)); const avgUrgency=average(profiles.map((item)=>payloadOf(item).urgency)); const avgFamiliarity=average(profiles.map((item)=>payloadOf(item).familiarity));
  return `<section class="scene cognition-scene">${sceneHeader('ACT I · COGNITIVE SEARCH REACTOR','Search begins before a keyword is <em>fully formed.</em>','Use established information-seeking research to connect uncertainty, risk, urgency, and familiarity with practical SEO decisions.')}
    <div class="cognition-grid"><section class="cognitive-reactor"><div class="reactor-rings"></div><div class="reactor-core"><small>UNCERTAINTY</small><strong>${esc(selected.short)}</strong><span>${esc(selected.number)} / 07</span></div>${COGNITIVE_STATES.map((item,index)=>`<button type="button" class="reactor-node${item.id===selected.id?' is-active':''}" style="--i:${index};--count:${COGNITIVE_STATES.length}" data-action="cognitive-state" data-state="${item.id}"><i>${item.number}</i><span>${esc(item.title)}</span></button>`).join('')}</section>
      <aside class="cognitive-detail"><span class="giant-number">${selected.number}</span><p class="eyebrow">${esc(selected.title)}</p><h2>${esc(selected.short)}</h2><p>${esc(selected.description)}</p><div class="reactor-fact"><small>OBSERVED SEARCH BEHAVIOR</small><p>${esc(selected.observed)}</p></div><div class="reactor-fact"><small>SEO OPERATING IMPLICATION</small><p>${esc(selected.seo)}</p></div><footer>Research basis: ${esc(selected.basis)}</footer></aside></div>
    <section class="panel decision-simulator"><div class="flex-between"><div><p class="eyebrow">DECISION-PATH SIMULATION</p><h2>Adjust the conditions to see how the expected search path changes.</h2></div><div class="scenario-tabs">${COGNITIVE_SCENARIOS.map((item)=>`<button type="button" data-action="cognitive-scenario" data-scenario="${item.id}" class="chip-button${item.id===scenario.id?' is-active':''}">${esc(item.label)}</button>`).join('')}</div></div><div class="divider"></div>
      <div class="simulator-grid"><article class="scenario-brief"><span class="tag ${scenario.client}">${esc(scenario.client==='kp'?'K&P ATTORNEY':'BREEZY GOLF')}</span><h3>${esc(scenario.title)}</h3><p>${esc(scenario.description)}</p><div class="threshold-box"><small>LIKELY STOPPING THRESHOLD</small><strong>${esc(scenario.threshold)}</strong></div><div class="scenario-path">${cognitivePathMarkup(scenario)}</div></article>
      <form id="cognition-profile-form" class="simulator-controls"><label><span>Perceived risk <output id="risk-output">${state.cognitiveDraft.risk}</output>/5</span><input name="risk" data-cognitive-slider="risk" type="range" min="1" max="5" value="${state.cognitiveDraft.risk}"></label><label><span>Urgency <output id="urgency-output">${state.cognitiveDraft.urgency}</output>/5</span><input name="urgency" data-cognitive-slider="urgency" type="range" min="1" max="5" value="${state.cognitiveDraft.urgency}"></label><label><span>Category familiarity <output id="familiarity-output">${state.cognitiveDraft.familiarity}</output>/5</span><input name="familiarity" data-cognitive-slider="familiarity" type="range" min="1" max="5" value="${state.cognitiveDraft.familiarity}"></label><label><span>Most valuable next surface</span><select name="next" data-cognitive-next>${optionMarkup(PLATFORMS)}</select></label><button class="primary-button" type="submit">Submit decision profile</button></form>
      <aside class="room-model"><p class="eyebrow">ROOM DECISION PROFILE</p><div class="room-meter"><label>Risk <b>${avgRisk?avgRisk.toFixed(1):'—'}</b></label><span><i style="width:${avgRisk/5*100}%"></i></span></div><div class="room-meter"><label>Urgency <b>${avgUrgency?avgUrgency.toFixed(1):'—'}</b></label><span><i style="width:${avgUrgency/5*100}%"></i></span></div><div class="room-meter"><label>Familiarity <b>${avgFamiliarity?avgFamiliarity.toFixed(1):'—'}</b></label><span><i style="width:${avgFamiliarity/5*100}%"></i></span></div><p>${profiles.length} participant profile${profiles.length===1?'':'s'} saved for this scenario.</p><div class="reference-interpretation"><strong>Strategic interpretation</strong><p>${esc(scenario.interpretation)}</p></div></aside></div></section>
    ${knowledgeCheckMarkup('k-gap')}
  </section>`;
}

function renderDefinition() {
  return `<section class="scene">${sceneHeader('ACT I · THE OPERATING DEFINITION','Search Everywhere is <em style="color:var(--lamark);font-style:normal">decision visibility.</em>','Map every surface the audience uses to resolve uncertainty. Advise the client how to earn visibility, credibility, and action across those moments.')}
    <div class="comparison-grid">
      <article class="model-card old"><header><p class="eyebrow">THE OLD MENTAL MODEL</p><h2>Keyword → Google → Website</h2></header><div class="model-graphic"><div class="linear-path"><i>QUERY</i><b>→</b><i>RANK</i><b>→</b><i>CLICK</i></div></div><footer><p class="muted small">This model captures a single search event. It misses the research that happens before, between, and after Google.</p></footer></article>
      <article class="model-card new"><header><p class="eyebrow">THE SEARCH EVERYWHERE MODEL</p><h2>Need → surfaces → signals → decision</h2></header><div class="model-graphic"><div class="network-mini"><span class="node center">NEED</span><span class="node">ASK</span><span class="node">SCAN</span><span class="node">PROVE</span><span class="node">ACT</span></div></div><footer><p class="muted small">The audience moves between search, social, video, community, local, AI, reviews, and owned properties.</p></footer></article>
    </div>
    <div class="panel" style="margin-top:18px"><p class="eyebrow">LAMARK'S CONSULTING BOUNDARY</p><div class="scope-boundary">
      <div class="scope-card"><strong>1. Diagnose</strong><p>Map audience moments, queries, surfaces, competitors, trust signals, and journey leaks.</p></div>
      <div class="scope-card"><strong>2. Advise</strong><p>Recommend owned content, local governance, reputation support, offsite proof, platform assets, and measurement.</p></div>
      <div class="scope-card"><strong>3. Coordinate</strong><p>Define the handoff to content, PR, organic social, creative, UX, analytics, development, and the client.</p></div>
    </div></div>
    <div class="panel-grid" style="margin-top:18px">
      <div class="card span-4"><p class="eyebrow">SCOPE BOUNDARY</p><h3>Daily organic social execution</h3><p class="muted small">Search strategy defines the audience need, evidence requirement, and handoff for social execution.</p></div>
      <div class="card span-4"><p class="eyebrow">STRATEGIC MANDATE</p><h3>Understand the audience’s decision architecture</h3><p class="muted small">Identify the question, the surface, the required evidence, and the business action.</p></div>
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
  return `<section class="scene">${sceneHeader('ACT II · UNDERSTAND THE SYSTEM','Every surface has a different <em style="color:var(--lamark);font-style:normal">job.</em>','Select a search surface to review its audience role, interpretable signals, and performance measures.', clientSwitchMarkup())}
    <div class="panel-grid">
      <section class="span-8 ecosystem-shell" aria-label="Interactive search ecosystem">
        <svg class="ecosystem-svg" viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true"><g stroke="#ccd6e5" stroke-width="1">${nodes.map((node) => `<line x1="500" y1="325" x2="${node.left * 10}" y2="${node.top * 6.5}" />`).join('')}</g><circle cx="500" cy="325" r="190" fill="none" stroke="#dce2ea" stroke-dasharray="4 7"/></svg>
        <div class="ecosystem-core"><div><span>AUDIENCE NEED</span><strong>${esc(client.coreQuestions[0])}</strong></div></div>
        ${nodes.map((platform) => `<button class="ecosystem-node${selected.id === platform.id ? ' is-active' : ''}" type="button" data-action="ecosystem-platform" data-platform="${platform.id}" style="left:${platform.left}%;top:${platform.top}%;--node-color:${platform.color}"><i>${esc(platform.icon)}</i><strong>${esc(platform.short)}</strong></button>`).join('')}
      </section>
      <aside class="panel span-4 ecosystem-detail"><span class="platform-icon" style="background:${selected.color}">${esc(selected.icon)}</span><p class="eyebrow" style="margin-top:18px">${esc(selected.role)}</p><h2>${esc(selected.name)}</h2><p class="lede" style="font-size:15px">${esc(selected.intent)}</p><div class="divider"></div><h4>Signals this surface reads</h4><div class="signal-list">${selected.signals.map((signal) => `<span>${esc(signal)}</span>`).join('')}</div><h4 style="margin-top:18px">Practical KPIs</h4><div class="kpi-list">${selected.kpis.map((kpi) => `<span>${esc(kpi)}</span>`).join('')}</div><div class="callout" style="margin-top:20px"><strong>Consulting question</strong><p>What must be true on this surface for ${esc(client.name)} to reduce uncertainty and move the audience forward?</p></div></aside>
      <section class="panel span-12"><div class="flex-between"><div><p class="eyebrow">AN EXAMPLE PATH</p><h3>Each surface plays a specific role for ${esc(client.name)}</h3></div><button class="secondary-button" type="button" data-action="animate-path">Replay path</button></div><div class="divider"></div><div id="sample-path" class="path-ribbon">${sample.map((step) => { const p = byPlatform(step.surface); return `<span data-path-step><i class="platform-icon" style="width:22px;height:22px;border-radius:6px;background:${p?.color || '#38465b'}">${esc(p?.icon || '')}</i>${esc(byJourneyStage(step.stage)?.label || step.stage)}</span>`; }).join('')}</div></section>
    </div></section>`;
}

function journeyItemsFor(clientKey) {
  return liveItems('journey').filter((item) => item.client === clientKey);
}
function journeyPredictions() { return liveItems('journey_prediction').filter((item)=>payloadOf(item).scenarioId===state.journeyScenario); }
function journeyTransitionItems() { return liveItems('journey').filter((item)=>payloadOf(item).kind==='transition' && item.client===currentCognitiveScenarioForJourney().client); }
function currentCognitiveScenarioForJourney() { return COGNITIVE_SCENARIOS.find((item)=>item.id===state.journeyScenario) || COGNITIVE_SCENARIOS[0]; }
function journeyCurveSvg(scenario) {
  const risk=scenario.defaultRisk; const uncertainty=[78,86,66,54,38,18,28].map((v,i)=>Math.min(94,v+(risk-3)*(i<5?4:2)));
  const confidence=[22,18,32,48,67,86,78].map((v,i)=>Math.max(8,v-(risk-3)*(i<5?3:1)));
  const points=(arr)=>arr.map((v,i)=>`${40+i*130},${112-v}`).join(' ');
  return `<svg viewBox="0 0 860 132" role="img" aria-label="Illustrative uncertainty and confidence across the journey"><defs><linearGradient id="uncertaintyLine" x1="0" x2="1"><stop stop-color="#14b8ff"/><stop offset="1" stop-color="#2964ff"/></linearGradient><linearGradient id="confidenceLine" x1="0" x2="1"><stop stop-color="#765dff"/><stop offset="1" stop-color="#b489ff"/></linearGradient></defs><g class="curve-grid">${[20,50,80,110].map(y=>`<line x1="30" y1="${y}" x2="830" y2="${y}"/>`).join('')}</g><polyline class="uncertainty-line" points="${points(uncertainty)}"/><polyline class="confidence-line" points="${points(confidence)}"/>${JOURNEY_STAGES.map((stage,index)=>`<circle class="curve-node" cx="${40+index*130}" cy="${112-uncertainty[index]}" r="5"/><text x="${40+index*130}" y="128" text-anchor="middle">${stage.label}</text>`).join('')}</svg>`;
}
function renderJourney() {
  const scenario=currentCognitiveScenarioForJourney(); const detail=byJourneyStage(state.journeyStageDetail)||JOURNEY_STAGES[0];
  const predictions=journeyPredictions(); const counts=new Map(); predictions.forEach((item)=>counts.set(payloadOf(item).surface,(counts.get(payloadOf(item).surface)||0)+1));
  const myPrediction=predictions.find((item)=>item.owner_id===currentUserId()); const max=Math.max(1,...counts.values()); const transitions=journeyTransitionItems();
  const scenarioTabs=`<div class="scenario-tabs journey-scenario-tabs">${COGNITIVE_SCENARIOS.map((item)=>`<button type="button" data-action="journey-scenario" data-scenario="${item.id}" class="chip-button${item.id===scenario.id?' is-active':''}">${esc(item.label)}</button>`).join('')}</div>`;
  return `<section class="scene journey-simulator">${sceneHeader('ACT II · DECISION JOURNEY SIMULATOR','The journey changes as <em>evidence changes.</em>','Select a stage to review the user’s task, required evidence, likely surfaces, and remaining uncertainty.')}${scenarioTabs}
    <section class="journey-command"><div class="journey-command-head"><div><span class="tag ${scenario.client}">${esc(scenario.client==='kp'?'K&P ATTORNEY':'BREEZY GOLF')}</span><h2>${esc(scenario.title)}</h2><p>${esc(scenario.description)}</p></div><div class="curve-legend"><span><i class="uncertainty-key"></i>Uncertainty</span><span><i class="confidence-key"></i>Confidence</span></div></div>${journeyCurveSvg(scenario)}
      <div class="journey-function-track">${JOURNEY_STAGES.map((item,index)=>`<button type="button" data-action="journey-stage-detail" data-stage="${item.id}" class="journey-function${item.id===detail.id?' is-active':''}"><span>${String(index+1).padStart(2,'0')}</span><strong>${esc(item.label)}</strong><small>${esc(item.function)}</small></button>`).join('')}</div></section>
    <div class="panel-grid" style="margin-top:16px"><section class="panel span-7 journey-detail-panel"><p class="eyebrow">${esc(detail.label)} · ${esc(detail.function)}</p><h2>${esc(detail.question)}</h2><div class="journey-detail-grid"><div><small>MENTAL TASK</small><p>${esc(detail.mentalTask)}</p></div><div><small>EVIDENCE REQUIRED</small><p>${esc(detail.evidence)}</p></div><div><small>LIKELY SURFACE ROLE</small><p>${esc(detail.surfaceRole)}</p></div><div><small>BREEZY EXAMPLE</small><p>${esc(detail.exampleBreezy)}</p></div><div><small>K&P EXAMPLE</small><p>${esc(detail.exampleKp)}</p></div><div><small>STRATEGIC FAILURE MODE</small><p>${detail.id==='trigger'?'Optimizing the query while overlooking the event that created the need.':detail.id==='validate'?'Providing more brand claims when the user needs independent corroboration.':'Optimizing a channel while leaving the decision task unresolved.'}</p></div></div></section>
      <aside class="panel span-5 prediction-panel"><p class="eyebrow">NEXT-SURFACE PREDICTION</p><h3>Which surface is most likely to provide the next useful evidence?</h3><p>${esc(scenario.interpretation)}</p><div class="prediction-grid">${scenario.path.slice(1).map((id)=>{const platform=byPlatform(id);const count=counts.get(id)||0;return `<button type="button" data-action="journey-predict" data-surface="${id}" class="prediction-option${myPrediction&&payloadOf(myPrediction).surface===id?' is-selected':''}"><i style="background:${platform?.color}">${esc(platform?.icon)}</i><strong>${esc(platform?.short||id)}</strong><span><b style="width:${count/max*100}%"></b></span><output>${count}</output></button>`}).join('')}</div><div class="system-note"><strong>Prediction discipline</strong><br>Base the prediction on the information gap and the expected value of the next evidence source.</div></aside></div>
    <section class="panel transition-lab"><div class="flex-between"><div><p class="eyebrow">TRANSITION LAB</p><h3>Document one evidence-driven transition</h3></div><span class="tag direction">Shared room evidence</span></div><form id="journey-insight-form" class="transition-form"><select name="from">${optionMarkup(JOURNEY_STAGES,'id','label')}</select><span>→</span><select name="to">${optionMarkup(JOURNEY_STAGES,'id','label')}</select><input name="insight" maxlength="280" required placeholder="What information, contradiction, or proof requirement changes the next move?"><button class="primary-button" type="submit">Add insight</button></form><div class="transition-wall">${transitions.map((item)=>{const p=payloadOf(item);return `<article><span>${esc(byJourneyStage(p.from)?.label||p.from)} → ${esc(byJourneyStage(p.to)?.label||p.to)}</span><p>${esc(p.insight)}</p><small>${esc(p.ownerName)}</small></article>`}).join('')||'<div class="empty-state"><div><strong>Awaiting the first transition insight</strong><span>Identify the information, contradiction, or proof requirement that changes the next move.</span></div></div>'}</div></section>
    ${knowledgeCheckMarkup('k-reformulate')}
  </section>`;
}

function journeyCardMarkup(card, journeyStage) {
  const platform = byPlatform(card.surface) || PLATFORMS[0];
  const removable = card.item && (card.item.owner_id === currentUserId() || isFacilitator());
  return `<article class="journey-card" style="--platform-color:${platform.color}"><span class="tag">${esc(platform.short)}</span><strong>${esc(card.query)}</strong><p>${esc(card.reason)}</p><footer><small class="muted">${card.sample ? 'Worked example' : esc(card.item?.payload?.ownerName || 'Team contribution')}</small>${removable ? `<button class="text-button" type="button" data-action="remove-item" data-id="${card.item.id}">Remove</button>` : ''}</footer></article>`;
}

function renderPortals() {
  return `<section class="scene">${sceneHeader('ACT III · APPLY THE FRAMEWORK','Two clients. Two entirely different <em style="color:var(--lamark);font-style:normal">search systems.</em>','The operating model stays consistent. Audience risk, platform roles, proof requirements, and business outcomes change by client.')}
    <div class="portal-grid">${Object.values(CLIENTS).map((client) => `<article class="client-portal ${client.key}"><header><p class="portal-label">${esc(client.label)}</p><h2>${esc(client.name)}</h2><p>${esc(client.summary)}</p></header><div><h4>Core audience questions</h4><div class="question-list" style="margin-top:10px">${client.coreQuestions.map((question) => `<div>${esc(question)}</div>`).join('')}</div></div><footer><h4>Primary search surfaces</h4><div class="platform-constellation" style="margin-top:10px">${client.primaryPlatforms.map((id) => `<span>${esc(byPlatform(id)?.short || id)}</span>`).join('')}</div><button class="primary-button" style="margin-top:18px;background:${client.accent}" type="button" data-action="enter-client" data-client="${client.key}">Enter ${esc(client.name)} audit</button></footer></article>`).join('')}</div>
    <section class="panel" style="margin-top:18px"><p class="eyebrow">WHY THIS CONTRAST MATTERS</p><div class="audit-shell"><div class="audit-scroll" style="max-height:none"><table class="audit-table" style="min-width:900px"><thead><tr><th>Dimension</th><th>Breezy Golf</th><th>KP Attorney</th><th>Strategic implication</th></tr></thead><tbody>
      <tr><td><strong>Decision risk</strong></td><td>Style, fit, value, delivery, social identity</td><td>Urgency, credibility, legal consequence, cost, locality</td><td>Each category requires its own proof burden and conversion path.</td></tr>
      <tr><td><strong>Discovery engine</strong></td><td>Creators, social search, Shopping, visual content</td><td>Google, AI orientation, local search, referral validation</td><td>Start with the audience’s natural first surface and decision context.</td></tr>
      <tr><td><strong>Validation</strong></td><td>Reviews, customer photos, YouTube, Reddit, creator fit</td><td>Reviews, attorney credentials, firm facts, local legitimacy, third-party mentions</td><td>Independent proof must answer the category’s specific fear.</td></tr>
      <tr><td><strong>Primary action</strong></td><td>Product-page visit and purchase</td><td>Call, consultation form, or local office contact</td><td>Success metrics must follow the business action.</td></tr>
      <tr><td><strong>Governance</strong></td><td>Product, creative, merchandising, social, content</td><td>SEO, legal, local, reputation, intake, content</td><td>Search Everywhere defines the cross-functional handoffs required for execution.</td></tr>
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
  return `<section class="scene">${sceneHeader('ACT III · THE LIVE AUDIT','Turn a fragmented ecosystem into a <em style="color:var(--lamark);font-style:normal">managed evidence system.</em>','Start with 55 worked Breezy and K&P observations. Filter, inspect, vote, and add findings as a team.', `<button class="secondary-button" type="button" data-action="audit-export">Export filtered CSV</button><button class="primary-button" type="button" data-action="audit-add">Add live finding</button>`)}
    <div class="metrics-grid"><div class="metric-card"><small>Total findings</small><strong>${all.length}</strong><p>${live} added live</p></div><div class="metric-card"><small>High-priority</small><strong>${high}</strong><p>Critical and high</p></div><div class="metric-card"><small>Search surfaces</small><strong>${platforms}</strong><p>Across the ecosystem</p></div><div class="metric-card"><small>Average score</small><strong>${avg}</strong><p>Out of 100</p></div><div class="metric-card"><small>Filtered view</small><strong>${rows.length}</strong><p>After filters</p></div></div>
    <div class="filter-bar" style="margin-top:12px"><select data-audit-filter="client"><option value="all">All clients</option><option value="breezy"${state.auditFilters.client === 'breezy' ? ' selected':''}>Breezy Golf</option><option value="kp"${state.auditFilters.client === 'kp' ? ' selected':''}>KP Attorney</option></select><select data-audit-filter="platform">${optionMarkup(PLATFORMS,'id','name',true,'All platforms').replace(`value="${state.auditFilters.platform}"`,`value="${state.auditFilters.platform}" selected`)}</select><select data-audit-filter="stage">${optionMarkup(JOURNEY_STAGES,'id','label',true,'All journey stages').replace(`value="${state.auditFilters.stage}"`,`value="${state.auditFilters.stage}" selected`)}</select><select data-audit-filter="priority"><option value="all">All priorities</option>${['critical','high','medium','low'].map((p) => `<option value="${p}"${state.auditFilters.priority === p ? ' selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join('')}</select><select data-audit-sort><option value="score-desc"${state.auditSort === 'score-desc'?' selected':''}>Highest score first</option><option value="score-asc"${state.auditSort === 'score-asc'?' selected':''}>Lowest score first</option><option value="priority"${state.auditSort === 'priority'?' selected':''}>Priority</option><option value="client"${state.auditSort === 'client'?' selected':''}>Client</option><option value="platform"${state.auditSort === 'platform'?' selected':''}>Platform</option></select><input data-audit-filter="search" value="${attr(state.auditFilters.search)}" placeholder="Search findings…"></div>
    <section class="audit-shell" style="margin-top:12px"><div class="audit-toolbar"><span class="status">Showing <strong>${rows.length}</strong> of ${all.length}. Click any row for the full evidence chain.</span><div class="inline-meta"><span class="tag confirmed">Confirmed</span><span class="tag directional">Directional</span><span class="tag hypothesis">Hypothesis</span></div></div><div class="audit-scroll"><table class="audit-table"><thead><tr><th>Client</th><th>Surface</th><th>Journey</th><th>Query / moment</th><th>Gap</th><th>Recommendation</th><th>Owner</th><th>Score</th><th>Priority</th><th>Vote</th></tr></thead><tbody>
      ${rows.map((row) => { const target = `audit:${row.id}`; const votes = totals.get(target) || 0; return `<tr data-action="audit-detail" data-id="${attr(row.id)}"><td><span class="tag ${row.clientKey}">${esc(row.clientKey === 'kp' ? 'KP' : 'Breezy')}</span></td><td><strong>${esc(row.platform)}</strong></td><td>${esc(byJourneyStage(row.stageId)?.label || row.stage)}</td><td class="query-cell">${esc(row.query)}</td><td>${esc(row.gap)}</td><td class="recommend-cell">${esc(row.recommendation)}</td><td>${esc(row.owner)}</td><td class="score-cell"><strong>${row.score}</strong></td><td><span class="tag ${row.priority}">${esc(row.priority)}</span></td><td><button class="vote-button${myVote(target) ? ' is-active':''}" type="button" data-action="audit-vote" data-target="${target}" aria-label="Vote for finding">▲ ${votes}</button></td></tr>`; }).join('') || `<tr><td colspan="10"><div class="empty-state"><div><strong>No findings match these filters</strong><span>Clear a filter or add a live finding.</span></div></div></td></tr>`}
    </tbody></table></div></section>
    <div class="panel-grid" style="margin-top:16px"><div class="callout span-4"><strong>Evidence discipline</strong><p>Separate confirmed observations, directional platform signals, and hypotheses requiring client data.</p></div><div class="callout span-4"><strong>Scope discipline</strong><p>Every action names an execution owner. SEO diagnoses the search role, defines the evidence need, and coordinates the handoff.</p></div><div class="callout span-4"><strong>Business discipline</strong><p>Rank opportunities by audience relevance, intent, visibility gap, feasibility, trust risk, and measurable outcome.</p></div></div>
  </section>`;
}

function boardItems() {
  return liveItems('board').filter((item) => state.selectedClient === 'both' || item.client === state.selectedClient || item.client === 'both');
}
function renderWhiteboard() {
  const cards = boardItems();
  const templates=[['evidence','Evidence'],['leak','Journey leak'],['conflict','Signal conflict'],['opportunity','Opportunity'],['question','Question to validate']];
  return `<section class="scene">${sceneHeader('ACT III · SHARED EVIDENCE MAP','Turn evidence into a <em>visible decision system.</em>','Map evidence across the journey. Contributions, card movement, priority votes, and live pointers update across the room.', `<div class="client-switch" role="group"><button type="button" data-action="board-client" data-client="breezy" class="${state.selectedClient === 'breezy'?'is-active':''}">Breezy</button><button type="button" data-action="board-client" data-client="kp" class="${state.selectedClient === 'kp'?'is-active':''}">KP</button><button type="button" data-action="board-client" data-client="both" class="${state.selectedClient === 'both'?'is-active':''}">Both</button></div>`)}
    <div class="whiteboard-templates">${templates.map(([id,label])=>`<button type="button" class="chip-button" data-action="board-template" data-template="${id}">+ ${label}</button>`).join('')}</div>
    <div class="whiteboard-shell" id="whiteboard"><div class="whiteboard-lanes">${JOURNEY_STAGES.map((item) => `<div class="whiteboard-lane"><span>${esc(item.label)}</span><small>${esc(item.function)}</small></div>`).join('')}</div><div class="board-toolbar"><button class="primary-button" type="button" data-action="board-add">+ Add evidence</button><button class="secondary-button" type="button" data-action="board-arrange">Auto-arrange</button></div>
      ${cards.map(boardCardMarkup).join('')}
      ${!cards.length ? `<div class="empty-state" style="position:absolute;inset:80px 20px 20px"><div><strong>Awaiting the first evidence card</strong><span>Add evidence, a journey leak, a signal conflict, an opportunity, or a question to validate.</span><div style="margin-top:14px"><button class="primary-button" type="button" data-action="board-add">Add the first card</button></div></div></div>` : ''}
    </div><div class="callout" style="margin-top:14px"><strong>Evidence standard</strong><p>Label each card by evidence strength. Match strategic confidence to the quality of the evidence.</p></div></section>`;
}

function boardCardMarkup(item) {
  const p = payloadOf(item); const platform = byPlatform(item.platform || p.platform) || PLATFORMS[0];
  const x = clamp(item.x ?? p.x ?? 5, 0, 90), y = clamp(item.y ?? p.y ?? 12, 0, 84);
  return `<article class="board-card" data-board-id="${item.id}" style="left:${x}%;top:${y}%;--card-color:${platform.color}"><span class="tag ${item.client}">${esc(item.client === 'kp' ? 'KP' : item.client === 'breezy' ? 'Breezy' : 'Both')}</span><strong>${esc(p.headline)}</strong><p>${esc(p.detail)}</p><footer><small class="muted">${esc(platform.short)} · ${esc(p.evidence || 'directional')}</small><button class="text-button" type="button" data-action="board-edit" data-id="${item.id}">Edit</button></footer></article>`;
}

function currentWheelSpin() { return state.room?.settings?.wheelSpin || null; }
function wheelResponses() { const spin=currentWheelSpin(); return spin ? liveItems('wheel_response').filter((item)=>payloadOf(item).spinId===spin.id && payloadOf(item).kind!=='spin') : []; }
function wheelRatingSummary(responseId) {
  const dims=['accuracy','clarity','strategy']; const result={};
  dims.forEach((dim)=>{const prefix=`wheel:${responseId}:${dim}`;const vals=state.votes.filter((vote)=>vote.target_key===prefix).map((vote)=>Number(vote.value));result[dim]={avg:average(vals),count:vals.length};});
  return result;
}
function wheelLeaderboard() {
  const responseItems=liveItems('wheel_response').filter((item)=>payloadOf(item).kind!=='spin'); const map=new Map();
  responseItems.forEach((item)=>{const p=payloadOf(item),scores=wheelRatingSummary(item.id);const vals=Object.values(scores).filter((x)=>x.count).map((x)=>x.avg);if(!vals.length)return;const row=map.get(p.winnerId)||{id:p.winnerId,name:p.winnerName,color:p.winnerColor,total:0,count:0};row.total+=average(vals);row.count+=1;map.set(p.winnerId,row);});
  return [...map.values()].map((row)=>({...row,avg:row.total/row.count})).sort((a,b)=>b.avg-a.avg);
}
function renderWheel() {
  const people=peopleInRoom(); const spin=currentWheelSpin(); const spinning=spin?.status==='spinning'; const challenge=spinning?null:spin?.challenge; const responses=spinning?[]:wheelResponses(); const latest=responses.at(-1); const canAnswer=!spinning && spin && (spin.winnerId===currentUserId() || isFacilitator()); const leaders=wheelLeaderboard();
  const categories=[...new Map(WHEEL_CHALLENGES.map((item)=>[item.category,item.label])).entries()];
  return `<section class="scene wheel-scene">${sceneHeader('LIVE ARENA · OPERATOR SELECTOR','Strategic reasoning under <em>shared pressure.</em>','The facilitator selects a challenge category. The system selects a participant, and the room scores the response for accuracy, clarity, and strategic defensibility.', isFacilitator()?`<button class="primary-button" type="button" data-action="wheel-spin" ${spinning?'disabled':''}>${spinning?'Selection in progress…':'Select operator'}</button>`:'')}
    <div class="wheel-layout"><section class="operator-wheel${spinning?' is-spinning':''}"><div class="wheel-radar"></div><div class="wheel-core"><small>${spinning?'SELECTION SEQUENCE':spin?'SELECTED OPERATOR':'ROOM READY'}</small><strong>${esc(spinning?'Scanning the room…':spin?.winnerName||`${people.length} participants`)}</strong><span>${spinning?'Matching participant and challenge category':spin?esc(challenge?.label||'Challenge'):'Choose a category and initiate selection'}</span></div>${people.map((person,index)=>`<div class="operator-node${!spinning&&spin?.winnerId===person.userId?' is-winner':''}" style="--i:${index};--count:${Math.max(people.length,1)};--operator:${attr(person.color||'#2864dc')}"><i>${esc(initials(person.name))}</i><span>${esc(person.name)}</span></div>`).join('')}</section>
      <aside class="panel wheel-console"><p class="eyebrow">CHALLENGE CATEGORY</p><div class="category-grid">${categories.map(([id,label])=>`<button type="button" class="chip-button${state.wheelCategory===id?' is-active':''}" data-action="wheel-category" data-category="${id}">${esc(label)}</button>`).join('')}</div><div class="wheel-challenge${spinning?' is-processing':''}">${spinning?`<span class="tag direction">Selection sequence active</span><h2>Selecting from the live participant roster.</h2><p>The selected participant and challenge will appear across the room.</p><div class="selection-sequence"><i></i><i></i><i></i><i></i><i></i></div>`:spin?`<span class="tag present">${esc(challenge?.label||'Challenge')}</span><h2>${esc(challenge?.prompt||'')}</h2><p>${esc(challenge?.guide||'')}</p>`:`<span class="tag direction">Awaiting selection</span><h2>Ready for selection.</h2><p>Select a challenge category, then use the Operator Selector.</p>`}</div>${!spinning&&spin?`<form id="wheel-response-form" class="stack"><label><span>${canAnswer?'Operator response':'The selected operator is responding'}</span><textarea name="answer" rows="5" maxlength="700" required ${canAnswer?'':'disabled'} placeholder="Respond in clear, client-ready language."></textarea></label><button class="primary-button" type="submit" ${canAnswer?'':'disabled'}>Share response</button></form>`:''}</aside></div>
    <div class="panel-grid" style="margin-top:16px"><section class="panel span-7"><div class="flex-between"><div><p class="eyebrow">ROOM SCORING</p><h3>${latest?'Score the latest response':'Awaiting the selected response'}</h3></div>${latest?`<span class="tag">${esc(payloadOf(latest).winnerName)}</span>`:''}</div><div class="divider"></div>${latest?`<blockquote class="response-quote">“${esc(payloadOf(latest).answer)}”</blockquote><div class="wheel-score-grid">${['accuracy','clarity','strategy'].map((dim)=>{const stats=wheelRatingSummary(latest.id);return `<div><strong>${dim==='strategy'?'Strategic defensibility':dim[0].toUpperCase()+dim.slice(1)}</strong><div class="score-buttons">${[1,2,3,4,5].map((value)=>`<button type="button" data-action="wheel-rate" data-response="${latest.id}" data-dimension="${dim}" data-value="${value}" class="${myVote(`wheel:${latest.id}:${dim}`)?.value==value?'is-selected':''}">${value}</button>`).join('')}</div><small>${stats[dim].count?`${stats[dim].avg.toFixed(1)} average · ${stats[dim].count} ratings`:'Awaiting ratings'}</small></div>`}).join('')}</div>`:'<div class="empty-state"><div><strong>Select the first participant</strong><span>The response will appear here for room scoring.</span></div></div>'}</section>
      <aside class="panel span-5"><p class="eyebrow">OPERATOR LEADERBOARD</p><h3>Average room score</h3><div class="leaderboard" style="margin-top:16px">${leaders.map((leader,index)=>`<div class="leader-row"><span class="rank">${String(index+1).padStart(2,'0')}</span><span class="avatar" style="background:${attr(leader.color||'#2864dc')}">${esc(initials(leader.name))}</span><strong>${esc(leader.name)}</strong><output>${leader.avg.toFixed(1)}/5</output></div>`).join('')||'<div class="empty-state"><div><strong>Awaiting scored responses</strong><span>The leaderboard updates as the room scores each response.</span></div></div>'}</div></aside></div>
  </section>`;
}

function auctionItems(client=state.auctionClient) { return liveItems('auction').filter((item)=>item.client===client); }
function auctionTotal() { return SIGNALS.reduce((sum,signal)=>sum+Number(state.auctionDraft[signal.id]||0),0); }
function myAuction(client=state.auctionClient) { return getMyItem('auction',(item)=>item.client===client); }
function loadAuctionDraft(client=state.auctionClient, force=false) {
  if(!force && state.auctionDirty && state.auctionLoadedClient===client)return;
  const mine=myAuction(client); state.auctionDraft=Object.fromEntries(SIGNALS.map((signal)=>[signal.id,Number(payloadOf(mine).allocations?.[signal.id]||0)]));state.auctionLoadedClient=client;state.auctionDirty=false;
}
function renderAuction() {
  loadAuctionDraft(state.auctionClient);
  const submissions=auctionItems(); const client=CLIENTS[state.auctionClient]; const aggregate=Object.fromEntries(SIGNALS.map((signal)=>[signal.id,0]));
  submissions.forEach((item)=>SIGNALS.forEach((signal)=>aggregate[signal.id]+=Number(payloadOf(item).allocations?.[signal.id]||0)));
  const denom=Math.max(1,submissions.length); const max=Math.max(1,...Object.values(aggregate).map((value)=>value/denom)); const total=auctionTotal(); const mine=myAuction();
  return `<section class="scene auction-scene">${sceneHeader('ACT IV · RESOURCE TRADEOFFS','You have 100 visibility credits. <em>Spend them deliberately.</em>','Allocate a fixed budget and save it room-wide. Compare how priorities change between visual commerce and high-stakes legal decisions.', `<div class="client-switch"><button type="button" data-action="auction-client" data-client="breezy" class="${state.auctionClient==='breezy'?'is-active':''}">Breezy Golf</button><button type="button" data-action="auction-client" data-client="kp" class="${state.auctionClient==='kp'?'is-active':''}">K&P Attorney</button></div>`)}
    <div class="credit-meter${total===100?'':' is-invalid'}"><div><span>REMAINING CREDITS · ${esc(client.name)}</span><strong>${100-total}</strong></div><div class="button-row"><button class="secondary-button" type="button" data-action="auction-reset">Reset draft</button><button class="primary-button" type="button" data-action="auction-submit" ${total===100?'':'disabled'}>${mine?'Update room allocation':'Lock room allocation'}</button></div></div>
    <div class="auction-grid" style="margin-top:14px">${SIGNALS.map((signal)=>`<article class="auction-signal"><header><strong>${esc(signal.name)}</strong><output id="auction-output-${signal.id}">${Number(state.auctionDraft[signal.id]||0)}</output></header><p>${esc(signal.description)}</p><input type="range" min="0" max="40" step="1" value="${Number(state.auctionDraft[signal.id]||0)}" data-auction-signal="${signal.id}" aria-label="Allocate credits to ${attr(signal.name)}"></article>`).join('')}</div>
    <div class="panel-grid" style="margin-top:16px"><section class="panel span-7"><div class="flex-between"><div><p class="eyebrow">ROOM ALLOCATION MODEL</p><h2>${submissions.length} saved allocation${submissions.length===1?'':'s'}</h2></div><span class="tag present">${esc(client.name)}</span></div><div class="divider"></div><div class="aggregate-chart">${SIGNALS.map((signal)=>{const avg=aggregate[signal.id]/denom;return `<div class="aggregate-row"><label>${esc(signal.name)}</label><div class="result-track"><div class="result-fill" style="width:${avg/max*100}%;background:linear-gradient(90deg,#12b7ff,#315eff)"></div></div><output>${avg.toFixed(1)}</output></div>`}).join('')}</div></section>
      <aside class="panel span-5"><p class="eyebrow">PARTICIPANT ALLOCATIONS</p><div class="allocation-list">${submissions.map((item)=>{const p=payloadOf(item);const top=SIGNALS.map((signal)=>({name:signal.name,value:Number(p.allocations?.[signal.id]||0)})).sort((a,b)=>b.value-a.value).slice(0,3);return `<article><header><span class="avatar" style="background:${attr(p.ownerColor||'#2864dc')}">${esc(initials(p.ownerName||'P'))}</span><div><strong>${esc(p.ownerName||'Participant')}</strong><small>${top.map((x)=>`${x.name} ${x.value}`).join(' · ')}</small></div></header><output>${Object.values(p.allocations||{}).reduce((a,b)=>a+Number(b),0)}</output></article>`}).join('')||'<div class="empty-state"><div><strong>Awaiting the first allocation</strong><span>Each participant submits a 100-credit model for live comparison.</span></div></div>'}</div><div class="callout"><strong>Discussion prompt</strong><p>Which allocations remain stable across both clients? Which should change based on risk, surface role, and evidence requirements?</p></div></aside></div>
  </section>`;
}

function renderDualVision() {
  const connections=liveItems('connection'); const humanOptions=HUMAN_SIGNALS.map((item)=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');
  const observable=['Review language','Branded query refinement','Repeat search','Video watch behavior','Map interaction','Third-party mention','Product or service comparison','Form or call action'];
  const outcomes=['Qualified visibility','Branded demand','Trust','Conversion','Lead quality','Revenue','Retention','Reputation'];
  return `<section class="scene decoder-scene">${sceneHeader('ACT IV · HUMAN + MACHINE SIGNAL DECODER','Translate perception into <em>observable evidence.</em>','Connect human perception to the observable signals platforms can process and the business outcomes they influence.')}
    <div class="signal-decoder"><div class="decoder-layer human-layer"><span>01 · HUMAN PERCEPTION</span><h2>What the person experiences</h2><p>Relevance, clarity, credibility, consensus, convenience, risk, and confidence.</p></div><div class="decoder-arrow">→</div><div class="decoder-layer behavior-layer"><span>02 · OBSERVABLE BEHAVIOR</span><h2>What the person does</h2><p>Clicks, watches, reformulates, compares, calls, returns, reviews, or abandons.</p></div><div class="decoder-arrow">→</div><div class="decoder-layer machine-layer"><span>03 · MACHINE-READABLE EVIDENCE</span><h2>What systems can interpret</h2><p>Entities, links, citations, reviews, structured facts, content, local data, engagement, and freshness.</p></div><div class="decoder-arrow">→</div><div class="decoder-layer outcome-layer"><span>04 · BUSINESS OUTCOME</span><h2>What the client receives</h2><p>Visibility, demand, trust, action, revenue, lead quality, retention, and reputation.</p></div></div>
    <section class="panel chain-builder"><div class="flex-between"><div><p class="eyebrow">BUILD A DEFENSIBLE SIGNAL CHAIN</p><h3>Connect one human need to one business effect</h3></div><span class="tag direction">Saved room-wide</span></div><form id="signal-chain-form" class="chain-form"><label><span>Human perception</span><select name="human">${humanOptions}</select></label><label><span>Observable behavior</span><select name="behavior">${observable.map((x)=>`<option>${esc(x)}</option>`).join('')}</select></label><label><span>Machine-readable signal</span><select name="machine">${optionMarkup(SIGNALS,'id','name')}</select></label><label><span>Business outcome</span><select name="outcome">${outcomes.map((x)=>`<option>${esc(x)}</option>`).join('')}</select></label><label class="chain-rationale"><span>Strategic rationale</span><input name="rationale" maxlength="300" required placeholder="State the mechanism and strongest supporting evidence."></label><button class="primary-button" type="submit">Save signal chain</button></form><div class="chain-wall">${connections.map((item)=>{const p=payloadOf(item);return `<article class="signal-chain-card"><div><span>${esc(p.humanName)}</span><b>→</b><span>${esc(p.behavior||'Observable behavior')}</span><b>→</b><span>${esc(p.machineName)}</span><b>→</b><span>${esc(p.outcome||'Business outcome')}</span></div><p>${esc(p.rationale||'')}</p><small>${esc(p.ownerName||'Team contribution')}</small></article>`}).join('')||'<div class="empty-state"><div><strong>Awaiting the first signal chain</strong><span>Build a chain, then test whether the evidence supports the proposed business effect.</span></div></div>'}</div></section>
    ${knowledgeCheckMarkup('k-machine')}
  </section>`;
}

function currentShock() {
  const id = state.room?.settings?.shockId;
  return SHOCKS.find((shock) => shock.id === id) || SHOCKS[state.localShockIndex % SHOCKS.length];
}
function renderShock() {
  const shock = currentShock();
  const responses = liveItems('shock').filter((item) => payloadOf(item).shockId === shock.id);
  return `<section class="scene">${sceneHeader('ACT IV · DISRUPTION SIMULATION','The ecosystem changed.<br><em style="color:var(--lamark);font-style:normal">Protect the decision path.</em>','Identify the affected decision moment within five minutes. Diagnose the signal failure, assign ownership, and redefine measurement.', isFacilitator() ? `<button class="secondary-button" type="button" data-action="shock-next">Draw a different shock</button>` : '')}
    <div class="shock-stage"><article class="shock-card"><header><p class="eyebrow">SEARCH SHOCK ${String(SHOCKS.indexOf(shock)+1).padStart(2,'0')}</p><h2>${esc(shock.title)}</h2></header><div><p>${esc(shock.description)}</p><div class="stack" style="margin-top:20px">${shock.questions.map((question,index) => `<div class="system-note" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#fff"><strong>${index+1}.</strong> ${esc(question)}</div>`).join('')}</div></div><footer><span class="tag" style="background:rgba(255,255,255,.12);color:white">Five-minute response</span></footer></article>
      <section class="panel"><p class="eyebrow">TEAM RESPONSE</p><h2>Stabilize the decision journey</h2><form id="shock-form" class="stack" style="margin-top:20px"><div class="form-grid"><label><span>Client</span><select name="client"><option value="breezy">Breezy Golf</option><option value="kp">KP Attorney</option></select></label><label><span>Affected journey stage</span><select name="stage">${optionMarkup(JOURNEY_STAGES,'id','label')}</select></label></div><label><span>What changed and why does it matter?</span><textarea name="diagnosis" rows="3" required maxlength="600"></textarea></label><label><span>What should Lamark recommend first?</span><textarea name="action" rows="3" required maxlength="600"></textarea></label><div class="form-grid"><label><span>Execution owner</span><select name="owner"><option>SEO</option><option>Content</option><option>PR / Offsite</option><option>Organic Social</option><option>Local</option><option>UX / CRO</option><option>Development</option><option>Client</option><option>Cross-functional</option></select></label><label><span>Success measure</span><input name="measure" required maxlength="180" placeholder="What changes if the response works?"></label></div><button class="primary-button" type="submit">Submit live response</button></form></section></div>
    <section class="panel" style="margin-top:16px"><div class="flex-between"><div><p class="eyebrow">RESPONSE WALL</p><h3>${responses.length} response${responses.length===1?'':'s'} for this shock</h3></div><span class="tag direction">Compare assumptions</span></div><div class="divider"></div><div class="response-grid">${responses.map((item) => { const p=payloadOf(item); return `<article class="response-card"><div class="inline-meta"><span class="tag ${item.client}">${esc(item.client === 'kp' ? 'KP' : 'Breezy')}</span><span class="tag">${esc(byJourneyStage(item.stage)?.label || item.stage)}</span></div><strong style="margin-top:10px">${esc(p.diagnosis)}</strong><p><b>First response:</b> ${esc(p.action)}</p><footer class="flex-between"><small class="muted">Owner: ${esc(p.executionOwner)} · Measure: ${esc(p.measure)}</small><small class="muted">${esc(p.ownerName)}</small></footer></article>`; }).join('') || '<div class="empty-state"><div><strong>Awaiting the first response</strong><span>Compare how each team diagnoses the same disruption.</span></div></div>'}</div></section>
  </section>`;
}

function strategyScore(p) {
  return Math.round(((Number(p.impact||0)*.30)+(Number(p.audience||0)*.25)+(Number(p.gap||0)*.20)+(Number(p.feasibility||0)*.15)+(Number(p.measurement||0)*.10))*20);
}
function strategyItems() {
  return liveItems('strategy').map((item) => ({ ...item, computedScore: strategyScore(payloadOf(item)) })).sort((a,b) => b.computedScore - a.computedScore);
}
function strategyRoadmapMarkup(items,totals) {
  const lanes=[['now','0–30 days'],['next','31–60 days'],['scale','61–90 days']];
  const laneFor=(item)=>payloadOf(item).horizon||((payloadOf(item).feasibility>=4)?'now':(payloadOf(item).impact>=4?'next':'scale'));
  return `<div class="roadmap-view">${lanes.map(([id,label])=>`<section><header><span>${esc(label)}</span><strong>${id==='now'?'Stabilize and capture':id==='next'?'Build proof and connections':'Scale the operating system'}</strong></header>${items.filter((item)=>laneFor(item)===id).map((item)=>strategyCardMarkup(item,totals)).join('')||'<div class="empty-state"><span>No initiatives in this horizon.</span></div>'}</section>`).join('')}</div>`;
}
function renderStrategy() {
  const items=strategyItems(); const totals=voteTotals(); const pillars=[{id:'capture',title:'Capture demand',description:'Win explicit searches and high-intent discovery moments.'},{id:'prove',title:'Prove value and trust',description:'Supply the independent evidence required to reduce risk.'},{id:'connect',title:'Connect signals and systems',description:'Make facts, entities, listings, assets, and measurement consistent.'}];
  const viewMarkup=state.strategyView==='pillars'?`<div class="strategy-grid" style="margin-top:16px">${pillars.map((pillar)=>`<section class="strategy-column"><header><span>${esc(pillar.id.toUpperCase())}</span><h3>${esc(pillar.title)}</h3><p>${esc(pillar.description)}</p></header>${items.filter((item)=>payloadOf(item).pillar===pillar.id).map((item)=>strategyCardMarkup(item,totals)).join('')||'<div class="empty-state"><span>Awaiting initiatives.</span></div>'}</section>`).join('')}</div>`:state.strategyView==='matrix'?strategyMatrixMarkup(items):strategyRoadmapMarkup(items,totals);
  return `<section class="scene strategy-scene">${sceneHeader('ACT V · STRATEGY WAR ROOM','A strategy is a set of <em>defensible choices.</em>','Propose, score, vote, and sequence the initiatives. Each item must identify the decision moment, evidence gap, owner, and first action.', `<div class="client-switch"><button type="button" data-action="strategy-view" data-view="pillars" class="${state.strategyView==='pillars'?'is-active':''}">Pillars</button><button type="button" data-action="strategy-view" data-view="matrix" class="${state.strategyView==='matrix'?'is-active':''}">Matrix</button><button type="button" data-action="strategy-view" data-view="roadmap" class="${state.strategyView==='roadmap'?'is-active':''}">90-day roadmap</button></div><button class="primary-button" type="button" data-action="strategy-add">Propose initiative</button>`)}
    <div class="metrics-grid"><div class="metric-card"><small>Initiatives</small><strong>${items.length}</strong><p>Team proposals</p></div><div class="metric-card"><small>Top score</small><strong>${items[0]?.computedScore||0}</strong><p>Weighted out of 100</p></div><div class="metric-card"><small>Priority votes</small><strong>${[...totals.entries()].filter(([key])=>key.startsWith('strategy:')).reduce((a,[,v])=>a+v,0)}</strong><p>Room choices</p></div><div class="metric-card"><small>Breezy</small><strong>${items.filter((i)=>i.client==='breezy').length}</strong><p>Initiatives</p></div><div class="metric-card"><small>K&P</small><strong>${items.filter((i)=>i.client==='kp').length}</strong><p>Initiatives</p></div></div>${viewMarkup}
    <section class="panel" style="margin-top:16px"><p class="eyebrow">WEIGHTED DECISION MODEL</p><div class="scope-boundary five"><div class="scope-card"><strong>30% Business impact</strong><p>Revenue, qualified leads, conversion, trust, or retention.</p></div><div class="scope-card"><strong>25% Audience relevance</strong><p>A real need at a meaningful decision stage.</p></div><div class="scope-card"><strong>20% Visibility gap</strong><p>Absence, weakness, inconsistency, or competitive loss.</p></div><div class="scope-card"><strong>15% Feasibility</strong><p>Realistic execution within client and agency constraints.</p></div><div class="scope-card"><strong>10% Measurement confidence</strong><p>Honest leading and business indicators.</p></div></div></section></section>`;
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
  return `<section class="scene">${sceneHeader('ACT V · TEACH IT BACK','Can you defend the model under <em style="color:var(--lamark);font-style:normal">client scrutiny?</em>','One participant responds in 45 seconds. The room scores accuracy, clarity, business relevance, confidence, and scope discipline.', isFacilitator()?`<button class="secondary-button" type="button" data-action="challenge-next">Next objection</button>`:'')}
    <div class="challenge-layout"><article class="objection-card"><header><p class="eyebrow">CLIENT OBJECTION ${String(objection.index+1).padStart(2,'0')}</p></header><blockquote>“${esc(objection.text)}”</blockquote><footer><div class="system-note"><strong>Response structure</strong><br>Clarify the misconception → connect it to audience behavior → define Lamark’s role → name the business value.</div></footer></article>
      <section class="panel"><p class="eyebrow">RATE THE TEACH-BACK</p><h2>How strong was the response?</h2><form id="challenge-form" class="stack" style="margin-top:20px"><label><span>Speaker</span><select name="speaker">${people.map((person) => `<option value="${attr(person.userId)}" data-name="${attr(person.name)}" data-color="${attr(person.color||'#38465b')}">${esc(person.name)}</option>`).join('')}</select></label><div class="form-grid"><label><span>Accuracy, 1–5</span><input name="accuracy" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Clarity, 1–5</span><input name="clarity" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Business relevance, 1–5</span><input name="business" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label><label><span>Scope discipline, 1–5</span><input name="scope" type="range" min="1" max="5" value="4"><output class="mini mono">4</output></label></div><label><span>One coaching note</span><input name="note" maxlength="240" placeholder="What would make the response stronger?"></label><button class="primary-button" type="submit">Submit rating</button></form></section></div>
    <section class="panel" style="margin-top:16px"><div class="flex-between"><div><p class="eyebrow">LIVE LEADERBOARD</p><h3>${ratings.length} rating${ratings.length===1?'':'s'} submitted</h3></div><span class="tag present">Strategic communication scoring</span></div><div class="divider"></div><div class="leaderboard">${leaders.map((leader,index) => `<div class="leader-row"><span class="rank">${String(index+1).padStart(2,'0')}</span><span class="avatar" style="background:${attr(leader.color||'#38465b')}">${esc(initials(leader.name))}</span><strong>${esc(leader.name)}</strong><output>${leader.avg.toFixed(1)}/5</output></div>`).join('') || '<div class="empty-state"><div><strong>Awaiting the first rating</strong><span>Begin with the first 45-second client response.</span></div></div>'}</div></section>
  </section>`;
}

function renderDebrief() {
  const takeaways = liveItems('takeaway');
  const avgConfidence = takeaways.length ? Math.round(takeaways.reduce((sum,item)=>sum+Number(payloadOf(item).confidence||0),0)/takeaways.length) : state.confidence;
  return `<section class="scene">${sceneHeader('FINAL ACT · LOCK IN THE MODEL','Convert the framework into a <em style="color:var(--lamark);font-style:normal">repeatable operating standard.</em>','Consolidate the decisions and evidence. Define how the operating standard will be applied to the next account.', `<a class="secondary-button" href="./assets/search-everywhere-operating-model.svg" download>Download operating model</a><button class="secondary-button" type="button" data-action="print-session">Print summary</button><button class="primary-button" type="button" data-action="export-session">Export workshop CSVs</button>`)}
    <div class="operating-model"><div class="operating-step"><span>01</span><strong>Map the audience</strong><p>Need states, language, risk, context, and desired action.</p></div><div class="operating-step"><span>02</span><strong>Map the surfaces</strong><p>Where the audience asks, scans, compares, validates, and acts.</p></div><div class="operating-step"><span>03</span><strong>Collect evidence</strong><p>Brand visibility, competitors, result types, proof, gaps, and conflicts.</p></div><div class="operating-step"><span>04</span><strong>Prioritize action</strong><p>Impact, audience relevance, gap, feasibility, measurement, and ownership.</p></div><div class="operating-step"><span>05</span><strong>Measure the system</strong><p>Platform-native leading signals plus traffic, leads, revenue, trust, and retention.</p></div></div>
    <div class="debrief-grid" style="margin-top:18px"><section class="panel confidence-panel"><p class="eyebrow">TEAM CONFIDENCE</p><div class="confidence-number" id="confidence-number">${state.confidence}</div><p class="muted">How confident are you in explaining and applying Search Everywhere for a client?</p><input id="confidence-slider" type="range" min="0" max="100" value="${state.confidence}"><form id="takeaway-form" class="stack"><label><span>One change you will apply on your next account</span><textarea name="takeaway" required rows="4" maxlength="500"></textarea></label><button class="primary-button" type="submit">Save operating commitment</button></form></section>
      <section class="panel"><div class="flex-between"><div><p class="eyebrow">COMMITMENT WALL</p><h2>${takeaways.length ? `${takeaways.length} team commitment${takeaways.length===1?'':'s'}` : 'Awaiting team commitments'}</h2></div><span class="tag present">Average confidence ${avgConfidence}</span></div><div class="divider"></div><div class="takeaway-wall">${takeaways.map((item) => {const p=payloadOf(item);return `<article class="takeaway-card"><p>“${esc(p.takeaway)}”</p><footer>${esc(p.ownerName)} · confidence ${esc(p.confidence)}/100</footer></article>`;}).join('') || '<div class="empty-state" style="grid-column:1/-1"><div><strong>Awaiting the first commitment</strong><span>Record one concrete change for the next client workflow.</span></div></div>'}</div></section></div>
    <section class="panel" style="margin-top:18px"><div class="flex-between"><div><p class="eyebrow">SOURCE REGISTER</p><h3>Evidence used in the worked audit</h3></div><span class="tag">${SOURCES.length} sources</span></div><div class="divider"></div><div class="source-grid">${SOURCES.map((source) => `<article class="source-card"><strong>${esc(source.title)}</strong><p>${esc(source.use)}</p><a href="${attr(source.url)}" target="_blank" rel="noopener">Open source</a></article>`).join('')}</div></section>
  </section>`;
}

async function upsertItem(item) {
  if (participantContributionsPaused()) throw new Error('The facilitator has temporarily paused participant inputs. Your unfinished text remains available.');
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
  if (participantContributionsPaused()) throw new Error('The facilitator has temporarily paused participant inputs.');
  if (state.connected) return realtime.removeItem(id);
  state.items = state.items.filter((item) => item.id !== id);
  scheduleRender();
}
async function castVote(target, value = 1) {
  if (participantContributionsPaused()) throw new Error('The facilitator has temporarily paused voting and participant inputs.');
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
  if(stage().id==='cognition'){syncCognitiveScenario();const select=$('[data-cognitive-next]');if(select)select.value=state.cognitiveDraft.next;}
  if(stage().id==='auction')loadAuctionDraft(state.auctionClient);
  if(stage().id==='whiteboard')bindBoardDragging();
  if(stage().id==='ecosystem')animatePath(false);
}

async function handleSceneClick(event) {
  const target=event.target.closest('[data-action]'); if(!target)return; const action=target.dataset.action;
  if(action==='open-join')return openDialog(joinDialog); if(action==='start-preview')return goToStage(1);
  if(action==='switch-client'){state.selectedClient=target.dataset.client;storageSet('se-selected-client',state.selectedClient);return renderStage();}
  if(action==='fracture-choice'){const existing=getMyItem('poll',(item)=>payloadOf(item).question==='fracture-first-platform');return safeAction(()=>upsertItem({id:existing?.id,item_type:'poll',dedupe_key:`fracture:${currentUserId()}`,payload:{question:'fracture-first-platform',choice:target.dataset.choice,ownerName:state.profile?.name||'Preview participant'}}));}
  if(action==='cognitive-state'){state.cognitiveState=target.dataset.state;return renderStage();}
  if(action==='cognitive-scenario'){state.cognitiveScenario=target.dataset.scenario;syncCognitiveScenario(true);return renderStage({preserveDraft:false});}
  if(action==='knowledge-answer'){const question=knowledgeQuestion(target.dataset.question);const existing=getMyItem('knowledge_answer',(item)=>payloadOf(item).questionId===question.id);return safeAction(()=>upsertItem({id:existing?.id,item_type:'knowledge_answer',dedupe_key:`${question.id}:${currentUserId()}`,payload:{questionId:question.id,answer:Number(target.dataset.answer),correct:Number(target.dataset.answer)===question.correct,ownerName:state.profile?.name||'Preview participant'}}),'Knowledge check saved');}
  if(action==='ecosystem-platform'){state.ecosystemPlatform=target.dataset.platform;return renderStage();} if(action==='animate-path')return animatePath(true);
  if(action==='journey-scenario'){state.journeyScenario=target.dataset.scenario;state.journeyStageDetail='trigger';return renderStage({preserveDraft:false});}
  if(action==='journey-stage-detail'){state.journeyStageDetail=target.dataset.stage;return renderStage();}
  if(action==='journey-predict'){const existing=getMyItem('journey_prediction',(item)=>payloadOf(item).scenarioId===state.journeyScenario);return safeAction(()=>upsertItem({id:existing?.id,item_type:'journey_prediction',client:currentCognitiveScenarioForJourney().client,dedupe_key:`${state.journeyScenario}:${currentUserId()}`,payload:{scenarioId:state.journeyScenario,surface:target.dataset.surface,ownerName:state.profile?.name||'Preview participant'}}),'Prediction saved');}
  if(action==='remove-item')return safeAction(()=>removeItem(target.dataset.id),'Contribution removed');
  if(action==='enter-client'){state.selectedClient=target.dataset.client;state.auditFilters.client=target.dataset.client;storageSet('se-selected-client',state.selectedClient);return goToStage(STAGES.findIndex((item)=>item.id==='audit'),isFacilitator());}
  if(action==='audit-add')return openFindingDialog(); if(action==='audit-export')return exportAuditCsv(); if(action==='audit-vote'){event.stopPropagation();return safeAction(()=>castVote(target.dataset.target));} if(action==='audit-detail')return openAuditDetail(target.dataset.id); if(action==='audit-edit')return openFindingDialog(target.dataset.id);
  if(action==='board-client'){state.selectedClient=target.dataset.client;return renderStage();} if(action==='board-add')return openBoardDialog(); if(action==='board-template'){openBoardDialog();const template=target.dataset.template;const map={evidence:['Evidence','Confirmed observation or source-supported finding'],leak:['Journey leak','A point where uncertainty remains unresolved or confidence falls'],conflict:['Signal conflict','A contradiction between owned, local, social, review, or third-party information'],opportunity:['Opportunity','A specific way to improve decision visibility or evidence'],question:['Question to validate','A hypothesis requiring first-party data or additional research']};setTimeout(()=>{$('#card-editor-headline').value=map[template]?.[0]||'';$('#card-editor-detail').value=map[template]?.[1]||'';},0);return;} if(action==='board-edit'){event.stopPropagation();return openBoardDialog(target.dataset.id);} if(action==='board-arrange')return autoArrangeBoard();
  if(action==='wheel-category'){state.wheelCategory=target.dataset.category;return renderStage();} if(action==='wheel-spin')return spinWheel(); if(action==='wheel-rate')return safeAction(()=>castVote(`wheel:${target.dataset.response}:${target.dataset.dimension}`,Number(target.dataset.value)),'Score saved');
  if(action==='auction-client'){state.auctionClient=target.dataset.client;storageSet('se-auction-client',state.auctionClient);state.auctionDirty=false;state.auctionLoadedClient=null;loadAuctionDraft(state.auctionClient,true);return renderStage({preserveDraft:false});} if(action==='auction-reset'){state.auctionDraft=Object.fromEntries(SIGNALS.map((signal)=>[signal.id,0]));state.auctionDirty=true;return renderStage({preserveDraft:false});} if(action==='auction-submit')return submitAuction();
  if(action==='shock-next')return nextShock(); if(action==='strategy-view'){state.strategyView=target.dataset.view;return renderStage();} if(action==='strategy-add')return openStrategyDialog(); if(action==='strategy-edit')return openStrategyDialog(target.dataset.id); if(action==='strategy-vote')return safeAction(()=>castVote(target.dataset.target)); if(action==='challenge-next')return nextObjection(); if(action==='print-session')return window.print(); if(action==='export-session')return exportSessionCsv();
}

async function handleSceneSubmit(event) {
  event.preventDefault(); const form=event.target;
  if(form.id==='cognition-profile-form'){const data=Object.fromEntries(new FormData(form));const scenario=currentCognitiveScenario();const existing=getMyItem('cognitive_profile',(item)=>payloadOf(item).scenarioId===scenario.id);const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'cognitive_profile',client:scenario.client,dedupe_key:`${scenario.id}:${currentUserId()}`,payload:{scenarioId:scenario.id,risk:Number(data.risk),urgency:Number(data.urgency),familiarity:Number(data.familiarity),next:data.next,ownerName:state.profile?.name||'Preview participant'}}),'Decision profile saved');if(saved){state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='journey-insight-form'){const data=Object.fromEntries(new FormData(form));const scenario=currentCognitiveScenarioForJourney();const saved=await safeAction(()=>upsertItem({item_type:'journey',client:scenario.client,stage:data.from,payload:{kind:'transition',from:data.from,to:data.to,insight:data.insight,ownerName:state.profile?.name||'Preview participant'}}),'Transition insight added');if(saved){form.reset();state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='wheel-response-form'){const spin=currentWheelSpin();const data=Object.fromEntries(new FormData(form));if(!spin)return;const existing=getMyItem('wheel_response',(item)=>payloadOf(item).spinId===spin.id);const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'wheel_response',dedupe_key:`${spin.id}:${spin.winnerId}`,payload:{kind:'response',spinId:spin.id,winnerId:spin.winnerId,winnerName:spin.winnerName,winnerColor:spin.winnerColor,challenge:spin.challenge,answer:data.answer,ownerName:state.profile?.name||'Preview participant'}}),'Operator response shared');if(saved){form.reset();state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='signal-chain-form'){const data=Object.fromEntries(new FormData(form));const human=HUMAN_SIGNALS.find((item)=>item.id===data.human);const machine=SIGNALS.find((item)=>item.id===data.machine);const saved=await safeAction(()=>upsertItem({item_type:'connection',payload:{humanId:human.id,humanName:human.name,behavior:data.behavior,machineId:machine.id,machineName:machine.name,outcome:data.outcome,rationale:data.rationale,ownerName:state.profile?.name||'Preview participant'}}),'Signal chain saved');if(saved){form.reset();state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='shock-form'){const data=Object.fromEntries(new FormData(form));const shock=currentShock();const existing=getMyItem('shock',(item)=>payloadOf(item).shockId===shock.id);const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'shock',client:data.client,stage:data.stage,dedupe_key:`${shock.id}:${currentUserId()}`,payload:{shockId:shock.id,diagnosis:data.diagnosis,action:data.action,executionOwner:data.owner,measure:data.measure,ownerName:state.profile?.name||'Preview participant'}}),'Shock response submitted');if(saved){form.reset();state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='challenge-form'){const data=Object.fromEntries(new FormData(form));const select=form.elements.speaker,option=select.selectedOptions[0],dimensions=['accuracy','clarity','business','scope'];const score=dimensions.reduce((sum,key)=>sum+Number(data[key]),0)/dimensions.length;const objection=currentObjection();const existing=getMyItem('rating',(item)=>Number(payloadOf(item).objectionIndex)===objection.index&&payloadOf(item).speakerId===data.speaker);const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'rating',dedupe_key:`${objection.index}:${data.speaker}:${currentUserId()}`,payload:{objectionIndex:objection.index,speakerId:data.speaker,speakerName:option.dataset.name||option.textContent,speakerColor:option.dataset.color,score,dimensions:Object.fromEntries(dimensions.map((key)=>[key,Number(data[key])])),note:data.note,raterName:state.profile?.name||'Preview participant'}}),'Rating submitted');if(saved){form.reset();$$('input[type=range]',form).forEach((input)=>{input.value=4;input.nextElementSibling.textContent='4';});state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});}return;}
  if(form.id==='takeaway-form'){const data=Object.fromEntries(new FormData(form));const existing=getMyItem('takeaway');const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'takeaway',dedupe_key:`takeaway:${currentUserId()}`,payload:{takeaway:data.takeaway,confidence:state.confidence,ownerName:state.profile?.name||'Preview participant'}}),'Commitment added');if(saved){form.reset();state.suppressRender=false;state.pendingRender=false;renderStage({preserveDraft:false});celebrate();}return;}
}

function handleSceneInput(event) {
  const target=event.target;
  if(target.matches('[data-audit-filter]')){const key=target.dataset.auditFilter;state.auditFilters[key]=target.value;if(key==='search'){clearTimeout(state.auditSearchTimer);const caret=target.selectionStart??target.value.length;state.auditSearchTimer=setTimeout(()=>{renderStage();const replacement=$('[data-audit-filter=search]');replacement?.focus();replacement?.setSelectionRange?.(caret,caret);},220);return;}return renderStage();}
  if(target.matches('[data-audit-sort]')){state.auditSort=target.value;return renderStage();}
  if(target.matches('[data-cognitive-slider]')){const key=target.dataset.cognitiveSlider;state.cognitiveDraft[key]=Number(target.value);const output=$(`#${key}-output`);if(output)output.textContent=target.value;return;}
  if(target.matches('[data-cognitive-next]')){state.cognitiveDraft.next=target.value;return;}
  if(target.matches('[data-auction-signal]')){const signal=target.dataset.auctionSignal;state.auctionDraft[signal]=Number(target.value);state.auctionDirty=true;const output=$(`#auction-output-${CSS.escape(signal)}`);if(output)output.textContent=target.value;const meter=$('.credit-meter'),remaining=100-auctionTotal();if(meter){meter.classList.toggle('is-invalid',remaining!==0);const strong=$('strong',meter);if(strong)strong.textContent=remaining;const submit=$('[data-action=auction-submit]',meter);if(submit)submit.disabled=remaining!==0;}return;}
  if(target.id==='confidence-slider'){state.confidence=Number(target.value);const number=$('#confidence-number');if(number)number.textContent=target.value;return;}
  if(target.closest('#challenge-form')&&target.type==='range')target.nextElementSibling.textContent=target.value;
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
    if (participantContributionsPaused()) {
      toast('Participant inputs are paused', 'The facilitator will reopen the workspace when the instruction segment is complete.');
      return;
    }
    const board=$('#whiteboard'); const item=state.items.find((candidate)=>candidate.id===card.dataset.boardId); if(!board||!item)return;
    const boardRect=board.getBoundingClientRect(); const cardRect=card.getBoundingClientRect();
    state.drag={card,item,board,boardRect,offsetX:event.clientX-cardRect.left,offsetY:event.clientY-cardRect.top};
    card.classList.add('is-dragging'); card.setPointerCapture?.(event.pointerId); state.suppressRender=true;
  }));
}
async function handlePointerMove(event) {
  if (state.connected && event.pointerType !== 'touch' && presentationSettings().pointersVisible) realtime.sendCursor({ x:event.clientX/innerWidth,y:event.clientY/innerHeight,stage:stage().id });
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

async function spinWheel() {
  if(!isFacilitator() && state.connected)return;
  if(currentWheelSpin()?.status==='spinning')return;
  const people=peopleInRoom(); if(!people.length)return toast('No participants are connected');
  const settings=state.room?.settings||{};let history=Array.isArray(settings.wheelHistory)?settings.wheelHistory:[];let available=people.filter((person)=>!history.includes(person.userId));if(!available.length){history=[];available=people;}
  const winner=available[Math.floor(Math.random()*available.length)];const bank=WHEEL_CHALLENGES.filter((item)=>item.category===state.wheelCategory);const challenge=bank[Math.floor(Math.random()*bank.length)]||WHEEL_CHALLENGES[0];const id=randomId();
  const pending={id,status:'spinning',category:state.wheelCategory,createdAt:Date.now()};
  await safeAction(()=>roomSettingsPatch({wheelSpin:pending}),'Selection sequence initiated');
  await realtime.broadcast('activity',{title:'Operator selection initiated',message:`Category: ${challenge.label}`});
  await new Promise((resolve)=>setTimeout(resolve,1650));
  const spin={id,status:'selected',winnerId:winner.userId,winnerName:winner.name,winnerColor:winner.color||'#2864dc',challenge,createdAt:pending.createdAt,revealedAt:Date.now()};
  await safeAction(()=>roomSettingsPatch({wheelSpin:spin,wheelHistory:[...history,winner.userId]}),'Operator selected');
  await realtime.broadcast('activity',{title:`${winner.name} selected`,message:challenge.prompt});
}

async function submitAuction() {
  if(auctionTotal()!==100)return toast('Allocation incomplete','Use exactly 100 credits.','warning');
  const existing=myAuction(); const saved=await safeAction(()=>upsertItem({id:existing?.id,item_type:'auction',client:state.auctionClient,dedupe_key:`${state.auctionClient}:${currentUserId()}`,payload:{allocations:{...state.auctionDraft},ownerName:state.profile?.name||'Preview participant',ownerColor:state.profile?.color||'#2864dc'}}),'Allocation saved room-wide');
  if(saved){state.auctionDirty=false;state.auctionLoadedClient=state.auctionClient;renderStage({preserveDraft:false});}
}

async function saveConnection() { return null; }

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
  $('#strategy-name').value=p.name||''; $('#strategy-rationale').value=p.rationale||''; $('#strategy-impact').value=p.impact||4; $('#strategy-audience').value=p.audience||4; $('#strategy-gap').value=p.gap||4; $('#strategy-feasibility').value=p.feasibility||3; $('#strategy-measurement').value=p.measurement||3; $('#strategy-owner').value=p.owner||'SEO'; if($('#strategy-horizon'))$('#strategy-horizon').value=p.horizon||'now'; $('#strategy-action').value=p.action||'';
  $('#strategy-delete').classList.toggle('hidden',!item); openDialog(strategyDialog);
}
async function saveStrategy(event) {
  event.preventDefault(); const id=$('#strategy-id').value;
  await safeAction(()=>upsertItem({id:id||undefined,item_type:'strategy',client:$('#strategy-client').value,payload:{pillar:$('#strategy-pillar').value,name:$('#strategy-name').value,rationale:$('#strategy-rationale').value,impact:Number($('#strategy-impact').value),audience:Number($('#strategy-audience').value),gap:Number($('#strategy-gap').value),feasibility:Number($('#strategy-feasibility').value),measurement:Number($('#strategy-measurement').value),owner:$('#strategy-owner').value,horizon:$('#strategy-horizon')?.value||'now',action:$('#strategy-action').value,ownerName:state.profile?.name||'Preview participant'}}),'Initiative saved'); closeDialog(strategyDialog);
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
  if (!presentationSettings().reactionsEnabled) {
    toast('Reactions are disabled', 'The facilitator has hidden room reactions for the current segment.');
    return;
  }
  $('.reaction-menu')?.remove(); const button=$('#reaction-button'); const rect=button.getBoundingClientRect(); const menu=document.createElement('div'); menu.className='reaction-menu'; menu.style.left=`${Math.max(10,rect.right-220)}px`;menu.style.top=`${rect.top-54}px`; menu.innerHTML=['👏','💡','🔥','✅','🤔','🎯'].map((emoji)=>`<button type="button" data-reaction="${emoji}">${emoji}</button>`).join(''); document.body.append(menu);
  menu.addEventListener('click',async(event)=>{const target=event.target.closest('[data-reaction]');if(!target)return;await realtime.broadcast('reaction',{emoji:target.dataset.reaction,x:.5,y:.78});showReaction({emoji:target.dataset.reaction,x:.5,y:.78,senderId:currentUserId()});menu.remove();});
  setTimeout(()=>document.addEventListener('pointerdown',(event)=>{if(!menu.contains(event.target))menu.remove();},{once:true}),0);
}
function showReaction(payload) {
  if (!presentationSettings().reactionsEnabled) return;
  const node=document.createElement('div');node.className='floating-reaction';node.textContent=payload.emoji||'👏';node.style.setProperty('--x',`${clamp((payload.x||.5)*100,3,97)}%`);node.style.setProperty('--y',`${clamp((payload.y||.75)*100,10,95)}%`);$('#reaction-layer').append(node);setTimeout(()=>node.remove(),2400);
}
function renderRemoteCursor(payload) {
  if(!presentationSettings().pointersVisible||!payload||payload.senderId===currentUserId())return;
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
  const particles=Array.from({length:80},()=>({x:innerWidth/2,y:innerHeight*.72,vx:(Math.random()-.5)*12,vy:-6-Math.random()*9,g:.24+Math.random()*.16,size:3+Math.random()*5,life:90+Math.random()*40,color:['#2864dc','#10b9ff','#6267ef','#8f75ff','#0a2a5e'][Math.floor(Math.random()*5)]}));
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
    await goToStage(Number(snapshot.room.active_stage||0),false,{forced:true});
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
    const settings=presentationSettings(room);
    if(room?.code){$('#room-code-label').textContent=room.code;$('#room-code-button').classList.remove('hidden');}
    if(!settings.pointersVisible)clearRemoteCursors();
    if(!settings.reactionsEnabled)$('.reaction-menu')?.remove();
    if(!isFacilitator()&&settings.navigationLocked)state.followFacilitator=true;
    else if(!isFacilitator()&&settings.mode==='review')state.followFacilitator=false;
    const requested=Number(room?.active_stage);
    const shouldFollow=state.connected&&!isFacilitator()&&(settings.navigationLocked||state.followFacilitator);
    if(shouldFollow&&Number.isFinite(requested)&&requested!==state.stageIndex){
      const payload={stageIndex:requested,stageId:STAGES[requested]?.id,ratio:0,reason:'stage-change',senderId:room.facilitator_id};
      if(participantIsBusy()){
        state.pendingHostView={payload,requireContinuousSync:false,smooth:false};
        if(!state.pendingHostViewNotice){state.pendingHostViewNotice=true;toast('Host moved the room','Your active field is protected. You will follow when editing is complete.');}
      }else goToStage(requested,false,{forced:true});
    }else scheduleRender();
  });
  realtime.on('items',(items)=>{state.items=items||[];scheduleRender();});
  realtime.on('votes',(votes)=>{state.votes=votes||[];scheduleRender();});
  realtime.on('presence',(presence)=>{state.presence=(presence||[]).sort((a,b)=>Number(a.joinedAt||0)-Number(b.joinedAt||0));renderParticipants();if(['challenge','wheel'].includes(stage().id))scheduleRender();});
  realtime.on('cursor',renderRemoteCursor);
  realtime.on('reaction',showReaction);
  realtime.on('card_move',applyRemoteCardMove);
  realtime.on('host_scroll',(payload)=>applyHostView(payload,{requireContinuousSync:true,smooth:false}));
  realtime.on('host_view',(payload)=>applyHostView(payload,{requireContinuousSync:false,smooth:true}));
  realtime.on('clear_pointers',(payload)=>{if(trustedHostPayload(payload))clearRemoteCursors();});
  realtime.on('activity',(payload)=>toast(payload?.title||'Workshop activity',payload?.message||''));
  realtime.on('warning',(warning)=>toast(warning.title,warning.message,'warning'));
}

function wireGlobalEvents() {
  $$('dialog').forEach((dialog) => dialog.addEventListener('close', () => setTimeout(flushPendingHostView, 0)));
  sceneRoot.addEventListener('click',handleSceneClick);
  sceneRoot.addEventListener('submit',handleSceneSubmit);
  sceneRoot.addEventListener('input',handleSceneInput);
  sceneRoot.addEventListener('focusin',(event)=>{
    if (isProtectedSceneEditor(event.target)) state.suppressRender = true;
  });
  sceneRoot.addEventListener('focusout',(event)=>{
    if (!event.target.matches(EDITABLE_SELECTOR)) return;
    // focusout fires before focusin when moving between controls. Waiting one task lets
    // document.activeElement settle, so changing a dropdown never clears a text field.
    setTimeout(updateSceneEditingLock, 0);
  });
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
  $('#follow-facilitator').addEventListener('change',(event)=>{state.followFacilitator=event.target.checked;if(state.followFacilitator&&Number.isFinite(Number(state.room?.active_stage)))goToStage(Number(state.room.active_stage),false,{forced:true});});
  $('#join-form').addEventListener('submit',handleJoin);
  $('#join-cancel').addEventListener('click',()=>{state.preview=true;state.profile=state.profile||{id:'preview-user',name:'Preview participant',team:'preview',role:'facilitator',color:'#2864dc'};closeDialog(joinDialog);setConnectionLabel('preview','preview');renderStage();});
  $('#color-options').addEventListener('click',(event)=>{const button=event.target.closest('[data-color]');if(!button)return;$$('.color-option').forEach((item)=>item.classList.remove('is-active'));button.classList.add('is-active');});
  $('#card-editor-form').addEventListener('submit',saveBoardCard);$('#card-editor-cancel').addEventListener('click',()=>closeDialog(cardEditorDialog));$('#card-editor-delete').addEventListener('click',deleteBoardCard);
  $('#finding-form').addEventListener('submit',saveFinding);$('#finding-cancel').addEventListener('click',()=>closeDialog(findingDialog));$('#finding-delete').addEventListener('click',deleteFinding);
  $('#strategy-form').addEventListener('submit',saveStrategy);$('#strategy-cancel').addEventListener('click',()=>closeDialog(strategyDialog));$('#strategy-delete').addEventListener('click',deleteStrategy);
  $('#detail-close').addEventListener('click',()=>closeDialog(detailDialog));
  $('#detail-content').addEventListener('click',(event)=>{const target=event.target.closest('[data-action=audit-edit]');if(target){closeDialog(detailDialog);openFindingDialog(target.dataset.id);}});
  facilitatorDialog.addEventListener('change',(event)=>{
    if(event.target.id==='facilitator-stage')return goToStage(Number(event.target.value),true);
    const setting=event.target.dataset.hostSetting;
    if(setting)return updatePresentationSettings({[setting]:event.target.checked},`${event.target.closest('.host-setting-row')?.querySelector('strong')?.textContent||'Host setting'} updated`);
  });
  facilitatorDialog.addEventListener('click',(event)=>{
    const timerButton=event.target.closest('[data-timer-minutes]');if(timerButton)return setTimer(timerButton.dataset.timerMinutes);
    const presetButton=event.target.closest('[data-host-preset]');if(presetButton)return updatePresentationSettings(presentationPreset(presetButton.dataset.hostPreset),`${presetButton.querySelector('strong')?.textContent||'Host'} mode applied`);
    if(event.target.closest('#host-bring-everyone'))return broadcastHostView({reason:'bring-everyone'});
    if(event.target.closest('#host-send-top'))return broadcastHostView({ratio:0,reason:'top'});
    if(event.target.closest('#host-clear-pointers'))return clearPointersRoomWide();
    if(event.target.closest('#timer-pause'))return toggleTimer();if(event.target.closest('#timer-clear'))return clearTimer();if(event.target.closest('#facilitator-copy-link'))return copyInviteLink();
  });
  workshopMain.addEventListener('scroll',handleWorkshopScroll,{passive:true});
  window.addEventListener('scroll',handleWorkshopScroll,{passive:true});
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

if (CONFIG.debug) {
  window.__SE_DEBUG = {
    state,
    realtime,
    renderStage,
    renderStageRail,
    renderShellState,
    renderFacilitatorControls,
    presentationSettings,
    goToStage,
    applyHostView,
    broadcastHostView,
    setSession({ profile, room, connected = true, preview = false } = {}) {
      if (profile) state.profile = { ...state.profile, ...profile };
      if (room) state.room = { ...state.room, ...room };
      state.connected = connected;
      state.preview = preview;
      realtime.profile = { ...state.profile };
      realtime.user = { id: state.profile?.id || 'debug-user' };
      realtime.room = { ...state.room };
      realtime.mode = connected ? 'local' : 'disconnected';
      renderStage();
    },
    emit(type, detail) { realtime.emit(type, detail); }
  };
}

initialize();
