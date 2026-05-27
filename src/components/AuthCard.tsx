'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, AlertCircle, ExternalLink, Mail, Lock, User, Phone } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthCardProps {
  defaultMode?: 'login' | 'signup';
}

export function AuthCard({ defaultMode = 'login' }: AuthCardProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigAlert, setShowConfigAlert] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const db = useFirestore();

  // Listen to search param mode changes
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'login') {
      setMode('login');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;

      // Fetch user role for redirection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });

      if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfigAlert(false);

    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Firebase service is not initialized. Please refresh the page.",
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: "Please ensure both passwords match.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const user = userCredential.user;

      await updateProfile(user, { displayName: signupName });
      
      const userData = {
        uid: user.uid,
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        role: 'citizen',
        contributionLevel: 0,
        createdAt: new Date().toISOString(),
      };

      // Non-blocking write with contextual error handling
      setDoc(doc(db, 'users', user.uid), userData)
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: `/users/${user.uid}`,
            operation: 'create',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      toast({
        title: "Account created",
        description: "Welcome to e-Swachh!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);
      
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        setShowConfigAlert(true);
        toast({
          variant: "destructive",
          title: "Setup Required",
          description: "Email/Password sign-up is not enabled in the Firebase Console.",
        });
      } else if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Account exists",
          description: "This email is already registered. Please log in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl rounded-none p-2 sm:p-6 transition-all duration-300">
      <CardHeader className="space-y-2 text-center pb-4">
        {/* Customized Logo Grid */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-cyan-600 flex items-center justify-center text-white font-bold text-lg">
              eS
            </div>
            <span className="text-xl font-headline font-extrabold tracking-wider text-slate-900">
              e-Swachh
            </span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold font-sans text-slate-900">
          {mode === 'login' ? 'Access Smart Portal' : 'Register Citizen Account'}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 font-sans tracking-wide">
          {mode === 'login' 
            ? 'Enter municipal credentials to view local active SLA logs and tracking maps.' 
            : 'Fulfill details below to start geo-spatial watch reporting and earn community rewards.'}
        </CardDescription>
      </CardHeader>
      
      {/* Sleek Toggles */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-none border border-slate-200/40">
          <button
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-none ${
              mode === 'login' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Login Portal
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-none ${
              mode === 'signup' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      <CardContent>
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="name@swachh.gov.in" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                  className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Access Password</Label>
                <Link href="/forgot-password" handle-ai-hint="forgot password" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="login-password" 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  required 
                  className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs rounded-none mt-2 shadow-sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Access Citizen Portal'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            {showConfigAlert && (
              <div className="p-4 rounded-none bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex gap-3">
                  <AlertCircle className="text-amber-600 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Console Setup Needed</p>
                    <p className="text-xxs text-amber-700 leading-relaxed">
                      The <strong>Email/Password</strong> provider is disabled in your Firebase project. You must enable it in the console.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white border-amber-200 text-amber-800 hover:bg-amber-100 h-9 text-xs font-bold rounded-none"
                  asChild
                >
                  <a 
                    href="https://console.firebase.google.com/project/_/authentication/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    Open Firebase Console <ExternalLink size={12} />
                  </a>
                </Button>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-slate-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="signup-name" 
                    placeholder="John Doe" 
                    value={signupName} 
                    onChange={(e) => setSignupName(e.target.value)} 
                    required 
                    className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="john@gmail.com" 
                      value={signupEmail} 
                      onChange={(e) => setSignupEmail(e.target.value)} 
                      required 
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-xs font-bold uppercase tracking-wider text-slate-700">Phone Contact</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="signup-phone" 
                      type="tel" 
                      placeholder="+91 9988776655" 
                      value={signupPhone} 
                      onChange={(e) => setSignupPhone(e.target.value)} 
                      required 
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="signup-password" 
                      type="password" 
                      value={signupPassword} 
                      onChange={(e) => setSignupPassword(e.target.value)} 
                      required 
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="signup-confirmPassword" 
                      type="password" 
                      value={signupConfirmPassword} 
                      onChange={(e) => setSignupConfirmPassword(e.target.value)} 
                      required 
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus-visible:ring-cyan-600 rounded-none" 
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs rounded-none mt-2 shadow-sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Register Citizen Account'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-100 pt-4">
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
          <ShieldCheck size={12} className="text-cyan-600" /> Secure Municipal Governance Protocol
        </div>
      </CardFooter>
    </Card>
  );
}
