import { Bubble, CanvasConfig, WebFont, DefaultSideStyles } from '../types';

export const INITIAL_SIDE_STYLES: DefaultSideStyles = {
  left: {
    fontFamily: "'KyoboHandwriting2020ParkDoYeon', sans-serif",
    fontSize: 17,
    color: '#34312F',
    bgColor: '#FBF8F1',
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'left',
    borderRadius: 14,
    paddingY: 16,
    paddingX: 24,
    hasShadow: true,
    hasBorder: true,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
  center: {
    fontFamily: "'Iropke Batang', serif",
    fontSize: 18,
    color: '#34312F',
    bgColor: 'transparent',
    isBold: true,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'center',
    borderRadius: 18,
    paddingY: 16,
    paddingX: 24,
    hasShadow: false,
    hasBorder: false,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
  right: {
    fontFamily: "'JoyBrightness', sans-serif",
    fontSize: 22,
    color: '#34312F',
    bgColor: '#FBF5E6',
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'left',
    borderRadius: 14,
    paddingY: 8,
    paddingX: 24,
    hasShadow: true,
    hasBorder: true,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
};

export const PRESET_FONTS: WebFont[] = [
  {
    id: 'nanum-pen',
    name: '나눔손글씨 펜체',
    family: "'Nanum Pen Script', cursive",
    category: 'handwriting',
    sourceType: 'google',
  },
  {
    id: 'gowun-batang',
    name: '고운바탕',
    family: "'Gowun Batang', serif",
    category: 'serif',
    sourceType: 'google',
  },
  {
    id: 'gowun-dodum',
    name: '고운돋움',
    family: "'Gowun Dodum', sans-serif",
    category: 'sans',
    sourceType: 'google',
  },
  {
    id: 'nanum-myeongjo',
    name: '나눔명조',
    family: "'Nanum Myeongjo', serif",
    category: 'serif',
    sourceType: 'google',
  },
  {
    id: 'noto-serif',
    name: '노토 세리프',
    family: "'Noto Serif KR', serif",
    category: 'serif',
    sourceType: 'google',
  },
  {
    id: 'gaegu',
    name: '개구체',
    family: "'Gaegu', cursive",
    category: 'handwriting',
    sourceType: 'google',
  },
  {
    id: 'dongle',
    name: '동글체',
    family: "'Dongle', sans-serif",
    category: 'handwriting',
    sourceType: 'google',
  },
  {
    id: 'pretendard',
    name: '프리텐다드',
    family: "'Pretendard', -apple-system, sans-serif",
    category: 'sans',
    sourceType: 'system',
  },
  {
    id: 'nanum-brush',
    name: '나눔 손글씨 붓',
    family: "'Nanum Brush Script', cursive",
    category: 'handwriting',
    sourceType: 'google',
  },
  {
    id: 'iropke-batang',
    name: '이롭게바탕체',
    family: "'Iropke Batang', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Iropke Batang';
  src: url('https://cdn.jsdelivr.net/font-iropke-batang/1.2/IropkeBatangM.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'yun-chorokwoosan-minguk',
    name: '윤초록우산어린이 민국',
    family: "'YunChorokwoosanEoriniMinguk', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'YunChorokwoosanEoriniMinguk';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaMinGuk.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'yunbonggil',
    name: '윤봉길체',
    family: "'Yunbonggil', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Yunbonggil';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/YUN-BONG-GIL.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'yoon-cho-woo-san',
    name: '윤초록우산어린이 만세',
    family: "'YoonChoWooSan', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'YoonChoWooSan';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaManSeh.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'yooncho-usan-childrens',
    name: '윤초록우산어린이 대한',
    family: "'YoonchoUsanChildrenS', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'YoonchoUsanChildrenS';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaDaeHan.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'yeogi-ottae-jalnan',
    name: '여기어때 잘난체',
    family: "'YeogiOttaeJalnan', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'YeogiOttaeJalnan';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.2/JalnanOTF00.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sungsil',
    name: '성실체',
    family: "'Sungsil', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Sungsil';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_10@1.0/Sungsil.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'soyo-danpung',
    name: '소요단풍체',
    family: "'SoyoDanpung', sans-serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SoyoDanpung';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2310@1.0/SOYOMapleRegularTTF.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sonpyeonji',
    name: '손편지체',
    family: "'Sonpyeonji', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Sonpyeonji';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_05@1.0/Handletter.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'songam-lee-hyeong-sik',
    name: '송암 이형식',
    family: "'SongamLeeHyeongSik', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SongamLeeHyeongSik';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2604-1@1.0/SongamIhyeongsik-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sim-gyeongha',
    name: '심경하체',
    family: "'SimGyeongha', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SimGyeongha';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202-2@1.0/SimKyungha.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'she-lee-ok-sun',
    name: '그녀-이옥선',
    family: "'SheLeeOkSun', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SheLeeOkSun';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_ten@1.0/Her-Leeoksun.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'she-gilwonok',
    name: '그녀-길원옥',
    family: "'SheGilwonok', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SheGilwonok';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_ten@1.0/Her-Gilwonok.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-wing',
    name: '학교안심 날개',
    family: "'SchoolSafetyWing', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyWing';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimNalgaeR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-tteokbokki',
    name: '학교안심 떡볶이',
    family: "'SchoolSafetyTteokbokki', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyTteokbokki';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimTTeokbokkiB.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-susukkang',
    name: '학교안심 수수깡',
    family: "'SchoolSafetySusukkang', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetySusukkang';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimSusukkangL.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-stubby-chalk',
    name: '학교안심 몽당분필',
    family: "'SchoolSafetyStubbyChalk', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyStubbyChalk';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimMondangbunfilR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-sketchbook',
    name: '학교안심 스케치북',
    family: "'SchoolSafetySketchbook', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetySketchbook';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimSketchbookR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-schedule',
    name: '학교안심 시간표',
    family: "'SchoolSafetySchedule', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetySchedule';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimSiganpyoR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-relay',
    name: '학교안심 이어달리기',
    family: "'SchoolSafetyRelay', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyRelay';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimYieodalligiL.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-poster',
    name: '학교안심 포스터',
    family: "'SchoolSafetyPoster', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyPoster';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimPosterB.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-ocarina',
    name: '학교안심 오카리나',
    family: "'SchoolSafetyOcarina', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyOcarina';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimOcarinaR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-manitto',
    name: '학교안심 마니또',
    family: "'SchoolSafetyManitto', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyManitto';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimManitoR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-kidari-balloon',
    name: '학교안심 키다리 풍선',
    family: "'SchoolSafetyKidariBalloon', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyKidariBalloon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimKidaripungseonL.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-half-moon',
    name: '학교안심 반달',
    family: "'SchoolSafetyHalfMoon', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyHalfMoon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimBandalL.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-dinosaur-egg',
    name: '학교안심 공룡알',
    family: "'SchoolSafetyDinosaurEgg', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyDinosaurEgg';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimGongryongalR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-dandelion-spore',
    name: '학교안심 민들레홀씨',
    family: "'SchoolSafetyDandelionSpore', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyDandelionSpore';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimMindeulleholssiR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-colored-pencil',
    name: '학교안심 색연필',
    family: "'SchoolSafetyColoredPencil', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyColoredPencil';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimSaekyeonpilR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-certificate',
    name: '학교안심 상장',
    family: "'SchoolSafetyCertificate', sans-serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyCertificate';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimSangjangR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safety-bookmark',
    name: '학교안심 책갈피',
    family: "'SchoolSafetyBookmark', sans-serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafetyBookmark';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/HakgyoansimChaekgalpiR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safe-little-one',
    name: '학교안심 꼬꼬마',
    family: "'SchoolSafeLittleOne', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafeLittleOne';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimKkokkomaR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'school-safe-board-marker',
    name: '학교안심 보드마카',
    family: "'SchoolSafeBoardMarker', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SchoolSafeBoardMarker';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/HakgyoansimBoadmarkerR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sanhayeop',
    name: '산하엽',
    family: "'Sanhayeop', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Sanhayeop';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_JAMO@1.0/Diphylleia-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sacheon-universe',
    name: '사천우주체',
    family: "'SacheonUniverse', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'SacheonUniverse';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2506-1@1.0/SacheonUju-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'sacheonhanggong',
    name: '사천항공체',
    family: "'Sacheonhanggong', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Sacheonhanggong';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2506-1@1.0/SacheonHangGong-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'rounded-fixedsys',
    name: '둥근모꼴',
    family: "'RoundedFixedsys', monospace",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'RoundedFixedsys';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'roughly-written-junwoo',
    name: '대충쓴준우체',
    family: "'RoughlyWrittenJunwoo', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'RoughlyWrittenJunwoo';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-4@1.1/RFjunwooo.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'paperozi',
    name: '페이퍼로지',
    family: "'Paperozi', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Paperozi';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleip-yoonwoo',
    name: '온글잎 윤우체',
    family: "'OngleipYoonwoo', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleipYoonwoo';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105@1.1/Yoonwoo.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongle-ip-sea-breeze',
    name: '온글잎 바닷바람',
    family: "'OngleIpSeaBreeze', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleIpSeaBreeze';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/Ownglyph_the_sea_breeze-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleip-ryuryu',
    name: '온글잎 류류체',
    family: "'OngleipRyuryu', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleipRyuryu';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_ryurue-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleip-ryudung',
    name: '온글잎 류뚱체',
    family: "'OngleipRyudung', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleipRyudung';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_ryuttung-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleip-park-dahyeon',
    name: '온글잎 박다현체',
    family: "'OngleipParkDahyeon', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleipParkDahyeon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/Ownglyph_ParkDaHyun.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleip-kimkonghae',
    name: '온글잎 김콩해',
    family: "'OngleipKimkonghae', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleipKimkonghae';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/Ownglyph_kimkonghae.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ongleeb-daisy',
    name: '온글잎 데이지',
    family: "'OngleebDaisy', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'OngleebDaisy';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/Ownglyph_daisy-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nostalgic-police-vibe',
    name: '그리운 경찰감성체',
    family: "'NostalgicPoliceVibe', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NostalgicPoliceVibe';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/Griun_PolSensibility-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nostalgic-police-human-rights',
    name: '그리운 경찰인권체',
    family: "'NostalgicPoliceHumanRights', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NostalgicPoliceHumanRights';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/Griun_PolHumanrights-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nostalgic-gelly-roll',
    name: '그리운 겔리롤',
    family: "'NostalgicGellyRoll', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NostalgicGellyRoll';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-1@1.0/Griun_Gellyroll-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-barun-gothic',
    name: '나눔바른고딕',
    family: "'NanumBarunGothic', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NanumBarunGothic';
  src: url('https://cdn.jsdelivr.net/font-nanumlight/1.0/NanumBarunGothicWeb.woff') format('woff'),
       url('https://cdn.jsdelivr.net/font-nanumlight/1.0/NanumBarunGothicWeb.ttf') format('truetype');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'missed-simsim',
    name: '그리운 심심체',
    family: "'MissedSimsim', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MissedSimsim';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/Griun_Simsimche-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'missed-gyuwon',
    name: '그리운 규원체',
    family: "'MissedGyuwon', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MissedGyuwon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/Griun_Gyuwon-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'mapoda-capo',
    name: '마포다카포',
    family: "'MapodaCapo', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MapodaCapo';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoDacapoA.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'manse',
    name: '만세체',
    family: "'Manse', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Manse';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/Manse.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kyobo-2020-park-do-yeon',
    name: '교보손글씨 2020 박도연',
    family: "'KyoboHandwriting2020ParkDoYeon', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KyoboHandwriting2020ParkDoYeon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2112@1.0/KyoboHandwriting2020A.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kim-jeong-cheol-handwriting',
    name: '김정철손글씨',
    family: "'KimJeongCheolHandwriting', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KimJeongCheolHandwriting';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302_01@1.0/KimjungchulScript-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-son-gigeong',
    name: 'KCC손기정체',
    family: "'KccSonGigeong', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccSonGigeong';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2212@1.0/KCC-Sonkeechung.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-sign',
    name: 'KCC 간판체',
    family: "'KccSign', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccSign';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCC-Ganpan.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-park-gyeongni',
    name: 'KCC 박경리체',
    family: "'KccParkGyeongni', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccParkGyeongni';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCPakKyongni.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-muruk-muruk',
    name: 'KCC 무럭무럭체',
    family: "'KccMurukMuruk', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccMurukMuruk';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCMurukmuruk.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-kim-hun',
    name: 'KCC 김훈체',
    family: "'KccKimHun', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccKimHun';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/KCC-Kimhoon-Regular.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-im-kwon-taek',
    name: 'KCC임권택체',
    family: "'KccImKwonTaek', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccImKwonTaek';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202@1.0/KCCImkwontaek.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-hyeri',
    name: 'KCC혜림체',
    family: "'KccHyeri', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccHyeri';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/KCCHyerim-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-hwan-gi',
    name: 'KCC김환기체',
    family: "'KccHwanGi', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccHwanGi';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202@1.0/KCC-Kimhwanki.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-eunyeong',
    name: 'KCC은영체',
    family: "'KccEunyeong', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccEunyeong';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/KCC-eunyoung-Regular.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-dodamdodam',
    name: 'KCC 도담도담체',
    family: "'KccDodamdodam', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccDodamdodam';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCC-DodamdodamR.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-cha-saem',
    name: 'KCC 차쌤체',
    family: "'KccChaSaem', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccChaSaem';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCChassam.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-bangjeonghwan',
    name: 'KCC방정환체',
    family: "'KccBangjeonghwan', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccBangjeonghwan';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-2@1.0/KCCBangJeonghwan.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'kcc-anjunggeun',
    name: 'KCC 안중근체',
    family: "'KccAnjunggeun', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KccAnjunggeun';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCAhnjunggeun.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jinju-park-kyeong-a',
    name: '진주 박경아체',
    family: "'JinjuParkKyeongA', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JinjuParkKyeongA';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_09@1.0/Parkgyunga.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jeonnam-education-yuna',
    name: '전남교육유나체',
    family: "'JeonnamEducationYuna', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JeonnamEducationYuna';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-1@1.0/JNE-Yuna-TTF-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jeonju-wanpanbon-soon',
    name: '전주완판본 순체',
    family: "'JeonjuWanpanbonSoon', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JeonjuWanpanbonSoon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202@1.0/JeonjuSunR.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jeonju-wanpanbon',
    name: '전주완판본 각체',
    family: "'JeonjuWanpanbon', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JeonjuWanpanbon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2102-01@1.0/Jeonju_gakR.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jeongnimsa-ji',
    name: '정림사지',
    family: "'JeongnimsaJi', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JeongnimsaJi';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_231029@1.1/Jeongnimsaji-R.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'jeju-stone-wall',
    name: '제주돌담체',
    family: "'JejuStoneWall', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JejuStoneWall';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2210-EF@1.0/EF_jejudoldam.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'ink-liquid',
    name: '잉크립퀴드체',
    family: "'InkLiquid', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'InkLiquid';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/InkLipquid.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'incheon-education-himchan',
    name: '인천교육힘찬체',
    family: "'IncheonEducationHimchan', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'IncheonEducationHimchan';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/iceHimchan-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'incheon-education-communication',
    name: '인천교육소통체',
    family: "'IncheonEducationCommunication', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'IncheonEducationCommunication';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/iceSotong-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'incheon-education-citizen',
    name: '인천교육시민체',
    family: "'IncheonEducationCitizen', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'IncheonEducationCitizen';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/iceSimin-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'incheon-education',
    name: '인천교육자람체',
    family: "'IncheonEducation', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'IncheonEducation';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/iceJaram-Rg.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'hs-gliding-serif',
    name: 'HS활공명조',
    family: "'HsGlidingSerif', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'HsGlidingSerif';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2604-1@1.0/HSHwalkongSerif-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'hanyun',
    name: '한윤체',
    family: "'Hanyun', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Hanyun';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_05@1.0/Hanyoon.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'han-yong-un',
    name: '한용운체',
    family: "'HanYongUn', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'HanYongUn';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/HAN-YONG-UN.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'hamlet',
    name: '함렛',
    family: "'Hamlet', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Hamlet';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2110@1.0/Hahmlet-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'gyeombalbal',
    name: '귀염발랄체',
    family: "'Gyeombalbal', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Gyeombalbal';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/insungitCutelivelyjisu.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'goseogu',
    name: '고서구체',
    family: "'Goseogu', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Goseogu';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-1@1.2/Goseogu-Regular.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'golden-face-true-heart',
    name: '금면성실',
    family: "'GoldenFaceTrueHeart', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GoldenFaceTrueHeart';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202@1.0/SSFaithfulnessOTF.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'gangwon-education-moduche',
    name: '강원교육모두체',
    family: "'GangwonEducationModuche', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GangwonEducationModuche';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2201-2@1.0/GangwonEdu_OTFLightA.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'gabia-cheongyeon',
    name: '가비아 청연체',
    family: "'GabiaCheongyeon', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GabiaCheongyeon';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2205@1.0/GabiaCheongyeon.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'chosun-ilbo-myungjo',
    name: '조선일보명조체',
    family: "'ChosunIlboMyungjo', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'ChosunIlboMyungjo';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_one@1.0/Chosunilbo_myungjo.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'cafe24-ssukssuk',
    name: '카페24 쑥쑥',
    family: "'Cafe24Ssukssuk', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Cafe24Ssukssuk';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/Cafe24Ssukssuk.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'cafe24-shining-star',
    name: '카페24 빛나는별',
    family: "'Cafe24ShiningStar', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Cafe24ShiningStar';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/Cafe24Shiningstar.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'cafe24-pro-slim',
    name: '카페24 PRO Slim Air',
    family: "'Cafe24ProSlim', sans-serif",
    category: 'sans',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Cafe24ProSlim';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2511-1@1.0/Cafe24PROSlim-Light.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'cafe24-gowoonbam',
    name: '카페24 고운밤',
    family: "'Cafe24Gowoonbam', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Cafe24Gowoonbam';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/Cafe24Oneprettynight.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'cafe24-dongdong',
    name: '카페24 동동',
    family: "'Cafe24Dongdong', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Cafe24Dongdong';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/Cafe24Dongdong.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'avi-czippapa',
    name: '어비 찌빠빠체',
    family: "'AviCzippapa', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'AviCzippapa';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_five@.2.0/UhBeeJJIBBABBA.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'andeul-science-unilabjang',
    name: '안될과학 유니랩장체',
    family: "'AndeulScienceUnilabjang', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'AndeulScienceUnilabjang';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2205-2@1.0/Unilab.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'amsterdam',
    name: '암스테르담',
    family: "'Amsterdam', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Amsterdam';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_01@1.0/Amsterdam.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'abi-lamiche',
    name: '어비 라미체',
    family: "'AbiLamiche', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'AbiLamiche';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_five@.2.0/UhBeeRami.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'poor-story',
    name: 'Poor Story',
    family: "'Poor Story', system-ui",
    category: 'handwriting',
    sourceType: 'google',
  },
  {
    id: 'nanum-hyeoki',
    name: '나눔손글씨 혁이체',
    family: "'Hyeoki', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Hyeoki';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_06@1.0/Hyukee.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-yedang',
    name: '나눔손글씨 예당체',
    family: "'Yedang', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Yedang';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_11@1.0/Yedang.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-yeol-il',
    name: '나눔손글씨 열일체',
    family: "'YeolIl', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'YeolIl';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_06@1.0/Hardworking.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-miraena-mu',
    name: '나눔손글씨 미래나무',
    family: "'MiraenaMu', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MiraenaMu';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/Future_tree.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-ttobakttobaki',
    name: '나눔손글씨 또박또박',
    family: "'Ttobakttobaki', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Ttobakttobaki';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_03@1.0/Ddobakddobak.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-mom-to-her-daughter',
    name: '나눔손글씨 딸에게 엄마가',
    family: "'MomToHerDaughter', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MomToHerDaughter';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_08@1.0/mom_to_daughter.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-ttaakdandan',
    name: '나눔손글씨 따악단단',
    family: "'Ttaakdandan', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Ttaakdandan';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_03@1.0/Ddakdandan.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-warm-farewell',
    name: '나눔손글씨 따뜻한 작별',
    family: "'WarmFarewell', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'WarmFarewell';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_11@1.0/Warm_farewell.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-round-relationship',
    name: '나눔손글씨 둥근인연',
    family: "'RoundRelationship', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'RoundRelationship';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_09@1.0/Round_destiny.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-dongwha-ttobbok',
    name: '나눔손글씨 동화또박',
    family: "'DongwhaTtobbok', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'DongwhaTtobbok';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_03@1.0/Fairytale_ddobak.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-daehan-minguk-yeolsa',
    name: '나눔손글씨 대한민국 열사체',
    family: "'DaehanMingukYeolsa', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'DaehanMingukYeolsa';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Korea_hero.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-daegwang-yuri',
    name: '나눔손글씨 대광유리',
    family: "'DaegwangYuri', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'DaegwangYuri';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_03@1.0/Deagwang_mirror.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-lunar-orbit',
    name: '나눔손글씨 달의궤도',
    family: "'LunarOrbit', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'LunarOrbit';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_09@1.0/Orbit_of_moon.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-dahaeng',
    name: '나눔손글씨 다행체',
    family: "'Dahaeng', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Dahaeng';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_02@1.0/Daheng.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-dachaesarang',
    name: '나눔손글씨 다채사랑',
    family: "'Dachaesarang', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Dachaesarang';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_02@1.0/Dache_love.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-dazin',
    name: '나눔손글씨 다진체',
    family: "'Dazin', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Dazin';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_03@1.0/Dajin.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-start-over',
    name: '나눔손글씨 다시 시작해',
    family: "'StartOver', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'StartOver';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_09@1.0/Restart.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-neuri-neuri',
    name: '나눔손글씨 느릿느릿체',
    family: "'NeuriNeuri', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NeuriNeuri';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_10@1.0/SlowSlow.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-donghee-trying-hard',
    name: '나눔손글씨 노력하는 동희',
    family: "'DongheeWhoIsTryingHard', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'DongheeWhoIsTryingHard';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_06@1.0/Hardworking_donghee.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-my-wifes-handwriting',
    name: '나눔손글씨 나의 아내 손글씨',
    family: "'MyWifeSHandwriting', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'MyWifeSHandwriting';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_08@1.0/My_wife_writing.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-wood-garden',
    name: '나눔손글씨 나무정원',
    family: "'WoodGarden', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'WoodGarden';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_10@1.0/Treegarden.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-i-will-overcome',
    name: '나눔손글씨 나는 이겨낸다',
    family: "'IWillOvercome', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'IWillOvercome';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_06@1.0/I_survive.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-edge',
    name: '나눔손글씨 끄트머리체',
    family: "'Edge', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Edge';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/Ggeuteumuri.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-flower-scent',
    name: '나눔손글씨 꽃내음',
    family: "'FlowerScent', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'FlowerScent';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_05@1.0/Gootneaeum.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-kim-yui',
    name: '나눔손글씨 김유이체',
    family: "'KimYui', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KimYui';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Kimyooyee.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-joy-brightness',
    name: '나눔손글씨 기쁨밝음',
    family: "'JoyBrightness', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'JoyBrightness';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/GibbemBalgeum.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-gold-silver-jewels',
    name: '나눔손글씨 금은보화',
    family: "'GoldSilverAndJewels', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GoldSilverAndJewels';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/Geumeunbohwa.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-kyuris-diary',
    name: '나눔손글씨 규리의 일기',
    family: "'KyuriSDiary', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'KyuriSDiary';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Kyuri_diary.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-gomsin',
    name: '나눔손글씨 곰신체',
    family: "'Gomsin', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Gomsin';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_05@1.0/Gomsin.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-goryeo-font',
    name: '나눔손글씨 고려글꼴',
    family: "'GoryeoFont', serif",
    category: 'serif',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GoryeoFont';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Koreageulggol.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-not-gothic-but-goding',
    name: '나눔손글씨 고딕 아니고 고딩',
    family: "'NotGothicButGoding', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'NotGothicButGoding';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_05@1.0/Gothic_Goding.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-strong-comfort',
    name: '나눔손글씨 강인한 위로',
    family: "'StrongComfort', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'StrongComfort';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Kanginhan.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-gang-bujang-nim',
    name: '나눔손글씨 강부장님체',
    family: "'GangBujangNim', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GangBujangNim';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_06@1.0/Kangbujang.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-galmat',
    name: '나눔손글씨 갈맷글',
    family: "'Galmat', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'Galmat';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/Galmetgol.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
  {
    id: 'nanum-garam-yeon-geot',
    name: '나눔손글씨 가람연꽃',
    family: "'GaramYeonGeot', sans-serif",
    category: 'handwriting',
    sourceType: 'noonnu',
    cssRule: `@font-face {
  font-family: 'GaramYeonGeot';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_04@1.0/Garam.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}`,
  },
];

export function getColorLuminance(color: string): number {
  if (!color) return 100;
  const trimmed = color.trim();
  let r = 250;
  let g = 247;
  let b = 240;

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (trimmed.startsWith('rgb')) {
    const parts = trimmed.match(/\d+(\.\d+)?/g);
    if (parts && parts.length >= 3) {
      r = Number(parts[0]);
      g = Number(parts[1]);
      b = Number(parts[2]);
    }
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return 100;
  }

  // Perceived luminance (0 ~ 100)
  return Math.round(((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100);
}

export const INITIAL_CANVAS_CONFIG: CanvasConfig = {
  width: 760,
  minHeight: 640,
  bgColor: '#F7F7F6',
  bgImageUrl: '',
  bgImageFit: 'cover',
  bgImageOpacity: 1,
  paperTexture: 'paper',
  textureIntensity: 50,
  darkBgAutoBoost: true,
  darkBgThreshold: 45,
  customTextureUrl: '',
  customTextureOpacity: 0.18,
  customTextureBlendMode: 'multiply',
  customTextureRepeat: 'repeat',
  showDividers: true,
  dividerColor: '#D1CAC0',
  dividerWidth: 88,
  dividerStyle: 'solid',
  headerText: '',
  footerText: '',
  showHeader: false,
  showFooter: false,
  paddingX: 44,
  paddingY: 48,
  bubbleSpacing: 22,
  bubbleMaxWidth: 82, // 82% max width limit before text wraps
  isFreePositionMode: false,
};

export const INITIAL_BUBBLES: Bubble[] = [
  {
    id: 'b-1',
    text: '2026.00.00',
    speaker: '',
    align: 'center',
    x: 26,
    y: 80,
    fontFamily: "'Iropke Batang', serif",
    fontSize: 18,
    color: '#34312F',
    bgColor: 'transparent',
    isBold: true,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'center',
    borderRadius: 18,
    cornerStyle: 'directional',
    paddingY: 16,
    paddingX: 24,
    hasShadow: false,
    hasBorder: false,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
  {
    id: 'b-2',
    text: '상대방',
    speaker: '',
    align: 'left',
    x: 0,
    y: 180,
    fontFamily: "'KyoboHandwriting2020ParkDoYeon', sans-serif",
    fontSize: 17,
    color: '#34312F',
    bgColor: '#FBF8F1',
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'left',
    borderRadius: 14,
    cornerStyle: 'directional',
    paddingY: 16,
    paddingX: 24,
    hasShadow: true,
    hasBorder: true,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
  {
    id: 'b-3',
    text: '나',
    speaker: '',
    align: 'right',
    x: 18,
    y: 280,
    fontFamily: "'JoyBrightness', sans-serif",
    fontSize: 22,
    color: '#34312F',
    bgColor: '#FBF5E6',
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isUnderline: false,
    textAlign: 'left',
    borderRadius: 14,
    cornerStyle: 'directional',
    paddingY: 8,
    paddingX: 24,
    hasShadow: true,
    hasBorder: true,
    borderColor: '#E5DED3',
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
];

export const COLOR_PALETTE = {
  text: [
    { label: '순백색', value: '#FFFFFF' },
    { label: '순흑색', value: '#000000' },
    { label: '깊은 남빛', value: '#233045' },
    { label: '고서 인주빛', value: '#823737' },
    { label: '솔잎 녹색', value: '#2F483A' },
  ],
  bubbleBg: [
    { label: '투명', value: 'transparent' },
    { label: '이체통 쪽지 A', value: '#FBF8F1' },
    { label: '이체통 쪽지 B', value: '#FBF5E6' },
    { label: '순백 화이트', value: '#FFFFFF' },
    { label: '다정한 차콜', value: '#2B2826' },
    { label: '카톡', value: '#FFEB33' },
    { label: '라인', value: '#6FE77B' },
  ],
  canvasBg: [
    { label: '기본', value: '#F7F7F6' },
    { label: '순백지', value: '#FFFFFF' },
    { label: '칠흑지', value: '#1C1B19' },
    { label: '카톡', value: '#BBCFE1' },
    { label: '라인', value: '#8CABD9' },
  ],
};
