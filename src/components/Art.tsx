import { useId } from "react";
export function Nova({
  size = 100,
  mood = "happy",
  hat = false,
}: {
  size?: number;
  mood?: string;
  hat?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`nova nova-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      role="img"
      aria-label={`Nova is ${mood}`}
    >
      <defs>
        <radialGradient id={`${id}body`} cx=".35" cy=".2" r=".9">
          <stop stopColor="#E4F8C6" />
          <stop offset=".5" stopColor="#ADC981" />
          <stop offset="1" stopColor="#648849" />
        </radialGradient>
        <radialGradient id={`${id}face`}>
          <stop stopColor="#FCFFEA" />
          <stop offset="1" stopColor="#D9E8B9" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="144" rx="43" ry="7" fill="#000" opacity=".16" />
      <path
        d="M44 110C23 101 22 79 33 69L52 81M116 110C137 101 138 79 127 69L108 81"
        fill="#83A65A"
      />
      <path
        d="M48 132L47 143Q59 149 68 140M95 140Q107 149 119 140L111 124"
        fill="#72954E"
      />
      <path
        d="M37 53Q31 22 48 15Q62 25 62 39M103 39Q105 19 123 15Q133 34 124 58"
        fill="#AACD7E"
        stroke="#DAEDB3"
        strokeWidth="2"
      />
      <path d="M79 42Q65 22 79 9Q99 19 92 40" fill="#BBDD8A" />
      <path d="M80 33Q88 4 109 7Q113 26 91 37" fill="#6BBF67" />
      <path d="M80 33L101 15" stroke="#DAFBA7" strokeWidth="2" />
      <path
        d="M29 81Q25 37 78 36Q134 36 133 87L126 111Q122 140 81 141Q39 142 33 112Z"
        fill={`url(#${id}body)`}
      />
      <path
        d="M41 79Q39 57 59 53Q71 51 81 62Q95 48 113 57Q128 64 120 92Q116 116 81 118Q46 117 41 79Z"
        fill={`url(#${id}face)`}
      />
      <ellipse
        cx="58"
        cy="83"
        rx="7"
        ry={mood === "sleeping" ? 2 : 10}
        fill="#273C29"
      />
      <ellipse
        cx="103"
        cy="83"
        rx="7"
        ry={mood === "sleeping" ? 2 : 10}
        fill="#273C29"
      />
      <circle cx="60" cy="80" r="2.5" fill="white" />
      <circle cx="105" cy="80" r="2.5" fill="white" />
      <ellipse cx="48" cy="98" rx="8" ry="4" fill="#E9B59A" opacity=".6" />
      <ellipse cx="113" cy="98" rx="8" ry="4" fill="#E9B59A" opacity=".6" />
      <path
        d="M75 97Q81 104 88 97"
        stroke="#44603B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M61 123Q80 112 100 123L96 139H65Z" fill="#DBE8AD" />
      <path
        d="M39 111L55 114M121 111L108 115"
        stroke="#87A762"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {hat && (
        <>
          <path d="M39 48L80 27L124 46L81 66Z" fill="#345653" />
          <path d="M54 58V70Q81 80 108 69V55" fill="#294541" />
          <path d="M123 47V79" stroke="#EED586" strokeWidth="3" />
          <circle cx="123" cy="81" r="4" fill="#EED586" />
        </>
      )}
    </svg>
  );
}
function Pine({
  x,
  y,
  s = 1,
  color = "#32664c",
}: {
  x: number;
  y: number;
  s?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-3 0H3V-24H-3Z" fill="#766F48" />
      <path d="M0-79L-24-32H-15L-32-12H32L15-32H24Z" fill={color} />
      <path d="M0-79V-12H32L15-32H24Z" fill="#0E332A" opacity=".3" />
      <path d="M0-79L-10-60H9Z" fill="#90A46E" opacity=".4" />
    </g>
  );
}
export function WorldArt({ large = false }: { large?: boolean }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`world-art ${large ? "world-large" : ""}`}
      viewBox="0 0 640 370"
      role="img"
      aria-label="Floating forest islands connected by a path to a glowing learning portal"
    >
      <defs>
        <linearGradient id={`${id}rock`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#506044" />
          <stop offset=".45" stopColor="#253D30" />
          <stop offset="1" stopColor="#142A25" />
        </linearGradient>
        <linearGradient id={`${id}top`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#87A472" />
          <stop offset="1" stopColor="#405D3E" />
        </linearGradient>
        <linearGradient id={`${id}portal`}>
          <stop stopColor="#F6F5BF" />
          <stop offset="1" stopColor="#90EAA7" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop stopColor="#B3EE92" stopOpacity=".3" />
          <stop offset="1" stopColor="#B3EE92" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}shadow`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <ellipse
        className="world-ground-shadow"
        cx="363"
        cy="327"
        rx="175"
        ry="17"
        fill="#041810"
        opacity=".65"
        filter={`url(#${id}shadow)`}
      />
      <circle cx="451" cy="117" r="115" fill={`url(#${id}glow)`} />
      <g opacity=".4">
        <path d="M496 46L545 21L588 43L574 72L535 87L508 70Z" fill="#234234" />
        <path d="M496 46L545 21L588 43L536 63Z" fill="#4D7152" />
        <Pine x={546} y={44} s={0.45} />
        <Pine x={563} y={45} s={0.3} />
      </g>
      <path
        d="M178 218L224 199L274 214L261 247L226 270L190 249Z"
        fill={`url(#${id}rock)`}
      />
      <path d="M178 218L220 193L274 214L229 236Z" fill={`url(#${id}top)`} />
      <path d="M181 219L229 240L269 219" stroke="#94A472" strokeWidth="3" />
      <Pine x={209} y={211} s={0.55} />
      <Pine x={229} y={216} s={0.36} />
      <path d="M259 215Q308 220 326 204" stroke="#9C9470" strokeWidth="9" />
      <path
        d="M258 210Q308 215 326 199"
        stroke="#E1CA8C"
        strokeWidth="2"
        strokeDasharray="3 8"
      />
      <path
        d="M284 171L397 114L554 158L571 208L535 248L455 291L363 271L312 222Z"
        fill={`url(#${id}rock)`}
      />
      <path
        d="M284 171L397 114L554 158L571 208L455 254L338 223Z"
        fill={`url(#${id}top)`}
      />
      <path
        d="M284 171L338 217L456 246L571 203"
        fill="none"
        stroke="#B2B67C"
        strokeWidth="5"
      />
      <path
        d="M338 224L362 269L377 238M454 250L454 287L482 244M521 230L510 255"
        fill="#152D25"
      />
      <path
        d="M314 181Q361 174 372 201Q383 220 415 209Q434 199 439 173Q443 157 462 154"
        stroke="#C6BC88"
        strokeWidth="17"
        fill="none"
      />
      <path
        d="M314 181Q361 174 372 201Q383 220 415 209Q434 199 439 173Q443 157 462 154"
        stroke="#EBDAA9"
        strokeWidth="2"
        strokeDasharray="3 9"
        fill="none"
      />
      <path d="M373 116L398 103L416 111L406 125Z" fill="#9BA779" />
      <Pine x={350} y={162} s={1} />
      <Pine x={377} y={150} s={0.9} color="#447855" />
      <Pine x={316} y={167} s={0.65} color="#457154" />
      <Pine x={512} y={180} s={0.9} />
      <Pine x={538} y={183} s={0.63} color="#486E45" />
      <Pine x={489} y={200} s={0.5} color="#659364" />
      <path
        d="M439 163V106Q456 74 479 98V154L467 159V109Q458 98 452 112V166Z"
        fill="#B0B986"
      />
      <path d="M452 163V113Q461 97 470 109V158Z" fill={`url(#${id}portal)`} />
      <path d="M433 166L456 172L485 159L477 153L453 165Z" fill="#A1AD7E" />
      <circle cx="461" cy="130" r="22" fill={`url(#${id}glow)`} />
      <path d="M383 210L383 194L392 189L400 194V211L392 216Z" fill="#EBE9B0" />
      <path d="M381 193L391 184L402 192L392 198Z" fill="#BFE77B" />
      <path d="M366 184L369 181L373 184L370 187Z" fill="#D6EAB1" />
      <g fill="#D5F0A4">
        <circle cx="416" cy="87" r="2" />
        <circle cx="509" cy="113" r="2" />
        <circle cx="427" cy="143" r="1.5" />
        <circle cx="362" cy="70" r="1.5" />
        <circle cx="481" cy="58" r="2" />
        <path d="M401 61V71M396 66H406" stroke="#BEDA9A" />
        <path d="M541 109V117M537 113H545" stroke="#BEDA9A" />
      </g>
      <path
        d="M433 260L424 302L412 315"
        stroke="#416C48"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M424 286Q409 282 415 295Q424 299 424 286M424 302Q441 292 438 303Q432 313 424 302"
        fill="#67924D"
      />
      <g transform="translate(128 260)">
        <path d="M0 0L30-15L56-4L44 20L22 30L8 17Z" fill={`url(#${id}rock)`} />
        <path d="M0 0L30-15L56-4L27 11Z" fill="#5D7F50" />
        <Pine x={29} y={-5} s={0.35} />
      </g>
    </svg>
  );
}
export function GardenArt() {
  return (
    <div className="garden-art">
      <span className="garden-star star-a">✧</span>
      <span className="garden-star star-b">✦</span>
      <svg viewBox="0 0 180 140" aria-hidden="true">
        <ellipse cx="90" cy="115" rx="59" ry="18" fill="#23382b" />
        <path d="M47 104L90 82L133 103L90 128Z" fill="#5A7950" />
        <path d="M47 104V113L90 137L133 115V103L90 126Z" fill="#354B33" />
        <path
          d="M90 110V57M91 88Q57 92 62 63Q93 64 91 88M91 72Q115 76 119 49Q91 47 91 72"
          fill="#8FBD6C"
          stroke="#8FBD6C"
          strokeWidth="3"
        />
        <path d="M90 58Q67 48 77 28Q104 30 90 58" fill="#B3D987" />
        <path
          d="M66 115V92M66 105Q50 105 52 91Q67 91 66 105"
          stroke="#78A95A"
          strokeWidth="3"
          fill="#78A95A"
        />
        <circle cx="113" cy="112" r="4" fill="#CBC380" />
      </svg>
    </div>
  );
}
