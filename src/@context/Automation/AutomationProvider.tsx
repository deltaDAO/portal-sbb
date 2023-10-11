import { LoggerInstance } from '@oceanprotocol/lib'
import { Wallet, ethers } from 'ethers'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useAccount, useBalance, useChainId, useProvider } from 'wagmi'
import { accountTruncate, getTokenBalance } from '../../@utils/wallet'
import { useUserPreferences } from '../UserPreferences'
import { toast } from 'react-toastify'
import Modal from '../../components/@shared/atoms/Modal'
import Button from '../../components/@shared/atoms/Button'
import styles from './AutomationProvider.module.css'
import Loader from '../../components/@shared/atoms/Loader'
import { useMarketMetadata } from '../MarketMetadata'

export interface NativeTokenBalance {
  symbol: string
  balance: string
}
export interface AutomationProviderValue {
  autoWallet: Wallet
  autoWalletAddress: string
  isAutomationEnabled: boolean
  balance: UserBalance
  nativeBalance: NativeTokenBalance
  isLoading: boolean
  decryptPercentage: number
  updateBalance: () => Promise<void>
  setIsAutomationEnabled: (isEnabled: boolean) => void
  exportAutomationWallet: (password: string) => Promise<void>
  deleteCurrentAutomationWallet: () => void
  importAutomationWallet: (encryptedJson: string) => Promise<boolean>
  hasValidEncryptedWallet: () => boolean
  decryptAutomationWallet: (password: string) => Promise<boolean>
}

// Refresh interval for balance retrieve - 20 sec
const refreshInterval = 20000

// Context
const AutomationContext = createContext({} as AutomationProviderValue)

