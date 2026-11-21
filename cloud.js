/* =========================================================
   Gip's HP 온라인 저장소(Supabase) 연결
   - config.js가 비어 있으면: 아무것도 하지 않고 지금처럼(이 브라우저에만 저장) 동작해요.
   - 채워져 있으면: 기록을 먼저 불러온 다음 script.js를 실행해요.
     · 내 기록(일기·영화·책·여행·앨범·기분·한마디) → 'kv' 표
     · 사진·포스터·책 표지·여행 사진 → 'records' 표 + 'media' 이미지 보관함
     · 방명록·도란도란 → 'guestbook' 표, 방문자 수 → hit_visit 함수
   - 주인장으로 로그인한 사람만 기록을 쓰고 고칠 수 있어요.
   ========================================================= */
(function () {
  const cfg = window.GIP_CONFIG || {};
  const SYNC_KEYS = ['gip_diary', 'gip_movie', 'gip_book', 'gip_travel', 'gip_albums', 'gip_mood', 'gip_word'];
  const RECORD_STORES = ['photos', 'posters', 'tripPhotos'];
  const BUCKET = 'media';

  const $ = (id) => document.getElementById(id);
  function loadMain() {
    const s = document.createElement('script');
    s.src = 'script.js';
    document.body.appendChild(s);
  }
  // 화면 위쪽에 잠깐(또는 계속) 보이는 알림 띠
  function banner(text, kind) {
    let el = $('cloudBanner');
    if (!el) {
      el = document.createElement('p');
      el.id = 'cloudBanner';
      el.className = 'cloud-banner';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = 'cloud-banner' + (kind ? ' ' + kind : '');
    el.hidden = false;
    clearTimeout(banner.t);
    if (kind === 'ok') banner.t = setTimeout(() => { el.hidden = true; }, 1800);
  }

  window.CLOUD = null;
  const url = (cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  const key = (cfg.supabaseAnonKey || '').trim();
  if (!url || !key) { loadMain(); return; }   // 설정 전: 이 브라우저에만 저장하는 방식

  // 안전장치: 모든 권한이 있는 비밀 키가 들어 있으면 연결하지 않아요
  let role = '';
  try { role = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role || ''; } catch (e) {}
  if (/^sb_secret_/.test(key) || role === 'service_role') {
    alert('⚠ config.js에 비밀(secret / service_role) 키가 들어 있어요!\n이 키는 공개되면 안 돼요. publishable(또는 anon) 키로 바꿔 주세요.\n그 전까지는 온라인 저장소에 연결하지 않아요.');
    loadMain();
    return;
  }
  // Supabase 도구(supabase-js)는 연결 정보가 있을 때만 인터넷에서 불러와요
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js';
  new Promise((resolve, reject) => {
    if (window.supabase && window.supabase.createClient) { resolve(); return; }
    const s = document.createElement('script');
    s.src = SUPABASE_JS;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  }).then(start, () => {
    banner('온라인 저장소 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.', 'err');
    document.body.classList.add('visitor');
    window.CLOUD = { failed: true, isOwner: () => false, syncs: () => false, usesRecords: () => false };
    loadMain();
  });

  function start() {
  const sb = window.supabase.createClient(url, key);
  const cache = {};      // 이름표 → 내용(글자)
  const timers = {};     // 저장 대기 중인 이름표
  let owner = false;
  let failed = false;

  /* ---------- 내 기록 (kv) ---------- */
  function flush(k) {
    clearTimeout(timers[k]);
    const value = cache[k];
    timers[k] = setTimeout(async () => {
      const { error } = await sb.from('kv').upsert({ key: k, value, updated_at: new Date().toISOString() });
      delete timers[k];
      if (error) banner('⚠ 저장하지 못했어요. 인터넷 연결을 확인해 주세요. (' + error.message + ')', 'err');
      else if (!Object.keys(timers).length) banner('☁ 저장했어요', 'ok');
    }, 400);
  }
  // 아직 저장이 안 끝났는데 창을 닫으려 하면 한 번 물어봐요
  window.addEventListener('beforeunload', (e) => {
    if (Object.keys(timers).length) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- 사진 등 이미지가 들어 있는 기록 (records + media) ---------- */
  const publicUrl = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const pathOf = (u) => {
    const mark = '/object/public/' + BUCKET + '/';
    const i = typeof u === 'string' ? u.indexOf(mark) : -1;
    return i < 0 ? null : decodeURIComponent(u.slice(i + mark.length).split('?')[0]);
  };
  // 기록 안의 모든 글자 칸을 돌면서 fn(글자, 바꾸기)을 불러요
  function walk(obj, fn) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (typeof v === 'string') fn(v, (nv) => { obj[k] = nv; });
      else if (v && typeof v === 'object') walk(v, fn);
    });
  }
  async function cleanFolder(folder, keep) {
    const { data, error } = await sb.storage.from(BUCKET).list(folder, { limit: 1000 });
    if (error || !data) return;
    const gone = data.map(f => folder + '/' + f.name).filter(p => !keep.has(p));
    if (gone.length) await sb.storage.from(BUCKET).remove(gone);
  }
  function recordStore(name) {
    return {
      async all() {
        const { data, error } = await sb.from('records').select('data').eq('store', name);
        if (error) throw error;
        return data.map(r => r.data);
      },
      // 이미지(dataURL)는 보관함에 파일로 올리고, 기록에는 그 주소를 적어요
      async put(item) {
        if (!owner) throw new Error('주인장만 저장할 수 있어요');
        const folder = name + '/' + item.id;
        const uploads = [];
        walk(item, (v, set) => {
          if (!v.startsWith('data:image/')) return;
          uploads.push((async () => {
            const blob = await (await fetch(v)).blob();
            const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
            const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' });
            if (error) throw error;
            set(publicUrl(path));
          })());
        });
        await Promise.all(uploads);
        const { error } = await sb.from('records').upsert({ store: name, id: String(item.id), data: item, updated_at: new Date().toISOString() });
        if (error) throw error;
        const keep = new Set();
        walk(item, (v) => { const p = pathOf(v); if (p) keep.add(p); });
        cleanFolder(folder, keep).catch(() => {});
      },
      async remove(id) {
        if (!owner) throw new Error('주인장만 지울 수 있어요');
        const { error } = await sb.from('records').delete().eq('store', name).eq('id', String(id));
        if (error) throw error;
        cleanFolder(name + '/' + id, new Set()).catch(() => {});
      }
    };
  }

  /* ---------- 방명록·도란도란 ---------- */
  const guestbook = {
    async list() {
      const { data, error } = await sb.from('guestbook').select('id,kind,name,text,minimi,reply,created_at').order('id', { ascending: true });
      if (error) throw error;
      return data;
    },
    async add(row) {
      const { error } = await sb.from('guestbook').insert(row);
      if (error) throw error;
    },
    async reply(id, text) {
      const { error } = await sb.from('guestbook').update({ reply: text }).eq('id', id);
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await sb.from('guestbook').delete().eq('id', id);
      if (error) throw error;
    }
  };

  window.CLOUD = {
    sb,
    failed: false,
    syncs: (k) => SYNC_KEYS.includes(k),
    isOwner: () => owner,
    get(k, fallback) { return Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : fallback; },
    set(k, v) {
      const s = String(v);
      if (cache[k] === s) return;          // 바뀐 게 없으면 저장하지 않아요
      cache[k] = s;
      if (owner) flush(k);
    },
    usesRecords: (name) => RECORD_STORES.includes(name),
    recordStore,
    guestbook,
    async hitVisit(first) {
      const { data, error } = await sb.rpc('hit_visit', { first });
      if (error) throw error;
      return data;
    }
  };

  /* ---------- 주인장 로그인 / 로그아웃 / 이사하기 ---------- */
  function setupOwnerUI() {
    const ownerBtn = $('ownerBtn'), box = $('loginBox'), form = $('loginForm'), msg = $('loginMsg');
    const migrateBtn = $('migrateBtn');
    if (!ownerBtn) return;
    ownerBtn.hidden = false;
    ownerBtn.textContent = owner ? '주인장 모드 · 로그아웃' : '주인장';
    ownerBtn.addEventListener('click', async () => {
      if (owner) {
        if (!confirm('로그아웃할까요?')) return;
        await sb.auth.signOut();
        location.reload();
        return;
      }
      msg.textContent = '';
      box.hidden = false;
      $('loginEmail').focus();
    });
    $('loginClose').addEventListener('click', () => { box.hidden = true; });
    box.addEventListener('click', (e) => { if (e.target === box) box.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) box.hidden = true; });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '확인하는 중…';
      const { error } = await sb.auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPw').value });
      if (error) { msg.textContent = '이메일이나 비밀번호가 맞지 않아요.'; return; }
      const { data } = await sb.rpc('is_owner');
      if (!data) {
        await sb.auth.signOut();
        msg.textContent = '주인장으로 등록된 계정이 아니에요. (supabase-setup.sql의 7번을 실행했는지 확인해 주세요)';
        return;
      }
      location.reload();
    });

    // 이 브라우저(내 컴퓨터)에 예전 기록이 남아 있으면 '이사하기' 버튼을 보여 줘요
    let hasLocal = false;
    try { hasLocal = SYNC_KEYS.some(k => localStorage.getItem(k) !== null); } catch (e) {}
    if (owner && migrateBtn && (hasLocal || location.protocol === 'file:')) {
      migrateBtn.hidden = false;
      migrateBtn.addEventListener('click', migrate);
    }
  }

  // 예전 IndexedDB 창고에서 한 칸을 통째로 읽어요 (없으면 빈 목록)
  function readLocalStore(name) {
    return new Promise((resolve) => {
      let req;
      try { req = indexedDB.open('gip_hp'); } catch (e) { resolve([]); return; }
      req.onerror = () => resolve([]);
      req.onupgradeneeded = () => {};   // 창고가 없으면 빈 채로 만들어졌다가 닫혀요
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(name)) { db.close(); resolve([]); return; }
        const r = db.transaction(name, 'readonly').objectStore(name).getAll();
        r.onsuccess = () => { db.close(); resolve(r.result || []); };
        r.onerror = () => { db.close(); resolve([]); };
      };
    });
  }

  async function migrate() {
    if (!confirm('이 브라우저에 있는 기록(일기·영화·책·여행·사진 등)을 온라인 저장소로 옮길까요?\n\n· 온라인에 같은 기록이 있으면 이 브라우저의 것으로 덮어써요.\n· 이 브라우저의 기록은 지우지 않아요.\n· 방명록·도란도란·배경음악은 옮기지 않아요.')) return;
    const btn = $('migrateBtn');
    btn.disabled = true;
    try {
      let n = 0;
      for (const k of SYNC_KEYS) {
        const v = localStorage.getItem(k);
        if (v === null) continue;
        banner(`☁ 기록을 옮기는 중… (${k.replace('gip_', '')})`);
        const { error } = await sb.from('kv').upsert({ key: k, value: v, updated_at: new Date().toISOString() });
        if (error) throw error;
        n++;
      }
      let pics = 0;
      for (const name of RECORD_STORES) {
        const list = await readLocalStore(name);
        const store = recordStore(name);
        for (let i = 0; i < list.length; i++) {
          banner(`☁ 사진을 옮기는 중… (${name} ${i + 1}/${list.length})`);
          await store.put(list[i]);
          pics++;
        }
      }
      banner('☁ 이사 완료!', 'ok');
      alert(`이사를 마쳤어요! 기록 ${n}묶음, 이미지가 든 기록 ${pics}개를 옮겼어요.\n새로고침하면 온라인 저장소의 기록으로 보여요.`);
      location.reload();
    } catch (e) {
      banner('⚠ 옮기다가 멈췄어요: ' + (e.message || e) + ' — 다시 눌러 이어서 옮길 수 있어요.', 'err');
      btn.disabled = false;
    }
  }

  /* ---------- 시작: 로그인 상태 확인 + 기록 불러오기 → script.js 실행 ---------- */
  (async () => {
    try {
      const [sess, kv] = await Promise.all([sb.auth.getSession(), sb.from('kv').select('key,value')]);
      if (kv.error) throw kv.error;
      (kv.data || []).forEach(r => { cache[r.key] = typeof r.value === 'string' ? r.value : JSON.stringify(r.value); });
      if (sess.data && sess.data.session) {
        const { data } = await sb.rpc('is_owner');
        owner = !!data;
      }
    } catch (e) {
      failed = true;
      owner = false;   // 불러오지 못했을 때 쓰면 빈 기록으로 덮어쓸 수 있어서, 쓰기를 막아요
      window.CLOUD.failed = true;
      banner('⚠ 기록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.', 'err');
    }
    document.body.classList.add(owner ? 'owner' : 'visitor');
    setupOwnerUI();
    loadMain();
  })();
  }
})();
