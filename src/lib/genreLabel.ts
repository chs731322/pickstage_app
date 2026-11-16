// 아티스트 장르/태그를 사용자에게 보여줄 한국어 표기로 바꾼다.
// DB에는 rock, indie_rock, k-pop처럼 영어 코드로 저장되어 있다.

// 주 장르 (artists.genre_primary)
const GENRE_LABEL: Record<string, string> = {
  rock: '락',
  indie: '인디',
  edm: 'EDM',
  hiphop: '힙합',
  idol: '아이돌',
  pop: '팝',
  jazz: '재즈',
  rnb: 'R&B',
  folk: '포크',
  alternative: '얼터너티브',
  world: '월드뮤직',
  metal: '메탈',
  punk: '펑크',
  trot: '트로트',
  classical: '클래식',
  crossover: '크로스오버',
};

// 태그 중 그대로 번역하면 어색하거나 장르가 아닌 것들을 따로 처리
const TAG_EXACT: Record<string, string> = {
  kpop: 'K-POP',
  k_pop: 'K-POP',
  kpop_solo: 'K-POP',
  kpop_rock: 'K-POP 락',
  kpop_rap: 'K-POP 랩',
  kpop_band: 'K-POP 밴드',
  kpop_unit: 'K-POP',
  '90s_kpop': '90년대 K-POP',
  '90s_idol': '90년대 아이돌',
  '90s_alternative': '90년대 얼터너티브',
  jpop: 'J-POP',
  j_pop: 'J-POP',
  j_pop_crossover: 'J-POP',
  jrock: 'J-락',
  j_rock: 'J-락',
  j_punk: 'J-펑크',
  k_rock: 'K-락',
  korean_hiphop: 'K-힙합',
  korean_rnb: 'K-R&B',
  'kr&b': 'K-R&B',
  korean_folk: '한국 포크',
  singer_songwriter: '싱어송라이터',
  singer_songwriter_band: '싱어송라이터 밴드',
  city_pop: '시티팝',
  gugak: '국악',
  gugak_crossover: '국악 크로스오버',
  gugak_fusion: '국악 퓨전',
  traditional_korean: '국악',
  korean_traditional: '국악',
  traditional_chinese: '중국 전통음악',
  pansori_fusion: '판소리 퓨전',
  ost: 'OST',
  ost_ballad: 'OST 발라드',
  ccm: 'CCM',
  mr_trot2: '트로트',
  ppongjjak: '뽕짝',
  techno_trot: '테크노 트로트',
  drum_and_bass: '드럼 앤 베이스',
  lo_fi: '로파이',
  r_b_vocal: 'R&B 보컬',
  pbr_b: 'PBR&B',
  'pbr&b': 'PBR&B',
  'r&b_vocal': 'R&B 보컬',
  rnb: 'R&B',
  alt_rnb: '얼터너티브 R&B',
  alternative_rnb: '얼터너티브 R&B',
  contemporary_rnb: '컨템포러리 R&B',
  rnb_rap: 'R&B 랩',
  rnb_hiphop: 'R&B 힙합',
  world_music: '월드뮤직',
  world_music_crossover: '월드뮤직 크로스오버',
  genre_crossing: '장르 크로스오버',
  folk_to_rock: '포크에서 락으로',
  new_orleans_jazz: '뉴올리언스 재즈',
  jazz_hop: '재즈 힙합',
  kawaii_metal: '카와이 메탈',
  meme_metal: '밈 메탈',
  comedy_punk: '코미디 펑크',
  chamber_music: '실내악',
  popera: '팝페라',
  jam_band: '잼 밴드',
  yacht_rock: '요트 락',
  beat_music: '비트 뮤직',
  old_school: '올드스쿨',
  kraut_rock: '크라우트락',
  hip_hop: '힙합',
  trip_hop: '트립합',
  avant_garde: '아방가르드',
  electropop: '일렉트로팝',
  psytrance: '사이트랜스',
  folk_song: '포크송',
  french_touch: '프렌치 터치',
  jpop_idol: 'J-POP 아이돌',
  dancehall: '댄스홀',
};

