'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutStepsProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Dados do Cliente' },
  { number: 2, label: 'Endereço' },
  { number: 3, label: 'Revisão' },
  { number: 4, label: 'Pagamento' },
]

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  currentStep > step.number
                    ? 'bg-primary border-primary text-white'
                    : currentStep === step.number
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-gray-300 text-gray-400'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm text-center',
                  currentStep >= step.number
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2',
                  currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
