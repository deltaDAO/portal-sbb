import { Link } from 'gatsby'
import React, { ReactElement } from 'react'
import { useGdprMetadata } from '../../../hooks/useGdprMetadata'
import { useSiteMetadata } from '../../../hooks/useSiteMetadata'
import { useUserPreferences } from '../../../providers/UserPreferences'
import Button from '../../atoms/Button'
import styles from './Links.module.css'

export default function Links(): ReactElement {
  const { appConfig, footer } = useSiteMetadata()
  const { setShowPPC } = useUserPreferences()
  const { content, privacyTitle } = footer

  const cookies = useGdprMetadata()

  return (
    <div className={styles.container}>
      {content?.map((section, i) => (
        <div key={i} className={styles.section}>
          <p className={styles.title}>{section.title}</p>
          <div className={styles.links}>
            {section.links.map((e, i) =>
              e.link.startsWith('/') ? (
                <Link key={i} to={e.link}>
                  {e.name}
                </Link>
              ) : (
                <a
                  key={i}
                  href={e.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {e.name} &#8599;
                </a>
              )
            )}
          </div>
        </div>
      ))}
      <div className={styles.section}>
        <p className={styles.title}>{privacyTitle}</p>
        <div className={styles.links}>
          <Button
            className={styles.link}
            style="text"
            href="https://portal.minimal-gaia-x.eu/imprint"
            target="_blank"
            rel="noopener noreferrer"
          >
            Imprint
          </Button>
          <Button
            className={styles.link}
            style="text"
            href="https://portal.minimal-gaia-x.eu/privacy/en"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </Button>
          {appConfig.privacyPreferenceCenter === 'true' && (
            <Button
              style="text"
              size="small"
              onClick={() => {
                setShowPPC(true)
              }}
            >
              {cookies.optionalCookies ? 'Cookie Settings' : 'Cookies'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
