/** Line-art thumbnails for the project cards, drawn in the same visual language. */

export const THUMBS = [
  // radar sweep — spam and threat analyzer
  <>
    <path className="s" d="M50 150a110 110 0 0 1 220 0z" />
    <path className="s" d="M95 150a65 65 0 0 1 130 0" opacity=".45" />
    <path className="s" d="M128 150a32 32 0 0 1 64 0" opacity=".45" />
    <path className="as t-sweep" d="M160 150V44" />
    <circle className="a t-zone" cx="118" cy="92" r="5" />
    <circle className="a t-zone" cx="214" cy="110" r="4" style={{ animationDelay: ".9s" }} />
  </>,
  // phone and screen — ABTalks redesign
  <>
    <rect className="s" x="52" y="42" width="50" height="96" rx="8" />
    <rect className="a" x="62" y="58" width="30" height="22" />
    <rect className="d" x="62" y="88" width="30" height="6" />
    <rect className="d" x="62" y="100" width="20" height="6" />
    <rect className="s" x="150" y="38" width="130" height="84" rx="4" />
    <path className="s" d="M136 134h158" />
    <rect className="a" x="182" y="52" width="66" height="34" />
    <rect className="d" x="182" y="94" width="66" height="7" />
    <rect className="d" x="182" y="106" width="44" height="7" />
    <path className="as" d="M110 90h30" strokeDasharray="3 7" style={{ animation: "dash 1s linear infinite" }} />
  </>,
  // screen with zones — landing page
  <>
    <rect className="s" x="78" y="30" width="164" height="104" rx="5" />
    <path className="s" d="M58 148h204" />
    <rect className="a t-zone" x="84" y="36" width="34" height="26" />
    <rect className="a t-zone" x="202" y="36" width="34" height="26" style={{ animationDelay: ".5s" }} />
    <rect className="a t-zone" x="84" y="102" width="34" height="26" style={{ animationDelay: "1.5s" }} />
    <rect className="a t-zone" x="202" y="102" width="34" height="26" style={{ animationDelay: "1s" }} />
    <circle className="s" cx="160" cy="82" r="5" />
  </>,
  // transfer between devices — budget app
  <>
    <rect className="s" x="46" y="40" width="54" height="100" rx="8" />
    <rect className="d" x="54" y="54" width="38" height="8" />
    <rect className="d" x="54" y="68" width="26" height="8" />
    <rect className="s" x="196" y="54" width="92" height="60" rx="4" />
    <path className="s" d="M184 126h116" />
    <path className="as" d="M110 90h76" strokeDasharray="4 10" style={{ animation: "dash 1s linear infinite" }} />
    <rect className="a t-pk" x="104" y="84" width="12" height="12" />
    <rect className="a t-pk" x="104" y="84" width="12" height="12" style={{ animationDelay: ".8s" }} />
  </>,
  // geometry — polygon calculator
  <>
    <rect className="s" x="66" y="46" width="124" height="86" rx="4" />
    <path className="s" d="M56 150h208" />
    <path className="as" d="M66 132L190 46" strokeDasharray="5 9" style={{ animation: "dash 1.4s linear infinite" }} />
    <path className="s" d="M190 132L244 74" />
    <circle className="a" cx="66" cy="46" r="4" />
    <circle className="a" cx="190" cy="46" r="4" />
    <circle className="a" cx="190" cy="132" r="4" />
    <path className="d" d="M66 132h124" />
  </>,
  // browser window — this portfolio
  <>
    <rect className="s" x="52" y="34" width="216" height="112" rx="6" />
    <path className="s" d="M52 58h216" />
    <circle className="a" cx="68" cy="46" r="4" />
    <circle className="d" cx="82" cy="46" r="4" />
    <circle className="d" cx="96" cy="46" r="4" />
    <rect className="d" x="68" y="72" width="62" height="7" />
    <rect className="a" x="68" y="90" width="118" height="7" />
    <rect className="d" x="68" y="108" width="48" height="7" />
    <rect className="a t-pk" x="196" y="106" width="11" height="11" />
  </>,
];
