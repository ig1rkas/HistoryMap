import { YMaps } from '@pbe/react-yandex-maps';
import Header from './components/Header';
import HeroContent from './components/HeroContent';
import MapSection from './components/MapSection';

const ymapsQuery = {
  apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
  lang: 'ru_RU',
  load: 'package.full',
};

export default function App() {
  return (
    <YMaps query={ymapsQuery}>
      <div className="page">
        <div className="page__right-gradient" aria-hidden="true">
          <svg
            className="page__wave-svg"
            viewBox="0 0 1100 1080"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveBase" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e99cab" />
                <stop offset="48%" stopColor="#f57890" />
                <stop offset="100%" stopColor="#ff4f73" />
              </linearGradient>

              <linearGradient id="waveSoft" x1="0.08" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="42%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.015)" />
              </linearGradient>

              <radialGradient
                id="waveGlow"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(760 190) rotate(34) scale(360 260)"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="65%" stopColor="rgba(255,255,255,0.035)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            <path
              fill="url(#waveBase)"
              d="
                M365,0
                C445,20 520,62 586,122
                C648,178 694,238 710,300
                C725,360 707,412 670,446
                C636,478 594,500 586,542
                C578,588 600,640 646,702
                C696,770 734,846 752,930
                C765,992 776,1042 794,1080
                L1100,1080
                L1100,0
                Z
              "
            />

            <path
              fill="url(#waveSoft)"
              opacity="0.46"
              d="
                M392,0
                C468,18 540,58 602,116
                C660,170 702,228 716,288
                C730,346 714,396 680,430
                C648,462 610,486 602,528
                C594,574 616,626 660,686
                C706,750 742,826 760,914
                C772,976 784,1032 804,1080
                L1100,1080
                L1100,0
                Z
              "
            />

            <path
              fill="url(#waveGlow)"
              opacity="0.58"
              d="
                M520,0
                C580,40 642,104 694,178
                C742,248 774,320 782,392
                C790,456 778,514 758,564
                C736,618 740,678 776,748
                C814,822 846,912 866,1080
                L1100,1080
                L1100,0
                Z
              "
            />
          </svg>
        </div>

        <svg
          className="page__decor page__decor--top"
          viewBox="0 0 210 300"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 0C136 56 98 104 98 152C98 214 140 244 154 300" />
        </svg>

        <svg
          className="page__decor page__decor--main"
          viewBox="0 0 560 650"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="116"
            cy="72"
            rx="58"
            ry="24"
            transform="rotate(-33 116 72)"
          />
          <path d="M334 0C360 92 258 128 190 174C120 222 128 326 204 388C278 448 414 440 504 530C533 558 550 596 560 650" />
        </svg>

        <div className="container">
          <Header />
          <main className="hero">
            <HeroContent />
            <MapSection />
          </main>
        </div>
      </div>
    </YMaps>
  );
}