import type { CategoryWithCount } from '@/hooks/useCategories'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import type { Tag } from '@/hooks/useTags'
import type { SupportedLanguage } from '@/lib/i18n'
import { pickLocalized } from '@/lib/localizedField'

export interface AiRecipePromptOptions {
  lang: SupportedLanguage
  categories: CategoryWithCount[]
  subcategories: SubcategoryWithCount[]
  tags: Tag[]
  nameSr: string
  nameEn: string
}

function listCategories(categories: CategoryWithCount[], lang: SupportedLanguage): string {
  return categories
    .map((category) => `- ${category.slug} — ${pickLocalized(category.name_en, category.name_sr, lang)}`)
    .join('\n')
}

function listSubcategoriesByCategory(
  categories: CategoryWithCount[],
  subcategories: SubcategoryWithCount[],
  lang: SupportedLanguage,
): string {
  return categories
    .map((category) => {
      const children = subcategories.filter((subcategory) => subcategory.category_id === category.id)
      if (children.length === 0) return null
      const childList = children
        .map((sub) => `${sub.slug} (${pickLocalized(sub.name_en, sub.name_sr, lang)})`)
        .join(', ')
      return `- ${category.slug}: ${childList}`
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}

function listTags(tags: Tag[], lang: SupportedLanguage): string {
  return tags.map((tag) => `- ${tag.slug} — ${pickLocalized(tag.name_en, tag.name_sr, lang)}`).join('\n')
}

export function buildAiRecipePrompt({
  lang,
  categories,
  subcategories,
  tags,
  nameSr,
  nameEn,
}: AiRecipePromptOptions): string {
  const categoryList = listCategories(categories, lang)
  const subcategoryList = listSubcategoriesByCategory(categories, subcategories, lang)
  const tagList = listTags(tags, lang)

  const recipeName =
    nameSr.trim() || nameEn.trim()
      ? `${nameSr.trim() || '—'} / ${nameEn.trim() || '—'}`
      : lang === 'sr'
        ? '[UPIŠI NAZIV RECEPTA OVDE, npr. "Proja sa sirom" / "Cheese Cornbread"]'
        : '[INSERT RECIPE NAME HERE, e.g. "Proja sa sirom" / "Cheese Cornbread"]'

  if (lang === 'sr') {
    return `Ti si asistent koji priprema podatke o receptima za dvojezični (srpski/engleski) sajt sa receptima.

ZADATAK
Za recept: ${recipeName}
Vrati ISKLJUČIVO jedan validan JSON objekat — bez markdown ograda (\`\`\`), bez uvodnog teksta i bez komentara pre ili posle — koji tačno prati šemu ispod. Ako neko polje ne možeš pouzdano da popuniš, koristi razumnu procenu na osnovu uobičajenog recepta za to jelo.

ŠEMA
{
  "name_sr": string,              // naziv recepta na srpskom
  "name_en": string,               // naziv recepta na engleskom (obavezno)
  "slug": string,                  // opciono, npr. "proja-sa-sirom" (malim slovima, bez dijakritike, reči odvojene crticom)
  "description_sr": string,        // kratak opis (1-2 rečenice), srpski
  "description_en": string,        // kratak opis (1-2 rečenice), engleski
  "category": string,              // OBAVEZNO — tačno jedan slug iz liste "DOZVOLJENE KATEGORIJE"
  "subcategory": string,           // opciono — tačno jedan slug iz liste "DOZVOLJENE PODKATEGORIJE" za izabranu kategoriju
  "tags": string[],                // opciono — 0 ili više slug-ova iz liste "DOZVOLJENI TAGOVI"
  "prep_time_minutes": number,     // vreme pripreme u minutima
  "cook_time_minutes": number,     // vreme kuvanja/pečenja u minutima
  "servings": number,              // broj porcija
  "weight_grams": number,          // procenjena ukupna težina gotovog jela u gramima
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [
    { "name_sr": string, "name_en": string, "quantity": number, "unit_sr": string, "unit_en": string }
  ],
  "steps": [
    { "text_sr": string, "text_en": string }
  ],
  "notes_sr": string,              // opciono, saveti/varijacije, srpski
  "notes_en": string               // opciono, saveti/varijacije, engleski
}

PRAVILA
- "ingredients" i "steps" moraju imati bar po jedan element.
- Koraci treba da budu jasni i navedeni redosledom pripreme, po jedna radnja po koraku.
- Za jedinice mere (unit_sr/unit_en) koristi uobičajene skraćenice (g, kg, ml, l, kašika, kašičica, komad...).
- "category" i "subcategory" MORAJU biti tačno jedan od ponuđenih slug-ova ispod — ne izmišljaj nove. Ako ništa odgovarajuće ne postoji za "subcategory", izostavi to polje.
- "tags" mogu sadržati samo slug-ove iz ponuđene liste — izostavi tagove koji ne odgovaraju.
- Vrati SAMO JSON, ništa drugo.

DOZVOLJENE KATEGORIJE (slug — naziv)
${categoryList}

DOZVOLJENE PODKATEGORIJE PO KATEGORIJI (slug kategorije: podkategorija-slug (naziv), ...)
${subcategoryList || '- (nema definisanih podkategorija)'}

DOZVOLJENI TAGOVI (slug — naziv)
${tagList || '- (nema definisanih tagova)'}`
  }

  return `You are an assistant preparing recipe data for a bilingual (Serbian/English) recipe website.

TASK
For the recipe: ${recipeName}
Return ONLY a single valid JSON object — no markdown fences (\`\`\`), no introductory text, no comments before or after — that follows the schema below exactly. If you cannot reliably fill in a field, use a reasonable estimate based on a typical recipe for that dish.

SCHEMA
{
  "name_sr": string,              // recipe name in Serbian
  "name_en": string,               // recipe name in English (required)
  "slug": string,                  // optional, e.g. "cheese-cornbread" (lowercase, no diacritics, words separated by hyphens)
  "description_sr": string,        // short description (1-2 sentences), Serbian
  "description_en": string,        // short description (1-2 sentences), English
  "category": string,              // REQUIRED — exactly one slug from the "ALLOWED CATEGORIES" list
  "subcategory": string,           // optional — exactly one slug from the "ALLOWED SUBCATEGORIES" list for the chosen category
  "tags": string[],                // optional — 0 or more slugs from the "ALLOWED TAGS" list
  "prep_time_minutes": number,     // prep time in minutes
  "cook_time_minutes": number,     // cook time in minutes
  "servings": number,              // number of servings
  "weight_grams": number,          // estimated total weight of the finished dish in grams
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [
    { "name_sr": string, "name_en": string, "quantity": number, "unit_sr": string, "unit_en": string }
  ],
  "steps": [
    { "text_sr": string, "text_en": string }
  ],
  "notes_sr": string,              // optional, tips/variations, Serbian
  "notes_en": string               // optional, tips/variations, English
}

RULES
- "ingredients" and "steps" must each contain at least one item.
- Steps should be clear, listed in preparation order, one action per step.
- Use common abbreviations for units (unit_sr/unit_en): g, kg, ml, l, tbsp, tsp, piece...
- "category" and "subcategory" MUST be exactly one of the slugs listed below — do not invent new ones. If nothing fits "subcategory", omit that field.
- "tags" may only contain slugs from the list below — omit any tag that doesn't fit.
- Return ONLY the JSON, nothing else.

ALLOWED CATEGORIES (slug — name)
${categoryList}

ALLOWED SUBCATEGORIES BY CATEGORY (category slug: subcategory-slug (name), ...)
${subcategoryList || '- (no subcategories defined)'}

ALLOWED TAGS (slug — name)
${tagList || '- (no tags defined)'}`
}
