function makeSvg(inner) {
  return `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      ${inner}
    </svg>
  `;
}

const ICONS = {
  coin: makeSvg(`<circle cx="12" cy="12" r="10"></circle><path d="M12 7v10"></path><path d="M15 9.5c0-1.5-1.3-2.5-3-2.5s-3 1-3 2.5 1.3 2 3 2.5 3 1 3 2.5-1.3 2.5-3 2.5-3-1-3-2.5"></path>`),
  shop: makeSvg(`<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>`),
  atom: makeSvg(`<circle cx="12" cy="12" r="1"></circle><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9C11.16 3.78 5.83 1.76 3.8 3.8c-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"></path><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"></path>`),
  mission: makeSvg(`<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>`),
  trophy: makeSvg(`<path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0z"></path><path d="M17 5h3v2a3 3 0 0 1-3 3"></path><path d="M7 5H4v2a3 3 0 0 0 3 3"></path>`),
  dice: makeSvg(`<rect x="3" y="3" width="18" height="18" rx="4"></rect><circle cx="8.5" cy="8.5" r="1"></circle><circle cx="15.5" cy="15.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle><circle cx="8.5" cy="15.5" r="1"></circle>`),
  theme: makeSvg(`<circle cx="12" cy="12" r="10"></circle><circle cx="8" cy="10" r="1"></circle><circle cx="12" cy="8" r="1"></circle><circle cx="16" cy="10" r="1"></circle><path d="M12 22c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2-.5-.6-.8-1.3-.8-2 0-1.7 1.3-3 3-3h1.8"></path>`),
  chart: makeSvg(`<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>`),
  settings: makeSvg(`<line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>`),
  sword: makeSvg(`<path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path>`),
  gift: makeSvg(`<polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>`),
  crown: makeSvg(`<path d="M2 18h20l-2-8-5 4-3-6-3 6-5-4z"></path>`),
  bolt: makeSvg(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`),
  money: makeSvg(`<rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle><path d="M6 12h.01"></path><path d="M18 12h.01"></path>`),
  mouse: makeSvg(`<rect x="6" y="2" width="12" height="20" rx="6"></rect><line x1="12" y1="6" x2="12" y2="10"></line>`),
  hand: makeSvg(`<path d="M18 11V6a2 2 0 0 0-4 0v5"></path><path d="M14 10V4a2 2 0 0 0-4 0v6"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>`),
  robot: makeSvg(`<rect x="3" y="8" width="18" height="12" rx="2"></rect><path d="M12 2v6"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle>`),
  factory: makeSvg(`<path d="M2 20h20"></path><path d="M4 20V9l5 3V9l5 3V5l6 3v12"></path>`),
  globe: makeSvg(`<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`),
  bank: makeSvg(`<path d="M3 21h18"></path><path d="M5 21V10"></path><path d="M19 21V10"></path><path d="M12 3 2 8h20z"></path><path d="M9 21v-6h6v6"></path>`),
  bitcoin: makeSvg(`<circle cx="12" cy="12" r="10"></circle><path d="M9.5 8h5a2.5 2.5 0 0 1 0 5h-5z"></path><path d="M9.5 13h6a2.5 2.5 0 0 1 0 5h-6z"></path><path d="M10 6v2"></path><path d="M14 6v2"></path><path d="M10 16v2"></path><path d="M14 16v2"></path>`),
  cpu: makeSvg(`<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>`),
  star: makeSvg(`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>`)
};

function icon(name, cls = "svg-icon") {
  return `<span class="${cls}" aria-hidden="true">${ICONS[name] || ICONS.star}</span>`;
}