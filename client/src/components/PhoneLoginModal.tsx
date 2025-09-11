import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Loader2, Phone, Shield } from "lucide-react";

interface PhoneLoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PhoneLoginModal({ isOpen, onOpenChange, onSuccess }: PhoneLoginModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [normalizedPhoneNumber, setNormalizedPhoneNumber] = useState(''); // Store normalized phone number
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string>(''); // For development
  
  const { sendOtp, login, sendOtpMutation, verifyOtpMutation } = useAuth();

  // Shared phone normalization function 
  const normalizePhoneNumber = (phone: string): string => {
    // Format phone number to E.164 format
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // If phone doesn't start with +, add country code (default to +1 for US)
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 10) {
        cleanPhone = '+1' + cleanPhone; // US phone number
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
        cleanPhone = '+' + cleanPhone; // US phone with country code
      } else {
        cleanPhone = '+1' + cleanPhone; // Default to US
      }
    }
    
    return cleanPhone;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Normalize phone number using shared function
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    
    // Validate E.164 format
    if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      const result = await sendOtp(cleanPhone);
      
      // Store normalized phone number for verification step
      setNormalizedPhoneNumber(cleanPhone);
      
      // Store dev OTP for development
      if (result.dev_otp) {
        setDevOtp(result.dev_otp);
      }
      
      toast.success(`Verification code sent to ${cleanPhone}`);
      
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    try {
      // Use the same normalized phone number that was used for sending OTP
      const result = await login(normalizedPhoneNumber, otp);
      
      // Check if user needs onboarding
      if (result.user && !result.user.onboardingCompleted) {
        toast.success("Welcome to Harmony! Let's set up your preferences.");
        onOpenChange(false);
        setStep('phone');
        setPhoneNumber('');
        setNormalizedPhoneNumber('');
        setOtp('');
        setDevOtp('');
        
        // Redirect to onboarding
        window.location.href = "/onboarding/language";
        return;
      }
      
      toast.success("Welcome back to Harmony!");
      
      onOpenChange(false);
      setStep('phone');
      setPhoneNumber('');
      setNormalizedPhoneNumber('');
      setOtp('');
      setDevOtp('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP. Please try again.");
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setDevOtp('');
    setNormalizedPhoneNumber('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('phone');
    setPhoneNumber('');
    setNormalizedPhoneNumber('');
    setOtp('');
    setDevOtp('');
  };

  // Auto-fill dev OTP for development
  const handleUseDevOtp = () => {
    if (devOtp) {
      setOtp(devOtp);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'phone' ? (
              <>
                <Phone className="w-5 h-5" />
                Welcome to Harmony
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verify your number
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? "Enter your mobile number to get started" 
              : `We've sent a verification code to ${phoneNumber}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Enter your mobile number
              </Label>
              <div className="flex">
                <div className="flex items-center bg-muted px-3 py-2 rounded-l-md border border-r-0">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='13'%3E%3Crect width='20' height='13' fill='%23FF9933'/%3E%3Crect width='20' height='4.33' y='4.33' fill='%23fff'/%3E%3Crect width='20' height='4.34' y='8.67' fill='%23138808'/%3E%3C/svg%3E" 
                    alt="IN" 
                    className="w-5 h-3 mr-2"
                  />
                  <span className="text-sm">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="rounded-l-none flex-1"
                  maxLength={15}
                  data-testid="input-phone"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={sendOtpMutation.isPending}
              data-testid="button-send-otp"
            >
              {sendOtpMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">
                Enter verification code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl tracking-wider"
                maxLength={6}
                data-testid="input-otp"
              />
              
              {/* Development helper */}
              {devOtp && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseDevOtp}
                    className="text-xs"
                    data-testid="button-use-dev-otp"
                  >
                    Use dev OTP: {devOtp}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
              
              <div className="flex justify-between text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-back"
                >
                  ← Back
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setDevOtp('');
                    setNormalizedPhoneNumber('');
                    handleSendOtp(new Event('submit') as any);
                  }}
                  disabled={sendOtpMutation.isPending}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-resend"
                >
                  Resend OTP
                </Button>
              </div>
            </div>
          </form>
        )}
        
        <div className="text-xs text-center text-muted-foreground mt-4">
          By continuing, you agree to Harmony's Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
}