'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    avatarAlt: "उपयोगकर्ता प्रथमाक्षर",
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
    phoneContact: "फ़ोन नंबर",
    physicalAddress: "भौतिक पता",
    saveChanges: "परिवर्तन सहेजें",
    saving: "सहेज रहा है...",
    secHeader: "खाता सत्यापन",
    secDesc: "प्राथमिकता शिकायत निवारण स्थिति प्राप्त करने के लिए अपने ईमेल और पहचान को सत्यापित करें।",
    emailStatus: "ईमेल स्थिति",
    verified: "सत्यापित",
    unverified: "असत्यापित",
    sendVerification: "सत्यापन ईमेल भेजें",
    sending: "भेज रहा है...",
    verificationSent: "सत्यापन ईमेल सफलतापूर्वक भेजा गया!",
    idVerification: "पहचान सत्यापन",
    idVerificationDesc: "सत्यापित नागरिक बैज और प्राथमिकता शिकायत समाधान अनलॉक करने के लिए आधिकारिक आईडी प्रदान करें।",
    docType: "दस्तावेज़ प्रकार",
    docNumber: "दस्तावेज़ आईडी नंबर",
    selectDoc: "दस्तावेज़ प्रकार चुनें",
    aadhar: "आधार कार्ड",
    voter: "मतदाता पहचान पत्र",
    license: "ड्राइविंग लाइसेंस",
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
    successSave: "प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!",
    errorSave: "प्रोफ़ाइल अपडेट करने में विफल।",
    errorEmailAuth: "अपना ईमेल पता बदलने के लिए कृपया पुन: लॉग इन करें।",
  },
  es: {
    title: "Perfil del Ciudadano",
    subtitle: "Administre sus datos personales, preferencias y estado de verificación de identidad.",
    backToDashboard: "Volver al Panel",
    avatarAlt: "Iniciales del usuario",
    verifiedBadge: "Ciudadano Verificado",
    unverifiedBadge: "Perfil no Verificado",
    memberSince: "Miembro desde",
    pointsEarned: "Puntos Ganados",
    profileCompletion: "Completitud del Perfil",
    tabPersonal: "Datos Personales",
    tabSecurity: "Verificación y Seguridad",
    tabPreferences: "Preferencias",
    personalHeader: "Información Personal",
    personalDesc: "Actualice su nombre, información de contacto y dirección física.",
    fullName: "Nombre Completo",
    emailAddress: "Dirección de Correo",
    phoneContact: "Contacto Telefónico",
    physicalAddress: "Dirección Física",
    saveChanges: "Guardar Cambios",
    saving: "Guardando...",
    secHeader: "Verificación de la Cuenta",
    secDesc: "Verifique su correo y su identidad para obtener el estado de resolución prioritaria.",
    emailStatus: "Estado del Correo",
    verified: "Verificado",
    unverified: "Sin Verificar",
    sendVerification: "Enviar Correo de Verificación",
    sending: "Enviando...",
    verificationSent: "¡Correo de verificación enviado con éxito!",
    idVerification: "Verificación de Identidad",
    idVerificationDesc: "Proporcione una identificación municipal oficial para desbloquear la insignia de Ciudadano Verificado.",
    docType: "Tipo de Documento",
    docNumber: "Número de Identificación",
    selectDoc: "Seleccionar Tipo de Documento",
    aadhar: "Cédula de Identidad",
    voter: "Cédula Electoral",
    license: "Licencia de Conducir",
    submitVerification: "Enviar Solicitud de Verificación",
    submitting: "Enviando...",
    verifiedSuccess: "¡Su perfil ha sido verificado con éxito!",
    prefHeader: "Preferencias de la Aplicación",
    prefDesc: "Personalice el idioma de la interfaz y el tema de estilo.",
    appLanguage: "Idioma de la Aplicación",
    appTheme: "Tema de Estilo",
    light: "Modo Claro",
    dark: "Modo Oscuro",
    system: "Modo Sistema",
    successSave: "¡Perfil actualizado con éxito!",
    errorSave: "Error al actualizar el perfil.",
    errorEmailAuth: "Inicie sesión nuevamente para actualizar su correo electrónico.",
  },
  mr: {
    title: "नागरिक प्रोफाइल",
    subtitle: "तुमचे वैयक्तिक तपशील, पसंती आणि ओळख पडताळणी स्थिती व्यवस्थापित करा.",
    backToDashboard: "डॅशबोर्डवर परत जा",
    avatarAlt: "वापरकर्ता आद्याक्षरे",
    verifiedBadge: "पडताळणीकृत नागरिक",
    unverifiedBadge: "अपडताळणीकृत प्रोफाइल",
    memberSince: "या तारखेपासून सदस्य",
    pointsEarned: "मिळवलेले गुण",
    profileCompletion: "प्रोफाइल पूर्णता",
    tabPersonal: "वैयक्तिक तपशील",
    tabSecurity: "पडताळणी आणि सुरक्षा",
    tabPreferences: "पसंती",
    personalHeader: "वैयक्तिक माहिती",
    personalDesc: "तुमचे नाव, संपर्क माहिती आणि पत्ता अपडेट करा.",
    fullName: "पूर्ण नाव",
    emailAddress: "ईमेल पत्ता",
    phoneContact: "फोन नंबर",
    physicalAddress: "पत्ता",
    saveChanges: "बदल जतन करा",
    saving: "जतन करत आहे...",
    secHeader: "खाते पडताळणी",
    secDesc: "प्राधान्याने तक्रार निवारण मिळवण्यासाठी तुमचा ईमेल आणि ओळख सत्यापित करा.",
    emailStatus: "ईमेल स्थिती",
    verified: "पडताळणी झाली",
    unverified: "पडताळणी नाही",
    sendVerification: "पडताळणी ईमेल पाठवा",
    sending: "पाठवत आहे...",
    verificationSent: "पडताळणी ईमेल यशस्वीरित्या पाठवला गेला!",
    idVerification: "ओळख पडताळणी",
    idVerificationDesc: "पडताळणीकृत नागरिक बॅज आणि तक्रारींचे जलद निवारण मिळवण्यासाठी शासकीय ओळखपत्र सादर करा.",
    docType: "ओळखपत्राचा प्रकार",
    docNumber: "ओळखपत्र क्रमांक",
    selectDoc: "ओळखपत्राचा प्रकार निवडा",
    aadhar: "आधार कार्ड",
    voter: "मतदार ओळखपत्र",
    license: "ड्रायव्हिंग लायसन्स",
    submitVerification: "पडताळणी विनंती सबमिट करा",
    submitting: "सबमिट करत आहे...",
    verifiedSuccess: "तुमचे प्रोफाइल यशस्वीरित्या पडताळले गेले आहे!",
    prefHeader: "ॲप्लिकेशन पसंती",
    prefDesc: "ॲप्लिकेशनची भाषा आणि रंगसंगती (थीम) बदला.",
    appLanguage: "ॲप्लिकेशनची भाषा",
    appTheme: "रंगसंगती (थीम)",
    light: "लाईट मोड",
    dark: "डार्क मोड",
    system: "सिस्टम मोड",
    successSave: "प्रोफाइल यशस्वीरित्या अपडेट झाली!",
    errorSave: "प्रोफाइल अपडेट करण्यात अयशस्वी.",
    errorEmailAuth: "कृपया तुमचा ईमेल पत्ता अपडेट करण्यासाठी पुन्हा लॉग इन करा.",
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
      const savedLang = localStorage.getItem('eswachh-language') || 'en';
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
    toast({
      title: selectedLang === 'hi' ? 'भाषा बदली' : selectedLang === 'es' ? 'Idioma cambiado' : selectedLang === 'mr' ? 'भाषा बदलली' : 'Language Changed',
      description: selectedLang === 'hi' ? 'इंटरफेस भाषा सफलतापूर्वक बदली गई।' : selectedLang === 'es' ? 'El idioma del portal ha sido cambiado.' : selectedLang === 'mr' ? 'इंटरफेस भाषा यशस्वीरित्या बदलली गेली.' : 'The interface language was updated successfully.',
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

      // 3. Update Firestore users collection record
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        address,
      });

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

      await updateDoc(doc(db, 'users', user.uid), {
        isVerified: true,
        documentType: docType,
        documentNumber: docNumber,
        contributionLevel: (userData?.contributionLevel || 0) + 15, // reward with community points
      });

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col transition-colors duration-300">
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-16 transition-colors">
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">{t.backToDashboard}</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">eS</div>
              <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-50">e-Swachh</span>
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
                    <Avatar className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 shadow-sm">
                      <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-400 font-headline font-bold text-3xl">
                        {name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C'}
                      </AvatarFallback>
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
                              <option value="en">English (US)</option>
                              <option value="hi">हिन्दी (Hindi)</option>
                              <option value="es">Español (Spanish)</option>
                              <option value="mr">मराठी (Marathi)</option>
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
                              <option value="light">☀️ {t.light}</option>
                              <option value="dark">🌙 {t.dark}</option>
                              <option value="system">🖥️ {t.system}</option>
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
      </div>
    </ProtectedRoute>
  );
}
