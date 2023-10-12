import React, { ReactElement, useEffect, useState } from 'react'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import Tooltip from '../../../@shared/atoms/Tooltip'
import Details from './Details'
import Transaction from '@images/transaction.svg'
import Caret from '@images/caret.svg'
import Lock from '@images/lock.svg'
import classNames from 'classnames/bind'
import stylesIndex from '../index.module.css'
import styles from './index.module.css'

const cx = classNames.bind(styles)

export default function Automation(): ReactElement {
  const {
    autoWallet,
    isAutomationEnabled,
    hasValidEncryptedWallet,
    balance,
    nativeBalance
  } = useAutomation()

  const [hasError, setHasError] = useState<boolean>()
  const [hasWarning, setHasWarning] = useState<boolean>(false)

  useEffect(() => {
    balance &&
      setHasWarning(
        Object.keys(balance)?.filter((token) => Number(balance[token]) <= 0)
          .length > 0
      )
    setHasError(Number(nativeBalance?.balance) <= 0)
  }, [balance, nativeBalance])

  const wrapperClasses = cx({
    automation: true,
    enabled: isAutomationEnabled
  })

  const indicatorClasses = cx({
    indicator: true,
    enabled: isAutomationEnabled,
    warning: hasWarning,
    error: hasError
  })

  return (
    <Tooltip
      content={<Details isFunded={!hasError} />}
      trigger="focus mouseenter click"
      placement="bottom"
      className={`${stylesIndex.preferences} ${wrapperClasses}`}
    >
      <div className={styles.wrapper}>
        {!autoWallet && hasValidEncryptedWallet() && (
          <Lock className={styles.lock} />
        )}
        <Transaction className={stylesIndex.icon} />
        {autoWallet && (
          <div className={indicatorClasses}>
            <div className={styles.indicatorPulse} />
          </div>
        )}
        {autoWallet && <Caret className={stylesIndex.caret} />}
      </div>
    </Tooltip>
  )
}