// 영어 단어 → 한국어 (조합 규칙용: indie_pop → 인디 팝)
const TOKEN: Record<string, string> = {
  rock: '락', pop: '팝', indie: '인디', jazz: '재즈', folk: '포크', metal: '메탈', punk: '펑크',
  house: '하우스', techno: '테크노', trance: '트랜스', hiphop: '힙합', rap: '랩',
  rnb: 'R&B', soul: '소울', funk: '훵크', electronic: '일렉트로닉', electro: '일렉트로', electronica: '일렉트로니카',
  alternative: '얼터너티브', alt: '얼터너티브', acoustic: '어쿠스틱', dream: '드림', shoegaze: '슈게이즈',
  post: '포스트', art: '아트', psychedelic: '사이키델릭', psych: '사이키델릭', experimental: '실험적',
  noise: '노이즈', dance: '댄스', city: '시티', synth: '신스', bass: '베이스', hard: '하드', heavy: '헤비',
  death: '데스', thrash: '스래시', power: '파워', melodic: '멜로딕', progressive: '프로그레시브',
  future: '퓨처', tech: '테크', tropical: '트로피컬', big: '빅', room: '룸', band: '밴드', sound: '사운드',
  korean: '한국', japanese: '일본', math: '매스', garage: '개러지', surf: '서프', blues: '블루스',
  grunge: '그런지', emo: '이모', ska: '스카', reggae: '레게', disco: '디스코', latin: '라틴', swing: '스윙',
  boom: '붐', bap: '뱁', trap: '트랩', dubstep: '덥스텝', hyperpop: '하이퍼팝', bedroom: '베드룸', lo: '로', fi: '파이',
  club: '클럽', rave: '레이브', hardstyle: '하드스타일', hardcore: '하드코어', core: '코어', metalcore: '메탈코어',
  deathcore: '데스코어', britpop: '브릿팝', jangle: '쟁글', gospel: '가스펠', opera: '오페라', orchestra: '오케스트라',
  orchestral: '오케스트라', ballad: '발라드', vocal: '보컬', instrumental: '인스트루멘탈', fusion: '퓨전',
  crossover: '크로스오버', classical: '클래식', trio: '트리오', duo: '듀오', quartet: '콰르텟', ensemble: '앙상블',
  free: '프리', latin2: '라틴', cuban: '쿠바', uk: 'UK', nu: '뉴', disco2: '디스코', modern: '모던', neo: '네오',
  retro: '레트로', old: '올드', school: '스쿨', vocalist: '보컬리스트', live: '라이브', idol: '아이돌', group: '그룹',
  ambient: '앰비언트', chiptune: '칩튠', darkwave: '다크웨이브', synthwave: '신스웨이브', trip: '트립',
  kraut: '크라우트', downtempo: '다운템포', afrobeat: '아프로비트', afro: '아프로', riddim: '리딤', dnb: '드럼앤베이스',
  edm: 'EDM', trot: '트로트', rage: '레이지', mumble: '멈블', party: '파티', scandi: '스칸디', underground: '언더그라운드',
  cosmic: '코스믹', music: '뮤직', song: '송', piano: '피아노', guitar: '기타', strings: '현악', big2: '빅', pbr: 'PBR', lofi: '로파이', k: 'K', j: 'J',
};

// 장르가 아니라 정보성인 태그 (유형, 국가, 직업, 악기, 메모 등)는 노출하지 않는다.
const HIDDEN = new Set([
  'band', 'solo', 'duo', 'group', 'boy_group', 'girl_group', 'boy_group_member', 'boy_duo', 'idol_solo', 'idol_group_alumna',
  'rookie', 'rookie_act', 'crew', 'supergroup', 'hybe', 'kpop_production', 'hiphop_label', 'producer', 'producer_team',
  'composer', 'keyboardist', 'pianist', 'arranger', 'conductor', 'vocalist', 'multi_instrumentalist', 'beatmaker',
  'japan', 'japanese', 'taiwan', 'thai', 'french', 'estonian', 'island', 'nature', 'busking', 'jazz_night',
  'trumpet', 'piano', 'guitar', 'drums', 'violin', 'saxophone_duo', 'strings', 'looping', 'dj', 'live_band', 'rock_band',
  'band_sound', 'co_ed_band', 'vocal_group', 'duet', 'rock_influence', 'electronic_wind_instrument', 'acoustic_guitar',
  'fingerstyle_guitar', 'soprano', 'tenor', 'baritone', 'gayageum', 'guqin', 'brazilian_underground', 'indonesian_pop',
  'taiwanese_indie', 'japanese_indie', 'japanese_rock', 'japanese_hiphop', 'jazz_standards', 'musical', 'musical_theater',
  'electronic_producer', 'throat_singing', 'shamanic', 'tuvan_folk', 'molam', 'orchestra', 'choral', 'improv',
]);

function normalize(tag: string): string {
  return String(tag).trim().toLowerCase().replace(/[-\s]+/g, '_');
}

export function genreLabel(genre: string | null | undefined): string {
  if (!genre) return '';
  return GENRE_LABEL[normalize(genre)] ?? '';
}

// 태그 하나를 한국어로. 번역할 수 없거나 숨길 태그면 null
export function tagLabel(tag: string): string | null {
  const key = normalize(tag);
  if (HIDDEN.has(key)) return null;
  if (TAG_EXACT[key]) return TAG_EXACT[key];
  if (GENRE_LABEL[key]) return GENRE_LABEL[key];
  const parts = key.split('_').filter(Boolean);
  if (parts.length === 0 || !parts.every((p) => TOKEN[p])) return null;
  return parts.map((p) => TOKEN[p]).join(' ');
}

// 태그 목록 → 보여줄 한국어 라벨 목록 (중복 제거, 주 장르와 같은 것 제외)
export function tagLabels(tags: string[] | null | undefined, primaryGenre: string | null | undefined, limit = 6): string[] {
  const primary = genreLabel(primaryGenre);
  const seen = new Set(primary ? [primary] : []);
  const out: string[] = [];
  for (const tag of tags ?? []) {
    const label = tagLabel(tag);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
    if (out.length >= limit) break;
  }
  return out;
}

// 공연(페스티벌)의 장르 코드 -> 화면에 보여줄 한국어
const FESTIVAL_GENRE_LABEL: Record<string, string> = {
  rock: '락·메탈',
  indie_band: '인디·밴드',
  hiphop: '힙합',
  jazz: '재즈',
  edm: 'EDM',
  general_music: '종합',
  exception: '기타',
};

export function festivalGenreLabel(genre: string | null | undefined): string {
  if (!genre) return '';
  return FESTIVAL_GENRE_LABEL[genre] ?? '';
}
