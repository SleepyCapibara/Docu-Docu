/**
 * Strip leading locale segments mistakenly treated as page path.
 * Fixes stacked URLs like /Docu-Docu/es/uk/ko/ when locale routing breaks.
 */
export function stripLeadingLocales(pathnameSuffix, locales, defaultLocale) {
  const segments = pathnameSuffix.split('/').filter(Boolean);
  let index = 0;

  while (index < segments.length && locales.includes(segments[index])) {
    index += 1;
  }

  const pageSegments = segments.slice(index);
  if (pageSegments.length === 0) {
    return '';
  }

  const suffix = `${pageSegments.join('/')}/`;
  return suffix;
}

/**
 * Normalize a pathname that may contain multiple stacked locale prefixes.
 * Returns null if no change is needed.
 */
export function normalizeStackedLocalePathname(
  pathname,
  baseUrl,
  locales,
  defaultLocale,
) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  if (!pathname.startsWith(normalizedBase)) {
    return null;
  }

  const suffix = pathname.slice(normalizedBase.length);
  const segments = suffix.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  let localeCount = 0;
  while (
    localeCount < segments.length &&
    locales.includes(segments[localeCount])
  ) {
    localeCount += 1;
  }

  if (localeCount <= 1) {
    return null;
  }

  const targetLocale = segments[localeCount - 1];
  const pageSegments = segments.slice(localeCount);
  const pagePath = pageSegments.length ? `${pageSegments.join('/')}/` : '';

  if (targetLocale === defaultLocale) {
    return `${normalizedBase}${pagePath}`.replace(/\/{2,}/g, '/');
  }

  return `${normalizedBase}${targetLocale}/${pagePath}`.replace(/\/{2,}/g, '/');
}
