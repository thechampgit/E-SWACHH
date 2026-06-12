'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePreferences } from '@/context/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Leaf, 
  Recycle, 
  AlertTriangle, 
  Sparkles, 
  Trophy, 
  Flame, 
  Trash2, 
  HelpCircle,
  ThumbsUp,
  XCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Game waste items list
const WASTE_ITEMS = [
  // Biodegradable
  { id: 'leftover-food', name: 'Leftover Food', type: 'bio', hindi: 'बचा हुआ भोजन', bengali: 'অবশিষ্ট খাদ্য', maithili: 'बचल भोजन', tip: 'Organic food scraps decompose quickly and enrich composting soil.' },
  { id: 'paper-cardboard', name: 'Paper and Cardboard', type: 'bio', hindi: 'कागज और गत्ता', bengali: 'কাগজ এবং পিচবোর্ড', maithili: 'कागज आ गत्ता', tip: 'Clean paper products degrade naturally and can be composted.' },
  { id: 'garden-waste', name: 'Garden Waste (leaves, grass, flowers)', type: 'bio', hindi: 'बगीचे का कचरा (पत्तियां, घास, फूल)', bengali: 'বাগানের বর্জ্য (পাতা, ঘাস, ফুল)', maithili: 'बगीचाक कचरा (पत्ता, घास, फूल)', tip: 'Leaves, grass clippings, and flowers are rich organic material for composting.' },
  { id: 'cotton-jute', name: 'Cotton and Jute Products', type: 'bio', hindi: 'कपास और जूट के उत्पाद', bengali: 'তুলা এবং পাটের তৈরি জিনিস', maithili: 'कपास आ जूटक उत्पाद', tip: 'Natural fibers like cotton and jute degrade organically.' },
  { id: 'wood-sawdust', name: 'Wood and Sawdust', type: 'bio', hindi: 'लकड़ी और बुरादा', bengali: 'কাঠ এবং কাঠের গুঁড়া', maithili: 'लकड़ी आ बुरादा', tip: 'Untreated wood and sawdust are compostable and degrade naturally.' },

  // Non-Biodegradable / Recyclable
  { id: 'plastic-bottles-bags', name: 'Plastic Bottles and Bags', type: 'non-bio', hindi: 'प्लास्टिक की बोतलें और बैग', bengali: 'প্লাস্টিকের বোতল এবং ব্যাগ', maithili: 'प्लास्टिकक बोतल आ बैग', tip: 'Plastics persist in the environment for centuries. Recycle them.' },
  { id: 'glass-bottles-jars', name: 'Glass Bottles and Jars', type: 'non-bio', hindi: 'कांच की बोतलें और जार', bengali: 'কাঁচের বোতল এবং জার', maithili: 'काँचक जार आ बोतल', tip: 'Glass is 100% recyclable and can be reused indefinitely.' },
  { id: 'aluminum-cans', name: 'Aluminum Cans', type: 'non-bio', hindi: 'एल्यूमीनियम के डिब्बे', bengali: 'অ্যালুমিনিয়াম ক্যান', maithili: 'एल्युमीनियमक डब्बा', tip: 'Aluminum recycling saves 95% of the energy needed to make new metal.' },
  { id: 'metal-scraps', name: 'Metal Scraps', type: 'non-bio', hindi: 'धातु के टुकड़े', bengali: 'ধাতুর টুকরো', maithili: 'धातुक टुकड़ा', tip: 'Scrap metals are highly valued for industrial recycling.' },
  { id: 'rubber-tires', name: 'Rubber Tires', type: 'non-bio', hindi: 'रबर के टायर', bengali: 'রাবারের টায়ার', maithili: 'रबरक टायर', tip: 'Tires do not decompose. Recycle or upcycle them to avoid hazardous fires.' },
  { id: 'styrofoam-thermocol', name: 'Styrofoam (Thermocol)', type: 'non-bio', hindi: 'थर्मोकोल (स्टायरोफोम)', bengali: 'থার্মোকল', maithili: 'थर्मोकोल', tip: 'Styrofoam does not break down and is lightweight, causing environmental litter.' },
  { id: 'synthetic-fabrics', name: 'Synthetic Fabrics (nylon, polyester)', type: 'non-bio', hindi: 'कृत्रिम कपड़े (नायलॉन, पॉलिएस्टर)', bengali: 'কৃত্রিম কাপড় (নাইলন, পলিয়েস্টার)', maithili: 'कृत्रिम कपड़ा (नायलॉन, पॉलिएस्टर)', tip: 'Synthetic fibers are forms of microplastics and do not decompose.' },
  { id: 'electronic-waste', name: 'Electronic Waste (old keyboards, cables, CDs)', type: 'non-bio', hindi: 'इलेक्ट्रॉनिक कचरा (कीबोर्ड, केबल, सीडी)', bengali: 'ইলেকট্রনিক বর্জ্য (কীবোর্ড, কেবল, সিডি)', maithili: 'इलेक्ट्रॉनिक कचरा (कीबोर्ड, केबल, सीडी)', tip: 'Dry electronic components can be safely stripped for recyclable metals.' },

  // Hazardous
  { id: 'used-batteries', name: 'Used Batteries', type: 'haz', hindi: 'इस्तेमाल की गई बैटरी', bengali: 'ব্যবহৃত ব্যাটারি', maithili: 'इस्तेमाल कएल बैटरी', tip: 'Batteries contain heavy metals like lead and cadmium. Dispose safely.' },
  { id: 'expired-medicines', name: 'Expired Medicines', type: 'haz', hindi: 'एक्सपायर दवाएं', bengali: 'মেয়াদोত্তীর্ণ ওষুধ', maithili: 'एक्सपायर दवाई', tip: 'Chemicals in medicine contaminate soil and water systems if dumped.' },
  { id: 'paints-thinners', name: 'Paints and Paint Thinners', type: 'haz', hindi: 'पेंट और पेंट थिनर', bengali: 'পেইন্ট এবং পেইন্ট থিনার', maithili: 'पेंट आ पेंट थिनर', tip: 'Paints contain toxic chemicals. Handle as hazardous waste.' },
  { id: 'pesticides-insecticides', name: 'Pesticides and Insecticides', type: 'haz', hindi: 'कीटनाशक और कीटनाशक दवाएं', bengali: 'কীটনাশক', maithili: 'कीटनाशक दवाई', tip: 'Pesticides are highly toxic to wildlife and human water supplies.' },
  { id: 'cleaning-chemicals', name: 'Cleaning Chemicals', type: 'haz', hindi: 'सफाई के रसायन', bengali: 'পরিষ্কারের রাসায়নিক', maithili: 'सफाईक रसायन', tip: 'Strong chemicals in cleaning supplies corrode pipes and soil.' },
  { id: 'fluorescent-bulbs', name: 'Fluorescent Bulbs and Tube Lights', type: 'haz', hindi: 'फ्लोरोसेंट बल्ब और ट्यूब लाइट', bengali: 'ফ্লুরোসেন্ট বাল্ব এবং টিউব লাইট', maithili: 'फ्लोरोसेंट बल्ब आ ट्यूब लाइट', tip: 'These contain toxic mercury vapor. Handle with extreme care.' },
  { id: 'medical-waste', name: 'Medical Waste (syringes, bandages, gloves)', type: 'haz', hindi: 'चिकित्सा कचरा (सिरिंज, पट्टियाँ, दस्ताने)', bengali: 'চিকিৎসা বর্জ্য (সিরিঞ্জ, ব্যান্ডেজ, গ্লাভস)', maithili: 'चिकित्सा कचरा (सिरिंज, पट्टी, दस्ताने)', tip: 'Bio-hazardous waste needs specialized collection and incineration.' },
  { id: 'used-motor-oil', name: 'Used Motor Oil', type: 'haz', hindi: 'इस्तेमाल किया हुआ मोटर ऑयल', bengali: 'ব্যবহৃত মোটর তেল', maithili: 'इस्तेमाल कएल मोटर ऑयल', tip: 'Motor oil is insoluble and toxic. Never pour down municipal drains.' },
  { id: 'solvents-chemicals', name: 'Solvents and Industrial Chemicals', type: 'haz', hindi: 'विलायक और औद्योगिक रसायन', bengali: 'দ্রাবক এবং শিল্প রাসায়নিক', maithili: 'विलायक आ औद्योगिक रसायन', tip: 'Highly toxic industrial chemicals must not be mixed with household trash.' },
  { id: 'toxic-e-waste', name: 'E-Waste containing toxic materials', type: 'haz', hindi: 'विषाक्त ई-कचरा', bengali: 'বিষাক্ত ই-বর্জ্য', maithili: 'विषाक्त ई-कचरा', tip: 'Circuit boards and CRTs contain lead, mercury, and other toxic flame retardants.' }
];

