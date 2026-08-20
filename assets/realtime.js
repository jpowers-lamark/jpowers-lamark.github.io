(() => {
  'use strict';

  const LOCAL_KEY = 'se-learning-lab-v2-rooms';
  const LOCAL_USER_KEY = 'se-learning-lab-v2-user';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const nowIso = () => new Date().toISOString();
  const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const randomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let value = '';
    for (let i = 0; i < 6; i += 1) value += alphabet[Math.floor(Math.random() * alphabet.length)];
    return value;
  };

  class SERealtime {
    constructor(callbacks = {}) {
      this.callbacks = callbacks;
      this.mode = 'idle';
      this.client = null;
      this.channel = null;
      this.room = null;
      this.user = null;
      this.member = null;
      this.participants = [];
      this.items = [];
      this.votes = [];
      this.localChannel = null;
      this._lastLocalMessage = 0;
    }

    get isCloud() { return this.mode === 'cloud'; }
    get isConnected() { return this.mode === 'cloud' || this.mode === 'local'; }
    get isFacilitator() {
      return Boolean(this.user && this.room && (this.room.facilitator_id === this.user.id || this.member?.role === 'facilitator'));
    }

    _emit(name, payload) {
      try { this.callbacks[name]?.(payload); } catch (error) { console.error(`Callback ${name} failed`, error); }
    }

    _emitData() {
      this._emit('onData', {
        room: this.room ? clone(this.room) : null,
        user: this.user ? clone(this.user) : null,
        member: this.member ? clone(this.member) : null,
        participants: clone(this.participants),
        items: clone(this.items),
        votes: clone(this.votes),
        mode: this.mode
      });
    }

    _emitStatus(status, detail = '') {
      this._emit('onStatus', { status, detail, mode: this.mode });
    }

    async connect({ create = false, roomCode = '', name, color = '#14532d', role = 'participant', squad = 'auto' }) {
      const config = window.SE_CONFIG || {};
      const hasCloudConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
      if (hasCloudConfig) {
        try {
          await this._connectCloud({ create, roomCode, name, color, role, squad });
          return { ok: true, mode: 'cloud', room: this.room };
        } catch (error) {
          console.error('Cloud connection failed', error);
          this._emit('onError', { message: error.message || 'Cloud connection failed.', error });
          if (config.enableDemoFallback === false) return { ok: false, error };
        }
      }
      try {
        this._connectLocal({ create, roomCode, name, color, role, squad });
        return { ok: true, mode: 'local', room: this.room };
      } catch (error) {
        this._emit('onError', { message: error.message || 'Local connection failed.', error });
        return { ok: false, error };
      }
    }

    async _connectCloud({ create, roomCode, name, color, role, squad }) {
      this._emitStatus('connecting', 'Connecting to the live workshop…');
      const config = window.SE_CONFIG;
      this.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 20 } }
      });

      let { data: sessionData, error: sessionError } = await this.client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        const authResult = await this.client.auth.signInAnonymously();
        if (authResult.error) throw authResult.error;
        sessionData = { session: authResult.data.session };
      }
      this.user = sessionData.session.user;

      if (create) {
        let code = randomCode();
        let roomResult = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          roomResult = await this.client.from('se_workshop_rooms').insert({
            code,
            title: 'Search Everywhere Learning Lab',
            facilitator_id: this.user.id,
            current_stage: 0,
            settings: { wheel_cycle: 0, reveal_tradeoffs: true }
          }).select().single();
          if (!roomResult.error) break;
          if (!String(roomResult.error.message || '').toLowerCase().includes('duplicate')) throw roomResult.error;
          code = randomCode();
        }
        if (!roomResult || roomResult.error) throw roomResult?.error || new Error('Could not create a unique room code.');
        this.room = roomResult.data;
        role = 'facilitator';
      } else {
        const code = normalizeCode(roomCode);
        if (!code) throw new Error('Enter the workshop room code.');
        const roomResult = await this.client.from('se_workshop_rooms').select('*').eq('code', code).maybeSingle();
        if (roomResult.error) throw roomResult.error;
        if (!roomResult.data) throw new Error('That room code was not found. Confirm the code and try again.');
        this.room = roomResult.data;
      }

      const memberResult = await this.client.from('se_workshop_participants').upsert({
        room_id: this.room.id,
        user_id: this.user.id,
        display_name: String(name || 'Participant').trim().slice(0, 60),
        color,
        role: create ? 'facilitator' : role,
        squad,
        last_seen_at: nowIso()
      }, { onConflict: 'room_id,user_id' }).select().single();
      if (memberResult.error) throw memberResult.error;
      this.member = memberResult.data;
      this.mode = 'cloud';

      await this._fetchCloudData();
      await this._subscribeCloud();
      this._emitStatus('connected', 'Live room connected');
      this._emitData();
    }

    async _fetchCloudData() {
      const [participantsResult, itemsResult, votesResult, roomResult] = await Promise.all([
        this.client.from('se_workshop_participants').select('*').eq('room_id', this.room.id).order('joined_at'),
        this.client.from('se_workshop_items').select('*').eq('room_id', this.room.id).order('created_at'),
        this.client.from('se_workshop_votes').select('*').eq('room_id', this.room.id).order('created_at'),
        this.client.from('se_workshop_rooms').select('*').eq('id', this.room.id).single()
      ]);
      for (const result of [participantsResult, itemsResult, votesResult, roomResult]) {
        if (result.error) throw result.error;
      }
      this.participants = participantsResult.data || [];
      this.items = itemsResult.data || [];
      this.votes = votesResult.data || [];
      this.room = roomResult.data;
      this.member = this.participants.find((person) => person.user_id === this.user.id) || this.member;
    }

    _upsert(list, row) {
      const index = list.findIndex((entry) => entry.id === row.id);
      if (index === -1) list.push(row); else list[index] = row;
    }

    _remove(list, id) {
      const index = list.findIndex((entry) => entry.id === id);
      if (index !== -1) list.splice(index, 1);
    }

    _applyChange(list, payload) {
      if (payload.eventType === 'DELETE') this._remove(list, payload.old.id);
      else this._upsert(list, payload.new);
    }

    async _subscribeCloud() {
      if (this.channel) await this.client.removeChannel(this.channel);
      this.channel = this.client.channel(`se-learning-lab-v2:${this.room.id}`, {
        config: { presence: { key: this.user.id }, broadcast: { self: false, ack: false } }
      });

      this.channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'se_workshop_rooms', filter: `id=eq.${this.room.id}` }, (payload) => {
          if (payload.eventType !== 'DELETE') this.room = payload.new;
          this._emitData();
          this._emit('onRoomChange', clone(this.room));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'se_workshop_participants', filter: `room_id=eq.${this.room.id}` }, (payload) => {
          this._applyChange(this.participants, payload);
          this.member = this.participants.find((person) => person.user_id === this.user.id) || this.member;
          this._emitData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'se_workshop_items', filter: `room_id=eq.${this.room.id}` }, (payload) => {
          this._applyChange(this.items, payload);
          this._emitData();
          if (payload.eventType !== 'DELETE') this._emit('onItem', clone(payload.new));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'se_workshop_votes', filter: `room_id=eq.${this.room.id}` }, (payload) => {
          this._applyChange(this.votes, payload);
          this._emitData();
        })
        .on('broadcast', { event: 'cursor' }, ({ payload }) => this._emit('onCursor', payload))
        .on('broadcast', { event: 'reaction' }, ({ payload }) => this._emit('onReaction', payload))
        .on('presence', { event: 'sync' }, () => this._emit('onPresence', clone(this.channel.presenceState())))
        .on('presence', { event: 'join' }, () => this._emit('onPresence', clone(this.channel.presenceState())))
        .on('presence', { event: 'leave' }, () => this._emit('onPresence', clone(this.channel.presenceState())));

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Realtime connection timed out.')), 12000);
        this.channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            await this.channel.track({
              user_id: this.user.id,
              display_name: this.member.display_name,
              color: this.member.color,
              role: this.member.role,
              squad: this.member.squad,
              stage: this.room.current_stage,
              online_at: nowIso()
            });
            resolve();
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            reject(new Error(`Realtime channel status: ${status}`));
          }
        });
      });
    }

    _getLocalUser() {
      let userId = sessionStorage.getItem(LOCAL_USER_KEY);
      if (!userId) {
        userId = uid();
        sessionStorage.setItem(LOCAL_USER_KEY, userId);
      }
      return { id: userId };
    }

    _readLocalRooms() {
      try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch { return {}; }
    }

    _writeLocalRooms(rooms, event = 'data') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rooms));
      this.localChannel?.postMessage({ event, roomId: this.room?.id, at: Date.now() });
    }

    _connectLocal({ create, roomCode, name, color, role, squad }) {
      this.mode = 'local';
      this.user = this._getLocalUser();
      const rooms = this._readLocalRooms();
      if (create) {
        let code = randomCode();
        while (Object.values(rooms).some((room) => room.code === code)) code = randomCode();
        this.room = {
          id: uid(), code, title: 'Search Everywhere Learning Lab', facilitator_id: this.user.id,
          current_stage: 0, timer_ends_at: null, settings: { wheel_cycle: 0, reveal_tradeoffs: true },
          created_at: nowIso(), updated_at: nowIso(), participants: [], items: [], votes: []
        };
        rooms[this.room.id] = this.room;
        role = 'facilitator';
      } else {
        const code = normalizeCode(roomCode);
        this.room = Object.values(rooms).find((room) => room.code === code);
        if (!this.room) throw new Error('That local room code was not found. Local preview rooms only work in tabs sharing the same browser storage.');
      }
      const existing = this.room.participants.find((person) => person.user_id === this.user.id);
      const member = {
        id: existing?.id || uid(), room_id: this.room.id, user_id: this.user.id,
        display_name: String(name || 'Participant').trim().slice(0, 60), color,
        role: create ? 'facilitator' : role, squad, joined_at: existing?.joined_at || nowIso(), last_seen_at: nowIso()
      };
      if (existing) Object.assign(existing, member); else this.room.participants.push(member);
      this.member = member;
      rooms[this.room.id] = this.room;
      this._writeLocalRooms(rooms);
      this._syncLocalState();
      this.localChannel = new BroadcastChannel(`se-learning-lab-v2-${this.room.id}`);
      this.localChannel.onmessage = ({ data }) => {
        if (data?.event === 'cursor') { this._emit('onCursor', data.payload); return; }
        if (data?.event === 'reaction') { this._emit('onReaction', data.payload); return; }
        this._syncLocalState();
        this._emitData();
        this._emit('onRoomChange', clone(this.room));
      };
      this._emitStatus('connected', 'Local preview room connected');
      this._emitData();
    }

    _syncLocalState() {
      const rooms = this._readLocalRooms();
      const fresh = rooms[this.room.id];
      if (!fresh) return;
      this.room = fresh;
      this.participants = fresh.participants || [];
      this.items = fresh.items || [];
      this.votes = fresh.votes || [];
      this.member = this.participants.find((person) => person.user_id === this.user.id) || this.member;
    }

    async updateRoom(patch) {
      if (!this.room || !this.isFacilitator) throw new Error('Only the facilitator can update the room.');
      if (this.isCloud) {
        const result = await this.client.from('se_workshop_rooms').update(patch).eq('id', this.room.id).select().single();
        if (result.error) throw result.error;
        this.room = result.data;
      } else {
        const rooms = this._readLocalRooms();
        Object.assign(rooms[this.room.id], patch, { updated_at: nowIso() });
        this._writeLocalRooms(rooms);
        this._syncLocalState();
        this._emitData();
        this._emit('onRoomChange', clone(this.room));
      }
      return clone(this.room);
    }

    async setStage(stage) {
      if (this.isFacilitator) await this.updateRoom({ current_stage: stage });
      await this.updatePresenceStage(stage);
    }

    async updatePresenceStage(stage) {
      if (this.isCloud && this.channel) {
        await this.channel.track({
          user_id: this.user.id,
          display_name: this.member.display_name,
          color: this.member.color,
          role: this.member.role,
          squad: this.member.squad,
          stage,
          online_at: nowIso()
        });
      }
    }

    async saveItem(item, options = {}) {
      if (!this.room || !this.member) throw new Error('Join a workshop room before saving.');
      const singletonKey = options.singletonKey || item.content?.singleton_key || '';
      let existing = null;
      if (item.id) existing = this.items.find((entry) => entry.id === item.id);
      if (!existing && singletonKey) {
        existing = this.items.find((entry) => entry.created_by === this.user.id && entry.item_type === item.item_type && entry.content?.singleton_key === singletonKey);
      }
      const row = {
        room_id: this.room.id,
        item_type: item.item_type,
        stage_key: item.stage_key || '',
        client_key: item.client_key || '',
        created_by: this.user.id,
        author_name: this.member.display_name,
        content: { ...(item.content || {}), ...(singletonKey ? { singleton_key: singletonKey } : {}) },
        position_x: Number.isFinite(Number(item.position_x)) ? Number(item.position_x) : 20,
        position_y: Number.isFinite(Number(item.position_y)) ? Number(item.position_y) : 20,
        sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0
      };
      if (this.isCloud) {
        const query = existing
          ? this.client.from('se_workshop_items').update(row).eq('id', existing.id)
          : this.client.from('se_workshop_items').insert(row);
        const result = await query.select().single();
        if (result.error) throw result.error;
        this._upsert(this.items, result.data);
        this._emitData();
        return clone(result.data);
      }
      const rooms = this._readLocalRooms();
      const localRoom = rooms[this.room.id];
      let saved;
      if (existing) {
        const index = localRoom.items.findIndex((entry) => entry.id === existing.id);
        saved = { ...localRoom.items[index], ...row, id: existing.id, updated_at: nowIso() };
        localRoom.items[index] = saved;
      } else {
        saved = { ...row, id: uid(), created_at: nowIso(), updated_at: nowIso() };
        localRoom.items.push(saved);
      }
      this._writeLocalRooms(rooms);
      this._syncLocalState();
      this._emitData();
      this._emit('onItem', clone(saved));
      return clone(saved);
    }

    async deleteItem(itemId) {
      const item = this.items.find((entry) => entry.id === itemId);
      if (!item) return;
      if (this.isCloud) {
        const result = await this.client.from('se_workshop_items').delete().eq('id', itemId);
        if (result.error) throw result.error;
      } else {
        const rooms = this._readLocalRooms();
        rooms[this.room.id].items = rooms[this.room.id].items.filter((entry) => entry.id !== itemId);
        rooms[this.room.id].votes = rooms[this.room.id].votes.filter((entry) => entry.item_id !== itemId);
        this._writeLocalRooms(rooms);
        this._syncLocalState();
        this._emitData();
      }
    }

    async castVote(itemId, voteType = 'upvote', value = 1) {
      if (!this.room) throw new Error('Join a room before voting.');
      const existing = this.votes.find((vote) => vote.item_id === itemId && vote.user_id === this.user.id && vote.vote_type === voteType);
      const row = { room_id: this.room.id, item_id: itemId, user_id: this.user.id, vote_type: voteType, value };
      if (this.isCloud) {
        const result = existing
          ? await this.client.from('se_workshop_votes').update({ value }).eq('id', existing.id).select().single()
          : await this.client.from('se_workshop_votes').insert(row).select().single();
        if (result.error) throw result.error;
        this._upsert(this.votes, result.data);
        this._emitData();
        return clone(result.data);
      }
      const rooms = this._readLocalRooms();
      const localVotes = rooms[this.room.id].votes;
      let saved;
      if (existing) {
        const index = localVotes.findIndex((vote) => vote.id === existing.id);
        saved = { ...localVotes[index], value, updated_at: nowIso() };
        localVotes[index] = saved;
      } else {
        saved = { ...row, id: uid(), created_at: nowIso(), updated_at: nowIso() };
        localVotes.push(saved);
      }
      this._writeLocalRooms(rooms);
      this._syncLocalState();
      this._emitData();
      return clone(saved);
    }

    async removeVote(itemId, voteType = 'upvote') {
      const existing = this.votes.find((vote) => vote.item_id === itemId && vote.user_id === this.user.id && vote.vote_type === voteType);
      if (!existing) return;
      if (this.isCloud) {
        const result = await this.client.from('se_workshop_votes').delete().eq('id', existing.id);
        if (result.error) throw result.error;
      } else {
        const rooms = this._readLocalRooms();
        rooms[this.room.id].votes = rooms[this.room.id].votes.filter((vote) => vote.id !== existing.id);
        this._writeLocalRooms(rooms);
        this._syncLocalState();
        this._emitData();
      }
    }

    async sendCursor(payload) {
      if (!this.room || !this.user) return;
      const full = { ...payload, user_id: this.user.id, name: this.member.display_name, color: this.member.color, at: Date.now() };
      if (this.isCloud && this.channel) {
        await this.channel.send({ type: 'broadcast', event: 'cursor', payload: full });
      } else if (this.localChannel) {
        this.localChannel.postMessage({ event: 'cursor', payload: full });
      }
    }

    async sendReaction(emoji) {
      if (!this.room || !this.user) return;
      const payload = { emoji, user_id: this.user.id, name: this.member.display_name, color: this.member.color, at: Date.now() };
      if (this.isCloud && this.channel) await this.channel.send({ type: 'broadcast', event: 'reaction', payload });
      else {
        this._emit('onReaction', payload);
        this.localChannel?.postMessage({ event: 'reaction', payload });
      }
    }

    exportSnapshot() {
      return clone({ room: this.room, participants: this.participants, items: this.items, votes: this.votes, exported_at: nowIso() });
    }

    async disconnect() {
      if (this.isCloud && this.channel) await this.client.removeChannel(this.channel);
      this.localChannel?.close();
      this.channel = null;
      this.localChannel = null;
      this.mode = 'idle';
    }
  }

  window.SERealtime = SERealtime;
})();
