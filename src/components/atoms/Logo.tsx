import React, { ReactElement } from 'react'
import { ReactComponent as LogoAssetFull } from '@oceanprotocol/art/logo/logo.svg'
import { ReactComponent as LogoAssetBranding } from '../../images/iliad_logo.svg'
import { ReactComponent as LogoAsset } from '../../images/ocean-logo.svg'
import styles from './Logo.module.css'
import classNames from 'classnames/bind'

const cx = classNames.bind(styles)

export default function Logo({
  noWordmark,
  branding,
  coloring
}: {
  noWordmark?: boolean
  branding?: boolean
  coloring?: boolean
}): ReactElement {
  const styleClasses = cx({
    logo: true,
    branding: branding,
    coloring: coloring
  })

  return branding ? (
    <LogoAssetBranding className={styleClasses} />
  ) : noWordmark ? (
    <LogoAsset className={styleClasses} />
  ) : (
    <LogoAssetFull className={styleClasses} />
  )
}