// Provider
function AutomationProvider({ children }) {
  const { address } = useAccount()
  const { approvedBaseTokens } = useMarketMetadata()
  const chainId = useChainId()
  const { automationWalletJSON, setAutomationWalletJSON } = useUserPreferences()

  const [autoWallet, setAutoWallet] = useState<Wallet>()
  const [isAutomationEnabled, setIsAutomationEnabled] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [autoWalletAddress, setAutoWalletAddress] = useState<string>()
  const [decryptPercentage, setDecryptPercentage] = useState<number>()

  const { data: balanceNativeToken } = useBalance({
    address: autoWallet?.address as `0x${string}`
  })

  const [nativeBalance, setNativeBalance] = useState<NativeTokenBalance>()
  const [balance, setBalance] = useState<UserBalance>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmedDeletion, setConfirmedDeletion] = useState(false)

  const wagmiProvider = useProvider()

  useEffect(() => {
    if (!automationWalletJSON) setAutoWalletAddress(undefined)
    else
      setAutoWalletAddress(
        ethers.utils.getJsonWalletAddress(automationWalletJSON)
      )
  }, [automationWalletJSON])

  useEffect(() => {
    if (autoWallet && !isAutomationEnabled) {
      toast.info(`Automation disabled`)
      return
    }

    if (autoWallet?.address)
      toast.success(
        `Successfully enabled automation wallet with address ${accountTruncate(
          autoWallet?.address
        )}`
      )
  }, [isAutomationEnabled, autoWallet])

  const exportAutomationWallet = useCallback(
    async (password: string) => {
      if (!autoWallet || !autoWallet) {
        toast.error(`Automation wallet does not exist.`)
        return
      }
      setIsLoading(true)

      const encrypted = await autoWallet.encrypt(password)

      const element = document.createElement('a')
      const jsonFile = new Blob([encrypted], {
        type: 'application/json'
      })
      element.href = URL.createObjectURL(jsonFile)
      element.download = `account_export_${autoWallet.address}.json`
      document.body.appendChild(element)
      element.click()
      setIsLoading(false)
    },
    [autoWallet]
  )

  const updateBalance = useCallback(async () => {
    if (!autoWallet) return

    try {
      if (balanceNativeToken)
        setNativeBalance({
          symbol: balanceNativeToken?.symbol.toLowerCase() || 'ETH',
          balance: balanceNativeToken?.formatted
        })

      if (approvedBaseTokens?.length > 0) {
        const newBalance: UserBalance = {}
        await Promise.all(
          approvedBaseTokens.map(async (token) => {
            const { address: tokenAddress, decimals, symbol } = token
            const tokenBalance = await getTokenBalance(
              autoWallet?.address,
              decimals,
              tokenAddress,
              wagmiProvider
            )
            newBalance[symbol.toLocaleLowerCase()] = tokenBalance
          })
        )
        setBalance(newBalance)
      } else setBalance(undefined)
    } catch (error) {
      LoggerInstance.error('[AutomationProvider] Error: ', error.message)
    }
  }, [autoWallet, balanceNativeToken, approvedBaseTokens, wagmiProvider])

  // periodic refresh of automation wallet balance
  useEffect(() => {
    updateBalance()

    const balanceInterval = setInterval(() => updateBalance(), refreshInterval)

    return () => {
      clearInterval(balanceInterval)
    }
  }, [updateBalance])

  const deleteCurrentAutomationWallet = () => {
    setIsModalOpen(true)
  }

  useEffect(() => {
    const manageDeletion = async () => {
      if (isModalOpen && !confirmedDeletion) return

      if (confirmedDeletion) {
        setIsLoading(true)
        setIsAutomationEnabled(false)
        setAutoWallet(undefined)
        setAutomationWalletJSON(undefined)
        setBalance(undefined)
        setConfirmedDeletion(false)
        toast.info('The automation wallet was removed from your machine.')
        setIsModalOpen(false)
        setIsLoading(false)
      }
    }

    manageDeletion()
  }, [address, isModalOpen, confirmedDeletion, setAutomationWalletJSON])

  const hasValidEncryptedWallet = useCallback(() => {
    return ethers.utils.isAddress(autoWalletAddress)
  }, [autoWalletAddress])

  const importAutomationWallet = async (encryptedJson: string) => {
    if (
      ethers.utils.isAddress(ethers.utils.getJsonWalletAddress(encryptedJson))
    ) {
      setAutomationWalletJSON(encryptedJson)
      return true
    } else {
      toast.error('Could not import Wallet. JSON format invalid.')
      LoggerInstance.error('Could not import Wallet. JSON format invalid.')
      return false
    }
  }

  const decryptAutomationWallet = useCallback(
    async (password: string) => {
      try {
        setIsLoading(true)
        if (!automationWalletJSON)
          throw new Error('No JSON to decrypt in local storage.')

        LoggerInstance.log(
          '[AutomationProvider] Start decrypting wallet from local storage'
        )
        const wallet = await ethers.Wallet.fromEncryptedJson(
          automationWalletJSON,
          password,
          (percent) => setDecryptPercentage(percent)
        )
        const connectedWallet = wallet.connect(wagmiProvider)
        LoggerInstance.log('[AutomationProvider] Finished decrypting:', {
          connectedWallet
        })
        setAutoWallet(connectedWallet)
        toast.success(
          `Succesfully imported wallet ${connectedWallet.address} for automation.`
        )
        return true
      } catch (e) {
        toast.error(
          `Could not decrypt the automation wallet. See console for more information.`
        )
        LoggerInstance.error(e)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wagmiProvider, automationWalletJSON]
  )

  return (
    <AutomationContext.Provider
      value={{
        autoWallet,
        autoWalletAddress,
        balance,
        nativeBalance,
        isAutomationEnabled,
        isLoading,
        decryptPercentage,
        setIsAutomationEnabled,
        updateBalance,
        exportAutomationWallet,
        deleteCurrentAutomationWallet,
        importAutomationWallet,
        hasValidEncryptedWallet,
        decryptAutomationWallet
      }}
    >
      {children}
      <Modal
        title="Automation Wallet"
        onToggleModal={() => setIsModalOpen(!isModalOpen)}
        isOpen={isModalOpen}
        className={styles.modal}
      >
        {autoWallet?.address && Number(balance?.eth) > 0 ? (
          <>
            <strong>
              {' '}
              The automation wallet {accountTruncate(autoWallet?.address)} still
              contains {balance?.eth} network tokens.
            </strong>
            <br />
            If you delete the wallet you will not be able to access related
            funds from the portal without reimporting. Do you want to continue?
          </>
        ) : (
          <>
            <strong>
              {' '}
              The automation wallet {accountTruncate(autoWallet?.address)} does
              not contain any funds.
            </strong>
            <br />
            If you delete the wallet you will not be able to access it from the
            portal without reimporting. Do you want to continue?
          </>
        )}
        <br />
        <div className={styles.modalActions}>
          <Button
            size="small"
            className={styles.modalCancelBtn}
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="small"
            className={styles.modalConfirmBtn}
            onClick={() => {
              setConfirmedDeletion(true)
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader message={`Loading...`} /> : `Confirm`}
          </Button>
        </div>
      </Modal>
    </AutomationContext.Provider>
  )
}

// Helper hook to access the provider values
const useAutomation = (): AutomationProviderValue =>
  useContext(AutomationContext)

export { AutomationContext, AutomationProvider, useAutomation }
export default AutomationProvider
