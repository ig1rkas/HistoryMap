import { YMaps } from '@pbe/react-yandex-maps';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroContent from '../components/HeroContent';
import MapSection from '../components/MapSection';

const ymapsQuery = {
  apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
  lang: 'ru_RU',
  load: 'package.full',
};

export default function LandingPage() {
  return (
    <YMaps query={ymapsQuery}>
      <div className="page">
        <div className="page__right-gradient" aria-hidden="true">
          <svg
            className="page__wave-svg"
            viewBox="0 0 1200 1080"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveBase" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eba0b0" />
                <stop offset="48%" stopColor="#f67b93" />
                <stop offset="100%" stopColor="#ff4f73" />
              </linearGradient>

              <linearGradient id="waveSoft" x1="0.05" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.015)" />
              </linearGradient>

              <radialGradient
                id="waveGlow"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(860 170) rotate(32) scale(440 300)"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            <path
              fill="url(#waveBase)"
              d="
                M210,0
                C320,6 444,34 566,92
                C664,138 746,190 804,252
                C858,310 884,372 874,432
                C864,486 826,528 770,552
                C718,574 670,590 646,628
                C620,670 624,726 660,796
                C698,870 742,950 806,1080
                L1200,1080
                L1200,0
                Z
              "
            />

            <path
              fill="url(#waveSoft)"
              opacity="0.44"
              d="
                M248,0
                C354,10 470,38 584,92
                C676,136 752,186 806,246
                C856,302 880,360 870,418
                C860,470 824,510 772,534
                C724,556 682,572 658,608
                C632,648 638,704 670,772
                C704,844 748,928 816,1080
                L1200,1080
                L1200,0
                Z
              "
            />

            <path
              fill="url(#waveGlow)"
              opacity="0.56"
              d="
                M530,0
                C636,44 744,120 832,212
                C902,286 944,366 948,446
                C950,514 922,570 878,606
                C836,640 804,676 800,726
                C796,790 828,872 892,1080
                L1200,1080
                L1200,0
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
          <Header variant="landing" showLogin />
          <main className="hero">
            <HeroContent />
            <MapSection />
          </main>
          <Footer className="site-footer--landing" />
        </div>
      </div>
    </YMaps>
  );
}