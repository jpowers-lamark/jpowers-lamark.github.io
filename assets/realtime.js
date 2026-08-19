const CONFIG = window.SE_CONFIG || {};
const SUPABASE_MODULE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/+esm';

const clone = (value) => value == null ? value : structuredClone(value);
const randomId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const normalizeCode = (value = '') => String(value).toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 8);
const createCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 7 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

class WorkshopRealtime extends EventTarget {
  constructor() {
    super();
    this.mode = 'disconnected';
    this.client = null;
    this.user = null;
    this.room = null;
    this.profile = null;
    this.items = new Map();
    this.votes = new Map();
    this.presence = new Map();
    this.channel = null;
    this.localChannel = null;
    this.localKey = '';
    this.localHeartbeat = null;
    this.localCleanup = null;
    this.subscriptions = [];
    this.pendingCursor = null;
    this.cursorFrame = null;
    this.localMemory = {};
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail: clone(detail) }));
  }

  on(type, handler) {
    const wrapped = (event) => handler(event.detail);
    this.addEventListener(type, wrapped);
    return () => this.removeEventListener(type, wrapped);
  }

  configured() {
    return Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  }

  async connect({ roomCode = '', profile, create = false } = {}) {
    this.profile = { ...profile };
    const code = normalizeCode(roomCode) || createCode();
    if (this.configured()) {
      try {
        return await this.connectSupabase({ code, create });
      } catch (error) {
        console.error('Supabase connection failed. Falling back to local demo mode.', error);
        this.emit('warning', {
          title: 'Live cloud collaboration unavailable',
          message: 'The workshop opened in local demo mode. Separate tabs on this device still synchronize.',
          error: error?.message || String(error)
        });
      }
    }
    return this.connectLocal({ code, create });
  }

  async connectSupabase({ code, create }) {
    const { createClient } = await import(SUPABASE_MODULE);
    this.client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 30 } }
    });

    let { data: sessionData, error: sessionError } = await this.client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
      const { data, error } = await this.client.auth.signInAnonymously();
      if (error) throw error;
      sessionData = { session: data.session };
    }
    this.user = sessionData.session.user;

    const rpcName = create ? 'create_workshop_room' : 'join_workshop_room';
    const { data: rpcData, error: rpcError } = await this.client.rpc(rpcName, {
      p_code: code,
      p_display_name: this.profile.name,
      p_team: this.profile.team,
      p_color: this.profile.color
    });
    if (rpcError) throw rpcError;
    const room = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!room?.id) throw new Error(create ? 'The workshop room could not be created.' : 'That workshop code was not found.');
    this.room = room;
    this.mode = 'supabase';

    await this.fetchInitialState();
    await this.subscribeSupabase();
    this.emit('connection', this.connectionSnapshot('connected'));
    return this.connectionSnapshot('connected');
  }

  async fetchInitialState() {
    const [roomResult, itemResult, voteResult] = await Promise.all([
      this.client.from('workshop_rooms').select('*').eq('id', this.room.id).single(),
      this.client.from('workshop_items').select('*').eq('room_id', this.room.id).order('created_at', { ascending: true }),
      this.client.from('workshop_votes').select('*').eq('room_id', this.room.id)
    ]);
    if (roomResult.error) throw roomResult.error;
    if (itemResult.error) throw itemResult.error;
    if (voteResult.error) throw voteResult.error;
    this.room = roomResult.data;
    this.items = new Map((itemResult.data || []).map((item) => [item.id, item]));
    this.votes = new Map((voteResult.data || []).map((vote) => [`${vote.target_key}:${vote.user_id}`, vote]));
    this.emit('room', this.room);
    this.emit('items', [...this.items.values()]);
    this.emit('votes', [...this.votes.values()]);
  }

  async subscribeSupabase() {
    const topic = `workshop:${this.room.id}`;
    this.channel = this.client.channel(topic, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: this.user.id }
      }
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const raw = this.channel.presenceState();
        const flattened = new Map();
        Object.entries(raw).forEach(([key, records]) => {
          const latest = Array.isArray(records) ? records.at(-1) : records;
          if (latest) flattened.set(key, latest);
        });
        this.presence = flattened;
        this.emit('presence', [...flattened.values()]);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => this.emit('cursor', payload))
      .on('broadcast', { event: 'reaction' }, ({ payload }) => this.emit('reaction', payload))
      .on('broadcast', { event: 'card_move' }, ({ payload }) => this.emit('card_move', payload))
      .on('broadcast', { event: 'activity' }, ({ payload }) => this.emit('activity', payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track(this.presencePayload());
          this.emit('connection', this.connectionSnapshot('connected'));
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.emit('connection', this.connectionSnapshot('reconnecting'));
        }
      });

    const roomSubscription = this.client
      .channel(`room-row:${this.room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'workshop_rooms', filter: `id=eq.${this.room.id}`
      }, ({ new: row }) => {
        this.room = row;
        this.emit('room', row);
      })
      .subscribe();

    const itemSubscription = this.client
      .channel(`items:${this.room.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'workshop_items', filter: `room_id=eq.${this.room.id}`
      }, ({ eventType, new: next, old }) => {
        if (eventType === 'DELETE') this.items.delete(old.id);
        else this.items.set(next.id, next);
        this.emit('items', [...this.items.values()]);
      })
      .subscribe();

    const voteSubscription = this.client
      .channel(`votes:${this.room.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'workshop_votes', filter: `room_id=eq.${this.room.id}`
      }, ({ eventType, new: next, old }) => {
        const row = eventType === 'DELETE' ? old : next;
        const key = `${row.target_key}:${row.user_id}`;
        if (eventType === 'DELETE') this.votes.delete(key);
        else this.votes.set(key, next);
        this.emit('votes', [...this.votes.values()]);
      })
      .subscribe();

    this.subscriptions.push(roomSubscription, itemSubscription, voteSubscription);
  }

  presencePayload(patch = {}) {
    return {
      userId: this.user?.id || this.profile?.id,
      name: this.profile?.name || 'Participant',
      team: this.profile?.team || 'auto',
      color: this.profile?.color || '#2864dc',
      stage: this.profile?.stage || 'welcome',
      role: this.profile?.role || 'participant',
      joinedAt: this.profile?.joinedAt || Date.now(),
      ...patch
    };
  }

  async updatePresence(patch = {}) {
    this.profile = { ...this.profile, ...patch };
    if (this.mode === 'supabase' && this.channel) {
      await this.channel.track(this.presencePayload());
      return;
    }
    if (this.mode === 'local') this.setLocalPresence();
  }

  async broadcast(event, payload) {
    const message = {
      ...payload,
      senderId: this.user?.id || this.profile?.id,
      senderName: this.profile?.name,
      senderColor: this.profile?.color,
      sentAt: Date.now()
    };
    if (this.mode === 'supabase' && this.channel) {
      await this.channel.send({ type: 'broadcast', event, payload: message });
    } else if (this.mode === 'local') {
      this.localChannel?.postMessage({ kind: 'broadcast', event, payload: message });
    }
  }

  sendCursor(payload) {
    this.pendingCursor = payload;
    if (this.cursorFrame) return;
    this.cursorFrame = requestAnimationFrame(async () => {
      const next = this.pendingCursor;
      this.pendingCursor = null;
      this.cursorFrame = null;
      if (next) await this.broadcast('cursor', next);
    });
  }

  async upsertItem(item) {
    const row = {
      id: item.id || randomId(),
      room_id: this.room.id,
      item_type: item.item_type,
      owner_id: item.owner_id || this.user?.id || this.profile?.id,
      client: item.client || null,
      stage: item.stage || null,
      platform: item.platform || null,
      dedupe_key: item.dedupe_key || null,
      x: Number.isFinite(Number(item.x)) ? Number(item.x) : null,
      y: Number.isFinite(Number(item.y)) ? Number(item.y) : null,
      payload: item.payload || {},
      updated_at: new Date().toISOString()
    };
    if (this.mode === 'supabase') {
      const { data, error } = await this.client.from('workshop_items').upsert(row).select().single();
      if (error) throw error;
      this.items.set(data.id, data);
      this.emit('items', [...this.items.values()]);
      return data;
    }
    const local = { ...row, created_at: this.items.get(row.id)?.created_at || row.updated_at };
    this.items.set(local.id, local);
    this.persistLocal('items');
    this.emit('items', [...this.items.values()]);
    return local;
  }

  async removeItem(id) {
    if (this.mode === 'supabase') {
      const { error } = await this.client.from('workshop_items').delete().eq('id', id);
      if (error) throw error;
    }
    this.items.delete(id);
    if (this.mode === 'local') this.persistLocal('items');
    this.emit('items', [...this.items.values()]);
  }

  async castVote(targetKey, value = 1) {
    const userId = this.user?.id || this.profile?.id;
    const key = `${targetKey}:${userId}`;
    const existing = this.votes.get(key);
    if (existing && Number(existing.value) === Number(value)) {
      if (this.mode === 'supabase') {
        const { error } = await this.client.from('workshop_votes').delete().eq('room_id', this.room.id).eq('target_key', targetKey).eq('user_id', userId);
        if (error) throw error;
      }
      this.votes.delete(key);
    } else {
      const row = { room_id: this.room.id, target_key: targetKey, user_id: userId, value };
      if (this.mode === 'supabase') {
        const { data, error } = await this.client.from('workshop_votes').upsert(row).select().single();
        if (error) throw error;
        this.votes.set(key, data);
      } else {
        this.votes.set(key, { ...row, created_at: new Date().toISOString() });
      }
    }
    if (this.mode === 'local') this.persistLocal('votes');
    this.emit('votes', [...this.votes.values()]);
  }

  async updateRoom(patch) {
    const next = { ...patch, updated_at: new Date().toISOString() };
    if (this.mode === 'supabase') {
      const { data, error } = await this.client.from('workshop_rooms').update(next).eq('id', this.room.id).select().single();
      if (error) throw error;
      this.room = data;
    } else {
      this.room = { ...this.room, ...next };
      this.persistLocal('room');
    }
    this.emit('room', this.room);
    return this.room;
  }

  voteTotals() {
    const totals = new Map();
    for (const vote of this.votes.values()) totals.set(vote.target_key, (totals.get(vote.target_key) || 0) + Number(vote.value || 0));
    return totals;
  }

  connectionSnapshot(status = 'connected') {
    return {
      status,
      mode: this.mode,
      room: clone(this.room),
      user: clone(this.user || { id: this.profile?.id }),
      profile: clone(this.profile)
    };
  }

  // Local demo mode supports multiple tabs in one browser. It mirrors the cloud API.
  connectLocal({ code, create }) {
    this.mode = 'local';
    let localUserId;
    try { localUserId = sessionStorage.getItem('se-local-user'); } catch { localUserId = null; }
    localUserId ||= randomId();
    try { sessionStorage.setItem('se-local-user', localUserId); } catch { /* in-memory identity for restricted origins */ }
    this.user = { id: localUserId, is_anonymous: true };
    this.profile = { ...this.profile, id: localUserId, joinedAt: Date.now() };
    this.localKey = `se-lab:${code}`;
    const saved = this.readLocal();
    if (!saved.room && !create && normalizeCode(code)) throw new Error('That room does not exist in local demo mode. Create it in the first tab.');
    this.room = saved.room || {
      id: `local-${code}`,
      code,
      title: 'Search Everywhere: The Decision Journey Lab',
      facilitator_id: localUserId,
      active_stage: 0,
      active_client: 'both',
      timer: { running: false, remaining: 0, endsAt: null, label: 'Activity timer' },
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.items = new Map((saved.items || []).map((item) => [item.id, item]));
    this.votes = new Map((saved.votes || []).map((vote) => [`${vote.target_key}:${vote.user_id}`, vote]));
    this.localChannel = 'BroadcastChannel' in window ? new BroadcastChannel(this.localKey) : null;
    this.localChannel?.addEventListener('message', ({ data }) => this.handleLocalMessage(data));
    this.setLocalPresence();
    this.localHeartbeat = setInterval(() => this.setLocalPresence(), 5000);
    this.localCleanup = setInterval(() => this.cleanupLocalPresence(), 5000);
    window.addEventListener('storage', (event) => {
      if (event.key !== this.localKey || !event.newValue) return;
      this.applyLocal(JSON.parse(event.newValue));
    });
    this.emit('room', this.room);
    this.emit('items', [...this.items.values()]);
    this.emit('votes', [...this.votes.values()]);
    this.emit('connection', this.connectionSnapshot('connected'));
    return this.connectionSnapshot('connected');
  }

  readLocal() {
    try { return JSON.parse(localStorage.getItem(this.localKey) || JSON.stringify(this.localMemory || {})); }
    catch { return clone(this.localMemory || {}); }
  }

  applyLocal(saved) {
    if (saved.room) this.room = saved.room;
    if (saved.items) this.items = new Map(saved.items.map((item) => [item.id, item]));
    if (saved.votes) this.votes = new Map(saved.votes.map((vote) => [`${vote.target_key}:${vote.user_id}`, vote]));
    if (saved.presence) this.presence = new Map(saved.presence.map((person) => [person.userId, person]));
    this.emit('room', this.room);
    this.emit('items', [...this.items.values()]);
    this.emit('votes', [...this.votes.values()]);
    this.emit('presence', [...this.presence.values()]);
  }

  persistLocal(kind = 'all') {
    const saved = this.readLocal();
    const next = {
      room: this.room,
      items: [...this.items.values()],
      votes: [...this.votes.values()],
      presence: [...this.presence.values()],
      updatedAt: Date.now()
    };
    this.localMemory = clone(next);
    try { localStorage.setItem(this.localKey, JSON.stringify(next)); } catch { /* in-memory fallback */ }
    this.localChannel?.postMessage({ kind: 'state', source: this.user.id, state: next, changed: kind });
  }

  setLocalPresence() {
    const person = { ...this.presencePayload(), lastSeen: Date.now() };
    this.presence.set(this.user.id, person);
    this.persistLocal('presence');
    this.emit('presence', [...this.presence.values()]);
  }

  cleanupLocalPresence() {
    const cutoff = Date.now() - 15000;
    let changed = false;
    for (const [id, person] of this.presence) {
      if (id !== this.user.id && Number(person.lastSeen || 0) < cutoff) {
        this.presence.delete(id);
        changed = true;
      }
    }
    if (changed) this.persistLocal('presence');
  }

  handleLocalMessage(message) {
    if (!message || message.source === this.user.id) return;
    if (message.kind === 'state') this.applyLocal(message.state);
    if (message.kind === 'broadcast') this.emit(message.event, message.payload);
  }

  async disconnect() {
    if (this.mode === 'supabase') {
      try { await this.channel?.untrack(); } catch {}
      try { await this.client?.removeChannel(this.channel); } catch {}
      for (const subscription of this.subscriptions) {
        try { await this.client?.removeChannel(subscription); } catch {}
      }
    }
    clearInterval(this.localHeartbeat);
    clearInterval(this.localCleanup);
    this.presence.delete(this.user?.id);
    if (this.mode === 'local') this.persistLocal('presence');
    this.localChannel?.close();
    this.mode = 'disconnected';
  }
}

export const realtime = new WorkshopRealtime();
export { createCode, normalizeCode, randomId };
