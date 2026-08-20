(() => {
  'use strict';

  const C = window.SE_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatTime = (seconds) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;
  const initials = (name = '?') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || '?';
  const hash = (value = '') => [...String(value)].reduce((total, char) => ((total << 5) - total + char.charCodeAt(0)) | 0, 0);
  const download = (filename, content, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    URL.revokeObjectURL(url);
  };
  const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  class SearchEverywhereLab {
    constructor() {
      this.store = new window.SERealtime({
        onStatus: (status) => this.onStatus(status),
        onData: (data) => this.onData(data),
        onRoomChange: (room) => this.onRoomChange(room),
        onCursor: (payload) => this.onCursor(payload),
        onReaction: (payload) => this.onReaction(payload),
        onPresence: () => this.renderRoster(),
        onItem: (item) => this.onItem(item),
        onError: ({ message }) => this.toast('Connection issue', message, 'error')
      });
      this.data = { room: null, user: null, member: null, participants: [], items: [], votes: [], mode: 'idle' };
      this.currentStage = 0;
      this.followFacilitator = true;
      this.selectedColor = '#14532d';
      this.activePsychStep = C.psychologySteps[0].id;
      this.activeJourneyPhase = C.journeyPhases[0].id;
      this.activeMissionClient = 'breezy';
      this.activeMissionIndex = { breezy: 0, kp: 0 };
      this.activeChallengeIndex = 0;
      this.signalSelection = { human: '', machine: '', business: '' };
      this.wheelRotation = 0;
      this.lastWheelSpinId = null;
      this.cursorNodes = new Map();
      this.lastCursorSentAt = 0;
      this.dragState = null;
      this.boardFilter = 'all';
      this.timerInterval = null;
      this.draftPrefix = 'se-lab-v2-draft';
    }

    init() {
      this.renderNavigation();
      this.renderStages();
      this.bindGlobalEvents();
      this.bindStageEvents();
      this.showStage(0, { force: true });
      this.renderPsychologyDetail();
      this.renderJourneyDetail();
      this.renderSurfaceMatch();
      this.renderMissionCard();
      this.renderSignalBuilder();
      this.renderChallengeCard();
      this.renderWheelSegments();
      this.restoreAllDrafts();
      this.startTimerLoop();
    }

    renderNavigation() {
      $('#stageNav').innerHTML = C.stages.map((stage, index) => `
        <button class="stage-nav-button${index === 0 ? ' is-active' : ''}" type="button" data-stage-index="${index}">
          <span class="stage-nav-number">${String(index + 1).padStart(2, '0')}</span>
          <span><small>${esc(stage.eyebrow)}</small><strong>${esc(stage.short)}</strong></span>
        </button>`).join('');
    }

    stageShell(index, body) {
      const stage = C.stages[index];
      return `<section class="stage${index === 0 ? ' is-active' : ''}" id="stage-${stage.key}" data-stage-index="${index}">
        <div class="stage-shell">${body}</div>
      </section>`;
    }

    intro(index, title, emphasized, lede, objective) {
      const stage = C.stages[index];
      return `<div class="stage-intro">
        <span class="stage-kicker">${esc(stage.eyebrow)} · ${esc(stage.title)}</span>
        <h1 class="stage-title">${esc(title)} <em>${esc(emphasized)}</em></h1>
        <p class="stage-lede">${esc(lede)}</p>
        ${objective ? `<div class="stage-objective">◎ ${esc(objective)}</div>` : ''}
      </div>`;
    }

    renderStages() {
      $('#stageRoot').innerHTML = [
        this.stageLobby(), this.stagePsychology(), this.stageJourney(), this.stageSurfaces(), this.stageWheel(),
        this.stageTradeoffs(), this.stageMissions(), this.stageSignals(), this.stageRoadmap(), this.stageTeachback(), this.stageDebrief()
      ].join('');
    }

    stageLobby() {
      const pollOptions = C.openingPoll.options.map((option) => `
        <button class="poll-option" type="button" data-poll-option="${option.id}">
          <span class="poll-icon">${esc(option.icon)}</span><strong>${esc(option.label)}</strong>
        </button>`).join('');
      return this.stageShell(0, `
        ${this.intro(0, 'Search is no longer', 'one place.', 'The workshop begins with the team’s own behavior. You will see how one need becomes a sequence of searches, proof checks, comparisons, and decisions across several surfaces.', 'See the fragmentation before learning the framework.')}
        <div class="join-grid">
          <article class="panel tint-green hero-manifesto">
            <div>
              <span class="eyebrow">The operating premise</span>
              <blockquote>People search until <em>uncertainty is resolved.</em></blockquote>
            </div>
            <div class="manifesto-chain" aria-label="Search journey examples">
              <span class="manifesto-chip">Google</span><span class="manifesto-chip">AI</span><span class="manifesto-chip">Reddit</span>
              <span class="manifesto-chip">YouTube</span><span class="manifesto-chip">Maps</span><span class="manifesto-chip">Reviews</span>
              <span class="manifesto-chip">TikTok</span><span class="manifesto-chip">Brand website</span>
            </div>
          </article>
          <aside class="panel join-card" id="joinCard">
            <div class="panel-heading"><div><span class="eyebrow">Join the live room</span><h2>Enter the workshop</h2><p>Every participant receives a live cursor, saves answers, and contributes one roadmap move.</p></div></div>
            <form id="joinForm" data-draft="join">
              <div class="field"><label for="participantName">Your name</label><input class="input" id="participantName" name="name" maxlength="60" autocomplete="name" placeholder="Justin" required></div>
              <div class="field"><label for="participantSquad">Client lens</label><select class="select" id="participantSquad" name="squad"><option value="auto">Assign automatically</option><option value="breezy">Breezy Golf</option><option value="kp">K&amp;P Attorney</option><option value="observer">Observer</option></select><small>The person who creates the room becomes the facilitator. Everyone who joins is a participant.</small></div>
              <div class="field"><span class="field-label">Cursor color</span><div class="color-picks" id="colorPicks">
                ${['#14532d','#142a43','#9a6a19','#7c3aed','#b42318','#0e7490','#c2410c','#374151'].map((color, i) => `<button class="color-pick${i === 0 ? ' is-selected' : ''}" type="button" data-color="${color}" style="background:${color}" aria-label="Choose ${color}"></button>`).join('')}
              </div></div>
              <div class="field"><label for="roomCodeInput">Room code <span style="color:var(--muted);font-weight:500">(leave blank to create)</span></label><input class="input" id="roomCodeInput" name="roomCode" maxlength="8" autocomplete="off" placeholder="ABC123" style="text-transform:uppercase;letter-spacing:.12em"></div>
              <div class="button-row"><button class="btn btn-primary" id="createRoomButton" type="button">Create live room</button><button class="btn btn-secondary" id="joinRoomButton" type="submit">Join room</button></div>
            </form>
            <div class="room-success hidden" id="roomSuccess"><span class="eyebrow">You are connected</span><strong class="room-code-large" id="roomCodeLarge">------</strong><p style="margin:0;color:var(--muted);font-size:11px;line-height:1.5">Share this code. Everyone should use the same live URL and room code.</p></div>
          </aside>
        </div>
        <div class="stage-grid" style="margin-top:24px">
          <section class="panel span-7">
            <div class="panel-heading"><div><span class="eyebrow">Live opening poll</span><h2>${esc(C.openingPoll.question)}</h2><p>Choose the answer that reflects your own behavior, not the platform you manage.</p></div></div>
            <div class="poll-options" id="openingPollOptions">${pollOptions}</div>
          </section>
          <section class="panel span-5 tint-navy">
            <div class="panel-heading"><div><span class="eyebrow">Room result</span><h2>The team’s search fracture</h2><p>Results update for everyone without a refresh.</p></div></div>
            <div class="result-bars" id="openingPollResults"><div class="empty-state">Join the room and vote to build the live map.</div></div>
          </section>
        </div>`);
    }

    stagePsychology() {
      return this.stageShell(1, `
        ${this.intro(1, 'The brain is trying to', 'reduce uncertainty.', 'Search behavior begins before a keyword. A person recognizes a gap, chooses a starting surface, scans for cues, tests trust, reformulates, and decides what to do next.', 'Understand the mental process that creates the search journey.')}
        <div class="stage-grid">
          <section class="panel span-7"><div class="panel-heading"><div><span class="eyebrow">The uncertainty loop</span><h2>Click each mental action</h2><p>This is an information-seeking model, not a claim that every person follows a perfectly linear sequence.</p></div></div><div class="psychology-loop" id="psychologyLoop">
            ${C.psychologySteps.map((step, i) => `<button class="psych-step${i === 0 ? ' is-active' : ''}" type="button" data-psych-step="${step.id}"><span class="psych-step-number">${step.number}</span><strong>${esc(step.label)}</strong><span>${esc(step.plain)}</span></button>`).join('')}
          </div></section>
          <section class="panel span-5 tint-green detail-reveal" id="psychologyDetail"></section>
          <section class="panel span-12">
            <div class="panel-heading"><div><span class="eyebrow">Fast knowledge check</span><h2>What is the person doing mentally?</h2><p>Answer one scenario at a time. The purpose is pattern recognition, not memorization.</p></div><button class="btn btn-secondary btn-small" id="nextPsychQuiz" type="button">New question</button></div>
            <div class="quiz-card" id="psychQuizCard"></div>
            <div class="inline-note" style="margin-top:14px"><strong>Teaching point:</strong> A platform switch often means the user’s information need changed. The next query is not always a failure of the previous surface.</div>
          </section>
        </div>`);
    }

    stageJourney() {
      return this.stageShell(2, `
        ${this.intro(2, 'A five-phase journey anyone can', 'explain.', 'The old audit-style journey has been replaced by five plain-language phases. Each phase explains the user’s question, common surfaces, the SEO role, and a client example.', 'Learn the journey first, then practice placing real moments within it.')}
        <section class="panel flat journey-orbit">
          <div class="journey-track"></div><div class="journey-nodes" id="journeyNodes">
            ${C.journeyPhases.map((phase, i) => `<button class="journey-node${i === 0 ? ' is-active' : ''}" type="button" data-journey-phase="${phase.id}"><span class="journey-node-dot">${phase.number}</span><span><strong>${esc(phase.title)}</strong><span>${esc(phase.subtitle)}</span></span></button>`).join('')}
          </div>
        </section>
        <div class="stage-grid">
          <section class="panel span-8 journey-detail" id="journeyDetail"></section>
          <section class="panel span-4 tint-navy">
            <div class="panel-heading"><div><span class="eyebrow">Place the moment</span><h2>Choose the phase</h2><p>Short scenarios reinforce the model without requiring an audit.</p></div><button class="btn btn-secondary btn-small" id="newJourneyScenario" type="button">New scenario</button></div>
            <div class="scenario-deck" id="journeyScenario"></div>
          </section>
        </div>`);
    }

    stageSurfaces() {
      return this.stageShell(3, `
        ${this.intro(3, 'Every surface has a', 'different job.', 'Search Everywhere does not mean recommending every platform. It means matching the user’s current task with the surface most likely to resolve it.', 'Practice platform-task fit instead of building a channel checklist.')}
        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Search surface atlas</span><h2>What each environment is good at</h2><p>Click a surface to compare its role, strength, and limitation.</p></div></div><div class="surface-grid" id="surfaceGrid">
          ${C.surfaces.map((surface) => `<button class="surface-card" type="button" data-surface-card="${surface.id}"><span class="surface-icon">${esc(surface.icon)}</span><h3>${esc(surface.name)}</h3><p>${esc(surface.role)}</p><div class="surface-strength"><small>Primary strength</small><p>${esc(surface.strength)}</p></div></button>`).join('')}
        </div></section>
        <section class="panel tint-navy" style="margin-top:20px"><div class="panel-heading"><div><span class="eyebrow">Live match game</span><h2>Which surface best resolves this moment?</h2><p>The “best” answer reflects the immediate task. A complete journey may still involve several surfaces.</p></div><button class="btn btn-secondary btn-small" id="newSurfaceMoment" type="button">New moment</button></div><div id="surfaceMatch"></div></section>`);
    }

    stageWheel() {
      return this.stageShell(4, `
        ${this.intro(4, 'Spin a person. Teach one', 'useful idea.', 'The wheel selects someone who joined the room, then assigns a short challenge. It cycles through the team before repeating names.', 'Make every person speak, reason, and teach without putting anyone through a long assignment.')}
        <div class="wheel-layout">
          <section class="panel wheel-stage"><div class="wheel-wrap"><div class="wheel-pointer"></div><div class="wheel" id="participantWheel"></div><div class="wheel-labels" id="wheelLabels"></div></div></section>
          <section class="wheel-controls">
            <div class="panel">
              <div class="panel-heading"><div><span class="eyebrow">Facilitator controls</span><h2>Choose a challenge type</h2><p>The wheel will pick a live participant and a matching question.</p></div></div>
              <div class="choice-grid" id="wheelCategoryChoices">${C.wheelCategories.map((cat, i) => `<label class="choice"><input type="radio" name="wheelCategory" value="${cat.id}" ${i === 0 ? 'checked' : ''}><strong>${esc(cat.label)}</strong><span>${esc(cat.description)}</span></label>`).join('')}</div>
              <div class="button-row" style="margin-top:14px"><button class="btn btn-primary" id="spinWheelButton" type="button">Spin the participant wheel</button><button class="btn btn-secondary" id="resetWheelCycleButton" type="button">Reset name cycle</button></div>
            </div>
            <div class="wheel-result" id="wheelResult"><span class="winner">Waiting for the first spin</span><h3>Everyone gets a turn.</h3><p>The facilitator chooses a category. The selected participant answers, completes a quick task, or creates one roadmap move.</p></div>
            <div class="panel" id="wheelAnswerPanel"><div class="empty-state">Spin the wheel to reveal a challenge.</div></div>
            <div class="panel"><div class="panel-heading"><div><span class="eyebrow">Shared answers</span><h3>Teach-back wall</h3></div></div><div id="wheelAnswerWall"><div class="empty-state">Answers will appear here for the full team.</div></div></div>
          </section>
        </div>`);
    }

    stageTradeoffs() {
      const initial = [15,15,10,10,10,15,15,10];
      return this.stageShell(5, `
        ${this.intro(5, 'You have 100 visibility credits.', 'Spend them deliberately.', 'Allocate limited resources across the evidence system. Save one Breezy or K&P allocation, then compare your choices with the team aggregate in real time.', 'Learn that Search Everywhere is prioritization, not equal investment everywhere.')}
        <div class="stage-grid">
          <section class="span-7">
            <form class="panel" id="tradeoffForm" data-draft="tradeoffs">
              <div class="panel-heading"><div><span class="eyebrow">Your allocation</span><h2>Build a 100-credit strategy</h2><p>Every signal includes a plain-language explanation and examples.</p></div><div class="client-toggle"><button class="is-active" type="button" data-tradeoff-client="breezy">Breezy</button><button type="button" data-tradeoff-client="kp">K&amp;P</button></div></div>
              <input type="hidden" id="tradeoffClient" name="client" value="breezy">
              <div class="allocation-list">${C.tradeoffSignals.map((signal, i) => `<div class="allocation-row"><div class="allocation-copy"><strong>${esc(signal.label)}</strong><span>${esc(signal.description)}<br><em>${esc(signal.examples)}</em></span></div><input class="range tradeoff-range" type="range" min="0" max="40" step="1" name="${signal.id}" value="${initial[i]}" aria-label="${esc(signal.label)} credits"><output class="credit-output" data-credit-output="${signal.id}">${initial[i]}</output></div>`).join('')}</div>
              <div class="button-row" style="margin-top:16px"><button class="btn btn-primary" id="saveTradeoffsButton" type="submit">Save my 100 credits</button><span class="pill green" id="tradeoffSaveStatus">Not saved yet</span></div>
            </form>
          </section>
          <aside class="span-5">
            <div class="panel credit-meter tint-green"><div class="credit-total"><div><span class="eyebrow">Credits allocated</span><strong id="creditTotal">100</strong></div><span>of 100</span></div><div class="credit-track" id="creditTrack"><span style="width:100%"></span></div><p class="credit-guide" id="creditGuide">You have used every credit. Saving is available.</p></div>
            <div class="panel" style="margin-top:16px"><div class="panel-heading"><div><span class="eyebrow">Room-wide result</span><h2>Team aggregate</h2><p>Every saved allocation is visible to everyone in the room.</p></div><select class="select" id="aggregateClientFilter" style="width:auto"><option value="breezy">Breezy</option><option value="kp">K&amp;P</option></select></div><div class="aggregate-chart" id="tradeoffAggregate"><div class="empty-state">Save the first allocation to create the aggregate.</div></div><div class="allocation-cards" id="tradeoffCards"></div></div>
          </aside>
        </div>`);
    }

    stageMissions() {
      return this.stageShell(6, `
        ${this.intro(6, 'Apply the model without doing', 'a full audit.', 'Each person receives one realistic client moment. Choose the best next move and explain the insight in one sentence. The deeper audit remains an optional reference library.', 'Practice strategic interpretation in less than five minutes.')}
        <div class="stage-grid">
          <section class="panel span-7">
            <div class="panel-heading"><div><span class="eyebrow">Your micro-mission</span><h2>Read, decide, explain</h2><p>Your mission is assigned from your client lens, but you can switch examples.</p></div><div class="client-toggle" id="missionClientToggle"><button class="is-active" type="button" data-mission-client="breezy">Breezy</button><button type="button" data-mission-client="kp">K&amp;P</button></div></div>
            <div id="missionCard"></div>
          </section>
          <aside class="panel span-5 tint-gold"><div class="panel-heading"><div><span class="eyebrow">Shared learning wall</span><h2>What the room concluded</h2><p>Each response is short, visible, and tied to a journey phase.</p></div></div><div class="mission-wall" id="missionWall"><div class="empty-state">Completed micro-missions will appear here.</div></div></aside>
          <section class="panel span-12"><details><summary style="cursor:pointer;font-weight:850">Open the optional Breezy and K&amp;P reference audit</summary><div class="reference-table-wrap" style="margin-top:16px"><table class="reference-table"><thead><tr><th>Client</th><th>Journey phase</th><th>Surface</th><th>Finding</th><th>Recommended direction</th><th>Confidence</th></tr></thead><tbody>${C.referenceAudit.map((row) => `<tr><td>${esc(row.client)}</td><td>${esc(row.phase)}</td><td>${esc(row.surface)}</td><td>${esc(row.finding)}</td><td>${esc(row.recommendation)}</td><td>${esc(row.confidence)}</td></tr>`).join('')}</tbody></table></div></details></section>
        </div>`);
    }

    stageSignals() {
      return this.stageShell(7, `
        ${this.intro(7, 'Turn fragmented activity into a', 'managed evidence system.', 'Users experience relevance and trust. Platforms interpret entities, reviews, citations, structure, and engagement. The business receives visibility, conversion, retention, and learning.', 'Connect the three layers instead of treating each platform as an isolated tactic.')}
        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">The dual-vision model</span><h2>What people feel, what systems interpret, what the business receives</h2><p>Select one node in each column to build an evidence chain.</p></div></div><div class="signal-system">
          ${['human','machine','business'].map((layer) => `<div class="signal-column"><h3>${layer === 'human' ? 'Human experience' : layer === 'machine' ? 'Machine-readable evidence' : 'Business outcome'}</h3><p>${layer === 'human' ? 'The cues a person uses to decide.' : layer === 'machine' ? 'The signals platforms can process or infer.' : 'The result the client ultimately values.'}</p>${C.signalLayers[layer].map((node) => `<button class="signal-node" type="button" data-signal-layer="${layer}" data-signal-id="${node.id}"><strong>${esc(node.label)}</strong><span>${esc(node.detail)}</span></button>`).join('')}</div>`).join('')}
        </div></section>
        <section class="panel tint-green" style="margin-top:20px"><div class="panel-heading"><div><span class="eyebrow">Build one chain</span><h2>Connect the evidence system</h2><p>Add an optional sentence explaining why the connection matters.</p></div></div><div id="signalBuilder"></div><div class="shared-chains" id="sharedChains"><div class="empty-state">The room’s evidence chains will appear here.</div></div></section>`);
    }

    stageRoadmap() {
      return this.stageShell(8, `
        ${this.intro(8, 'One person. One strategic move.', 'One shared wall.', 'The roadmap builder uses guided choices and a single clear sentence. Cards are visible to everyone, draggable, and voteable.', 'Convert learning into a manageable next step without creating workshop homework.')}
        <div class="roadmap-layout">
          <aside class="panel roadmap-form-panel">
            <div class="panel-heading"><div><span class="eyebrow">Guided roadmap builder</span><h2>Add one move</h2><p>Choose the context, then finish one action sentence.</p></div></div>
            <form id="roadmapForm" data-draft="roadmap" class="form-grid">
              <div class="field"><label for="roadmapClient">Client</label><select class="select" id="roadmapClient" name="client"><option value="breezy">Breezy Golf</option><option value="kp">K&amp;P Attorney</option></select></div>
              <div class="field"><label for="roadmapPhase">Journey phase</label><select class="select" id="roadmapPhase" name="phase">${C.journeyPhases.map((phase) => `<option value="${phase.id}">${esc(phase.title)}</option>`).join('')}</select></div>
              <div class="field full"><label for="roadmapTemplate">Type of move</label><select class="select" id="roadmapTemplate" name="template">${C.roadmapTemplates.map((template) => `<option value="${template.id}">${esc(template.label)}</option>`).join('')}</select></div>
              <div class="field full"><label for="roadmapAction">We should…</label><textarea class="textarea" id="roadmapAction" name="action" maxlength="260" placeholder="Create or improve an owned answer that resolves…" required></textarea><small>One specific sentence is enough.</small></div>
              <div class="field"><label for="roadmapOwner">Likely owner</label><input class="input" id="roadmapOwner" name="owner" value="SEO + Content" maxlength="80"></div>
              <div class="field"><label for="roadmapHorizon">Horizon</label><select class="select" id="roadmapHorizon" name="horizon"><option>Next 30 days</option><option>Next 60 days</option><option>Next 90 days</option><option>Longer-term</option></select></div>
              <div class="field"><label for="roadmapImpact">Expected effect</label><select class="select" id="roadmapImpact" name="impact"><option>Qualified visibility</option><option>Trust and validation</option><option>Conversion</option><option>Local action</option><option>Retention</option><option>Measurement</option></select></div>
              <div class="field"><label for="roadmapEvidence">Evidence level</label><select class="select" id="roadmapEvidence" name="evidence"><option>Confirmed finding</option><option>Directional evidence</option><option>Hypothesis to test</option></select></div>
              <div class="full button-row"><button class="btn btn-primary" type="submit">Add to the shared wall</button><button class="btn btn-secondary" id="clearRoadmapDraft" type="button">Clear</button></div>
            </form>
          </aside>
          <section class="roadmap-board" id="roadmapBoard"><div class="board-toolbar"><select class="select" id="roadmapFilter" style="width:auto"><option value="all">All cards</option><option value="breezy">Breezy</option><option value="kp">K&amp;P</option></select><button class="btn btn-secondary btn-small" id="organizeRoadmapButton" type="button">Auto-organize</button></div><div class="empty-state" id="roadmapEmpty" style="position:absolute;inset:90px 20px 20px">Add the first strategic move. Every participant only needs one.</div></section>
        </div>`);
    }

    stageTeachback() {
      return this.stageShell(9, `
        ${this.intro(9, 'The team understands it when it can', 'explain it.', 'Respond to a realistic client objection in plain language. The room rates clarity, not presentation polish.', 'Build the confidence to consult on Search Everywhere with clients and internal teams.')}
        <div class="stage-grid">
          <section class="span-7"><div class="challenge-card" id="challengeCard"></div><form class="panel" id="challengeForm" data-draft="teachback" style="margin-top:14px"><div class="field"><label for="challengeAnswer">Your client-ready response</label><textarea class="textarea" id="challengeAnswer" name="answer" maxlength="520" placeholder="Explain it in a way a client could understand…" required></textarea></div><div class="button-row" style="margin-top:12px"><button class="btn btn-primary" type="submit">Share my response</button><button class="btn btn-secondary" id="newChallengeButton" type="button">Different objection</button></div></form></section>
          <aside class="panel span-5"><div class="panel-heading"><div><span class="eyebrow">Live leaderboard</span><h2>Participation, not perfection</h2><p>Points reward learning activities, shared contributions, and clear explanations.</p></div></div><div class="scoreboard" id="scoreboard"><div class="empty-state">Scores will appear as the room participates.</div></div></aside>
          <section class="panel span-12"><div class="panel-heading"><div><span class="eyebrow">Client-ready answers</span><h2>Rate what is clear</h2><p>Use the rating to reinforce useful language. Avoid turning this into a writing contest.</p></div></div><div class="stage-grid" id="challengeResponseWall"><div class="empty-state span-12">Shared responses will appear here.</div></div></section>
        </div>`);
    }

    stageDebrief() {
      return this.stageShell(10, `
        ${this.intro(10, 'Search Everywhere becomes', 'an operating habit.', 'Close by stating the model in your own words, naming one behavior you will change, and choosing where to apply it next.', 'Leave with a reusable framework, shared roadmap, and visible team commitments.')}
        <div class="stage-grid">
          <section class="panel span-5">
            <div class="panel-heading"><div><span class="eyebrow">Your commitment</span><h2>Three short prompts</h2><p>Your answers will remain visible in the room and can be exported.</p></div></div>
            <form id="commitmentForm" data-draft="commitment" class="form-grid">
              <div class="field full"><label for="definitionCommitment">Search Everywhere is…</label><textarea class="textarea" id="definitionCommitment" name="definition" maxlength="300" required></textarea></div>
              <div class="field full"><label for="behaviorCommitment">One behavior I will change…</label><textarea class="textarea" id="behaviorCommitment" name="behavior" maxlength="300" required></textarea></div>
              <div class="field full"><label for="clientCommitment">One client or account where I will apply it…</label><input class="input" id="clientCommitment" name="client" maxlength="100" required></div>
              <div class="full button-row"><button class="btn btn-primary" type="submit">Save my commitment</button><button class="btn btn-secondary" id="exportCsvButton" type="button">Export workshop CSV</button><button class="btn btn-secondary" id="exportJsonButton" type="button">Export room backup</button></div>
            </form>
          </section>
          <section class="panel span-7 tint-navy"><div class="operating-model">
            <div class="model-ring two"></div><div class="model-ring one"></div>
            <div class="model-center"><div><strong>Audience uncertainty</strong><span>Start with what the person needs to resolve.</span></div></div>
            ${[
              ['Search moments','Where do they ask?','50%','3%'],['Evidence','What helps them trust?','78%','20%'],['Surfaces','Which environment fits?','76%','68%'],['Signals','What can systems interpret?','48%','82%'],['Action','What should change?','12%','67%'],['Measurement','What did we learn?','10%','22%']
            ].map((n) => `<div class="model-node" style="left:${n[2]};top:${n[3]};transform:translate(-50%,-50%)"><strong>${n[0]}</strong><span>${n[1]}</span></div>`).join('')}
          </div></section>
          <section class="panel span-12"><div class="panel-heading"><div><span class="eyebrow">Room commitments</span><h2>What the team will carry forward</h2><p>These cards are the final proof that the workshop changed how the team thinks.</p></div></div><div class="commitment-wall" id="commitmentWall"><div class="empty-state" style="grid-column:1/-1">Commitments will appear here.</div></div></section>
        </div>`);
    }

    bindGlobalEvents() {
      $('#stageNav').addEventListener('click', (event) => {
        const button = event.target.closest('[data-stage-index]');
        if (!button) return;
        const index = Number(button.dataset.stageIndex);
        if (!this.store.isConnected && index !== 0) {
          this.toast('Join the room first', 'The live learning stages activate after you join or create a room.');
          return;
        }
        if (this.store.isFacilitator) this.goToStage(index, true);
        else if (this.followFacilitator) this.toast('Following the facilitator', 'Turn off “Follow facilitator” to review another stage independently.');
        else this.goToStage(index, false);
      });

      $('#followFacilitator').addEventListener('change', (event) => {
        this.followFacilitator = event.target.checked;
        if (this.followFacilitator && this.data.room) this.showStage(Number(this.data.room.current_stage || 0));
      });

      $('#previousStageButton').addEventListener('click', () => this.goToStage(this.currentStage - 1, this.store.isFacilitator));
      $('#nextStageButton').addEventListener('click', () => this.goToStage(this.currentStage + 1, this.store.isFacilitator));
      $('#timerFiveButton').addEventListener('click', () => this.startRoomTimer(5));
      $('#timerStopButton').addEventListener('click', () => this.stopRoomTimer());
      $('#copyRoomButton').addEventListener('click', () => this.copyRoomCode());
      $('#fullscreenButton').addEventListener('click', () => this.toggleFullscreen());
      $('#mobileMenuButton').addEventListener('click', () => $('#stageRail').classList.toggle('is-open'));

      $$('.reaction-button').forEach((button) => button.addEventListener('click', () => this.store.sendReaction(button.dataset.reaction)));

      let cursorFrame = null;
      window.addEventListener('pointermove', (event) => {
        if (!this.store.isConnected) return;
        if (Date.now() - this.lastCursorSentAt < 55) return;
        this.lastCursorSentAt = Date.now();
        if (cursorFrame) cancelAnimationFrame(cursorFrame);
        cursorFrame = requestAnimationFrame(() => this.store.sendCursor({
          nx: event.clientX / window.innerWidth,
          ny: event.clientY / window.innerHeight,
          stage: this.currentStage
        }));
      }, { passive: true });

      document.addEventListener('input', (event) => {
        const form = event.target.closest('form[data-draft]');
        if (form) this.saveDraft(form);
      });
      document.addEventListener('change', (event) => {
        const form = event.target.closest('form[data-draft]');
        if (form) this.saveDraft(form);
      });

      window.addEventListener('keydown', (event) => {
        if (event.target.matches('input, textarea, select')) return;
        if (event.key === 'ArrowRight' && this.store.isFacilitator) this.goToStage(this.currentStage + 1, true);
        if (event.key === 'ArrowLeft' && this.store.isFacilitator) this.goToStage(this.currentStage - 1, true);
      });
    }

    bindStageEvents() {
      $('#colorPicks').addEventListener('click', (event) => {
        const button = event.target.closest('[data-color]');
        if (!button) return;
        this.selectedColor = button.dataset.color;
        $$('.color-pick', $('#colorPicks')).forEach((node) => node.classList.toggle('is-selected', node === button));
      });
      $('#createRoomButton').addEventListener('click', () => this.connectRoom(true));
      $('#joinForm').addEventListener('submit', (event) => { event.preventDefault(); this.connectRoom(false); });

      $('#openingPollOptions').addEventListener('click', (event) => {
        const option = event.target.closest('[data-poll-option]');
        if (option) this.saveOpeningPoll(option.dataset.pollOption);
      });

      $('#psychologyLoop').addEventListener('click', (event) => {
        const button = event.target.closest('[data-psych-step]');
        if (!button) return;
        this.activePsychStep = button.dataset.psychStep;
        $$('.psych-step').forEach((node) => node.classList.toggle('is-active', node === button));
        this.renderPsychologyDetail();
      });
      $('#nextPsychQuiz').addEventListener('click', () => this.renderPsychQuiz(true));
      $('#psychQuizCard').addEventListener('click', (event) => {
        const option = event.target.closest('[data-psych-answer]');
        if (option) this.answerPsychQuiz(option);
      });

      $('#journeyNodes').addEventListener('click', (event) => {
        const button = event.target.closest('[data-journey-phase]');
        if (!button) return;
        this.activeJourneyPhase = button.dataset.journeyPhase;
        $$('.journey-node').forEach((node) => node.classList.toggle('is-active', node === button));
        this.renderJourneyDetail();
      });
      $('#newJourneyScenario').addEventListener('click', () => this.renderJourneyScenario(true));
      $('#journeyScenario').addEventListener('click', (event) => {
        const choice = event.target.closest('[data-journey-choice]');
        if (choice) this.answerJourneyScenario(choice);
      });

      $('#surfaceGrid').addEventListener('click', (event) => {
        const card = event.target.closest('[data-surface-card]');
        if (!card) return;
        $$('.surface-card').forEach((node) => node.classList.toggle('is-selected', node === card));
        const surface = C.surfaces.find((entry) => entry.id === card.dataset.surfaceCard);
        this.toast(surface.name, `Best at: ${surface.strength}. Limitation: ${surface.weak}`);
      });
      $('#newSurfaceMoment').addEventListener('click', () => this.renderSurfaceMatch(true));
      $('#surfaceMatch').addEventListener('click', (event) => {
        const option = event.target.closest('[data-surface-answer]');
        if (option) this.answerSurfaceMatch(option);
      });

      $('#spinWheelButton').addEventListener('click', () => this.spinWheel());
      $('#resetWheelCycleButton').addEventListener('click', () => this.resetWheelCycle());
      $('#wheelAnswerPanel').addEventListener('submit', (event) => {
        if (event.target.id === 'wheelAnswerForm') { event.preventDefault(); this.saveWheelAnswer(event.target); }
      });
      $('#wheelAnswerPanel').addEventListener('click', (event) => {
        if (event.target.closest('[data-open-roadmap]')) this.goToStage(8, this.store.isFacilitator);
      });
      $('#wheelAnswerWall').addEventListener('click', (event) => this.handleRatingClick(event, 'wheel-clarity'));

      $('#tradeoffForm').addEventListener('input', () => this.updateCreditTotal());
      $('#tradeoffForm').addEventListener('submit', (event) => { event.preventDefault(); this.saveTradeoffs(); });
      $$('.client-toggle [data-tradeoff-client]').forEach((button) => button.addEventListener('click', () => this.setTradeoffClient(button.dataset.tradeoffClient)));
      $('#aggregateClientFilter').addEventListener('change', () => this.renderTradeoffResults());

      $('#missionClientToggle').addEventListener('click', (event) => {
        const button = event.target.closest('[data-mission-client]');
        if (!button) return;
        this.activeMissionClient = button.dataset.missionClient;
        $$('[data-mission-client]').forEach((node) => node.classList.toggle('is-active', node === button));
        this.renderMissionCard();
      });
      $('#missionCard').addEventListener('click', (event) => {
        const choice = event.target.closest('[data-mission-choice]');
        if (choice) this.answerMission(choice);
        if (event.target.closest('#nextMissionButton')) this.nextMission();
      });
      $('#missionCard').addEventListener('submit', (event) => {
        if (event.target.id === 'missionReflectionForm') { event.preventDefault(); this.saveMissionReflection(event.target); }
      });

      $$('.signal-node').forEach((node) => node.addEventListener('click', () => {
        this.signalSelection[node.dataset.signalLayer] = node.dataset.signalId;
        $$(`[data-signal-layer="${node.dataset.signalLayer}"]`).forEach((entry) => entry.classList.toggle('is-selected', entry === node));
        this.renderSignalBuilder();
      }));
      $('#signalBuilder').addEventListener('submit', (event) => {
        if (event.target.id === 'signalChainForm') { event.preventDefault(); this.saveSignalChain(event.target); }
      });

      $('#roadmapTemplate').addEventListener('change', () => this.applyRoadmapTemplate());
      $('#roadmapForm').addEventListener('submit', (event) => { event.preventDefault(); this.saveRoadmapItem(event.target); });
      $('#clearRoadmapDraft').addEventListener('click', () => this.clearRoadmapForm());
      $('#roadmapFilter').addEventListener('change', (event) => { this.boardFilter = event.target.value; this.renderRoadmapBoard(); });
      $('#organizeRoadmapButton').addEventListener('click', () => this.organizeRoadmap());
      $('#roadmapBoard').addEventListener('pointerdown', (event) => this.startRoadmapDrag(event));
      $('#roadmapBoard').addEventListener('click', (event) => this.handleRoadmapClick(event));
      window.addEventListener('pointermove', (event) => this.moveRoadmapDrag(event));
      window.addEventListener('pointerup', (event) => this.endRoadmapDrag(event));

      $('#challengeForm').addEventListener('submit', (event) => { event.preventDefault(); this.saveChallengeAnswer(event.target); });
      $('#newChallengeButton').addEventListener('click', () => this.nextChallenge());
      $('#challengeResponseWall').addEventListener('click', (event) => this.handleRatingClick(event, 'teachback-clear'));

      $('#commitmentForm').addEventListener('submit', (event) => { event.preventDefault(); this.saveCommitment(event.target); });
      $('#exportCsvButton').addEventListener('click', () => this.exportCsv());
      $('#exportJsonButton').addEventListener('click', () => this.exportJson());
    }

    async connectRoom(create) {
      const form = $('#joinForm');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const roomCode = String(data.get('roomCode') || '').trim();
      if (!create && !roomCode) {
        this.toast('Room code required', 'Enter the code shown on the facilitator’s screen.', 'error');
        return;
      }
      this.setJoinLoading(true);
      const result = await this.store.connect({
        create, roomCode, name, color: this.selectedColor,
        role: create ? 'facilitator' : 'participant',
        squad: String(data.get('squad') || 'auto')
      });
      this.setJoinLoading(false);
      if (!result.ok) return;
      this.clearDraft(form);
      this.afterConnected();
    }

    setJoinLoading(loading) {
      $('#createRoomButton').disabled = loading;
      $('#joinRoomButton').disabled = loading;
      $('#createRoomButton').textContent = loading ? 'Connecting…' : 'Create live room';
      $('#joinRoomButton').textContent = loading ? 'Connecting…' : 'Join room';
    }

    afterConnected() {
      $('#joinForm').classList.add('hidden');
      $('#roomSuccess').classList.remove('hidden');
      $('#roomCodeLarge').textContent = this.data.room?.code || this.store.room?.code || '------';
      $('#roomPill').classList.remove('hidden');
      $('#timerPill').classList.remove('hidden');
      $('#followPanel').classList.toggle('hidden', this.store.isFacilitator);
      $('#facilitatorDock').classList.add('is-visible');
      this.updateDockControls();
      this.applyParticipantDefaults();
      this.renderAllLivePanels();
      if (this.data.room) this.showStage(Number(this.data.room.current_stage || 0), { force: true });
      this.toast('Room connected', this.store.isCloud ? 'Live collaboration is active across devices.' : 'Local preview mode is active. Cross-device collaboration requires Supabase.');
    }

    applyParticipantDefaults() {
      const squad = this.data.member?.squad || this.store.member?.squad;
      if (squad === 'kp' || squad === 'breezy') {
        this.activeMissionClient = squad;
        this.setTradeoffClient(squad);
        $('#roadmapClient').value = squad;
      }
      const seed = Math.abs(hash(this.data.user?.id || this.store.user?.id || ''));
      this.activeMissionIndex.breezy = seed % C.missions.breezy.length;
      this.activeMissionIndex.kp = seed % C.missions.kp.length;
      this.activeChallengeIndex = seed % C.clientObjections.length;
      this.renderMissionCard();
      this.renderChallengeCard();
    }

    onStatus({ status, detail }) {
      const pill = $('#connectionPill');
      pill.dataset.state = status;
      $('#connectionText').textContent = detail || status;
    }

    onData(data) {
      this.data = data;
      if (data.room) {
        $('#roomCodeHeader').textContent = data.room.code;
        $('#roomCodeLarge').textContent = data.room.code;
        $('#roomPill').classList.remove('hidden');
      }
      if (data.member) this.afterDataMemberReady();
      this.renderAllLivePanels();
    }

    afterDataMemberReady() {
      if (!$('#joinForm').classList.contains('hidden')) {
        $('#joinForm').classList.add('hidden');
        $('#roomSuccess').classList.remove('hidden');
      }
      $('#facilitatorDock').classList.add('is-visible');
      $('#followPanel').classList.toggle('hidden', this.store.isFacilitator);
      this.updateDockControls();
    }

    onRoomChange(room) {
      this.data.room = room;
      if (!this.store.isFacilitator && this.followFacilitator) this.showStage(Number(room.current_stage || 0));
      this.updateTimerDisplay();
    }

    onItem(item) {
      if (item.item_type === 'wheel_spin') this.renderWheelState();
    }

    onCursor(payload) {
      if (!payload || payload.user_id === this.data.user?.id || Number(payload.stage) !== this.currentStage) return;
      let node = this.cursorNodes.get(payload.user_id);
      if (!node) {
        node = document.createElement('div');
        node.className = 'remote-cursor';
        node.innerHTML = `<svg viewBox="0 0 24 28" aria-hidden="true"><path fill="${esc(payload.color || '#142a43')}" stroke="white" stroke-width="1.5" d="M2 2l18 10-8 2-4 9z"/></svg><span class="remote-cursor-label"></span>`;
        $('#cursorLayer').appendChild(node);
        this.cursorNodes.set(payload.user_id, node);
      }
      node.style.left = `${clamp(Number(payload.nx || 0), 0, 1) * 100}%`;
      node.style.top = `${clamp(Number(payload.ny || 0), 0, 1) * 100}%`;
      const label = $('.remote-cursor-label', node);
      label.textContent = payload.name || 'Participant';
      label.style.background = payload.color || '#142a43';
      node.dataset.lastSeen = String(Date.now());
      setTimeout(() => {
        if (Date.now() - Number(node.dataset.lastSeen || 0) > 2500) { node.remove(); this.cursorNodes.delete(payload.user_id); }
      }, 2800);
    }

    onReaction(payload) {
      const pop = document.createElement('div');
      pop.className = 'reaction-pop';
      pop.textContent = payload.emoji || '👏';
      pop.style.left = `${15 + Math.random() * 70}%`;
      pop.style.bottom = `${5 + Math.random() * 20}%`;
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 2300);
    }

    async goToStage(index, broadcast = false) {
      index = clamp(index, 0, C.stages.length - 1);
      this.showStage(index);
      if (broadcast && this.store.isConnected && this.store.isFacilitator) {
        try { await this.store.setStage(index); } catch (error) { this.toast('Could not synchronize stage', error.message, 'error'); }
      } else if (this.store.isConnected) this.store.updatePresenceStage(index);
    }

    showStage(index, { force = false } = {}) {
      index = clamp(Number(index) || 0, 0, C.stages.length - 1);
      if (!force && index === this.currentStage) return;
      this.currentStage = index;
      $$('.stage').forEach((stage) => stage.classList.toggle('is-active', Number(stage.dataset.stageIndex) === index));
      $$('.stage-nav-button').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.stageIndex) === index));
      const progress = ((index + 1) / C.stages.length) * 100;
      $('#progressFill').style.width = `${progress}%`;
      $('#progressLabel').textContent = `${Math.round(progress)}%`;
      $('#dockStageTitle').textContent = C.stages[index].title;
      $('#dockStageMeta').textContent = `Stage ${index + 1} of ${C.stages.length} · ${C.stages[index].minutes} min`;
      $('#previousStageButton').disabled = index === 0;
      $('#nextStageButton').disabled = index === C.stages.length - 1;
      $('#stageRail').classList.remove('is-open');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.store.updatePresenceStage(index);
      for (const [userId, node] of this.cursorNodes.entries()) { node.remove(); this.cursorNodes.delete(userId); }
    }

    updateDockControls() {
      const facilitatorOnly = ['#previousStageButton','#nextStageButton','#timerFiveButton','#timerStopButton'];
      facilitatorOnly.forEach((selector) => { $(selector).classList.toggle('hidden', !this.store.isFacilitator); });
      $('#spinWheelButton').disabled = !this.store.isFacilitator;
      $('#resetWheelCycleButton').disabled = !this.store.isFacilitator;
      $('#organizeRoadmapButton').disabled = !this.store.isFacilitator;
    }

    draftKey(form) {
      const room = this.data.room?.code || 'prejoin';
      return `${this.draftPrefix}:${room}:${form.dataset.draft}`;
    }

    saveDraft(form) {
      const value = {};
      [...form.elements].forEach((field) => {
        if (!field.name || field.type === 'button' || field.type === 'submit') return;
        if (field.type === 'radio') { if (field.checked) value[field.name] = field.value; return; }
        if (field.type === 'checkbox') { value[field.name] = field.checked; return; }
        value[field.name] = field.value;
      });
      try { sessionStorage.setItem(this.draftKey(form), JSON.stringify(value)); } catch { /* storage may be restricted */ }
    }

    restoreDraft(form) {
      let data = null;
      try { data = JSON.parse(sessionStorage.getItem(this.draftKey(form)) || 'null'); } catch { data = null; }
      if (!data) return;
      Object.entries(data).forEach(([name, value]) => {
        const fields = [...form.elements].filter((field) => field.name === name);
        fields.forEach((field) => {
          if (field.type === 'radio') field.checked = field.value === value;
          else if (field.type === 'checkbox') field.checked = Boolean(value);
          else field.value = value;
        });
      });
    }

    restoreAllDrafts() { $$('form[data-draft]').forEach((form) => this.restoreDraft(form)); }
    clearDraft(form) { try { sessionStorage.removeItem(this.draftKey(form)); } catch { /* ignore */ } }

    toast(title, message, type = 'success') {
      const node = document.createElement('div');
      node.className = `toast${type === 'error' ? ' error' : ''}`;
      node.innerHTML = `<strong>${esc(title)}</strong><span>${esc(message)}</span>`;
      $('#toastStack').appendChild(node);
      setTimeout(() => node.remove(), 4800);
    }

    copyRoomCode() {
      const code = this.data.room?.code;
      if (!code) { this.toast('No room code yet', 'Create or join a room first.'); return; }
      navigator.clipboard?.writeText(code).then(() => this.toast('Room code copied', code)).catch(() => this.toast('Room code', code));
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }

    startTimerLoop() {
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
      this.updateTimerDisplay();
    }

    async startRoomTimer(minutes) {
      if (!this.store.isFacilitator) return;
      try {
        const ends = new Date(Date.now() + minutes * 60000).toISOString();
        await this.store.updateRoom({ timer_ends_at: ends });
        this.toast('Timer started', `${minutes} minutes for this activity.`);
      } catch (error) { this.toast('Timer failed', error.message, 'error'); }
    }

    async stopRoomTimer() {
      if (!this.store.isFacilitator) return;
      try { await this.store.updateRoom({ timer_ends_at: null }); } catch (error) { this.toast('Timer failed', error.message, 'error'); }
    }

    updateTimerDisplay() {
      const ends = this.data.room?.timer_ends_at;
      if (!ends) { $('#timerDisplay').textContent = '00:00'; return; }
      const seconds = Math.ceil((new Date(ends).getTime() - Date.now()) / 1000);
      $('#timerDisplay').textContent = formatTime(seconds);
      $('#timerPill').style.borderColor = seconds <= 60 && seconds > 0 ? '#e9a8a2' : '';
      if (seconds === 0 && !$('#timerPill').dataset.finished) {
        $('#timerPill').dataset.finished = '1';
        this.onReaction({ emoji: '⏱️' });
        this.toast('Time', 'Finish the current thought and prepare to move on.');
      }
      if (seconds > 0) delete $('#timerPill').dataset.finished;
    }

    renderAllLivePanels() {
      this.renderRoster();
      this.renderOpeningPoll();
      this.renderWheelSegments();
      this.renderWheelState();
      this.renderWheelAnswers();
      this.renderTradeoffResults();
      this.renderMissionWall();
      this.renderSharedChains();
      this.renderRoadmapBoard();
      this.renderChallengeResponses();
      this.renderScoreboard();
      this.renderCommitments();
      this.updateTimerDisplay();
    }

    renderRoster() {
      const participants = this.data.participants || [];
      $('#avatarStack').innerHTML = participants.slice(0, 8).map((person) => `<span class="avatar" title="${esc(person.display_name)} · ${esc(person.role)}" style="background:${esc(person.color)}">${esc(initials(person.display_name))}</span>`).join('') + (participants.length > 8 ? `<span class="avatar" style="background:#697684">+${participants.length - 8}</span>` : '');
    }

    itemType(type) { return (this.data.items || []).filter((item) => item.item_type === type); }
    votesFor(itemId, type = null) { return (this.data.votes || []).filter((vote) => vote.item_id === itemId && (!type || vote.vote_type === type)); }
    myItem(type, predicate = () => true) { return this.itemType(type).find((item) => item.created_by === this.data.user?.id && predicate(item)); }
    participantName(userId) { return this.data.participants.find((person) => person.user_id === userId)?.display_name || 'Participant'; }

    async saveOpeningPoll(optionId) {
      if (!this.requireRoom()) return;
      try {
        await this.store.saveItem({ item_type: 'opening_poll', stage_key: 'lobby', content: { option_id: optionId } }, { singletonKey: 'opening-poll' });
        this.toast('Answer saved', 'The room result updated for everyone.');
      } catch (error) { this.toast('Could not save answer', error.message, 'error'); }
    }

    renderOpeningPoll() {
      const answers = this.itemType('opening_poll');
      const mine = answers.find((item) => item.created_by === this.data.user?.id);
      $$('.poll-option').forEach((button) => button.classList.toggle('is-selected', button.dataset.pollOption === mine?.content?.option_id));
      const counts = Object.fromEntries(C.openingPoll.options.map((option) => [option.id, 0]));
      answers.forEach((item) => { if (Object.hasOwn(counts, item.content?.option_id)) counts[item.content.option_id] += 1; });
      const max = Math.max(1, ...Object.values(counts));
      $('#openingPollResults').innerHTML = C.openingPoll.options.map((option) => `<div class="result-row"><label>${esc(option.label)}</label><div class="result-bar"><span style="width:${(counts[option.id] / max) * 100}%"></span></div><output>${counts[option.id]}</output></div>`).join('');
    }

    renderPsychologyDetail() {
      const step = C.psychologySteps.find((entry) => entry.id === this.activePsychStep) || C.psychologySteps[0];
      $('#psychologyDetail').innerHTML = `<span class="eyebrow">${step.number} · ${esc(step.label)}</span><p class="detail-quote">${esc(step.inner)}</p><p style="color:var(--muted);font-size:13px;line-height:1.6">${esc(step.plain)}</p><div class="detail-columns"><div class="detail-box"><small>SEO implication</small><p>${esc(step.seo)}</p></div><div class="detail-box"><small>Breezy example</small><p>${esc(step.breezy)}</p></div><div class="detail-box"><small>K&amp;P example</small><p>${esc(step.kp)}</p></div></div>`;
      if (!$('#psychQuizCard').dataset.quizId) this.renderPsychQuiz(false);
    }

    renderPsychQuiz(newQuestion = false) {
      let index = Number($('#psychQuizCard').dataset.quizIndex || -1);
      if (newQuestion || index < 0) index = (index + 1 + C.psychologyQuiz.length) % C.psychologyQuiz.length;
      const quiz = C.psychologyQuiz[index];
      $('#psychQuizCard').dataset.quizIndex = String(index);
      delete $('#psychQuizCard').dataset.answered;
      $('#psychQuizCard').dataset.quizId = quiz.id;
      $('#psychQuizCard').innerHTML = `<h4>${esc(quiz.prompt)}</h4><div class="quiz-options">${quiz.options.map((option, optionIndex) => `<button class="quiz-option" type="button" data-psych-answer="${optionIndex}">${esc(option)}</button>`).join('')}</div><div class="quiz-explain hidden" id="psychQuizExplain"></div>`;
    }

    async answerPsychQuiz(button) {
      if (button.closest('.quiz-card').dataset.answered) return;
      const card = button.closest('.quiz-card');
      const quiz = C.psychologyQuiz.find((entry) => entry.id === card.dataset.quizId);
      const selected = Number(button.dataset.psychAnswer);
      card.dataset.answered = '1';
      $$('[data-psych-answer]', card).forEach((node) => {
        const value = Number(node.dataset.psychAnswer);
        node.classList.add(value === quiz.answer ? 'is-correct' : value === selected ? 'is-wrong' : '');
        node.disabled = true;
      });
      const explain = $('#psychQuizExplain');
      explain.classList.remove('hidden');
      explain.innerHTML = `<strong>${selected === quiz.answer ? 'Correct.' : 'Not quite.'}</strong> ${esc(quiz.explain)}`;
      if (this.store.isConnected) {
        try { await this.store.saveItem({ item_type: 'quiz_answer', stage_key: 'psychology', content: { quiz_id: quiz.id, selected, correct: selected === quiz.answer } }, { singletonKey: `quiz-${quiz.id}` }); } catch (error) { this.toast('Answer was not saved', error.message, 'error'); }
      }
    }

    renderJourneyDetail() {
      const phase = C.journeyPhases.find((entry) => entry.id === this.activeJourneyPhase) || C.journeyPhases[0];
      $('#journeyDetail').innerHTML = `<div class="journey-detail-header"><div><span class="eyebrow">Phase ${phase.number}</span><h2>${esc(phase.title)}</h2><h3>${esc(phase.subtitle)}</h3></div><div class="journey-detail-number">${phase.number}</div></div><p class="journey-definition">${esc(phase.definition)}</p><div class="journey-question">“${esc(phase.question)}”</div><div class="phase-facts"><div class="phase-fact"><small>Common surfaces</small><div class="surface-tags">${phase.surfaces.map((surface) => `<span class="surface-tag">${esc(surface)}</span>`).join('')}</div></div><div class="phase-fact"><small>SEO’s job</small><p>${esc(phase.seoJob)}</p></div><div class="phase-fact"><small>Breezy</small><p>${esc(phase.breezy)}</p></div><div class="phase-fact"><small>K&amp;P</small><p>${esc(phase.kp)}</p></div></div><div class="phase-warning"><strong>Common mistake:</strong> ${esc(phase.mistake)}</div>`;
      if (!$('#journeyScenario').dataset.scenarioId) this.renderJourneyScenario(false);
    }

    renderJourneyScenario(newScenario = false) {
      let index = Number($('#journeyScenario').dataset.index || -1);
      if (newScenario || index < 0) index = (index + 1 + C.journeyScenarios.length) % C.journeyScenarios.length;
      const scenario = C.journeyScenarios[index];
      $('#journeyScenario').dataset.index = String(index);
      delete $('#journeyScenario').dataset.answered;
      $('#journeyScenario').dataset.scenarioId = scenario.id;
      $('#journeyScenario').innerHTML = `<div class="scenario-card"><p>${esc(scenario.text)}</p><div class="phase-choice-row">${C.journeyPhases.map((phase) => `<button class="phase-choice" type="button" data-journey-choice="${phase.id}">${esc(phase.title)}</button>`).join('')}</div><div class="quiz-explain hidden" id="journeyExplain"></div></div>`;
    }

    async answerJourneyScenario(button) {
      const container = $('#journeyScenario');
      if (container.dataset.answered) return;
      const scenario = C.journeyScenarios.find((entry) => entry.id === container.dataset.scenarioId);
      const selected = button.dataset.journeyChoice;
      container.dataset.answered = '1';
      $$('[data-journey-choice]', container).forEach((node) => {
        node.classList.add(node.dataset.journeyChoice === scenario.phase ? 'is-correct' : node === button ? 'is-wrong' : '');
        node.disabled = true;
      });
      const explain = $('#journeyExplain'); explain.classList.remove('hidden'); explain.textContent = scenario.explain;
      if (this.store.isConnected) {
        try { await this.store.saveItem({ item_type: 'journey_answer', stage_key: 'journey', content: { scenario_id: scenario.id, selected, correct: selected === scenario.phase } }, { singletonKey: `journey-${scenario.id}` }); } catch (error) { this.toast('Answer was not saved', error.message, 'error'); }
      }
    }

    renderSurfaceMatch(newMoment = false) {
      let index = Number($('#surfaceMatch').dataset.index || -1);
      if (newMoment || index < 0) index = (index + 1 + C.surfaceMoments.length) % C.surfaceMoments.length;
      const moment = C.surfaceMoments[index];
      $('#surfaceMatch').dataset.index = String(index);
      delete $('#surfaceMatch').dataset.answered;
      $('#surfaceMatch').dataset.momentId = moment.id;
      $('#surfaceMatch').innerHTML = `<div class="match-moment"><blockquote>“${esc(moment.moment)}”</blockquote><div class="match-options">${C.surfaces.map((surface) => `<button class="match-option" type="button" data-surface-answer="${surface.id}">${esc(surface.name)}</button>`).join('')}</div><div class="quiz-explain hidden" id="surfaceExplain" style="color:rgba(255,255,255,.76)"></div></div>`;
    }

    async answerSurfaceMatch(button) {
      const container = $('#surfaceMatch');
      if (container.dataset.answered) return;
      const moment = C.surfaceMoments.find((entry) => entry.id === container.dataset.momentId);
      const selected = button.dataset.surfaceAnswer;
      container.dataset.answered = '1';
      $$('[data-surface-answer]', container).forEach((node) => {
        node.classList.add(node.dataset.surfaceAnswer === moment.best ? 'is-correct' : node === button ? 'is-wrong' : '');
        node.disabled = true;
      });
      const explain = $('#surfaceExplain'); explain.classList.remove('hidden'); explain.innerHTML = `<strong>${selected === moment.best ? 'Correct.' : 'Consider the immediate task.'}</strong> ${esc(moment.why)}`;
      if (this.store.isConnected) {
        try { await this.store.saveItem({ item_type: 'surface_match', stage_key: 'surfaces', content: { moment_id: moment.id, selected, correct: selected === moment.best } }, { singletonKey: `surface-${moment.id}` }); } catch (error) { this.toast('Answer was not saved', error.message, 'error'); }
      }
    }

    renderWheelSegments() {
      const people = (this.data.participants || []).filter((person) => person.squad !== 'observer');
      const display = people.length ? people : [
        { display_name: 'Participant 1', color: '#14532d' }, { display_name: 'Participant 2', color: '#142a43' },
        { display_name: 'Participant 3', color: '#9a6a19' }, { display_name: 'Participant 4', color: '#7c3aed' }
      ];
      const segment = 360 / display.length;
      const gradient = display.map((person, index) => `${person.color || '#14532d'} ${index * segment}deg ${(index + 1) * segment}deg`).join(',');
      $('#participantWheel').style.background = `conic-gradient(${gradient})`;
      $('#wheelLabels').innerHTML = display.map((person, index) => {
        const angle = index * segment + segment / 2 - 90;
        return `<span class="wheel-label" style="transform:rotate(${angle}deg) translate(34px,-50%)">${esc(person.display_name)}</span>`;
      }).join('');
    }

    wheelSpinsSinceReset() {
      const resets = this.itemType('wheel_reset').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const resetAt = resets[0]?.created_at ? new Date(resets[0].created_at).getTime() : 0;
      return this.itemType('wheel_spin').filter((item) => new Date(item.created_at).getTime() > resetAt).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    eligibleWheelParticipants() {
      const people = (this.data.participants || []).filter((person) => person.squad !== 'observer');
      const selected = new Set(this.wheelSpinsSinceReset().map((spin) => spin.content?.winner_user_id));
      const remaining = people.filter((person) => !selected.has(person.user_id));
      return remaining.length ? remaining : people;
    }

    async spinWheel() {
      if (!this.requireRoom() || !this.store.isFacilitator) return;
      const eligible = this.eligibleWheelParticipants();
      if (!eligible.length) { this.toast('No participants yet', 'Ask the team to join the room before spinning.', 'error'); return; }
      const category = $('input[name="wheelCategory"]:checked')?.value || 'define';
      const questions = C.wheelQuestions.filter((question) => question.category === category);
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      const question = questions[Math.floor(Math.random() * questions.length)];
      this.wheelRotation += 1440 + Math.floor(Math.random() * 360);
      try {
        await this.store.saveItem({
          item_type: 'wheel_spin', stage_key: 'wheel',
          content: {
            winner_user_id: winner.user_id, winner_name: winner.display_name, winner_color: winner.color,
            question_id: question.id, category, rotation: this.wheelRotation, started_at: new Date().toISOString()
          }
        });
      } catch (error) { this.toast('The wheel could not spin', error.message, 'error'); }
    }

    async resetWheelCycle() {
      if (!this.requireRoom() || !this.store.isFacilitator) return;
      try {
        await this.store.saveItem({ item_type: 'wheel_reset', stage_key: 'wheel', content: { reset_at: new Date().toISOString() } });
        this.toast('Name cycle reset', 'Every participant is eligible again.');
      } catch (error) { this.toast('Could not reset the wheel', error.message, 'error'); }
    }

    latestWheelSpin() {
      return this.itemType('wheel_spin').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    }

    renderWheelState() {
      const spin = this.latestWheelSpin();
      if (!spin) return;
      const question = C.wheelQuestions.find((entry) => entry.id === spin.content?.question_id);
      const rotation = Number(spin.content?.rotation || 0);
      $('#participantWheel').style.transform = `rotate(${rotation}deg)`;
      $('#wheelResult').innerHTML = `<span class="winner">${esc(spin.content?.winner_name || 'Participant')} · ${esc(C.wheelCategories.find((cat) => cat.id === spin.content?.category)?.label || 'Challenge')}</span><h3>${esc(question?.prompt || 'Your turn.')}</h3><p>${esc(question?.guide || '')}</p>`;
      if (this.lastWheelSpinId === spin.id) return;
      this.lastWheelSpinId = spin.id;
      const isWinner = spin.content?.winner_user_id === this.data.user?.id;
      const canAnswer = isWinner || this.store.isFacilitator;
      const existing = this.itemType('wheel_answer').find((item) => item.content?.spin_id === spin.id && item.created_by === spin.content?.winner_user_id);
      if (existing) {
        $('#wheelAnswerPanel').innerHTML = `<span class="eyebrow">Answer saved</span><h3 style="margin:0 0 8px">${esc(existing.author_name)}</h3><p style="margin:0;color:var(--muted);font-size:12px;line-height:1.55">${esc(existing.content?.answer || '')}</p>`;
      } else {
        $('#wheelAnswerPanel').innerHTML = `<form id="wheelAnswerForm" data-draft="wheel-${spin.id}"><span class="eyebrow">${canAnswer ? (isWinner ? 'You were selected' : 'Facilitator assist') : `${esc(spin.content?.winner_name)} is answering`}</span><div class="field"><label for="wheelAnswerInput">${esc(question?.prompt || 'Answer the challenge')}</label><textarea class="textarea" id="wheelAnswerInput" name="answer" maxlength="500" placeholder="Keep it clear and client-ready…" ${canAnswer ? '' : 'disabled'} required></textarea><small>${esc(question?.guide || '')}</small></div><input type="hidden" name="spinId" value="${spin.id}"><div class="button-row" style="margin-top:12px"><button class="btn btn-primary" type="submit" ${canAnswer ? '' : 'disabled'}>Share the answer</button>${spin.content?.category === 'roadmap' ? '<button class="btn btn-secondary" type="button" data-open-roadmap>Open roadmap wall</button>' : ''}</div></form>`;
        const form = $('#wheelAnswerForm'); if (form) this.restoreDraft(form);
      }
    }

    async saveWheelAnswer(form) {
      if (!this.requireRoom()) return;
      const spin = this.latestWheelSpin();
      if (!spin || spin.id !== new FormData(form).get('spinId')) return;
      const answer = String(new FormData(form).get('answer') || '').trim();
      if (!answer) return;
      try {
        await this.store.saveItem({
          item_type: 'wheel_answer', stage_key: 'wheel',
          content: { spin_id: spin.id, question_id: spin.content?.question_id, answer, selected_user_id: spin.content?.winner_user_id }
        }, { singletonKey: `wheel-answer-${spin.id}` });
        this.clearDraft(form);
        $('#wheelAnswerPanel').innerHTML = `<span class="eyebrow">Answer saved</span><h3 style="margin:0 0 8px">${esc(this.data.member?.display_name || 'Participant')}</h3><p style="margin:0;color:var(--muted);font-size:12px;line-height:1.55">${esc(answer)}</p>`;
        this.toast('Answer shared', 'The team can now rate the explanation.');
      } catch (error) { this.toast('Answer not saved', `${error.message}. Your text is still in the form.`, 'error'); }
    }

    renderWheelAnswers() {
      const answers = this.itemType('wheel_answer').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
      if (!answers.length) { $('#wheelAnswerWall').innerHTML = '<div class="empty-state">Answers will appear here for the full team.</div>'; return; }
      $('#wheelAnswerWall').innerHTML = answers.map((item) => {
        const question = C.wheelQuestions.find((entry) => entry.id === item.content?.question_id);
        const votes = this.votesFor(item.id, 'wheel-clarity');
        const clear = votes.filter((vote) => Number(vote.value) > 0).length;
        const mine = votes.find((vote) => vote.user_id === this.data.user?.id);
        return `<article class="wheel-answer-card${item.created_by === this.data.user?.id ? ' is-mine' : ''}"><span class="eyebrow">${esc(item.author_name)}</span><strong style="display:block;font-size:11px;line-height:1.4">${esc(question?.prompt || '')}</strong><p style="color:var(--muted);font-size:11px;line-height:1.5">${esc(item.content?.answer || '')}</p><div class="live-rating"><button class="rating-button${Number(mine?.value) > 0 ? ' is-selected' : ''}" type="button" data-rate-item="${item.id}" data-rate-value="1">Clear · ${clear}</button><button class="rating-button${Number(mine?.value) < 0 ? ' is-selected' : ''}" type="button" data-rate-item="${item.id}" data-rate-value="-1">Needs one clearer sentence</button></div></article>`;
      }).join('');
    }

    async handleRatingClick(event, voteType) {
      const button = event.target.closest('[data-rate-item]');
      if (!button || !this.requireRoom()) return;
      try {
        await this.store.castVote(button.dataset.rateItem, voteType, Number(button.dataset.rateValue));
      } catch (error) { this.toast('Rating not saved', error.message, 'error'); }
    }

    updateCreditTotal() {
      const ranges = $$('.tradeoff-range');
      const total = ranges.reduce((sum, range) => sum + Number(range.value), 0);
      ranges.forEach((range) => { $(`[data-credit-output="${range.name}"]`).textContent = range.value; });
      $('#creditTotal').textContent = total;
      const percent = clamp(total, 0, 100);
      $('#creditTrack span').style.width = `${percent}%`;
      $('#creditTrack').classList.toggle('is-over', total > 100);
      $('#saveTradeoffsButton').disabled = total !== 100;
      $('#creditGuide').textContent = total === 100 ? 'You have used every credit. Saving is available.' : total < 100 ? `${100 - total} credits remain.` : `Reduce the plan by ${total - 100} credits.`;
      this.saveDraft($('#tradeoffForm'));
    }

    setTradeoffClient(client) {
      if (!['breezy','kp'].includes(client)) return;
      $('#tradeoffClient').value = client;
      $$('[data-tradeoff-client]').forEach((button) => button.classList.toggle('is-active', button.dataset.tradeoffClient === client));
      const saved = this.itemType('tradeoff_allocation').find((item) => item.created_by === this.data.user?.id && item.content?.client === client);
      const defaultValues = { answers: 15, proof: 15, community: 10, video: 10, local: 10, entity: 15, experience: 15, measurement: 10 };
      const values = saved?.content?.allocations || defaultValues;
      $$('.tradeoff-range').forEach((range) => { range.value = values[range.name] ?? defaultValues[range.name] ?? 0; });
      $('#tradeoffSaveStatus').textContent = saved ? 'Saved for this client' : 'Not saved yet';
      this.updateCreditTotal();
    }

    async saveTradeoffs() {
      if (!this.requireRoom()) return;
      const client = $('#tradeoffClient').value;
      const allocations = Object.fromEntries($$('.tradeoff-range').map((range) => [range.name, Number(range.value)]));
      const total = Object.values(allocations).reduce((sum, value) => sum + value, 0);
      if (total !== 100) { this.toast('Use exactly 100 credits', 'The allocation must total 100 before it can be saved.', 'error'); return; }
      try {
        await this.store.saveItem({ item_type: 'tradeoff_allocation', stage_key: 'tradeoffs', client_key: client, content: { client, allocations, total } }, { singletonKey: `tradeoff-${client}` });
        this.clearDraft($('#tradeoffForm'));
        $('#tradeoffSaveStatus').textContent = 'Saved and shared';
        this.toast('Allocation saved', 'Every participant can now see it in the room-wide result.');
      } catch (error) { this.toast('Allocation not saved', `${error.message}. Your slider values remain in place.`, 'error'); }
    }

    renderTradeoffResults() {
      const client = $('#aggregateClientFilter')?.value || 'breezy';
      const allocations = this.itemType('tradeoff_allocation').filter((item) => item.content?.client === client);
      if (!allocations.length) {
        $('#tradeoffAggregate').innerHTML = '<div class="empty-state">Save the first allocation to create the aggregate.</div>';
        $('#tradeoffCards').innerHTML = '';
        return;
      }
      const averages = {};
      C.tradeoffSignals.forEach((signal) => {
        averages[signal.id] = allocations.reduce((sum, item) => sum + Number(item.content?.allocations?.[signal.id] || 0), 0) / allocations.length;
      });
      const max = Math.max(1, ...Object.values(averages));
      $('#tradeoffAggregate').innerHTML = C.tradeoffSignals.map((signal) => `<div class="aggregate-row"><label>${esc(signal.label)}</label><div class="aggregate-bar"><span style="width:${(averages[signal.id] / max) * 100}%"></span></div><output>${averages[signal.id].toFixed(1)}</output></div>`).join('');
      $('#tradeoffCards').innerHTML = allocations.map((item) => `<article class="allocation-card"><header><strong>${esc(item.author_name)}</strong><span>${client === 'breezy' ? 'Breezy' : 'K&P'}</span></header><div class="mini-bars">${C.tradeoffSignals.map((signal) => `<div class="mini-bar"><span>${esc(signal.label.split(' ')[0])}</span><i><span style="width:${Math.min(100, Number(item.content?.allocations?.[signal.id] || 0) * 2.5)}%"></span></i><b>${Number(item.content?.allocations?.[signal.id] || 0)}</b></div>`).join('')}</div></article>`).join('');
    }

    currentMission() {
      return C.missions[this.activeMissionClient][this.activeMissionIndex[this.activeMissionClient] % C.missions[this.activeMissionClient].length];
    }

    renderMissionCard() {
      const mission = this.currentMission();
      const existing = this.itemType('mission_response').find((item) => item.created_by === this.data.user?.id && item.content?.mission_id === mission.id);
      $('#missionCard').innerHTML = `<article class="mission-card"><span class="eyebrow">${this.activeMissionClient === 'breezy' ? 'Breezy Golf' : 'K&P Attorney'} · ${esc(mission.title)}</span><h3>What should the strategy do next?</h3><div class="mission-scenario">${esc(mission.scenario)}</div><div class="mission-meta"><span class="meta-chip">Journey: ${esc(C.journeyPhases.find((phase) => phase.id === mission.phase)?.title || mission.phase)}</span><span class="meta-chip">Surface: ${esc(C.surfaces.find((surface) => surface.id === mission.surface)?.name || mission.surface)}</span></div><div class="mission-choices">${mission.choices.map((choice, index) => `<button class="mission-choice${existing ? (index === mission.answer ? ' is-correct' : index === Number(existing.content?.selected) ? ' is-wrong' : '') : ''}" type="button" data-mission-choice="${index}" ${existing ? 'disabled' : ''}>${esc(choice)}</button>`).join('')}</div><div id="missionReflectionArea" style="margin-top:14px">${existing ? this.missionReflectionMarkup(mission, existing) : ''}</div><div class="button-row" style="margin-top:14px"><button class="btn btn-secondary btn-small" id="nextMissionButton" type="button">Try another micro-mission</button></div></article>`;
      const form = $('#missionReflectionForm'); if (form) this.restoreDraft(form);
    }

    missionReflectionMarkup(mission, existing) {
      return `<div class="inline-note"><strong>${Number(existing.content?.selected) === mission.answer ? 'Strong choice.' : 'Consider the strategic fit.'}</strong> ${esc(mission.insight)}</div><form id="missionReflectionForm" data-draft="mission-${mission.id}" style="margin-top:12px"><div class="field"><label for="missionNote">Explain the lesson in one sentence</label><textarea class="textarea" id="missionNote" name="note" maxlength="300" placeholder="The user needs… so the strategy should…">${esc(existing.content?.note || '')}</textarea></div><button class="btn btn-primary btn-small" type="submit" style="margin-top:10px">${existing.content?.note ? 'Update sentence' : 'Share sentence'}</button></form>`;
    }

    async answerMission(button) {
      if (!this.requireRoom()) return;
      const mission = this.currentMission();
      const selected = Number(button.dataset.missionChoice);
      try {
        const saved = await this.store.saveItem({ item_type: 'mission_response', stage_key: 'missions', client_key: this.activeMissionClient, content: { mission_id: mission.id, client: this.activeMissionClient, selected, correct: selected === mission.answer, phase: mission.phase, surface: mission.surface, note: '' } }, { singletonKey: `mission-${mission.id}` });
        $$('.mission-choice', $('#missionCard')).forEach((node) => {
          const value = Number(node.dataset.missionChoice);
          node.classList.add(value === mission.answer ? 'is-correct' : value === selected ? 'is-wrong' : '');
          node.disabled = true;
        });
        $('#missionReflectionArea').innerHTML = this.missionReflectionMarkup(mission, saved);
        const form = $('#missionReflectionForm'); if (form) this.restoreDraft(form);
      } catch (error) { this.toast('Mission answer not saved', error.message, 'error'); }
    }

    async saveMissionReflection(form) {
      if (!this.requireRoom()) return;
      const mission = this.currentMission();
      const existing = this.itemType('mission_response').find((item) => item.created_by === this.data.user?.id && item.content?.mission_id === mission.id);
      if (!existing) return;
      const note = String(new FormData(form).get('note') || '').trim();
      try {
        await this.store.saveItem({ ...existing, content: { ...existing.content, note } }, { singletonKey: `mission-${mission.id}` });
        this.clearDraft(form);
        this.toast('Lesson shared', 'The room can see your one-sentence interpretation.');
      } catch (error) { this.toast('Sentence not saved', `${error.message}. Your text remains in place.`, 'error'); }
    }

    nextMission() {
      this.activeMissionIndex[this.activeMissionClient] = (this.activeMissionIndex[this.activeMissionClient] + 1) % C.missions[this.activeMissionClient].length;
      this.renderMissionCard();
    }

    renderMissionWall() {
      const responses = this.itemType('mission_response').sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)).slice(0, 10);
      if (!responses.length) { $('#missionWall').innerHTML = '<div class="empty-state">Completed micro-missions will appear here.</div>'; return; }
      $('#missionWall').innerHTML = responses.map((item) => {
        const client = item.content?.client;
        const mission = C.missions[client]?.find((entry) => entry.id === item.content?.mission_id);
        return `<article class="mission-response"><header><strong>${esc(item.author_name)} · ${client === 'kp' ? 'K&P' : 'Breezy'}</strong><span>${esc(C.journeyPhases.find((phase) => phase.id === item.content?.phase)?.title || '')}</span></header><p><strong>${esc(mission?.title || 'Micro-mission')}:</strong> ${esc(item.content?.note || mission?.insight || '')}</p></article>`;
      }).join('');
    }

    renderSignalBuilder() {
      const getNode = (layer) => C.signalLayers[layer].find((node) => node.id === this.signalSelection[layer]);
      const h = getNode('human'), m = getNode('machine'), b = getNode('business');
      $('#signalBuilder').innerHTML = `<form id="signalChainForm" data-draft="signal-chain"><div class="chain-builder"><div class="phase-fact"><small>Human</small><p>${h ? esc(h.label) : 'Select a human cue above'}</p></div><div class="chain-arrow">→</div><div class="phase-fact"><small>Machine</small><p>${m ? esc(m.label) : 'Select a machine signal above'}</p></div><div class="chain-arrow">→</div><div class="phase-fact"><small>Business</small><p>${b ? esc(b.label) : 'Select a business outcome above'}</p></div></div><div class="form-grid" style="margin-top:14px"><div class="field full"><label for="signalRationale">Why does this chain matter? <span style="color:var(--muted);font-weight:500">(optional)</span></label><input class="input" id="signalRationale" name="rationale" maxlength="240" placeholder="For example: recent reviews reduce risk, create review signals, and improve consultation conversion."></div><div class="full"><button class="btn btn-primary" type="submit" ${h && m && b ? '' : 'disabled'}>Add this chain to the room</button></div></div></form>`;
      const form = $('#signalChainForm'); if (form) this.restoreDraft(form);
    }

    async saveSignalChain(form) {
      if (!this.requireRoom()) return;
      const { human, machine, business } = this.signalSelection;
      if (!human || !machine || !business) return;
      const rationale = String(new FormData(form).get('rationale') || '').trim();
      try {
        await this.store.saveItem({ item_type: 'signal_chain', stage_key: 'signals', content: { human, machine, business, rationale } });
        this.clearDraft(form);
        form.reset();
        this.signalSelection = { human: '', machine: '', business: '' };
        $$('.signal-node').forEach((node) => node.classList.remove('is-selected'));
        this.renderSignalBuilder();
        this.toast('Evidence chain added', 'The relationship is now visible to the room.');
      } catch (error) { this.toast('Chain not saved', `${error.message}. Your explanation remains in the form.`, 'error'); }
    }

    renderSharedChains() {
      const chains = this.itemType('signal_chain').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      if (!chains.length) { $('#sharedChains').innerHTML = '<div class="empty-state">The room’s evidence chains will appear here.</div>'; return; }
      $('#sharedChains').innerHTML = chains.map((item) => {
        const h = C.signalLayers.human.find((node) => node.id === item.content?.human);
        const m = C.signalLayers.machine.find((node) => node.id === item.content?.machine);
        const b = C.signalLayers.business.find((node) => node.id === item.content?.business);
        return `<article class="shared-chain"><div><strong>${esc(h?.label || '')}</strong><span>${esc(item.author_name)}</span></div><div class="arrow">→</div><div><strong>${esc(m?.label || '')}</strong><span>${esc(item.content?.rationale || 'Machine-readable evidence')}</span></div><div class="arrow">→</div><div><strong>${esc(b?.label || '')}</strong><span>Business effect</span></div></article>`;
      }).join('');
    }

    applyRoadmapTemplate() {
      const template = C.roadmapTemplates.find((entry) => entry.id === $('#roadmapTemplate').value) || C.roadmapTemplates[0];
      if (!$('#roadmapAction').value.trim()) $('#roadmapAction').value = template.starter;
      $('#roadmapOwner').value = template.owner;
      this.saveDraft($('#roadmapForm'));
    }

    async saveRoadmapItem(form) {
      if (!this.requireRoom() || !form.reportValidity()) return;
      const data = new FormData(form);
      const action = String(data.get('action') || '').trim();
      const client = String(data.get('client') || 'breezy');
      const existingCount = this.itemType('roadmap_item').length;
      const board = $('#roadmapBoard');
      const columns = Math.max(1, Math.floor((board.clientWidth - 40) / 270));
      const positionX = 24 + (existingCount % columns) * 270;
      const positionY = 74 + Math.floor(existingCount / columns) * 200;
      try {
        await this.store.saveItem({
          item_type: 'roadmap_item', stage_key: 'roadmap', client_key: client,
          position_x: positionX, position_y: positionY,
          content: {
            client, phase: String(data.get('phase')), template: String(data.get('template')),
            action, owner: String(data.get('owner') || ''), horizon: String(data.get('horizon') || ''),
            impact: String(data.get('impact') || ''), evidence: String(data.get('evidence') || '')
          }
        });
        this.clearDraft(form);
        this.clearRoadmapForm();
        this.toast('Roadmap move added', 'The card is live, draggable, and visible to everyone.');
      } catch (error) { this.toast('Roadmap item not saved', `${error.message}. Your form remains unchanged.`, 'error'); }
    }

    clearRoadmapForm() {
      const form = $('#roadmapForm');
      form.reset();
      $('#roadmapAction').value = C.roadmapTemplates[0].starter;
      $('#roadmapOwner').value = C.roadmapTemplates[0].owner;
      this.clearDraft(form);
    }

    renderRoadmapBoard() {
      if (this.dragState) return;
      const board = $('#roadmapBoard');
      if (!board) return;
      $$('.roadmap-card', board).forEach((card) => card.remove());
      const items = this.itemType('roadmap_item').filter((item) => this.boardFilter === 'all' || item.content?.client === this.boardFilter);
      $('#roadmapEmpty').classList.toggle('hidden', items.length > 0);
      items.forEach((item) => {
        const votes = this.votesFor(item.id, 'roadmap-priority');
        const mine = votes.some((vote) => vote.user_id === this.data.user?.id && Number(vote.value) > 0);
        const canDelete = item.created_by === this.data.user?.id || this.store.isFacilitator;
        const phase = C.journeyPhases.find((entry) => entry.id === item.content?.phase);
        const card = document.createElement('article');
        card.className = 'roadmap-card';
        card.dataset.itemId = item.id;
        card.dataset.client = item.content?.client || 'breezy';
        card.style.left = `${Number(item.position_x || 20)}px`;
        card.style.top = `${Number(item.position_y || 80)}px`;
        card.innerHTML = `<header data-drag-handle><div><span class="client-label">${item.content?.client === 'kp' ? 'K&P Attorney' : 'Breezy Golf'}</span><h4>${esc(item.content?.action || 'Roadmap move')}</h4></div>${canDelete ? `<button class="btn btn-ghost btn-small" type="button" data-delete-roadmap="${item.id}" aria-label="Delete roadmap card">×</button>` : ''}</header><p><strong>${esc(phase?.title || '')}</strong> · ${esc(item.content?.impact || '')}</p><p style="margin-top:6px">Owner: ${esc(item.content?.owner || 'TBD')}<br>Horizon: ${esc(item.content?.horizon || '')}<br>Evidence: ${esc(item.content?.evidence || '')}</p><footer><span>${esc(item.author_name)}</span><button class="vote-control${mine ? ' is-selected' : ''}" type="button" data-roadmap-vote="${item.id}">Priority · ${votes.filter((vote) => Number(vote.value) > 0).length}</button></footer>`;
        board.appendChild(card);
      });
    }

    async handleRoadmapClick(event) {
      const voteButton = event.target.closest('[data-roadmap-vote]');
      if (voteButton) {
        if (!this.requireRoom()) return;
        const itemId = voteButton.dataset.roadmapVote;
        const mine = this.votesFor(itemId, 'roadmap-priority').find((vote) => vote.user_id === this.data.user?.id);
        try { if (mine) await this.store.removeVote(itemId, 'roadmap-priority'); else await this.store.castVote(itemId, 'roadmap-priority', 1); } catch (error) { this.toast('Vote not saved', error.message, 'error'); }
        return;
      }
      const deleteButton = event.target.closest('[data-delete-roadmap]');
      if (deleteButton) {
        if (!confirm('Remove this roadmap card from the shared wall?')) return;
        try { await this.store.deleteItem(deleteButton.dataset.deleteRoadmap); } catch (error) { this.toast('Card not deleted', error.message, 'error'); }
      }
    }

    startRoadmapDrag(event) {
      const handle = event.target.closest('[data-drag-handle]');
      const card = event.target.closest('.roadmap-card');
      if (!handle || !card || event.target.closest('button')) return;
      const item = this.itemType('roadmap_item').find((entry) => entry.id === card.dataset.itemId);
      if (!item || (item.created_by !== this.data.user?.id && !this.store.isFacilitator)) return;
      const boardRect = $('#roadmapBoard').getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      this.dragState = { item, card, offsetX: event.clientX - cardRect.left, offsetY: event.clientY - cardRect.top, boardRect };
      card.classList.add('is-dragging');
      card.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }

    moveRoadmapDrag(event) {
      if (!this.dragState) return;
      const { card, offsetX, offsetY, boardRect } = this.dragState;
      const x = clamp(event.clientX - boardRect.left - offsetX, 8, Math.max(8, boardRect.width - card.offsetWidth - 8));
      const y = clamp(event.clientY - boardRect.top - offsetY, 54, Math.max(54, boardRect.height - card.offsetHeight - 8));
      card.style.left = `${x}px`; card.style.top = `${y}px`;
      this.dragState.x = x; this.dragState.y = y;
    }

    async endRoadmapDrag(event) {
      if (!this.dragState) return;
      const state = this.dragState;
      this.dragState = null;
      state.card.classList.remove('is-dragging');
      state.card.releasePointerCapture?.(event.pointerId);
      if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return;
      try { await this.store.saveItem({ ...state.item, position_x: state.x, position_y: state.y, content: state.item.content }); } catch (error) { this.toast('Card position not saved', error.message, 'error'); }
    }

    async organizeRoadmap() {
      if (!this.store.isFacilitator) return;
      const board = $('#roadmapBoard');
      const items = this.itemType('roadmap_item');
      const width = Math.max(520, board.clientWidth);
      const cardW = 260;
      const columns = Math.max(2, Math.floor((width - 40) / cardW));
      try {
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          const clientOffset = item.content?.client === 'kp' ? Math.floor(columns / 2) : 0;
          const localIndex = items.slice(0, index).filter((entry) => entry.content?.client === item.content?.client).length;
          const clientColumns = Math.max(1, Math.floor(columns / 2));
          const x = 20 + (clientOffset + (localIndex % clientColumns)) * cardW;
          const y = 74 + Math.floor(localIndex / clientColumns) * 195;
          await this.store.saveItem({ ...item, position_x: x, position_y: y, content: item.content });
        }
        this.toast('Roadmap organized', 'Breezy and K&P cards have been grouped.');
      } catch (error) { this.toast('Auto-organize stopped', error.message, 'error'); }
    }

    renderChallengeCard() {
      const challenge = C.clientObjections[this.activeChallengeIndex % C.clientObjections.length];
      $('#challengeCard').dataset.challengeId = challenge.id;
      $('#challengeCard').innerHTML = `<span class="eyebrow" style="color:#b9e6c8">Client objection</span><blockquote>${esc(challenge.prompt)}</blockquote><p class="guide"><strong>Strong answer should communicate:</strong> ${esc(challenge.guide)}</p>`;
    }

    nextChallenge() {
      this.activeChallengeIndex = (this.activeChallengeIndex + 1) % C.clientObjections.length;
      this.renderChallengeCard();
      $('#challengeAnswer').value = '';
      this.clearDraft($('#challengeForm'));
    }

    async saveChallengeAnswer(form) {
      if (!this.requireRoom() || !form.reportValidity()) return;
      const challengeId = $('#challengeCard').dataset.challengeId;
      const answer = String(new FormData(form).get('answer') || '').trim();
      try {
        await this.store.saveItem({ item_type: 'teachback_response', stage_key: 'teachback', content: { challenge_id: challengeId, answer } }, { singletonKey: `teachback-${challengeId}` });
        this.clearDraft(form);
        form.reset();
        this.toast('Client answer shared', 'The team can now rate its clarity.');
      } catch (error) { this.toast('Answer not saved', `${error.message}. Your response remains in the form.`, 'error'); }
    }

    renderChallengeResponses() {
      const responses = this.itemType('teachback_response').sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      if (!responses.length) { $('#challengeResponseWall').innerHTML = '<div class="empty-state span-12">Shared responses will appear here.</div>'; return; }
      $('#challengeResponseWall').innerHTML = responses.map((item) => {
        const challenge = C.clientObjections.find((entry) => entry.id === item.content?.challenge_id);
        const ratings = this.votesFor(item.id, 'teachback-clear');
        const positive = ratings.filter((vote) => Number(vote.value) > 0).length;
        const mine = ratings.find((vote) => vote.user_id === this.data.user?.id);
        return `<article class="challenge-response span-6"><header><strong>${esc(item.author_name)}</strong><span class="pill navy">${positive} clear ratings</span></header><p><strong>${esc(challenge?.prompt || '')}</strong></p><p>${esc(item.content?.answer || '')}</p><div class="live-rating"><button class="rating-button${Number(mine?.value) > 0 ? ' is-selected' : ''}" type="button" data-rate-item="${item.id}" data-rate-value="1">Clear and useful</button><button class="rating-button${Number(mine?.value) < 0 ? ' is-selected' : ''}" type="button" data-rate-item="${item.id}" data-rate-value="-1">Needs less jargon</button></div></article>`;
      }).join('');
    }

    scoreFor(userId) {
      const mine = this.data.items.filter((item) => item.created_by === userId);
      let score = 0;
      score += mine.filter((item) => item.item_type === 'quiz_answer' && item.content?.correct).length * 2;
      score += mine.filter((item) => item.item_type === 'journey_answer' && item.content?.correct).length * 2;
      score += mine.filter((item) => item.item_type === 'surface_match' && item.content?.correct).length * 2;
      score += mine.filter((item) => item.item_type === 'wheel_answer').length * 3;
      score += mine.filter((item) => item.item_type === 'tradeoff_allocation').length * 2;
      score += mine.filter((item) => item.item_type === 'mission_response' && item.content?.correct).length * 2;
      score += mine.filter((item) => item.item_type === 'signal_chain').length * 2;
      score += mine.filter((item) => item.item_type === 'roadmap_item').length * 4;
      score += mine.filter((item) => item.item_type === 'teachback_response').length * 3;
      score += mine.filter((item) => item.item_type === 'commitment').length;
      const itemIds = new Set(mine.map((item) => item.id));
      score += this.data.votes.filter((vote) => itemIds.has(vote.item_id) && Number(vote.value) > 0).length;
      return score;
    }

    renderScoreboard() {
      const people = (this.data.participants || []).map((person) => ({ ...person, score: this.scoreFor(person.user_id) })).sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name));
      if (!people.length) { $('#scoreboard').innerHTML = '<div class="empty-state">Scores will appear as the room participates.</div>'; return; }
      $('#scoreboard').innerHTML = people.map((person, index) => `<div class="score-row"><span class="score-rank">${index + 1}</span><span class="score-name">${esc(person.display_name)}</span><span class="score-points">${person.score} pts</span></div>`).join('');
    }

    async saveCommitment(form) {
      if (!this.requireRoom() || !form.reportValidity()) return;
      const data = new FormData(form);
      const content = {
        definition: String(data.get('definition') || '').trim(),
        behavior: String(data.get('behavior') || '').trim(),
        client: String(data.get('client') || '').trim()
      };
      try {
        await this.store.saveItem({ item_type: 'commitment', stage_key: 'debrief', content }, { singletonKey: 'final-commitment' });
        this.clearDraft(form);
        this.toast('Commitment saved', 'Your closing card is now visible to the room.');
      } catch (error) { this.toast('Commitment not saved', `${error.message}. Your responses remain in the form.`, 'error'); }
    }

    renderCommitments() {
      const commitments = this.itemType('commitment').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      if (!commitments.length) { $('#commitmentWall').innerHTML = '<div class="empty-state" style="grid-column:1/-1">Commitments will appear here.</div>'; return; }
      $('#commitmentWall').innerHTML = commitments.map((item) => `<article class="commitment-card"><small>${esc(item.author_name)}</small><p><strong>Search Everywhere is:</strong> ${esc(item.content?.definition || '')}</p><p><strong>I will change:</strong> ${esc(item.content?.behavior || '')}</p><span>Apply to: ${esc(item.content?.client || '')}</span></article>`).join('');
    }

    exportCsv() {
      if (!this.requireRoom()) return;
      const rows = [['Room','Item Type','Stage','Client','Author','Created','Summary','Details','Votes']];
      this.data.items.forEach((item) => {
        let summary = '', details = '';
        switch (item.item_type) {
          case 'opening_poll': summary = item.content?.option_id; break;
          case 'wheel_answer': summary = item.content?.answer; details = item.content?.question_id; break;
          case 'tradeoff_allocation': summary = `${item.content?.client} allocation`; details = JSON.stringify(item.content?.allocations || {}); break;
          case 'mission_response': summary = item.content?.note || item.content?.mission_id; details = JSON.stringify({ correct: item.content?.correct, phase: item.content?.phase, surface: item.content?.surface }); break;
          case 'signal_chain': summary = `${item.content?.human} → ${item.content?.machine} → ${item.content?.business}`; details = item.content?.rationale; break;
          case 'roadmap_item': summary = item.content?.action; details = JSON.stringify({ phase: item.content?.phase, owner: item.content?.owner, horizon: item.content?.horizon, impact: item.content?.impact, evidence: item.content?.evidence }); break;
          case 'teachback_response': summary = item.content?.answer; details = item.content?.challenge_id; break;
          case 'commitment': summary = item.content?.definition; details = JSON.stringify({ behavior: item.content?.behavior, client: item.content?.client }); break;
          default: summary = JSON.stringify(item.content || {});
        }
        rows.push([
          this.data.room?.code || '', item.item_type, item.stage_key, item.client_key, item.author_name,
          item.created_at, summary, details, this.votesFor(item.id).filter((vote) => Number(vote.value) > 0).length
        ]);
      });
      download(`search-everywhere-${this.data.room?.code || 'room'}-results.csv`, rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
    }

    exportJson() {
      if (!this.requireRoom()) return;
      download(`search-everywhere-${this.data.room?.code || 'room'}-backup.json`, JSON.stringify(this.store.exportSnapshot(), null, 2), 'application/json');
    }

    requireRoom() {
      if (this.store.isConnected) return true;
      this.toast('Join the workshop room', 'Create or join a room before saving a shared response.', 'error');
      this.showStage(0);
      return false;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new SearchEverywhereLab();
    window.searchEverywhereLab = app;
    app.init();
    app.updateCreditTotal();
    app.applyRoadmapTemplate();
  });
})();
