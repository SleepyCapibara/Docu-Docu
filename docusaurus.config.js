// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'SOC Prime Documentation',
  tagline:
    'Detection intelligence turbocharged with AI — product guides, FAQs, and release notes.',
  favicon: 'img/favicon.ico',

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/Docu-Docu/img/favicon-32.png',
        sizes: '32x32',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/Docu-Docu/img/favicon-192.png',
        sizes: '192x192',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/Docu-Docu/img/apple-touch-icon.png',
      },
    },
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sleepycapibara.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/Docu-Docu/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'SleepyCapibara', // Usually your GitHub org/user name.
  projectName: 'Docu-Docu', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uk', 'es', 'ko'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en'},
      uk: {label: 'Українська', htmlLang: 'uk'},
      es: {label: 'Español', htmlLang: 'es'},
      ko: {label: '한국어', htmlLang: 'ko'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/SleepyCapibara/Docu-Docu/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/socprime-social-card.svg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: '',
        logo: {
          alt: 'SOC Prime',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'productSidebar',
            position: 'left',
            label: 'Product Docs',
          },
          {
            type: 'docSidebar',
            sidebarId: 'faqSidebar',
            position: 'left',
            label: 'FAQs',
          },
          {
            type: 'docSidebar',
            sidebarId: 'releaseNotesSidebar',
            position: 'left',
            label: 'Release Notes',
          },
          {
            href: 'https://socprime.com/',
            label: 'SOC Prime',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Product Docs',
                to: '/docs/product/threat-detection-marketplace/active-threats',
              },
              {
                label: 'FAQs',
                to: '/docs/faq/coralogix-data-plane-credentials',
              },
              {
                label: 'Release Notes',
                to: '/docs/release-notes/v6.2.0',
              },
            ],
          },
          {
            title: 'SOC Prime',
            items: [
              {
                label: 'Website',
                href: 'https://socprime.com/',
              },
              {
                label: 'Help Center',
                href: 'https://help.socprime.com/',
              },
              {
                label: 'Threat Detection Marketplace',
                href: 'https://tdm.socprime.com/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/socprime',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/Cj76AjsSzd',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/soc-prime',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/@socprime6652',
              },
              {
                label: 'Facebook',
                href: 'https://www.facebook.com/socprime',
              },
              {
                label: 'X',
                href: 'https://twitter.com/SOC_Prime',
              },
              {
                label: 'Bluesky',
                href: 'https://bsky.app/profile/socprime.com',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SOC Prime, Inc. SOC Prime, SOC Prime Logo and Threat Detection Marketplace are registered trademarks of SOC Prime, Inc.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
