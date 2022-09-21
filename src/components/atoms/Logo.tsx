import React, { ReactElement } from 'react'
import { ReactComponent as LogoAssetFull } from '@oceanprotocol/art/logo/logo.svg'
import { ReactComponent as LogoAsset } from '../../images/ocean-logo.svg'
import styles from './Logo.module.css'
import classNames from 'classnames/bind'
import { graphql, useStaticQuery } from 'gatsby'

const cx = classNames.bind(styles)

const query = graphql`
  {
    file(relativePath: { eq: "crossAsia-logo.png" }) {
      childImageSharp {
        original {
          src
        }
      }
    }
  }
`

interface Logo {
  file: {
    childImageSharp: {
      original: {
        src: string
      }
    }
  }
}

export default function Logo({
  noWordmark,
  branding,
  coloring
}: {
  noWordmark?: boolean
  branding?: boolean
  coloring?: boolean
}): ReactElement {
  const data = useStaticQuery(query)

  const styleClasses = cx({
    logo: true,
    branding: branding,
    coloring: coloring
  })

  return branding ? (
    <img
      src={data.file.childImageSharp.original.src}
      className={styleClasses}
    />
  ) : noWordmark ? (
    <LogoAsset className={styleClasses} />
  ) : (
    <LogoAssetFull className={styleClasses} />
  )
}
