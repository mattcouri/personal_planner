// Stripe Integration - Demo Mode
import React, { createContext, useContext, ReactNode } from 'react';

// Demo Stripe Types
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
}

export interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval?: 'month' | 'year' | 'week' | 'day';
  product: string;
}

interface StripeContextType {
  createPaymentIntent: (amount: number, currency: string, metadata?: Record<string, string>) => Promise<StripePaymentIntent>;
  confirmPayment: (paymentIntentId: string, paymentMethod: any) => Promise<{ success: boolean; error?: string }>;
  createCustomer: (email: string, name?: string) => Promise<StripeCustomer>;
  createPrice: (amount: number, currency: string, interval?: string) => Promise<StripePrice>;
  isDemo: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Demo implementation - replace with real Stripe integration
  const createPaymentIntent = async (
    amount: number, 
    currency: string, 
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `pi_demo_${Date.now()}`,
      amount,
      currency,
      status: 'requires_payment_method',
      client_secret: `pi_demo_${Date.now()}_secret_demo`
    };
  };

  const confirmPayment = async (
    paymentIntentId: string, 
    paymentMethod: any
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Demo: randomly succeed or fail for testing
    const success = Math.random() > 0.2; // 80% success rate
    
    if (success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Demo payment failed - this is expected in demo mode' 
      };
    }
  };

  const createCustomer = async (email: string, name?: string): Promise<StripeCustomer> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: `cus_demo_${Date.now()}`,
      email,
      name,
      created: Math.floor(Date.now() / 1000)
    };
  };

  const createPrice = async (
    amount: number, 
    currency: string, 
    interval?: string
  ): Promise<StripePrice> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: `price_demo_${Date.now()}`,
      amount,
      currency,
      interval: interval as any,
      product: `prod_demo_${Date.now()}`
    };
  };

  const value: StripeContextType = {
    createPaymentIntent,
    confirmPayment,
    createCustomer,
    createPrice,
    isDemo: true
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
};

// Demo Payment Form Component
export const DemoPaymentForm: React.FC<{
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}> = ({ amount, currency, onSuccess, onError }) => {
  const { createPaymentIntent, confirmPayment } = useStripe();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentIntent, setPaymentIntent] = React.useState<StripePaymentIntent | null>(null);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create payment intent
      const intent = await createPaymentIntent(amount, currency);
      setPaymentIntent(intent);
      
      // Simulate payment method (demo)
      const demoPaymentMethod = {
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      };
      
      // Confirm payment
      const result = await confirmPayment(intent.id, demoPaymentMethod);
      
      if (result.success) {
        onSuccess(intent.id);
      } else {
        onError(result.error || 'Payment failed');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
          Demo Mode - Stripe Integration
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm text-yellow-600 dark:text-yellow-400">
          <p>This is a demo payment form. In production, this would integrate with Stripe's secure payment processing.</p>
          <p className="mt-1">Amount: {(amount / 100).toFixed(2)} {currency.toUpperCase()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded border p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Demo Card Details:</div>
          <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
            <div>Card: 4242 4242 4242 4242</div>
            <div>Exp: 12/25 | CVC: 123</div>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isProcessing ? 'Processing Demo Payment...' : `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`}
        </button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          🔒 This is a demo. No real payment will be processed.
        </div>
      </div>
    </div>
  );
};