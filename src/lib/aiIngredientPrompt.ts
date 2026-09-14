import type { SupportedLanguage } from '@/lib/i18n'
import { pickLocalized } from '@/lib/localizedField'
import type { IngredientCategory, Mineral, Vitamin } from '@/types/ingredient'

export interface AiIngredientPromptOptions {
  lang: SupportedLanguage
  categories: IngredientCategory[]
  vitamins: Vitamin[]
  minerals: Mineral[]
  nameSr: string
  nameEn: string
}

function listCategories(categories: IngredientCategory[], lang: SupportedLanguage): string {
  return categories.map((category) => `- ${category.slug} — ${pickLocalized(category.name_en, category.name_sr, lang)}`).join('\n')
}

function listMicronutrients(items: { code: string; name_en: string; name_sr: string; unit: string }[]): string {
  return items.map((item) => `- ${item.code} — ${item.name_en} / ${item.name_sr} (${item.unit})`).join('\n')
}

export function buildAiIngredientPrompt({
  lang,
  categories,
  vitamins,
  minerals,
  nameSr,
  nameEn,
}: AiIngredientPromptOptions): string {
  const categoryList = listCategories(categories, lang)
  const vitaminList = listMicronutrients(vitamins)
  const mineralList = listMicronutrients(minerals)

  const ingredientName =
    nameSr.trim() || nameEn.trim()
      ? `${nameSr.trim() || '—'} / ${nameEn.trim() || '—'}`
      : lang === 'sr'
        ? '[UPIŠI NAZIV SASTOJKA OVDE, npr. "Mleko" / "Milk"]'
        : '[INSERT INGREDIENT NAME HERE, e.g. "Mleko" / "Milk"]'

  if (lang === 'sr') {
    return `Ti si asistent koji priprema podatke o sastojcima za dvojezični (srpski/engleski) katalog sastojaka na sajtu sa receptima.

ZADATAK
Za sastojak: ${ingredientName}
Vrati ISKLJUČIVO jedan validan JSON objekat — bez markdown ograda (\`\`\`), bez uvodnog teksta i bez komentara pre ili posle — koji tačno prati šemu ispod. Nutritivne vrednosti su UVEK na 100g sastojka. Ako neko polje ne možeš pouzdano da popuniš, izostavi ga.

ŠEMA
{
  "name_sr": string,               // naziv sastojka na srpskom
  "name_en": string,                // naziv sastojka na engleskom (obavezno)
  "slug": string,                   // opciono, npr. "mleko" (malim slovima, bez dijakritike, reči odvojene crticom)
  "latin_name": string,             // opciono, latinski/naučni naziv
  "regional_names": string,         // opciono, regionalni/alternativni nazivi odvojeni zarezom
  "category": string,               // opciono — tačno jedan slug iz liste "DOZVOLJENE KATEGORIJE"
  "fact_sr": string,                // opciono, kratka zanimljivost (do 300 karaktera), srpski
  "fact_en": string,                // opciono, kratka zanimljivost (do 300 karaktera), engleski
  "default_unit_sr": string,        // opciono, uobičajena merna jedinica, srpski (npr. "ml", "kom")
  "default_unit_en": string,        // opciono, uobičajena merna jedinica, engleski (npr. "ml", "pc")
  "calories_kcal": number,          // na 100g
  "protein_g": number,              // na 100g
  "fat_g": number,                  // na 100g
  "carbs_g": number,                // na 100g
  "fiber_g": number,                // na 100g
  "vitamins": [
    { "vitamin": string, "amount": number }   // "vitamin" je kod ili naziv iz liste "DOZVOLJENI VITAMINI", "amount" na 100g u navedenoj jedinici
  ],
  "minerals": [
    { "mineral": string, "amount": number }   // "mineral" je kod ili naziv iz liste "DOZVOLJENI MINERALI", "amount" na 100g u navedenoj jedinici
  ],
  "unit_conversions": [
    { "unit": string, "grams": number }        // grama po jedinici, za jedinice koje nisu g/kg (npr. "kašika" -> 15)
  ]
}

PRAVILA
- "category" MORA biti tačno jedan od ponuđenih slug-ova ispod — ne izmišljaj nove. Ako ništa ne odgovara, izostavi polje.
- "vitamins"/"minerals" mogu sadržati samo kodove/nazive iz ponuđenih lista — izostavi one koji ne odgovaraju.
- Vrati SAMO JSON, ništa drugo.

DOZVOLJENE KATEGORIJE (slug — naziv)
${categoryList}

DOZVOLJENI VITAMINI (kod — naziv (jedinica))
${vitaminList || '- (nema definisanih vitamina)'}

DOZVOLJENI MINERALI (kod — naziv (jedinica))
${mineralList || '- (nema definisanih minerala)'}`
  }

  return `You are an assistant preparing ingredient data for a bilingual (Serbian/English) ingredient catalog on a recipe website.

TASK
For the ingredient: ${ingredientName}
Return ONLY a single valid JSON object — no markdown fences (\`\`\`), no introductory text, no comments before or after — that follows the schema below exactly. Nutrition values are ALWAYS per 100g of the ingredient. If you cannot reliably fill in a field, omit it.

SCHEMA
{
  "name_sr": string,                // ingredient name in Serbian
  "name_en": string,                 // ingredient name in English (required)
  "slug": string,                    // optional, e.g. "milk" (lowercase, no diacritics, words separated by hyphens)
  "latin_name": string,              // optional, Latin/scientific name
  "regional_names": string,          // optional, regional/alternative names, comma-separated
  "category": string,                // optional — exactly one slug from the "ALLOWED CATEGORIES" list
  "fact_sr": string,                 // optional, short fact (max 300 characters), Serbian
  "fact_en": string,                 // optional, short fact (max 300 characters), English
  "default_unit_sr": string,         // optional, common unit, Serbian (e.g. "ml", "kom")
  "default_unit_en": string,         // optional, common unit, English (e.g. "ml", "pc")
  "calories_kcal": number,           // per 100g
  "protein_g": number,               // per 100g
  "fat_g": number,                   // per 100g
  "carbs_g": number,                 // per 100g
  "fiber_g": number,                 // per 100g
  "vitamins": [
    { "vitamin": string, "amount": number }   // "vitamin" is a code or name from the "ALLOWED VITAMINS" list, "amount" per 100g in that unit
  ],
  "minerals": [
    { "mineral": string, "amount": number }   // "mineral" is a code or name from the "ALLOWED MINERALS" list, "amount" per 100g in that unit
  ],
  "unit_conversions": [
    { "unit": string, "grams": number }        // grams per unit, for units other than g/kg (e.g. "tbsp" -> 15)
  ]
}

RULES
- "category" MUST be exactly one of the slugs listed below — do not invent new ones. If nothing fits, omit the field.
- "vitamins"/"minerals" may only contain codes/names from the lists below — omit any that don't fit.
- Return ONLY the JSON, nothing else.

ALLOWED CATEGORIES (slug — name)
${categoryList}

ALLOWED VITAMINS (code — name (unit))
${vitaminList || '- (no vitamins defined)'}

ALLOWED MINERALS (code — name (unit))
${mineralList || '- (no minerals defined)'}`
}
