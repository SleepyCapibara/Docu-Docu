import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

function Feature({icon, badge, title, description, link, linkLabel}) {
  return (
    <div className={clsx('docu-card docu-card--gradient', styles.featureCard)}>
      <div className="docu-card__icon" aria-hidden="true">
        {icon}
      </div>
      <span className="docu-badge">{badge}</span>
      <Heading as="h3" className="docu-card__title">
        {title}
      </Heading>
      <p className="docu-card__description">{description}</p>
      <Link className="docu-card__link" to={link}>
        {linkLabel} &rarr;
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={clsx('docu-section', styles.features)}>
      <div className="container">
        <div className="docu-section__header">
          <Heading as="h2" className="docu-section__title">
            <Translate id="homepage.section.title">
              Detection intelligence for SecOps teams
            </Translate>
          </Heading>
          <p className="docu-section__subtitle">
            <Translate id="homepage.section.subtitle">
              Explore Threat Detection Marketplace guides, find answers fast,
              and track platform updates across every release.
            </Translate>
          </p>
        </div>
        <div className={clsx('docu-grid docu-grid--3', styles.featureGrid)}>
          <Feature
            icon="TDM"
            badge={
              <Translate id="homepage.feature.tdm.badge">Product</Translate>
            }
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
            linkLabel={
              <Translate id="homepage.feature.tdm.linkLabel">
                Browse Product Docs
              </Translate>
            }
          />
          <Feature
            icon="FAQ"
            badge={
              <Translate id="homepage.feature.faq.badge">Support</Translate>
            }
            title={<Translate id="homepage.feature.faq.title">FAQs</Translate>}
            description={
              <Translate id="homepage.feature.faq.description">
                Answers to common platform questions, integrations,
                notifications, and troubleshooting for everyday SecOps
                workflows.
              </Translate>
            }
            link="/docs/faq/coralogix-data-plane-credentials"
            linkLabel={
              <Translate id="homepage.feature.faq.linkLabel">
                Browse FAQs
              </Translate>
            }
          />
          <Feature
            icon="RN"
            badge={
              <Translate id="homepage.feature.rn.badge">Updates</Translate>
            }
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
            linkLabel={
              <Translate id="homepage.feature.rn.linkLabel">
                Latest Release
              </Translate>
            }
          />
        </div>
      </div>
    </section>
  );
}
