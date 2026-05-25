'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigAlert, setShowConfigAlert] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

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

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: "Please ensure both passwords match.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      const userData = {
        uid: user.uid,
        name,
        email,
        phone,
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
        description: "Welcome to CivicPulse!",
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mb-4">
            C
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-slate-900">Create an account</CardTitle>
          <CardDescription>Join our community to report and track civic issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showConfigAlert && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex gap-3">
                <AlertCircle className="text-amber-600 h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Console Setup Needed</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    The <strong>Email/Password</strong> provider is disabled in your Firebase project. You must enable it to allow citizens to sign up.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white border-amber-200 text-amber-800 hover:bg-amber-100 h-9 text-xs font-bold"
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
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 text-lg font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center w-full text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Log in
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest pt-4 border-t w-full">
            <ShieldCheck size={12} /> Secure Governance Protocol
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
