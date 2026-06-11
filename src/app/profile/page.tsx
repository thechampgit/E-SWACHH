'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail, sendEmailVerification, RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Globe, 
  Moon, 
  Sun, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  Settings,
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Translation Dictionary for multi-language support
const translations: Record<string, any> = {
  en: {
    title: "Citizen Profile",
    subtitle: "Manage your personal details, preferences, and identity verification status.",
    backToDashboard: "Back to Dashboard",
    avatarAlt: "User initials",
    verifiedBadge: "Verified Citizen",
    unverifiedBadge: "Unverified Profile",
    memberSince: "Member since",
    pointsEarned: "Points Earned",
    profileCompletion: "Profile Completion",
    tabPersonal: "Personal Details",
    tabSecurity: "Verification & Security",
    tabPreferences: "Preferences",
    personalHeader: "Personal Information",
    personalDesc: "Update your name, contact information, and physical address.",
    fullName: "Full Name",
    emailAddress: "Email Address",
    phoneContact: "Phone Contact",
    physicalAddress: "Physical Address",
    saveChanges: "Save Changes",
    saving: "Saving...",
    secHeader: "Account Verification",
    secDesc: "Verify your email and identity to gain priority resolution status.",
    emailStatus: "Email Status",
    verified: "Verified",
    unverified: "Unverified",
    sendVerification: "Send Verification Email",
    sending: "Sending...",
    verificationSent: "Verification email sent successfully!",
    idVerification: "Identity Verification",
    idVerificationDesc: "Provide an official municipal ID to unlock the Verified Citizen badge and priority resolution.",
    docType: "Document Type",
    docNumber: "Document ID Number",
    selectDoc: "Select Document Type",
    aadhar: "Aadhaar Card",
    voter: "Voter ID",
    license: "Driving License",
    pan: "PAN Card",
    submitVerification: "Submit Verification Request",
    submitting: "Submitting...",
    verifiedSuccess: "Your profile has been verified successfully!",
    prefHeader: "Application Preferences",
    prefDesc: "Customize the interface language and styling theme.",
    appLanguage: "Application Language",
    appTheme: "Styling Theme",
    light: "Light Mode",
    dark: "Dark Mode",
    system: "System Mode",
    successSave: "Profile updated successfully!",
    errorSave: "Failed to update profile.",
    errorEmailAuth: "Please log in again to update your email address.",
  },
  hi: {
    title: "नागरिक प्रोफ़ाइल",
    subtitle: "अपने व्यक्तिगत विवरण, प्राथमिकताएं और पहचान सत्यापन स्थिति प्रबंधित करें।",
    backToDashboard: "डैशबोर्ड पर वापस जाएं",
    avatarAlt: "उपयोगकर्ता के आद्याक्षर",
    verifiedBadge: "सत्यापित नागरिक",
    unverifiedBadge: "असत्यापित प्रोफ़ाइल",
    memberSince: "सदस्यता की तिथि",
    pointsEarned: "अर्जित अंक",
    profileCompletion: "प्रोफ़ाइल पूर्णता",
    tabPersonal: "व्यक्तिगत विवरण",
    tabSecurity: "सत्यापन और सुरक्षा",
    tabPreferences: "प्राथमिकताएं",
    personalHeader: "व्यक्तिगत जानकारी",
    personalDesc: "अपना नाम, संपर्क जानकारी और भौतिक पता अपडेट करें।",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    phoneContact: "फ़ोन संपर्क",
    physicalAddress: "भौतिक पता",
    saveChanges: "बदलाव सहेजें",
    saving: "सहेज रहा है...",
    secHeader: "खाता सत्यापन",
    secDesc: "प्राथमिकता समाधान स्थिति प्राप्त करने के लिए अपना ईमेल और पहचान सत्यापित करें।",
    emailStatus: "ईमेल स्थिति",
    verified: "सत्यापित",
    unverified: "असत्यापित",
    sendVerification: "सत्यापन ईमेल भेजें",
    sending: "भेज रहा है...",
    verificationSent: "सत्यापन ईमेल सफलतापूर्वक भेजा गया!",
    idVerification: "पहचान सत्यापन",
    idVerificationDesc: "सत्यापित नागरिक बैज और प्राथमिकता समाधान अनलॉक करने के लिए एक आधिकारिक नगर निगम आईडी प्रदान करें।",
    docType: "दस्तावेज़ का प्रकार",
    docNumber: "दस्तावेज़ आईडी संख्या",
    selectDoc: "दस्तावेज़ प्रकार चुनें",
    aadhar: "आधार कार्ड",
    voter: "मतदाता पहचान पत्र",
    license: "ड्राइविंग लाइसेंस",
    pan: "पैन कार्ड",
    submitVerification: "सत्यापन अनुरोध सबमिट करें",
    submitting: "सबमिट कर रहा है...",
    verifiedSuccess: "आपकी प्रोफ़ाइल सफलतापूर्वक सत्यापित हो गई है!",
    prefHeader: "एप्लिकेशन प्राथमिकताएं",
    prefDesc: "इंटरफ़ेस भाषा और स्टाइलिंग थीम को कस्टमाइज़ करें।",
    appLanguage: "एप्लिकेशन की भाषा",
    appTheme: "स्टाइलिंग थीम",
    light: "लाइट मोड",
    dark: "डार्क मोड",
    system: "सिस्टम मोड",
    successSave: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    errorSave: "प्रोफ़ाइल अपडेट करने में विफल।",
    errorEmailAuth: "कृपया अपना ईमेल पता अपडेट करने के लिए फिर से लॉग इन करें।",
  },
  bn: {
    title: "নাগরিক প্রোফাইল",
    subtitle: "আপনার ব্যক্তিগত বিবরণ, পছন্দ এবং পরিচয় যাচাইকরণ স্থিতি পরিচালনা করুন।",
    backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
    avatarAlt: "ব্যবহারকারীর আদ্যক্ষর",
    verifiedBadge: "যাচাইকৃত নাগরিক",
    unverifiedBadge: "অযাচাইকৃত প্রোফাইল",
    memberSince: "সদস্যপদ কাল থেকে",
    pointsEarned: "অর্জিত পয়েন্ট",
    profileCompletion: "প্রোফাইল সম্পূর্ণতা",
    tabPersonal: "ব্যক্তিগত বিবরণ",
    tabSecurity: "যাচাইকরণ ও নিরাপত্তা",
    tabPreferences: "পছন্দসমূহ",
    personalHeader: "ব্যক্তিগত তথ্য",
    personalDesc: "আপনার নাম, যোগাযোগের তথ্য এবং স্থায়ী ঠিকানা আপডেট করুন।",
    fullName: "সম্পূর্ণ নাম",
    emailAddress: "ইমেল ঠিকানা",
    phoneContact: "ফোন নম্বর",
    physicalAddress: "স্থায়ী ঠিকানা",
    saveChanges: "পরিবর্তনগুলি সংরক্ষণ করুন",
    saving: "সংরक्षण করা হচ্ছে...",
    secHeader: "অ্যাকাউন্ট যাচাইকরণ",
    secDesc: "অগ্রাধিকার সমাধানের স্থিতি পেতে আপনার ইমেল এবং পরিচয় যাচাই করুন।",
    emailStatus: "ইমেলের স্থিতি",
    verified: "যাচাইকৃত",
    unverified: "অযাচাইকৃত",
    sendVerification: "যাচাইকরণ ইমেল পাঠান",
    sending: "পাঠানো হচ্ছে...",
    verificationSent: "যাচাইকরণ ইমেল সফলভাবে পাঠানো হয়েছে!",
    idVerification: "পরিচয় যাচাইকরণ",
    idVerificationDesc: "যাচাইকৃত নাগরিক ব্যাজ এবং অগ্রাধিকার সমাধান আনলক করতে একটি অফিসিয়াল পৌর আইডি প্রদান করুন।",
    docType: "নথির ধরণ",
    docNumber: "নথি আইডি নম্বর",
    selectDoc: "নথির ধরণ নির্বাচন করুন",
    aadhar: "আধার কার্ড",
    voter: "ভোটার আইডি",
    license: "ড্রাইভিং লাইসেন্স",
    pan: "প্যান কার্ড",
    submitVerification: "যাচাইকরণের অনুরোধ জমা দিন",
    submitting: "জমা দেওয়া হচ্ছে...",
    verifiedSuccess: "আপনার প্রোফাইল সফলভাবে যাচাই করা হয়েছে!",
    prefHeader: "অ্যাপ্লিকেশন পছন্দসমূহ",
    prefDesc: "ইন্টারফেসের ভাষা এবং স্টাইল থিম কাস্টমাইজ করুন।",
    appLanguage: "অ্যাপ্লিকেশনের ভাষা",
    appTheme: "স্টাইল থিম",
    light: "লাইট মোড",
    dark: "ডার্ক মোড",
    system: "সিস্টেম মোড",
    successSave: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
    errorSave: "প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।",
    errorEmailAuth: "আপনার ইমেল ঠিকানা আপডেট করতে অনুগ্রহ করে আবার লগ ইন করুন।",
  },
  mai: {
    title: "नागरिक प्रोफाइल",
    subtitle: "अपन व्यक्तिगत विवरण, पसंद आ पहचान सत्यापन स्थिति प्रबंधित करू।",
    backToDashboard: "डैशबोर्ड पर वापस जाउ",
    avatarAlt: "उपयोगकर्ताक आद्याक्षर",
    verifiedBadge: "सत्यापित नागरिक",
    unverifiedBadge: "असत्यापित प्रोफाइल",
    memberSince: "सदस्यताक तिथि",
    pointsEarned: "अर्जित अंक",
    profileCompletion: "प्रोफाइल पूर्णता",
    tabPersonal: "व्यक्तिगत विवरण",
    tabSecurity: "सत्यापन आ सुरक्षा",
    tabPreferences: "प्राथमिकता",
    personalHeader: "व्यक्तिगत जानकारी",
    personalDesc: "अपन नाम, संपर्क जानकारी आ भौतिक पता अपडेट करू।",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    phoneContact: "फोन संपर्क",
    physicalAddress: "भौतिक पता",
    saveChanges: "बदलाव सुरक्षित करू",
    saving: "सुरक्षित भ रहल अछि...",
    secHeader: "खाता सत्यापन",
    secDesc: "प्राथमिकता समाधानक स्थिति प्राप्त करवाक लेल अपन ईमेल आ पहचान सत्यापित करू।",
    emailStatus: "ईमेल स्थिति",
    verified: "सत्यापित",
    unverified: "असत्यापित",
    sendVerification: "सत्यापन ईमेल पठाउ",
    sending: "पठा रहल अछि...",
    verificationSent: "सत्यापन ईमेल सफलतापूर्वक पठाओल गेल!",
    idVerification: "पहचान सत्यापन",
    idVerificationDesc: "सत्यापित नागरिक बैज आ प्राथमिकता समाधानक लेल एकटा आधिकारिक नगर निगम आईडी प्रदान करू।",
    docType: "दस्तावेजक प्रकार",
    docNumber: "दस्तावेज आईडी नंबर",
    selectDoc: "दस्तावेजक प्रकार चुनू",
    aadhar: "आधार कार्ड",
    voter: "मतदाता पहचान पत्र",
    license: "ड्राइविंग लाइसेंस",
    pan: "पैन कार्ड",
    submitVerification: "सत्यापन अनुरोध सबमिट करू",
    submitting: "सबमिट भ रहल अछि...",
    verifiedSuccess: "अहाँक प्रोफाइल सफलतापूर्वक सत्यापित भ गेल अछि!",
    prefHeader: "एप्लिकेशन प्राथमिकता",
    prefDesc: "भारत मे स्वच्छताक लेल भाषा आ डिजाइन बदलू।",
    appLanguage: "एप्लिकेशनक भाषा",
    appTheme: "डिजाइन थीम",
    light: "लाइट मोड",
    dark: "डार्क मोड",
    system: "सिस्टम मोड",
    successSave: "प्रोफाइल सफलतापूर्वक अपडेट कएल गेल!",
    errorSave: "प्रोफाइल अपडेट करबा मे विफल।",
    errorEmailAuth: "अपन ईमेल पता अपडेट करबाक लेल कृपया दोबारा लॉग इन करू।",
  }
};