export default function WasteSegregationPage() {
  const { t, lang } = usePreferences();

  // Game states
  const [currentItem, setCurrentItem] = useState<typeof WASTE_ITEMS[0] | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Load high score
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem('eswachh-segregation-highscore');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
      selectRandomItem();
    }
  }, []);

  const selectRandomItem = () => {
    const availableItems = WASTE_ITEMS.filter(item => item.id !== currentItem?.id);
    const random = availableItems[Math.floor(Math.random() * availableItems.length)];
    setCurrentItem(random);
    setFeedback(null);
  };

  const handleSort = (binType: 'bio' | 'non-bio' | 'haz') => {
    if (!currentItem || feedback) return;

    const isCorrect = currentItem.type === binType;
    let feedbackMsg = '';

    if (isCorrect) {
      feedbackMsg = t.correct || 'Correct!';
      const newScore = score + 10;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setBounce(true);
      setTimeout(() => setBounce(false), 500);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('eswachh-segregation-highscore', newScore.toString());
      }

      setFeedback({ isCorrect: true, message: feedbackMsg });
      setTimeout(() => {
        selectRandomItem();
      }, 1500);
    } else {
      const correctBinName = 
        currentItem.type === 'bio' ? (t.bioTitle || 'Biodegradable') : 
        currentItem.type === 'non-bio' ? (t.nonBioTitle || 'Non-Biodegradable') : 
        (t.hazTitle || 'Hazardous');

      feedbackMsg = `${t.incorrect || 'Incorrect!'} ${currentItem.name} should go into the ${correctBinName} bin.`;
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      setFeedback({ isCorrect: false, message: feedbackMsg });
    }
  };

  const handleReset = () => {
    setScore(0);
    setStreak(0);
    selectRandomItem();
  };

  // Get item name based on current language
  const getItemName = (item: typeof WASTE_ITEMS[0]) => {
    if (lang === 'hi' && item.hindi) return item.hindi;
    if (lang === 'bn' && item.bengali) return item.bengali;
    if (lang === 'mai' && item.maithili) return item.maithili;
    return item.name;
  };

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-350 bg-no-repeat bg-fixed bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      style={{ backgroundImage: "url('/portal_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* HEADER NAVBAR */}
      <header className="fixed top-0 z-[100] w-full border-b dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16 transition-colors">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">E-Swachh</span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="rounded-xl border dark:border-slate-800">
            <Link href="/" className="flex items-center gap-1.5 font-bold">
              <ArrowLeft size={14} /> {t.backToHome || 'Back to Home'}
            </Link>
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-12 space-y-12 max-w-5xl">
        {/* HERO SECTION */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold uppercase py-1 px-3">
            <BookOpen size={12} className="mr-1.5 inline-block" /> {t.features || 'Features'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-headline font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {t.segregationTitle || 'Waste Segregation Guide'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.segregationSubtitle || 'Learn how to separate biodegradable, non-biodegradable, and hazardous waste properly to make recycling and composting efficient.'}
          </p>
        </div>

        {/* THREE COLUMNS EDUCATION GUIDE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BIODEGRADABLE CARD */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Leaf size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.bioTitle || 'Biodegradable (Green)'}
                </CardTitle>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-500 uppercase">Wet Waste</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.bioDesc || 'Organic waste that decomposes naturally. Used for making rich composting manure.'}
              </p>
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.howToCollect || 'How to Collect'}:
                </span>
                <ul className="list-disc pl-4 text-slate-500 dark:text-slate-400 space-y-1">
                  <li>Use aerated green bins.</li>
                  <li>Do not mix plastic bags or wrappers inside.</li>
                  <li>Compost at home if possible.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.examples || 'Common Examples'}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Vegetable Peels</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Leftover Food</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Tea Leaves</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Egg Shells</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NON-BIODEGRADABLE CARD */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Recycle size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.nonBioTitle || 'Non-Biodegradable (Blue)'}
                </CardTitle>
                <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-455 uppercase">Dry Waste</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.nonBioDesc || 'Dry waste that does not decompose naturally. Should be separated and sent for recycling.'}
              </p>
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.howToCollect || 'How to Collect'}:
                </span>
                <ul className="list-disc pl-4 text-slate-500 dark:text-slate-400 space-y-1">
                  <li>Store in dry blue bins.</li>
                  <li>Clean and rinse plastic/metal containers.</li>
                  <li>Flatten paperboards and cardboard.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.examples || 'Common Examples'}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Plastic Bottle</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Paper Cup</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Cans & Metal</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Glass Jar</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HAZARDOUS CARD */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.hazTitle || 'Hazardous (Red)'}
                </CardTitle>
                <span className="text-[10px] font-extrabold text-red-600 dark:text-red-500 uppercase">Chemical & E-Waste</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.hazDesc || 'Toxic, chemical, or electronic items requiring specialized treatment to avoid environmental damage.'}
              </p>
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.howToCollect || 'How to Collect'}:
                </span>
                <ul className="list-disc pl-4 text-slate-500 dark:text-slate-400 space-y-1">
                  <li>Discard in secure red/black bins.</li>
                  <li>Handle broken bulbs/mercury with gloves.</li>
                  <li>Deposit batteries at specialized collection hubs.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  {t.examples || 'Common Examples'}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Batteries</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Medicines</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">LED Bulbs</Badge>
                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Syringes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* INTERACTIVE GAME */}
        <div className="max-w-xl mx-auto">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md relative overflow-hidden">
            {/* Header */}
            <CardHeader className="p-6 pb-2 text-center">
              <CardTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                <Sparkles className="text-amber-500 h-5 w-5 animate-pulse" /> {t.gameTitle || 'Test Your Sorting Skills'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                {t.gameSubtitle || 'Categorize the waste items shown below into the correct bins.'}
              </CardDescription>
            </CardHeader>

            {/* Score panel */}
            <div className="flex justify-around border-y dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 py-3.5 px-6">
              <div className="text-center space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t.score || 'Score'}</span>
                <span className="text-lg font-headline font-black text-cyan-600 dark:text-cyan-400">{score}</span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block flex items-center justify-center gap-1">
                  <Flame size={10} className="text-orange-500" /> {t.streak || 'Streak'}
                </span>
                <span className="text-lg font-headline font-black text-orange-500">{streak}</span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block flex items-center justify-center gap-1">
                  <Trophy size={10} className="text-amber-500" /> {t.highScore || 'High Score'}
                </span>
                <span className="text-lg font-headline font-black text-amber-500">{highScore}</span>
              </div>
            </div>

            <CardContent className="p-6 space-y-8 flex flex-col items-center">
              {/* Falling/shown item */}
              <AnimatePresence mode="wait">
                {currentItem && (
                  <motion.div
                    key={currentItem.id}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      x: shake ? [-10, 10, -10, 10, 0] : 0,
                      scale: bounce ? [1, 1.1, 1] : 1
                    }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="p-6 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl text-center shadow-inner relative max-w-xs w-full flex flex-col items-center gap-3 group"
                  >
                    <Trash2 size={36} className="text-slate-400 group-hover:rotate-12 transition-transform duration-300" />
                    <div>
                      <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
                        {getItemName(currentItem)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bins selection */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {/* Biodegradable Bin */}
                <Button 
                  onClick={() => handleSort('bio')}
                  disabled={feedback?.isCorrect === true}
                  className="h-24 flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs gap-1.5 shadow-sm rounded-xl p-2"
                >
                  <Leaf size={18} />
                  <span className="text-[10px] uppercase text-center line-clamp-1">{t.bioTitle || 'Bio'}</span>
                </Button>

                {/* Non-Biodegradable Bin */}
                <Button 
                  onClick={() => handleSort('non-bio')}
                  disabled={feedback?.isCorrect === true}
                  className="h-24 flex flex-col items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs gap-1.5 shadow-sm rounded-xl p-2"
                >
                  <Recycle size={18} />
                  <span className="text-[10px] uppercase text-center line-clamp-1">{t.nonBioTitle || 'Non-Bio'}</span>
                </Button>

                {/* Hazardous Bin */}
                <Button 
                  onClick={() => handleSort('haz')}
                  disabled={feedback?.isCorrect === true}
                  className="h-24 flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs gap-1.5 shadow-sm rounded-xl p-2"
                >
                  <AlertTriangle size={18} />
                  <span className="text-[10px] uppercase text-center line-clamp-1">{t.hazTitle || 'Hazardous'}</span>
                </Button>
              </div>

              {/* Feedback card */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 border w-full rounded-xl flex items-start gap-3 ${
                      feedback.isCorrect 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-350'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-350'
                    }`}
                  >
                    {feedback.isCorrect ? (
                      <ThumbsUp className="shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" size={16} />
                    ) : (
                      <XCircle className="shrink-0 text-red-600 dark:text-red-500 mt-0.5" size={16} />
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-bold">{feedback.message}</p>
                      {currentItem && (
                        <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                          <strong>Tip:</strong> {currentItem.tip}
                        </p>
                      )}
                      {!feedback.isCorrect && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectRandomItem} 
                          className="h-7 text-[10px] font-bold text-red-700 dark:text-red-400 hover:bg-red-500/10 px-2 py-0 mt-2"
                        >
                          Next Item
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset Game button */}
              {(score > 0 || streak > 0) && (
                <Button 
                  onClick={handleReset} 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Reset Score
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
