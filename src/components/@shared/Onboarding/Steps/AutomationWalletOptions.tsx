import React, { ReactElement } from 'react'
import { OnboardingStep } from '..'
import StepBody from '../StepBody'
import StepHeader from '../StepHeader'
import content from '../../../../../content/onboarding/steps/automationWalletOptions.json'

export default function AutomationWalletOptions(): ReactElement {
  const { title, subtitle, body, image }: OnboardingStep = content

  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <StepBody body={body} image={image} />
    </div>
  )
}
