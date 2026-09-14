const categoryDescriptionBySlug: Record<string, { en: string; sr: string }> = {
  dorucak: { en: 'Start your day with delicious breakfast ideas.', sr: 'Započnite dan ukusnim idejama za doručak.' },
  predjela: { en: 'Small bites, big flavors.', sr: 'Mali zalogaji, veliki ukusi.' },
  'supe-i-corbe': { en: 'Warm and comforting soups for every season.', sr: 'Tople i prijatne supe za svaku sezonu.' },
  'glavna-jela': { en: 'Hearty and satisfying main courses.', sr: 'Izdašna i zasitna glavna jela.' },
  prilozi: { en: 'Perfect companions to any meal.', sr: 'Savršena dopuna svakom obroku.' },
  salate: { en: 'Fresh, healthy and flavorful salad recipes.', sr: 'Sveži, zdravi i ukusni recepti za salate.' },
  peciva: { en: 'Bread, rolls and homemade pastries.', sr: 'Hleb, zemičke i domaće pecivo.' },
  deserti: { en: 'Sweet treats for every occasion.', sr: 'Slatki zalogaji za svaku priliku.' },
  'sosovi-prelivi-i-namazi': {
    en: 'Sauces, dressings and spreads to top off any dish.',
    sr: 'Sosovi, prelivi i namazi za svako jelo.',
  },
  'pica-i-napici': { en: 'Refreshing drinks for any time.', sr: 'Osvežavajuća pića za svaki trenutak.' },
  ostalo: { en: 'Everything else.', sr: 'Sve ostalo.' },
}

export function getCategoryDescription(slug: string, lang: 'en' | 'sr'): string | null {
  const entry = categoryDescriptionBySlug[slug]
  if (!entry) return null
  return lang === 'sr' ? entry.sr : entry.en
}
