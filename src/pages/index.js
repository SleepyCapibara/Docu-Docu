import {useState} from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HeroSearch() {
  const history = useHistory();
  // Locale-aware, baseUrl-aware path to the local search results page.
  const searchBase = useBaseUrl('/search');
  const [query, setQuery] = useState('');

  const placeholder = translate({
    id: 'homepage.search.placeholder',
    message: 'Search the documentation…',
    description: 'Placeholder text for the homepage hero search box',
  });
  const label = translate({
    id: 'homepage.search.label',
    message: 'Search documentation',
    description: 'Accessible label for the homepage hero search box',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    history.push(`${searchBase}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form className={styles.heroSearch} role="search" onSubmit={handleSubmit}>
      <svg
        className={styles.heroSearchIcon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true">
        <path
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="search"
        className={styles.heroSearchInput}
        placeholder={placeholder}
        aria-label={label}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit" className={styles.heroSearchButton}>
        <Translate
          id="homepage.search.button"
          description="Label for the homepage hero search submit button">
          Search
        </Translate>
      </button>
    </form>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('docu-hero', styles.heroBanner)}>
      <div className="docu-hero__inner">
        <span className="docu-hero__badge">
          <Translate>SOC Prime Platform</Translate>
        </span>
        <Heading as="h1" className="docu-hero__title">
          {siteConfig.title}
        </Heading>
        <HeroSearch />
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      wrapperClassName={styles.homepageLayout}
      title={siteConfig.title}
      description={translate({
        id: 'homepage.meta.description',
        message:
          'SOC Prime product documentation, frequently asked questions, and release notes for Threat Detection Marketplace, Uncoder AI, and DetectFlow.',
        description: 'Homepage meta description for SEO',
      })}>
      <div className={styles.homepageShell}>
        <HomepageHeader />
        <main className={styles.homepageMain}>
          <HomepageFeatures />
        </main>
      </div>
    </Layout>
  );
}
