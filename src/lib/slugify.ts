const COMBINING_DIACRITICS = /[̀-ͯ]/g

export function slugify(input: string): string {
  return input
    .replace(/đ/g, 'dj')
    .replace(/Đ/g, 'Dj')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
