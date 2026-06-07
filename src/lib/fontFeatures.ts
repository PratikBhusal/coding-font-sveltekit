type FontFeatureConfig = {
  family: string;
  openTypeFeatures?: string[];
};

export function getFontFeatures(
  font?: Pick<FontFeatureConfig, 'openTypeFeatures'>
) {
  return font?.openTypeFeatures?.length
    ? font.openTypeFeatures.map((feature) => `"${feature}"`).join(', ')
    : '';
}

export function getFontStyle(font?: FontFeatureConfig) {
  const fontFeatures = getFontFeatures(font);
  return [
    font?.family ? `font-family: '${font.family}'` : '',
    fontFeatures ? `font-feature-settings: ${fontFeatures}` : ''
  ]
    .filter(Boolean)
    .join('; ');
}
