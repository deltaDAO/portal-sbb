import React, { ReactElement } from 'react'
import styles from './index.module.css'
import Markdown from '../../atoms/Markdown'
import { useSiteMetadata } from '../../../hooks/useSiteMetadata'
import Links from './Links'
import Container from '../../atoms/Container'
import { graphql, useStaticQuery } from 'gatsby'

const footerLogoQuery = graphql`
  query footerLogoQuery {
    logo: file(relativePath: { eq: "SBB_Logo_sRGB.png" }) {
      childImageSharp {
        original {
          src
        }
      }
    }
  }
`

interface FooterLogo {
  logo: {
    childImageSharp: {
      original: {
        src: string
      }
    }
  }
}

export default function Footer(): ReactElement {
  const data: FooterLogo = useStaticQuery(footerLogoQuery)
  const { footer } = useSiteMetadata()
  const { copyright } = footer

  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <div>
          <a
            href="https://delta-dao.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.main}>
              <img src={data.logo.childImageSharp.original.src} />
            </div>
          </a>
        </div>
        <Links />
      </Container>
      <div className={styles.copyright}>
        <Markdown text={copyright} />
      </div>
    </footer>
  )
}
