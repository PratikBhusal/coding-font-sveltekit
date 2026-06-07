import { codingFonts } from '$lib';

function getFontSlug(family: string) {
  return family.replace(/\s+/g, '');
}

function getFontBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  return codingFonts.find(
    (font) => getFontSlug(font.family) === decodedSlug
  );
}

export function entries() {
  return codingFonts.flatMap((font) =>
    codingFonts
      .filter((compareFont) => compareFont.family !== font.family)
      .map((compareFont) => ({
        slug: getFontSlug(font.family),
        rightSlug: getFontSlug(compareFont.family)
      }))
  );
}

export async function load({ params }) {
  const font = getFontBySlug(params.slug);
  const compareFont = getFontBySlug(params.rightSlug);

  if (font && compareFont) {
    return { font, compareFont };
  }
}