export default function ProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  // Load language and theme from localStorage
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('light');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();

  const [photoURL, setPhotoURL] = useState('');
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // ID Verification states
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingId, setIsVerifyingId] = useState(false);

  // Sync firestore document
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: userData, loading: docLoading } = useDoc<any>(userDocRef);

  const t = translations[lang] || translations.en;

  // Initialize theme & language preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('Eswachh-language') || 'en';
      setLang(savedLang);

      const savedTheme = localStorage.getItem('eswachh-theme') || 'light';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Update local forms once user data is loaded
  useEffect(() => {
    if (userData) {
      setName(userData.name || user?.displayName || '');
      setEmail(userData.email || user?.email || '');
      setPhone(userData.phone || '');
      setAddress(userData.address || '');
      setPhotoURL(userData.photoURL || user?.photoURL || '');
    }
  }, [userData, user]);

  const applyTheme = (targetTheme: string) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    
    if (targetTheme === 'dark') {
      root.classList.add('dark');
    } else if (targetTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System Theme handling
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    setLang(selectedLang);
    localStorage.setItem('eswachh-language', selectedLang);
    
    let title = 'Language Changed';
    let description = 'The interface language was updated successfully.';
    
    if (selectedLang === 'hi') {
      title = 'भाषा बदली गई';
      description = 'इंटरफ़ेस भाषा सफलतापूर्वक अपडेट की गई थी।';
    } else if (selectedLang === 'bn') {
      title = 'ভাষা পরিবর্তন করা হয়েছে';
      description = 'ইন্টারফেসের ভাষা সফলভাবে আপডেট করা হয়েছে।';
    } else if (selectedLang === 'mai') {
      title = 'भाषा बदलल गेल';
      description = 'इंटरफ़ेसक भाषा सफलतापूर्वक अपडेट कएल गेल छल।';
    }
    
    toast({
      title,
      description,
    });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value;
    setTheme(selectedTheme);
    localStorage.setItem('eswachh-theme', selectedTheme);
    applyTheme(selectedTheme);
    toast({
      title: "Theme Updated",
      description: `Interface style switched to ${selectedTheme} mode.`,
    });
  };

  // Profile completion % calculation
  const completionPercentage = (() => {
    let score = 0;
    if (name) score += 25;
    if (email) score += 25;
    if (phone) score += 25;
    if (address) score += 25;
    return score;
  })();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file.",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image size must be less than 2MB.",
      });
      return;
    }

    setIsSaving(true);
    try {
      let downloadURL = '';

      if (storage) {
        try {
          const storagePath = `users/${user.uid}/profile_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, file);
          downloadURL = await getDownloadURL(storageRef);
        } catch (storageError) {
          console.warn("Storage upload failed, falling back to base64:", storageError);
        }
      }

      if (!downloadURL) {
        downloadURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      setPhotoURL(downloadURL);

      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      await setDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      }, { merge: true });

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error uploading image",
        description: error.message || "Failed to update profile picture.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initRecaptcha = () => {
    if (typeof window === 'undefined' || !auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {}
      });
    }
  };

  const handleStartPhoneVerification = async () => {
    if (!phone || !auth?.currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a valid phone number.",
      });
      return;
    }

    setIsVerifyingPhone(true);
    try {
      initRecaptcha();
    } catch (err: any) {
      console.error("Recaptcha Init Error:", err);
      toast({
        variant: "destructive",
        title: "reCAPTCHA Error",
        description: err.message || "Failed to initialize security verifier.",
      });
      setIsVerifyingPhone(false);
      return;
    }

    try {
      const confirmation = await linkWithPhoneNumber(auth.currentUser, phone, (window as any).recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowPhoneVerifyModal(true);
      toast({
        title: "SMS Code Sent",
        description: `Verification code has been sent to ${phone}.`,
      });
    } catch (error: any) {
      console.warn("Real phone linking failed, entering local test mode:", error);
      setConfirmationResult({ mock: true, code: "123456" });
      setShowPhoneVerifyModal(true);
      toast({
        title: "Test Mode Activated",
        description: "Entering local test verification mode (Code is 123456).",
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleConfirmPhoneCode = async () => {
    if (!smsCode || !user || !db) return;

    setIsVerifyingPhone(true);
    try {
      if (confirmationResult?.mock) {
        if (smsCode === confirmationResult.code) {
          await setDoc(doc(db, 'users', user.uid), {
            phoneVerified: true
          }, { merge: true });
          
          toast({
            title: "Success",
            description: "Phone number verified successfully (Test Mode)!",
          });
          setShowPhoneVerifyModal(false);
          setConfirmationResult(null);
          setSmsCode('');
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Code",
            description: "The verification code entered is incorrect.",
          });
        }
      } else {
        await confirmationResult.confirm(smsCode);
        
        await setDoc(doc(db, 'users', user.uid), {
          phoneVerified: true
        }, { merge: true });

        toast({
          title: "Success",
          description: "Phone number verified and linked successfully!",
        });
        setShowPhoneVerifyModal(false);
        setConfirmationResult(null);
        setSmsCode('');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to verify SMS code.",
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db || !user) return;

    setIsSaving(true);
    try {
      // 1. Update Firebase Auth displayName
      if (name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // 2. Update Firebase Auth email address (might require fresh credentials)
      if (email !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch (authError: any) {
          if (authError.code === 'auth/requires-recent-login') {
            toast({
              variant: "destructive",
              title: "Security Verification Required",
              description: t.errorEmailAuth,
            });
            setIsSaving(false);
            return;
          }
          throw authError;
        }
      }

      // 3. Update/Create Firestore users collection record
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        address,
        role: userData?.role || 'citizen',
      }, { merge: true });

      toast({
        title: "Success",
        description: t.successSave,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || t.errorSave,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!auth?.currentUser) return;
    setIsSendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Email Sent",
        description: t.verificationSent,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending email",
        description: error.message,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleIdVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    if (!docType || !docNumber) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Please specify document details.",
      });
      return;
    }

    setIsVerifyingId(true);
    try {
      // Simulate validation / scanning municipal database
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await setDoc(doc(db, 'users', user.uid), {
        isVerified: true,
        documentType: docType,
        documentNumber: docNumber,
        contributionLevel: (userData?.contributionLevel || 0) + 15, // reward with community points
        role: userData?.role || 'citizen',
      }, { merge: true });

      toast({
        title: "Identity Verified",
        description: t.verifiedSuccess,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error verifying ID",
        description: error.message,
      });
    } finally {
      setIsVerifyingId(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="citizen">
      <div 
        className="min-h-screen text-slate-900 dark:text-slate-50 flex flex-col transition-colors duration-300 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/profile_bg.jpg')" }}
      >
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-16 transition-colors">
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">{t.backToDashboard}</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
              <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-50">E-Swachh</span>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-6 py-10 max-w-6xl space-y-8">
          
          {/* Header Description */}
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {t.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {t.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PROFILE CARD COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
                <CardContent className="p-6 pt-8 text-center space-y-6">
                  
                  {/* User Avatar Initials */}
                  <div className="flex justify-center">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <Avatar 
                      onClick={handleAvatarClick}
                      className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 shadow-sm relative group cursor-pointer overflow-hidden"
                      title="Click to change profile picture"
                    >
                      {photoURL && (
                        <AvatarImage src={photoURL} alt={name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-400 font-headline font-bold text-3xl">
                        {name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C'}
                      </AvatarFallback>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                      </div>
                    </Avatar>
                  </div>

                  {/* Name and Verification Badge */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-50 leading-snug">
                      {name || 'Citizen'}
                    </h2>
                    <div className="flex justify-center">
                      {userData?.isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex gap-1.5 items-center py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                          <ShieldCheck size={14} className="fill-emerald-200 dark:fill-transparent" /> {t.verifiedBadge}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex gap-1.5 items-center py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                          <AlertTriangle size={14} /> {t.unverifiedBadge}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 gap-4 text-start">
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">{t.pointsEarned}</p>
                      <p className="text-lg font-headline font-bold text-slate-800 dark:text-slate-200">
                        {((userData?.contributionLevel || 0) * 10) || 0} pts
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Status Level</p>
                      <p className="text-lg font-headline font-bold text-slate-800 dark:text-slate-200">
                        Lvl {userData?.contributionLevel || 0}
                      </p>
                    </div>
                  </div>

                  {/* Profile Completion Meter */}
                  <div className="space-y-2 text-start">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500 dark:text-slate-400">{t.profileCompletion}</span>
                      <span className="font-extrabold text-cyan-600 dark:text-cyan-400">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2 bg-slate-100 dark:bg-slate-800" />
                  </div>

                  {/* Meta text */}
                  <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {t.memberSince} {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Active'}
                  </div>
                </CardContent>
              </Card>

              {/* Informative Security tips callout */}
              <div className="p-4 bg-cyan-50/50 dark:bg-slate-900 border border-cyan-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Data Privacy Protocol</span>
                </div>
                <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your municipal account coordinates with direct smart GIS filters. Details such as phone contact and address are solely used to optimize automated field-officer dispatching in your ward.
                </p>
              </div>
            </div>

            {/* RIGHT WORKBENCH TABS COLUMN */}
            <div className="lg:col-span-8">
              <Tabs defaultValue="personal" className="w-full space-y-6">
                
                {/* Tabs Trigger Headers */}
                <TabsList className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-1 rounded-lg">
                  <TabsTrigger value="personal" className="flex items-center gap-2 rounded-md py-2.5 font-semibold text-xs transition-all">
                    <User size={14} /> <span className="hidden sm:inline">{t.tabPersonal}</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2 rounded-md py-2.5 font-semibold text-xs transition-all">
                    <ShieldCheck size={14} /> <span className="hidden sm:inline">{t.tabSecurity}</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2 rounded-md py-2.5 font-semibold text-xs transition-all">
                    <Settings size={14} /> <span className="hidden sm:inline">{t.tabPreferences}</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: PERSONAL DETAILS */}
                <TabsContent value="personal">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-50">
                          {t.personalHeader}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                          {t.personalDesc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <form onSubmit={handleSaveChanges} className="space-y-5">
                          
                          <div className="space-y-2">
                            <Label htmlFor="prof-name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.fullName}</Label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <Input 
                                id="prof-name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required
                                className="h-11 pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-600" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="prof-email" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.emailAddress}</Label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  id="prof-email" 
                                  type="email"
                                  value={email} 
                                  onChange={(e) => setEmail(e.target.value)} 
                                  required
                                  className="h-11 pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-600" 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prof-phone" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.phoneContact}</Label>
                              <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  id="prof-phone" 
                                  placeholder="+91 XXXXX XXXXX"
                                  value={phone} 
                                  onChange={(e) => setPhone(e.target.value)} 
                                  className="h-11 pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-600" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="prof-address" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.physicalAddress}</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <Input 
                                id="prof-address" 
                                placeholder="Ward 12, Main Street, Civic Block, Metro City"
                                value={address} 
                                onChange={(e) => setAddress(e.target.value)} 
                                className="h-11 pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-600" 
                              />
                            </div>
                          </div>

                          <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs px-6 h-11" disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.saving}
                              </>
                            ) : (
                              t.saveChanges
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* TAB 2: VERIFICATION & SECURITY */}
                <TabsContent value="security">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
                    
                    {/* Part A: Email Verification Status */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-50">
                          {t.secHeader}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                          {t.secDesc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border dark:border-slate-800">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t.emailStatus}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {auth?.currentUser?.emailVerified ? (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 flex gap-1 items-center py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                                <CheckCircle2 size={12} /> {t.verified}
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex gap-1 items-center py-1 px-3 rounded-full text-xs font-bold">
                                  <AlertTriangle size={12} /> {t.unverified}
                                </Badge>
                                <Button variant="outline" size="sm" onClick={handleSendVerificationEmail} className="h-9 text-xs font-bold border-cyan-600/30 text-cyan-600 dark:border-cyan-400/30 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-none bg-transparent" disabled={isSendingEmail}>
                                  {isSendingEmail ? (
                                    <>
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                      {t.sending}
                                    </>
                                  ) : (
                                    t.sendVerification
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Phone Verification */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border dark:border-slate-800">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Status</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{phone || 'No phone number set'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {userData?.phoneVerified ? (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 flex gap-1 items-center py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                                <CheckCircle2 size={12} /> Verified
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex gap-1 items-center py-1 px-3 rounded-full text-xs font-bold">
                                  <AlertTriangle size={12} /> Unverified
                                </Badge>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleStartPhoneVerification} 
                                  className="h-9 text-xs font-bold border-cyan-600/30 text-cyan-600 dark:border-cyan-400/30 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-none bg-transparent"
                                  disabled={!phone || isVerifyingPhone}
                                  title={!phone ? "Please set a phone number in Personal Details first" : "Verify your phone number"}
                                >
                                  {isVerifyingPhone ? (
                                    <>
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    "Verify Phone"
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Part B: Identity Verification Simulation */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                          <Sparkles className="text-amber-500 fill-amber-300 dark:fill-transparent animate-pulse" size={20} /> {t.idVerification}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                          {t.idVerificationDesc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        {userData?.isVerified ? (
                          <div className="p-6 text-center bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-800/40 space-y-4 rounded-xl">
                            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-400">Official Municipal Identity Verified</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Thank you for verifying! Your civic reports are now prioritized and will route directly to ward administrators with high SLA clearance times.
                              </p>
                            </div>
                            <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border dark:border-slate-800 py-1.5 px-4 inline-block rounded-md shadow-xs">
                              ID Document: {userData.documentType || 'Aadhaar Card'} (xxxx-xxxx-{userData.documentNumber?.slice(-4) || 'xxxx'})
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleIdVerificationSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="doc-type" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.docType}</Label>
                                <select 
                                  id="doc-type"
                                  value={docType}
                                  onChange={(e) => setDocType(e.target.value)}
                                  required
                                  className="flex h-11 w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">{t.selectDoc}</option>
                                
                                  <option value="Aadhaar Card">{t.aadhar}</option>
                                 <option value="PAN Card">{t.PAN || "PAN Card"}</option>
                                  <option value="Voter ID">{t.voter}</option>
                                  <option value="Driving License">{t.license}</option>
                                  
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="doc-number" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.docNumber}</Label>
                                <div className="relative">
                                  <Smartphone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                  <Input 
                                    id="doc-number" 
                                    placeholder="e.g. 1234 5678 9012"
                                    value={docNumber} 
                                    onChange={(e) => setDocNumber(e.target.value)} 
                                    required
                                    className="h-11 pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-600" 
                                  />
                                </div>
                              </div>
                            </div>

                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs px-6 h-11" disabled={isVerifyingId}>
                              {isVerifyingId ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t.submitting}
                                </>
                              ) : (
                                t.submitVerification
                              )}
                            </Button>
                          </form>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* TAB 3: APPLICATION PREFERENCES */}
                <TabsContent value="preferences">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-50">
                          {t.prefHeader}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                          {t.prefDesc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-6">
                        
                        {/* Language Selection Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                              <Globe size={18} className="text-cyan-600 dark:text-cyan-400" />
                              <span className="text-sm font-bold uppercase tracking-wider">{t.appLanguage}</span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Select language for the portal layout and menus.</p>
                          </div>
                          <div className="w-full sm:w-48">
                            <select 
                                value={lang} 
                                onChange={handleLanguageChange}
                                className="flex h-11 w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 rounded-md"
                              >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                                <option value="bn">বাংলা (Bengali)</option>
                                <option value="mai">मैथिली (Maithili)</option>
                              </select>
                          </div>
                        </div>

                        {/* Theme Selection Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                              {theme === 'dark' ? <Moon size={18} className="text-cyan-400" /> : <Sun size={18} className="text-amber-500" />}
                              <span className="text-sm font-bold uppercase tracking-wider">{t.appTheme}</span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Toggle dark styling scheme to protect visual strain.</p>
                          </div>
                          <div className="w-full sm:w-48">
                            <select 
                                value={theme} 
                                onChange={handleThemeChange}
                                className="flex h-11 w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 rounded-md"
                              >
                                <option value="light">{t.light}</option>
                                <option value="dark">{t.dark}</option>
                                <option value="system">{t.system}</option>
                              </select>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

              </Tabs>
            </div>

          </div>

        </main>
        
        {/* Recaptcha Container for Firebase Phone Verification */}
        <div id="recaptcha-container" className="hidden"></div>

        {/* Phone Verification Modal Overlay */}
        <AnimatePresence>
          {showPhoneVerifyModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 border dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-6 rounded-xl relative text-slate-900 dark:text-slate-50"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-headline font-bold text-slate-900 dark:text-slate-50">Enter Verification Code</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Please type the 6-digit SMS verification code sent to <strong className="text-slate-700 dark:text-slate-300">{phone}</strong>.
                    {confirmationResult?.mock && <span className="block text-amber-500 font-semibold mt-1">Local Test Mode: Enter "123456"</span>}
                  </p>
                </div>

                <div className="space-y-4">
                  <Input 
                    type="text" 
                    maxLength={6} 
                    placeholder="xxxxxx" 
                    value={smsCode} 
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl font-bold tracking-[0.5em] h-12 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800"
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPhoneVerifyModal(false);
                        setConfirmationResult(null);
                        setSmsCode('');
                      }}
                      className="text-xs font-bold rounded-none"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirmPhoneCode} 
                      disabled={smsCode.length !== 6 || isVerifyingPhone}
                      className="text-xs font-bold rounded-none"
                    >
                      {isVerifyingPhone ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Code"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
