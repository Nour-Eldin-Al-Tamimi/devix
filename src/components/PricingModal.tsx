import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Zap, Shield, AlertCircle, RefreshCw, UserCheck, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '../context/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeToPro: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onUpgradeToPro,
}) => {
  const { user, activateProLocally } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPayPalButtons, setShowPayPalButtons] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string>('sb');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setShowPayPalButtons(false);
      setPaymentError(null);
      return;
    }

    // Fetch PayPal public config from backend
    fetch('/api/paypal/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId) {
          setPaypalClientId(data.clientId);
        }
        setIsConfigured(Boolean(data.isConfigured));
      })
      .catch((err) => {
        console.warn('Could not fetch PayPal config from backend:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCheckout = () => {
    setPaymentError(null);
    setShowPayPalButtons(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="pricing-modal"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-[#E5DDD2] flex items-center justify-between bg-[#F8F2EA]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DCD0] text-[#7A5338] text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Investment in Your Career</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1B18]">
              DEVIX Lifetime Access
            </h3>
            <p className="text-xs sm:text-sm text-[#75675C] mt-0.5">
              Land higher paying developer roles by proving genuine engineering depth.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#75675C] hover:text-[#1F1B18] hover:bg-[#EAE1DC] rounded-xl transition-colors self-start cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#FCF9F4]">
          {upgradedSuccess || isPro ? (
            <div className="bg-[#FAF6F0] border border-[#9A6F52] p-8 rounded-3xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#7A5338] text-white flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-[#1F1B18]">
                Lifetime Pro Unlocked!
              </h4>
              <p className="text-sm text-[#50443D] max-w-md mx-auto">
                Payment verified on server. You now have unlimited project generations, instant GitHub template exports, and deep architectural breakdowns for life.
              </p>
              <button
                onClick={onClose}
                className="bg-[#7A5338] hover:bg-[#67432A] text-white font-medium text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Start Generating Projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Tier */}
              <div className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#75675C]">
                      Free Plan
                    </span>
                    <span className="text-xs text-[#75675C]">Standard</span>
                  </div>

                  <div>
                    <span className="font-serif text-3xl font-bold text-[#1F1B18]">$0</span>
                    <span className="text-xs text-[#75675C] ml-1">/ forever</span>
                  </div>

                  <p className="text-xs text-[#50443D] leading-relaxed">
                    Great for exploring tailored project concepts and understanding the format.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-[#E5DDD2]">
                    {[
                      '5 Free project blueprints / month',
                      'High-level architecture outline',
                      'Basic milestone checklist',
                      'Standard README markdown export',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#50443D]">
                        <Check className="w-3.5 h-3.5 text-[#75675C] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="w-full bg-[#EAE1DC] hover:bg-[#DFD5CF] text-[#1F1B18] text-xs font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Current Plan
                  </button>
                </div>
              </div>

              {/* Lifetime Pro Pass */}
              <div className="bg-[#FAF6F0] border-2 border-[#9A6F52] rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-md">
                <div className="absolute -top-3 right-6 bg-[#9A6F52] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                  Most Popular
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7A5338]">
                      Lifetime Pro Pass
                    </span>
                    <span className="text-xs text-[#7A5338] font-semibold bg-[#F0DCD0] px-2 py-0.5 rounded-md">
                      One-time payment
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-bold text-[#1F1B18]">$4.99</span>
                    <span className="text-xs text-[#75675C] line-through">$9.99</span>
                    <span className="text-xs text-[#7A5338] font-medium ml-1">Pay once, own forever</span>
                  </div>

                  <p className="text-xs text-[#50443D] leading-relaxed">
                    Everything you need to build standout projects that impress hiring managers and ace technical interviews.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-[#D5C3B9]">
                    {[
                      '✨ Unlimited project blueprint generations',
                      '🧠 Deep Gemini 3.7 Pro architectural synthesis',
                      '📊 Indexed SQL schemas & API specifications',
                      '💼 Google XYZ resume bullet points & CV exports',
                      '🎯 Senior interviewer defense cheat sheets',
                      '📦 Production-grade starter code files',
                      '🔄 Save & organize unlimited projects locally',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-medium text-[#1F1B18]">
                        <Check className="w-3.5 h-3.5 text-[#7A5338] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  {paymentError && (
                    <div className="p-3 bg-[#FFF1F0] border border-[#FFDAD6] rounded-xl flex items-start gap-2 text-xs text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">
                        <span className="font-semibold block">Checkout Notice:</span>
                        {paymentError}
                      </div>
                    </div>
                  )}

                  {!showPayPalButtons ? (
                    <button
                      id="upgrade-to-pro-btn"
                      disabled={isProcessing}
                      onClick={handleStartCheckout}
                      className="w-full bg-[#7A5338] hover:bg-[#67432A] text-white text-xs sm:text-sm font-semibold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Get Lifetime Access ($4.99)</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#75675C] pb-1 border-b border-[#E5DDD2]">
                        <span className="font-medium">
                          {user?.email ? `Account: ${user.email}` : 'Lifetime Single License'}
                        </span>
                        <span className="font-semibold text-[#1F1B18]">$4.99 USD</span>
                      </div>

                      <div className="min-h-[44px] relative">
                        <PayPalScriptProvider
                          options={{
                            clientId: paypalClientId || 'sb',
                            currency: 'USD',
                            intent: 'capture',
                          }}
                        >
                          <PayPalButtons
                            style={{
                              layout: 'vertical',
                              color: 'gold',
                              shape: 'rect',
                              label: 'pay',
                              height: 42,
                            }}
                            disabled={isProcessing}
                            createOrder={async () => {
                              setIsProcessing(true);
                              setPaymentError(null);
                              try {
                                const headers: Record<string, string> = {
                                  'Content-Type': 'application/json',
                                  Accept: 'application/json',
                                };
                                let idToken: string | undefined;
                                if (user) {
                                  try {
                                    idToken = await user.getIdToken();
                                    headers['Authorization'] = `Bearer ${idToken}`;
                                  } catch (e) {
                                    // Token fetch note
                                  }
                                }
                                const res = await fetch('/api/paypal/create-order', {
                                  method: 'POST',
                                  headers,
                                  body: JSON.stringify({
                                    userId: user?.uid || 'guest',
                                    userEmail: user?.email || 'guest@devix.local',
                                    idToken,
                                  }),
                                });
                                const contentType = res.headers.get('content-type') || '';
                                let data: any;
                                if (contentType.includes('application/json')) {
                                  data = await res.json();
                                } else {
                                  const raw = await res.text();
                                  console.error('Non-JSON response from /api/paypal/create-order:', raw);
                                  throw new Error('Server returned an invalid response during order creation.');
                                }

                                if (!res.ok || !data.id) {
                                  throw new Error(data.error || 'Failed to create PayPal order on server.');
                                }
                                return data.id;
                              } catch (err: any) {
                                console.error('Order creation error:', err);
                                setPaymentError(err.message || 'Error initializing PayPal order');
                                setIsProcessing(false);
                                throw err;
                              }
                            }}
                            onApprove={async (data) => {
                              setIsProcessing(true);
                              setPaymentError(null);
                              try {
                                const headers: Record<string, string> = {
                                  'Content-Type': 'application/json',
                                  Accept: 'application/json',
                                };
                                let idToken: string | undefined;
                                if (user) {
                                  try {
                                    idToken = await user.getIdToken();
                                    headers['Authorization'] = `Bearer ${idToken}`;
                                  } catch (e) {
                                    // Token fetch note
                                  }
                                }
                                const res = await fetch('/api/paypal/capture-order', {
                                  method: 'POST',
                                  headers,
                                  body: JSON.stringify({
                                    orderId: data.orderID,
                                    userId: user?.uid || 'guest',
                                    idToken,
                                  }),
                                });
                                const contentType = res.headers.get('content-type') || '';
                                let captureData: any;
                                if (contentType.includes('application/json')) {
                                  captureData = await res.json();
                                } else {
                                  const raw = await res.text();
                                  console.error('Non-JSON response from /api/paypal/capture-order:', raw);
                                  throw new Error('Server returned an unexpected response during payment capture.');
                                }

                                if (
                                  !res.ok ||
                                  !captureData.success ||
                                  captureData.status !== 'COMPLETED' ||
                                  !captureData.isPro
                                ) {
                                  throw new Error(
                                    captureData.error ||
                                      'Server payment verification failed. Pro was not activated.'
                                  );
                                }

                                // Successful entitlement
                                setIsProcessing(false);
                                activateProLocally();
                                setUpgradedSuccess(true);
                                onUpgradeToPro();
                                confetti({
                                  particleCount: 100,
                                  spread: 80,
                                  origin: { y: 0.6 },
                                  colors: ['#9A6F52', '#7A5338', '#EAE1DC', '#F0DCD0'],
                                });
                              } catch (err: any) {
                                console.error('Capture verification error:', err);
                                setPaymentError(
                                  err.message || 'Payment capture failed. Please try again.'
                                );
                                setIsProcessing(false);
                              }
                            }}
                            onCancel={() => {
                              setIsProcessing(false);
                              setPaymentError('Payment was cancelled. You have not been charged.');
                            }}
                            onError={(err) => {
                              console.error('PayPal button error:', err);
                              setIsProcessing(false);
                              setPaymentError(
                                'PayPal checkout encountered an issue. Please verify your PayPal Sandbox Personal account or server credentials.'
                              );
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPayPalButtons(false)}
                        className="text-[11px] text-[#75675C] hover:text-[#1F1B18] underline block text-center mx-auto cursor-pointer pt-1"
                      >
                        Back to overview
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-center text-[#75675C] mt-2">
                    100% Satisfaction Guarantee • Sandbox Test Mode
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
