'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { useLogoutConfirm } from '@/context/LogoutConfirmContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Gift, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Crown, 
  Medal, 
  Sparkles,
  Award,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { confirmLogout } = useLogoutConfirm();

  const handleLogout = async () => {
    confirmLogout(async () => {
      if (!auth) return;
      await signOut(auth);
      router.push('/');
    });
  };

  // Fetch all complaints from DB and sum points by user
  useEffect(() => {
    const fetchLeaders = async () => {
      if (!db) return;
      try {
        const snapshot = await getDocs(collection(db, 'complaints'));
        const pointsMap: Record<string, { email: string; name: string; points: number }> = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.userId) return;

          if (!pointsMap[data.userId]) {
            pointsMap[data.userId] = {
              email: data.userEmail || 'Unknown',
              name: data.userName || (data.userEmail ? data.userEmail.split('@')[0] : 'Citizen'),
              points: 0,
            };
          }

          // +10 points for each reported grievance
          pointsMap[data.userId].points += 10;
          // +20 points when tickets resolve successfully
          if (data.status === 'Resolved') {
            pointsMap[data.userId].points += 20;
          }
        });

        const sorted = Object.entries(pointsMap).map(([uid, info]) => ({
          uid,
          name: info.name,
          email: info.email,
          points: info.points,
          isCurrentUser: uid === user?.uid
        })).sort((a, b) => b.points - a.points);

        setLeaders(sorted);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [db, user?.uid]);

  // Mocked base players list for gamified competitiveness
  const mockPlayers = [
    { rank: 1, name: "Rajesh Kumar", points: 1250, badge: "Eco Legend", avatar: "👨‍🔧", isCurrentUser: false },
    { rank: 2, name: "Priya Sharma", points: 980, badge: "Green Crusader", avatar: "👩‍⚕️", isCurrentUser: false },
    { rank: 3, name: "Amit Patel", points: 820, badge: "Waste Warrior", avatar: "👨‍💼", isCurrentUser: false },
    { rank: 4, name: "Vikram Singh", points: 710, badge: "Eco Guardian", avatar: "👨‍🌾", isCurrentUser: false },
    { rank: 5, name: "Sunita Rao", points: 640, badge: "Nature Warden", avatar: "👩‍🏫", isCurrentUser: false },
    { rank: 6, name: "Anjali Gupta", points: 580, badge: "Recycle Hero", avatar: "👩‍🎨", isCurrentUser: false },
    { rank: 7, name: "Rohan Mehra", points: 510, badge: "Clean Cadet", avatar: "👨‍🎓", isCurrentUser: false },
  ];

  // Merge Firestore actual leader scores into the leaderboard list
  const finalList = useMemo(() => {
    let list = [...mockPlayers];

    leaders.forEach(leader => {
      const isCurrent = leader.uid === user?.uid;
      
      if (isCurrent) {
        const existingYouIdx = list.findIndex(p => p.isCurrentUser);
        if (existingYouIdx !== -1) {
          list[existingYouIdx].points = leader.points;
          list[existingYouIdx].name = leader.name;
        } else {
          list.push({
            rank: 8,
            name: leader.name,
            points: leader.points,
            badge: "Swachh Scout",
            avatar: "⭐",
            isCurrentUser: true
          });
        }
      } else {
        if (!list.some(p => p.name === leader.name)) {
          list.push({
            rank: 8,
            name: leader.name,
            points: leader.points,
            badge: "Swachh Scout",
            avatar: "👤",
            isCurrentUser: false
          });
        }
      }
    });

    list.sort((a, b) => b.points - a.points);

    return list.map((player, index) => ({
      ...player,
      rank: index + 1,
      badge: player.isCurrentUser 
        ? (player.points >= 1000 ? "Eco Legend" : player.points >= 500 ? "Green Crusader" : "Clean Cadet")
        : player.badge
    }));
  }, [leaders, user?.uid]);

  const finalTopThree = useMemo(() => {
    return finalList.slice(0, 3);
  }, [finalList]);

  const finalSecondaryList = useMemo(() => {
    return finalList.slice(3);
  }, [finalList]);

  const currentUserPoints = useMemo(() => {
    const found = leaders.find(l => l.uid === user?.uid);
    return found ? found.points : 0;
  }, [leaders, user?.uid]);

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-350 bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/portal_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* HEADER */}
      <header className="fixed top-0 z-[100] w-full border-b bg-white/95 backdrop-blur-md h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="text-lg font-headline font-bold text-slate-900">E-Swachh</span>
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-headline font-bold text-slate-900 flex items-center gap-2">
              Swachh Warriors <Sparkles className="text-amber-500 h-5 w-5 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-600">Inspiring municipal cleanliness. Earn points by keeping your neighborhoods spotless!</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            <Trophy className="h-4 w-4 animate-bounce" /> {currentUserPoints} Community Points
          </div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <Link 
              href="/dashboard" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" /> My Dashboard
            </Link>
            <Link 
              href="/dashboard/leaderboard" 
              className="border-b-2 border-cyan-600 pb-3 text-sm font-bold text-cyan-600 flex items-center gap-2 transition-all"
            >
              <Trophy className="h-4 w-4" /> Swachh Warriors
            </Link>
            <Link 
              href="/dashboard/rewards" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <Gift className="h-4 w-4" /> Eco Rewards
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading Leaderboard rankings...</p>
          </div>
        ) : (
          <>
            {/* PODIUM SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
              {finalTopThree.length >= 3 && (
                <>
                  {/* 2nd Place */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="order-2 md:order-1 flex flex-col items-center"
                  >
                    <div className="relative mb-3 flex flex-col items-center group">
                      <div className="w-20 h-20 rounded-full border-4 border-slate-300 bg-white shadow-lg flex items-center justify-center text-4xl group-hover:scale-105 transition-all">
                        {finalTopThree[1].avatar}
                      </div>
                      <div className="absolute -top-6 bg-slate-400 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-white">
                        <Medal size={10} /> 2nd Place
                      </div>
                    </div>
                    <Card className="w-full shadow-md border-slate-200 bg-white/70 backdrop-blur-sm group hover:border-slate-300 transition-all text-center">
                      <CardContent className="p-6 flex flex-col items-center">
                        <p className="font-bold text-slate-800 text-base">{finalTopThree[1].name}</p>
                        <Badge variant="secondary" className="mt-1 text-[9px] bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">{finalTopThree[1].badge}</Badge>
                        <div className="mt-4 bg-slate-100/60 rounded-xl px-4 py-2 border border-slate-200/50 w-full">
                          <span className="text-xl font-headline font-extrabold text-slate-700">{finalTopThree[1].points}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">pts</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 1st Place (Center Podium) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="order-1 md:order-2 flex flex-col items-center md:-translate-y-4"
                  >
                    <div className="relative mb-3 flex flex-col items-center group">
                      <div className="w-24 h-24 rounded-full border-4 border-amber-400 bg-white shadow-xl flex items-center justify-center text-5xl group-hover:scale-105 transition-all ring-4 ring-amber-400/20">
                        {finalTopThree[0].avatar}
                      </div>
                      <div className="absolute -top-7 bg-amber-400 text-amber-950 text-xs font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-white animate-bounce">
                        <Crown size={12} className="fill-amber-950" /> 1st Place
                      </div>
                    </div>
                    <Card className="w-full shadow-xl border-amber-300/40 bg-gradient-to-b from-amber-500/5 to-white group hover:border-amber-400/50 transition-all text-center">
                      <CardContent className="p-6 flex flex-col items-center">
                        <p className="font-bold text-slate-900 text-lg flex items-center gap-1">
                          {finalTopThree[0].name}
                          <Sparkles size={14} className="text-amber-500 animate-pulse" />
                        </p>
                        <Badge variant="outline" className="mt-1 text-[9px] border-amber-300 bg-amber-400/10 text-amber-700 font-extrabold uppercase tracking-wider">{finalTopThree[0].badge}</Badge>
                        <div className="mt-4 bg-amber-400/10 rounded-xl px-5 py-2.5 border border-amber-200 w-full shadow-inner">
                          <span className="text-2xl font-headline font-extrabold text-amber-600">{finalTopThree[0].points}</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase ml-1">pts</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 3rd Place */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="order-3 flex flex-col items-center"
                  >
                    <div className="relative mb-3 flex flex-col items-center group">
                      <div className="w-20 h-20 rounded-full border-4 border-amber-600 bg-white shadow-lg flex items-center justify-center text-4xl group-hover:scale-105 transition-all">
                        {finalTopThree[2].avatar}
                      </div>
                      <div className="absolute -top-6 bg-amber-600 text-amber-50 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-white">
                        <Medal size={10} /> 3rd Place
                      </div>
                    </div>
                    <Card className="w-full shadow-md border-slate-200 bg-white/70 backdrop-blur-sm group hover:border-amber-600/30 transition-all text-center">
                      <CardContent className="p-6 flex flex-col items-center">
                        <p className="font-bold text-slate-800 text-base">{finalTopThree[2].name}</p>
                        <Badge variant="secondary" className="mt-1 text-[9px] bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">{finalTopThree[2].badge}</Badge>
                        <div className="mt-4 bg-slate-100/60 rounded-xl px-4 py-2 border border-slate-200/50 w-full">
                          <span className="text-xl font-headline font-extrabold text-slate-700">{finalTopThree[2].points}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">pts</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>

            {/* RANKINGS TABLE SECTION */}
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-headline font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-slate-400 h-5 w-5" /> City Leaderboard Rankings
                </h2>
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  Updated Live <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                </div>
              </div>

              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="divide-y divide-slate-100">
                  {finalSecondaryList.map((player) => (
                    <div 
                      key={player.rank}
                      className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all ${
                        player.isCurrentUser ? 'bg-cyan-50/40 border-y border-cyan-100/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Number */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          player.isCurrentUser 
                            ? 'bg-cyan-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {player.rank}
                        </div>
                        {/* Avatar & Name */}
                        <div className="text-2xl mr-1">{player.avatar}</div>
                        <div>
                          <div className={`text-sm font-bold flex items-center gap-1.5 ${
                            player.isCurrentUser ? 'text-cyan-800' : 'text-slate-800'
                          }`}>
                            {player.name}
                            {player.isCurrentUser && (
                              <Badge variant="default" className="text-[8px] px-1.5 py-0 bg-cyan-600 font-bold uppercase hover:bg-cyan-700">You</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{player.badge}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Points */}
                        <div className="text-right">
                          <span className={`text-base font-headline font-extrabold ${
                            player.isCurrentUser ? 'text-cyan-600' : 'text-slate-700'
                          }`}>{player.points}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase ml-0.5">pts</span>
                        </div>
                        {/* Trend Icon */}
                        <div className="text-emerald-500 flex items-center gap-0.5 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <ChevronUp size={12} /> Live
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
