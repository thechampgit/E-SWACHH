'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Gift, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Bus, 
  CupSoda, 
  Trees, 
  Leaf, 
  Ticket,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  QrCode,
  Tag,
  ArrowRight
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

// Defined catalog items
const REWARDS_CATALOG = [
  {
    id: "ebus-pass",
    title: "Free E-Bus Transit Pass",
    pointsCost: 100,
    icon: Bus,
    iconColor: "text-blue-500 bg-blue-50 border-blue-100",
    description: "Get a free single-journey ride pass on any local municipal electric bus transit line.",
    ecoBenefit: "Reduces local traffic & carbon emissions",
  },
  {
    id: "tree-sapling",
    title: "Plant a Tree Sapling",
    pointsCost: 150,
    icon: Trees,
    iconColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
    description: "Have a native tree sapling planted in your name in a city reforestation zone. Includes GPS tracker.",
    ecoBenefit: "Urban green cover & biodiversity boost",
  },
  {
    id: "compost-pack",
    title: "Organic Wet Waste Compost",
    pointsCost: 200,
    icon: Leaf,
    iconColor: "text-teal-500 bg-teal-50 border-teal-100",
    description: "Redeem a 5kg bag of organic, high-nutrition compost generated from municipal wet waste processing.",
    ecoBenefit: "Supports circular organic gardening cycles",
  },
  {
    id: "bamboo-mug",
    title: "Eco Bamboo Reusable Mug",
    pointsCost: 250,
    icon: CupSoda,
    iconColor: "text-amber-500 bg-amber-50 border-amber-100",
    description: "Redeem for a premium sustainable bamboo fiber travel coffee/tea mug. Zero plastic waste.",
    ecoBenefit: "Prevents single-use container landfill waste",
  },
  {
    id: "cinema-ticket",
    title: "Civic Cinema 50% Voucher",
    pointsCost: 300,
    icon: Ticket,
    iconColor: "text-purple-500 bg-purple-50 border-purple-100",
    description: "Get a 50% discount voucher for any movie at the local Municipal Cultural Center theater.",
    ecoBenefit: "Promotes local community hubs & centers",
  }
];

