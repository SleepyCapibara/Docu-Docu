/**
 * Locale dropdown with fixed alternate-URL generation when pathname contains
 * unrecognized locale segments (common in dev when only one locale is served).
 */
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import {mergeSearchStrings, useHistorySelector} from '@docusaurus/theme-common';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import {useLocation} from '@docusaurus/router';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';
import {stripLeadingLocales} from '@site/src/utils/localePath';
import styles from './styles.module.css';

function useLocaleDropdownUtils() {
  const {
    siteConfig,
    i18n: {localeConfigs, locales, defaultLocale},
  } = useDocusaurusContext();
  const {pathname} = useLocation();
  const search = useHistorySelector((history) => history.location.search);
  const hash = useHistorySelector((history) => history.location.hash);

  const getLocaleConfig = (locale) => {
    const localeConfig = localeConfigs[locale];
    if (!localeConfig) {
      throw new Error(
        `Docusaurus bug, no locale config found for locale=${locale}`,
      );
    }
    return localeConfig;
  };

  const getBaseURLForLocale = (locale) => {
    const localeConfig = getLocaleConfig(locale);
    const isSameDomain = localeConfig.url === siteConfig.url;

    const canonicalPathname = applyTrailingSlash(pathname, {
      trailingSlash: siteConfig.trailingSlash,
      baseUrl: siteConfig.baseUrl,
    });
    const pathnameSuffix = canonicalPathname.replace(siteConfig.baseUrl, '');
    const cleanSuffix = stripLeadingLocales(
      pathnameSuffix,
      locales,
      defaultLocale,
    );
    const localizedPath = `${localeConfig.baseUrl}${cleanSuffix}`;

    if (isSameDomain) {
      return `pathname://${localizedPath}`;
    }

    return `${localeConfig.url}${localizedPath}`;
  };

  return {
    getURL: (locale, options) => {
      const finalSearch = mergeSearchStrings(
        [search, options.queryString],
        'append',
      );
      return `${getBaseURLForLocale(locale)}${finalSearch}${hash}`;
    },
    getLabel: (locale) => getLocaleConfig(locale).label,
    getLang: (locale) => getLocaleConfig(locale).htmlLang,
  };
}

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore,
  dropdownItemsAfter,
  queryString,
  ...props
}) {
  const utils = useLocaleDropdownUtils();
  const {
    i18n: {currentLocale, locales},
  } = useDocusaurusContext();

  const localeItems = locales.map((locale) => ({
    label: utils.getLabel(locale),
    lang: utils.getLang(locale),
    to: utils.getURL(locale, {queryString}),
    target: '_self',
    autoAddBaseUrl: false,
    className:
      locale === currentLocale
        ? mobile
          ? 'menu__link--active'
          : 'dropdown__link--active'
        : '',
  }));

  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];
  const dropdownLabel = mobile
    ? translate({
        message: 'Languages',
        id: 'theme.navbar.mobileLanguageDropdown.label',
        description: 'The label for the mobile language switcher dropdown',
      })
    : utils.getLabel(currentLocale);

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage className={styles.iconLanguage} />
          {dropdownLabel}
        </>
      }
      items={items}
    />
  );
}
