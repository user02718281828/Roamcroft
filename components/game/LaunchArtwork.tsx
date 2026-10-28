'use client';
import { translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

/** Keep lettering as real translated text, rather than baking Turkish into an image. */
export default function LaunchArtwork() {
  useLocale();
  return <svg className="launch-art" viewBox="0 0 1200 630" aria-hidden="true" focusable="false">
    <defs><linearGradient id="launch-land" x2="1" y2="1"><stop stopColor="#172e2b"/><stop offset="1" stopColor="#53633c"/></linearGradient></defs>
    <path fill="url(#launch-land)" d="M0 0h1200v630H0z"/>
    <path fill="#a3a677" d="M812 0h249c56 141-185 190-116 318 31 61 163 91 255 147v165h-157c51-87 61-102-26-140-252-109-138-186-116-279C929 94 929 53 812 0"/>
    <path fill="#63a8b8" d="M837 0h196c57 144-181 189-111 328 38 75 176 97 278 171v131h-133c49-83 47-96-59-141-240-102-127-196-105-279C929 104 930 53 837 0"/>
    <g fill="#6f834c" opacity=".8"><circle cx="84" cy="599" r="116"/><circle cx="785" cy="484" r="90"/><circle cx="1090" cy="88" r="66"/></g>
    <path fill="#e9c578" d="M140 117c9 24 31 33 32 57 13-5 19-16 18-28 48 26 54 55 31 87-31 42-94 25-101-17-4-33 25-54 20-99"/>
    <text x="82" y="354" fill="#f0d18b" fontSize="108" fontFamily="Georgia, serif">Roamcroft</text>
    <path stroke="#a6aa7560" d="M85 393h570"/>
    <text x="85" y="445" fill="#e0dfbb" fontSize="25" fontFamily="Segoe UI, sans-serif" letterSpacing="3">{translate('m_2b04167dc2')}</text>
    <text x="85" y="553" fill="#b8c7a6" fontSize="22" fontFamily="Segoe UI, sans-serif">{translate('m_f136549175')}</text>
  </svg>;
}
