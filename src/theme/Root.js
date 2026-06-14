import React from 'react';
import {useHistory, useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import {normalizeStackedLocalePathname} from '@site/src/utils/localePath';

export default function Root({children}) {
  const {
    siteConfig: {baseUrl, trailingSlash},
    i18n: {locales, defaultLocale},
  } = useDocusaurusContext();
  const history = useHistory();
  const location = useLocation();

  React.useEffect(() => {
    const canonicalPathname = applyTrailingSlash(location.pathname, {
      trailingSlash,
      baseUrl,
    });

    const normalized = normalizeStackedLocalePathname(
      canonicalPathname,
      baseUrl,
      locales,
      defaultLocale,
    );

    if (normalized && normalized !== canonicalPathname) {
      history.replace(`${normalized}${location.search}${location.hash}`);
    }
  }, [
    baseUrl,
    defaultLocale,
    history,
    location.hash,
    location.pathname,
    location.search,
    locales,
    trailingSlash,
  ]);

  return children;
}
