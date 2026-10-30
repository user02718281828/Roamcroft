// Public identity only. Game API, WebSocket and saves remain relative to the current origin.
export const SITE_URL = 'https://roamcroft.com';
// Historical storage/session origin for recovery documentation, not a public endpoint.
export const LEGACY_URL = 'https://roamcroft.roamcroft.workers.dev';
export const SITE_DESCRIPTION = 'A free isometric browser farming game. Grow crops, craft, explore a valley and share a surface farm with up to four players. Play in English or Turkish.';
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {'@type':'WebSite','@id':`${SITE_URL}/#website`,name:'Roamcroft',url:SITE_URL+'/',inLanguage:['en','tr']},
    {'@type':'VideoGame','@id':`${SITE_URL}/#game`,name:'Roamcroft',url:SITE_URL+'/',description:SITE_DESCRIPTION,
      image:SITE_URL+'/og-image.jpg',genre:['Farming','Crafting','Exploration'],gamePlatform:'Web browser',
      inLanguage:['en','tr'],playMode:['SinglePlayer','MultiPlayer']},
  ],
};
