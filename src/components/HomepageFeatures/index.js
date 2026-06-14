import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

function Feature({title, description, link}) {
  return (
    <Link
      to={link}
      className={clsx('docu-card docu-card--gradient', styles.featureCard)}>
      <Heading as="h3" className="docu-card__title">
        {title}
      </Heading>
      <p className="docu-card__description">{description}</p>
    </Link>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={clsx('docu-grid docu-grid--3', styles.featureGrid)}>
          <Feature
            title={
              <Translate id="homepage.feature.tdm.title">
                Threat Detection Marketplace
              </Translate>
            }
            description={
              <Translate id="homepage.feature.tdm.description">
                Guides for sourcing detection content, managing active threats,
                and deploying Sigma-based rules across your security stack.
              </Translate>
            }
            link="/docs/product/threat-detection-marketplace/active-threats"
          />
          <Feature
            title={<Translate id="homepage.feature.faq.title">FAQs</Translate>}
            description={
              <Translate id="homepage.feature.faq.description">
                Answers to common platform questions, integrations,
                notifications, and troubleshooting for everyday SecOps
                workflows.
              </Translate>
            }
            link="/docs/faq/coralogix-data-plane-credentials"
          />
          <Feature
            title={
              <Translate id="homepage.feature.rn.title">
                Release Notes
              </Translate>
            }
            description={
              <Translate id="homepage.feature.rn.description">
                Version history and changelogs for the SOC Prime Platform so
                your team stays current with the latest capabilities.
              </Translate>
            }
            link="/docs/release-notes/v6.2.0"
          />
        </div>
      </div>
    </section>
  );
}
