import { FormikContextType, useFormikContext } from 'formik'
import React, { ReactElement } from 'react'
import { AdvancedSettingsForm } from '../../../../models/FormEditCredential'
import { useAsset } from '../../../../providers/Asset'
import { useOcean } from '../../../../providers/Ocean'
import { useWeb3 } from '../../../../providers/Web3'
import Button from '../../../atoms/Button'
import styles from './FormActions.module.css'

export default function FormActions({
  setShowEdit,
  handleClick
}: {
  setShowEdit: (show: boolean) => void
  handleClick?: () => void
}): ReactElement {
  const { accountId } = useWeb3()
  const { ocean } = useOcean()
  const { isAssetNetwork } = useAsset()
  const { isValid, status }: FormikContextType<Partial<AdvancedSettingsForm>> =
    useFormikContext()

  return (
    <footer className={styles.actions}>
      <Button
        style="primary"
        disabled={
          !ocean ||
          !accountId ||
          !isValid ||
          !isAssetNetwork ||
          status === 'empty' ||
          status === 'loading'
        }
        onClick={handleClick}
      >
        Submit
      </Button>
      <Button style="text" onClick={() => setShowEdit(false)}>
        Cancel
      </Button>
    </footer>
  )
}
