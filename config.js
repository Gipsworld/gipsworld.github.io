/* =========================================================
   Gip's HP 온라인 저장소(Supabase) 연결 정보
   - 두 칸을 비워 두면: 지금처럼 이 브라우저 안에만 저장해요.
   - 채우면: 기록이 온라인 저장소에 저장되고, 주인장만 글을 쓸 수 있어요.

   supabaseUrl     : Supabase → Project Settings → API (또는 Data API) 의 Project URL
   supabaseAnonKey : 'publishable' 키(sb_publishable_…) 또는 'anon public' 키(eyJ…)
                     → 공개돼도 괜찮은 키예요.
   ⚠ 'secret' / 'service_role' 키는 절대 여기에 넣지 마세요! (모든 권한이 있는 열쇠예요)

   googleMapsKey   : 구글 지도 API 키 (비워 두면 기본 지도 Leaflet을 써요)
                     → Google Cloud에서 '내 홈페이지 주소에서만' 쓰게 잠가 둔 키를 넣어요.
   googleMapId     : (선택) 구글 지도 Map ID. 비워 두면 구글의 시험용 ID를 써요.
   ========================================================= */
window.GIP_CONFIG = {
  supabaseUrl: 'https://fefuarxefahbllhwfsqv.supabase.co',
  supabaseAnonKey: 'sb_publishable_FCR3bPKuAPrRW1Vmf9iLmw_1kS9GHol',
  googleMapsKey: 'AIzaSyC_LvoIiTYCYy3pKYIKea-nECtdsUtsuzk',
  googleMapId: ''
};
