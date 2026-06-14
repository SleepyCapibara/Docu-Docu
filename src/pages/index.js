import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

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
        <p className="docu-hero__subtitle">{siteConfig.tagline}</p>
        <div className={clsx('docu-hero__actions', styles.buttons)}>
          <Link
            className="docu-btn docu-btn--primary docu-btn--lg"
            to="/docs/product/threat-detection-marketplace/active-threats">
            <Translate>Product Docs</Translate>
          </Link>
          <Link
            className="docu-btn docu-btn--secondary docu-btn--lg"
            to="/docs/faq/coralogix-data-plane-credentials">
            <Translate>FAQs</Translate>
          </Link>
          <Link
            className="docu-btn docu-btn--secondary docu-btn--lg"
            to="/docs/release-notes/v6.2.0">
            <Translate>Release Notes</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={translate({
        id: 'homepage.meta.description',
        message:
          'SOC Prime product documentation, frequently asked questions, and release notes for Threat Detection Marketplace, Uncoder AI, and DetectFlow.',
        description: 'Homepage meta description for SEO',
      })}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
