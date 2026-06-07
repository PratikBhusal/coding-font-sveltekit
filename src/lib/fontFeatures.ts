import type { CodingFont } from './codingFonts';

type FontFeatureConfig = Pick<
  CodingFont,
  'family' | 'openTypeFeatures' | 'ligatureFeatures'
>;

export function getFontFeatures(
  font?: Pick<FontFeatureConfig, 'openTypeFeatures' | 'ligatureFeatures'>,
  enableOpenTypeFeatures = true,
  enableLigatureFeatures = true
) {
  const features = [
    ...(enableOpenTypeFeatures ? (font?.openTypeFeatures ?? []) : []),
    ...(enableLigatureFeatures ? (font?.ligatureFeatures ?? []) : [])
  ].filter((feature, index, enabledFeatures) => {
    return enabledFeatures.indexOf(feature) === index;
  });

  return features
    .map((feature) => {
      const [featureName, featureValue] = feature.split('=');
      return featureValue
        ? `"${featureName}" ${featureValue}`
        : `"${featureName}"`;
    })
    .join(', ');
}

export function getFontStyle(
  font?: FontFeatureConfig,
  enableOpenTypeFeatures = true,
  enableLigatureFeatures = true
) {
  const fontFeatures = getFontFeatures(
    font,
    enableOpenTypeFeatures,
    enableLigatureFeatures
  );
  return [
    font?.family ? `font-family: '${font.family}'` : '',
    fontFeatures ? `font-feature-settings: ${fontFeatures}` : ''
  ]
    .filter(Boolean)
    .join('; ');
}