export default function RewardsPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Active view tab: 'shop' or 'vouchers'
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'vouchers'>('shop');
  
  // Modal states for redemption flows
  const [selectedReward, setSelectedReward] = useState<typeof REWARDS_CATALOG[0] | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showSuccessCode, setShowSuccessCode] = useState<string | null>(null);

  // Vouchers state to dynamically persist redeemed items in the active session
  const [vouchers, setVouchers] = useState<Array<{
    id: string;
    code: string;
    reward: typeof REWARDS_CATALOG[0];
    dateRedeemed: string;
    status: 'Active' | 'Redeemed';
  }>>([
    // Pre-populate with one mock claimed coupon for high-fidelity demo
    {
      id: "v-prev",
      code: "SWACHH-BUS-842FD",
      reward: REWARDS_CATALOG[0],
      dateRedeemed: "2026-05-20",
      status: "Redeemed"
    }
  ]);

  // Query user complaints to determine their live points
  const complaintsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "complaints"), 
      where("userId", "==", user.uid)
    );
  }, [db, user?.uid]);

  const { data: complaints } = useCollection(complaintsQuery);

  const userBasePoints = useMemo(() => {
    if (!complaints) return 0;
    return complaints.length * 10;
  }, [complaints]);

  // Subtract redeemed voucher costs from dynamic user points
  const currentPointsBalance = useMemo(() => {
    const totalRedeemedCost = vouchers
      .filter(v => v.id !== "v-prev") // don't count pre-loaded mock for dynamic point calculation
      .reduce((sum, v) => sum + v.reward.pointsCost, 0);
    return Math.max(0, userBasePoints - totalRedeemedCost);
  }, [userBasePoints, vouchers]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const handleRedeemClick = (reward: typeof REWARDS_CATALOG[0]) => {
    setSelectedReward(reward);
    setShowSuccessCode(null);
  };

  const executeRedemption = () => {
    if (!selectedReward || currentPointsBalance < selectedReward.pointsCost) return;
    
    setIsRedeeming(true);
    
    // Simulate premium transaction deduction loading
    setTimeout(() => {
      const uniqueCode = `SWACHH-${selectedReward.title.split(' ')[1].toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      
      const newVoucher = {
        id: `v-${Date.now()}`,
        code: uniqueCode,
        reward: selectedReward,
        dateRedeemed: new Date().toISOString().split('T')[0],
        status: 'Active' as const
      };

      setVouchers(prev => [newVoucher, ...prev]);
      setIsRedeeming(false);
      setShowSuccessCode(uniqueCode);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-colors duration-350">
      {/* HEADER */}
      <header className="fixed top-0 z-[100] w-full border-b bg-white/95 backdrop-blur-md h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">eS</div>
            <span className="text-lg font-headline font-bold text-slate-900">e-Swachh</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/profile" title="View Profile">
                <User className="h-4 w-4 text-slate-600" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:text-destructive hover:bg-destructive/10" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-12 space-y-8">
        
        {/* Welcome Section & Pulsating Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h1 className="text-2xl font-headline font-bold text-slate-900 flex items-center gap-2">
              Eco-Rewards Marketplace <Sparkles className="text-amber-500 h-5 w-5 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-500">Redeem points earned from reporting issues and helping keep the city clean for awesome, eco-friendly vouchers!</p>
          </div>
          
          {/* PREMIUM BALANCE CARD */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg border border-amber-400/20 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 text-white/10 opacity-30 pointer-events-none">
              <Trophy size={110} />
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-100 flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className="animate-spin-slow" /> Points Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-headline font-black tracking-tight">{currentPointsBalance}</span>
              <span className="text-xs uppercase font-extrabold text-amber-200">pts</span>
            </div>
            <p className="text-[10px] text-amber-100 mt-2 font-medium">Keep reporting cleanliness issues to stack more points!</p>
          </motion.div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <Link 
              href="/dashboard" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:border-slate-300 flex items-center gap-2 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" /> My Dashboard
            </Link>
            <Link 
              href="/dashboard/leaderboard" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:border-slate-300 flex items-center gap-2 transition-all"
            >
              <Trophy className="h-4 w-4" /> Swachh Warriors
            </Link>
            <Link 
              href="/dashboard/rewards" 
              className="border-b-2 border-primary pb-3 text-sm font-bold text-primary flex items-center gap-2 transition-all"
            >
              <Gift className="h-4 w-4" /> Eco Rewards
            </Link>
          </div>
        </div>

        {/* SUB-TABS: SHOP VS VOUCHERS */}
        <div className="flex gap-3">
          <Button 
            variant={activeSubTab === 'shop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubTab('shop')}
            className="rounded-xl px-4 text-xs font-bold"
          >
            <Gift className="h-3.5 w-3.5 mr-1.5" /> Rewards Shop
          </Button>
          <Button 
            variant={activeSubTab === 'vouchers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubTab('vouchers')}
            className="rounded-xl px-4 text-xs font-bold relative"
          >
            <Tag className="h-3.5 w-3.5 mr-1.5" /> My Vouchers
            {vouchers.filter(v => v.status === 'Active').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                {vouchers.filter(v => v.status === 'Active').length}
              </span>
            )}
          </Button>
        </div>

        {/* CONTENT SWITCH */}
        <AnimatePresence mode="wait">
          {activeSubTab === 'shop' ? (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {REWARDS_CATALOG.map((reward) => {
                const IconComponent = reward.icon;
                const canAfford = currentPointsBalance >= reward.pointsCost;
                
                return (
                  <Card key={reward.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col bg-white group">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl border ${reward.iconColor}`}>
                          <IconComponent size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <Badge variant="outline" className="border-amber-200 bg-amber-500/10 text-amber-700 font-extrabold uppercase text-[9px] py-1 px-2.5">
                          {reward.pointsCost} Points
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-800 line-clamp-1">{reward.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider">{reward.ecoBenefit}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between gap-4">
                      <p className="text-xs text-slate-500 leading-relaxed">{reward.description}</p>
                      
                      <Button 
                        onClick={() => handleRedeemClick(reward)}
                        className={`w-full text-xs font-bold h-9 mt-2 rounded-xl transition-all ${
                          canAfford 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100'
                        }`}
                      >
                        {canAfford ? 'Redeem Voucher' : 'Insufficient Points'} <ArrowRight size={13} className="ml-1.5" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="vouchers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 max-w-3xl"
            >
              {vouchers.length === 0 ? (
                <Card className="p-12 text-center border-dashed border bg-white flex flex-col items-center gap-4">
                  <Tag size={40} className="text-slate-200" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">No vouchers claimed yet</h3>
                    <p className="text-sm text-slate-400 mt-1">Redeem your accumulated cleanliness points in the Rewards Shop tab to claim discount coupons!</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSubTab('shop')} className="rounded-xl">
                    Browse Rewards Shop
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vouchers.map((voucher) => {
                    const RewardIcon = voucher.reward.icon;
                    return (
                      <Card key={voucher.id} className="border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
                        <div className="p-5 flex gap-4 items-start border-b border-dashed border-slate-100">
                          <div className={`p-2.5 rounded-xl border ${voucher.reward.iconColor} shrink-0`}>
                            <RewardIcon size={20} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{voucher.reward.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{voucher.reward.ecoBenefit}</p>
                            <span className="text-[9px] text-slate-400 font-medium block">Claimed on: {voucher.dateRedeemed}</span>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Coupon Code</span>
                            <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 border px-2 py-0.5 rounded border-slate-200">{voucher.code}</span>
                          </div>
                          
                          {voucher.status === 'Active' ? (
                            <Badge className="bg-emerald-500 text-white font-bold uppercase text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <QrCode size={10} /> Ready to Use
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-200 text-slate-500 font-bold uppercase text-[9px] px-2.5 py-0.5 rounded-full">
                              Redeemed
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* CONFIRMATION / REDEMPTION OVERLAY MODAL */}
      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100"
            >
              
              {!showSuccessCode ? (
                // STEP 1: CONFIRMATION MODAL CONTENT
                <div className="p-6 space-y-6">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl border ${selectedReward.iconColor} shrink-0`}>
                      {<selectedReward.icon size={28} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedReward.title}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{selectedReward.ecoBenefit}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed">{selectedReward.description}</p>
                  
                  <div className="bg-slate-50 border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Points Deducted</span>
                      <span className="text-base font-extrabold text-amber-600">-{selectedReward.pointsCost} Points</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Remaining Balance</span>
                      <span className="text-base font-extrabold text-slate-700">{currentPointsBalance - selectedReward.pointsCost} Points</span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedReward(null)}
                      disabled={isRedeeming}
                      className="rounded-xl text-xs font-bold h-9"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={executeRedemption}
                      disabled={isRedeeming}
                      className="rounded-xl text-xs font-bold h-9 bg-primary"
                    >
                      {isRedeeming ? (
                        <span className="flex items-center gap-1.5">
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> Processing...
                        </span>
                      ) : (
                        'Confirm & Redeem'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // STEP 2: REDEMPTION SUCCESS COUPON MODAL
                <div className="p-6 text-center space-y-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
                    <Check size={24} className="stroke-[3]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Voucher Claimed Successfully!</h3>
                    <p className="text-xs text-slate-400">Your coupon has been generated. Use it at local distribution hubs.</p>
                  </div>

                  {/* BARCODE CARD CONTAINER */}
                  <div className="border border-slate-200 bg-slate-50/50 p-6 rounded-xl space-y-4">
                    <QrCode size={110} className="mx-auto text-slate-800" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Voucher Coupon Code</span>
                      <span className="font-mono text-base font-black text-cyan-700 bg-white border px-3 py-1 rounded border-slate-200 select-all">{showSuccessCode}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <Button 
                      onClick={() => {
                        setSelectedReward(null);
                        setActiveSubTab('vouchers');
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-6 bg-emerald-600 hover:bg-emerald-700"
                    >
                      View My Vouchers
                    </Button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
