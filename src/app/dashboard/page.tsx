'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { useLogoutConfirm } from '@/context/LogoutConfirmContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Activity,
  MapPin,
  LogOut,
  Bell,
  Clock,
  User,
  Trophy,
  Gift,
  LayoutDashboard,
  ThumbsUp,
  Flame
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { motion } from 'framer-motion';
import { usePreferences } from '@/context/PreferencesContext';

export default function DashboardPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { t } = usePreferences();

  const [dashboardTab, setDashboardTab] = useState<'my-reports' | 'community-watch'>('my-reports');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'community-watch') {
        setDashboardTab('community-watch');
      }
    }
  }, []);

  const myComplaintsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "complaints"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"), 
      limit(10)
    );
  }, [db, user?.uid]);

  const communityComplaintsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "complaints"), 
      orderBy("createdAt", "desc"), 
      limit(50)
    );
  }, [db]);

  const { data: myComplaints, loading: loadingMy } = useCollection(myComplaintsQuery);
  const { data: allComplaints, loading: loadingCommunity } = useCollection(communityComplaintsQuery);

  const stats = useMemo(() => {
    if (!myComplaints) return { total: 0, resolved: 0, pending: 0 };
    return {
      total: myComplaints.length,
      resolved: myComplaints.filter(c => c.status === "Resolved").length,
      pending: myComplaints.filter(c => c.status === "Pending").length,
    };
  }, [myComplaints]);

  const communityComplaints = useMemo(() => {
    if (!allComplaints || !user) return [];
    return allComplaints.filter((c: any) => c.userId !== user.uid);
  }, [allComplaints, user?.uid]);

  const handleUpvote = async (complaintId: string, currentUpvotes: string[] = []) => {
    if (!db || !user) return;
    const isUpvoted = currentUpvotes.includes(user.uid);
    const docRef = doc(db, "complaints", complaintId);
    try {
      if (isUpvoted) {
        await updateDoc(docRef, {
          upvotes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(docRef, {
          upvotes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error upvoting: ", error);
    }
  };

  const { confirmLogout } = useLogoutConfirm();

  const handleLogout = async () => {
    confirmLogout(async () => {
      if (!auth) return;
      await signOut(auth);
      router.push('/');
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-350 bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/portal_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <header className="fixed top-0 z-[100] w-full border-b dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">E-Swachh</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/profile" title={t.profile || "Profile"}>
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:text-destructive hover:bg-destructive/10" title={t.logout || "Logout"}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 pt-24 pb-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-headline font-bold text-slate-900">
              {t.welcome || 'Welcome'}, {user?.displayName?.split(' ')[0] || 'Citizen'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.dashboardSubtitle}</p>
          </div>
          <Button asChild>
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> {t.newReport}
            </Link>
          </Button>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <Link 
              href="/dashboard" 
              className="border-b-2 border-cyan-600 pb-3 text-sm font-bold text-cyan-600 flex items-center gap-2 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" /> {t.myDashboard}
            </Link>
            <Link 
              href="/dashboard/leaderboard" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <Trophy className="h-4 w-4" /> {t.swachhWarriors}
            </Link>
            <Link 
              href="/dashboard/rewards" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <Gift className="h-4 w-4" /> {t.ecoRewards}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t.totalReports} value={stats.total} icon={<Activity className="text-blue-500" />} />
          <StatCard label={t.resolved} value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard label={t.pointsEarned} value={stats.total * 10} icon={<Trophy className="text-amber-500 animate-pulse" />} href="/dashboard/rewards" />
          <StatCard label={t.inProgress} value={stats.total - stats.resolved} icon={<Clock className="text-slate-500" />} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
            <div className="flex gap-4 md:gap-8">
              <button 
                onClick={() => setDashboardTab('my-reports')}
                className={`pb-2 text-base md:text-lg font-headline font-bold transition-all relative ${
                  dashboardTab === 'my-reports' 
                    ? 'text-slate-900 dark:text-slate-100 border-b-2 border-primary' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                {t.myReports || 'My Reports'}
              </button>
              <button 
                onClick={() => setDashboardTab('community-watch')}
                className={`pb-2 text-base md:text-lg font-headline font-bold transition-all relative flex items-center gap-2 ${
                  dashboardTab === 'community-watch' 
                    ? 'text-slate-900 dark:text-slate-100 border-b-2 border-primary' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                {t.communityWatch || 'Community Watch'}
                <Badge className="bg-cyan-500 dark:bg-cyan-600 text-white text-[9px] px-1.5 py-0 border-none font-bold uppercase tracking-wider">Feed</Badge>
              </button>
            </div>
            {dashboardTab === 'my-reports' && (
              <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
                <Link href="/my-reports">{t.viewAll || 'View All'} <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            )}
          </div>

          {dashboardTab === 'my-reports' ? (
            loadingMy ? (
              <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-800">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : myComplaints?.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-800" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.noReports}</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">{t.noReportsDesc}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/report">{t.createFirstReport}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myComplaints.map((c: any) => (
                  <ComplaintCard key={c.id} complaint={c} onUpvote={handleUpvote} currentUserId={user?.uid} />
                ))}
              </div>
            )
          ) : (
            loadingCommunity ? (
              <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-800">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : communityComplaints?.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-800" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.neighborIssues || 'No Neighbor Issues'}</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">There are no reports submitted by neighbors in your area yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityComplaints.map((c: any) => (
                  <ComplaintCard key={c.id} complaint={c} onUpvote={handleUpvote} currentUserId={user?.uid} isCommunityFeed />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, href }: any) {
  const cardContent = (
    <Card className={`shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full ${href ? "hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer group/stat" : ""}`}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg group-hover/stat:bg-amber-50 transition-colors">{icon}</div>
        <div>
          <p className="text-2xl font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
            {value}
            {href && <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover/stat:text-amber-500 group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5 transition-all" />}
          </p>
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  return cardContent;
}

function ComplaintCard({ complaint, onUpvote, currentUserId, isCommunityFeed }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/35 dark:text-blue-400 dark:border-blue-900",
    "Resolved": "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-400 dark:border-emerald-900",
  };
  const locationAddress = typeof complaint.location === 'string'
    ? complaint.location
    : complaint.location?.address || 'Location provided';

  const upvotes = complaint.upvotes || [];
  const upvoteCount = upvotes.length;
  const isTrending = upvoteCount >= 5;
  const hasUpvoted = currentUserId ? upvotes.includes(currentUserId) : false;

  return (
    <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between">
      <div>
        {complaint.imageUrl && (
          <div className="h-40 w-full overflow-hidden border-b dark:border-slate-800">
            <img src={complaint.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-bold uppercase">{complaint.category}</Badge>
              {isTrending ? (
                <Badge className="text-[9px] font-extrabold uppercase bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-none flex items-center gap-0.5 animate-pulse shadow-sm shadow-orange-500/20">
                  <Flame size={10} className="fill-current" /> Trending
                </Badge>
              ) : complaint.priority && complaint.priority !== 'Medium' && (
                <Badge variant={complaint.priority === 'High' || complaint.priority === 'Critical' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold">
                  {complaint.priority}
                </Badge>
              )}
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColors[complaint.status || "Pending"]}`}>
              {complaint.status || "Pending"}
            </div>
          </div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{complaint.title}</CardTitle>
        </CardHeader>
      </div>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={12} className="text-slate-400 dark:text-slate-500" /> {locationAddress}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 h-9 text-xs" variant="secondary" asChild>
            <Link href={`/track/${complaint.id}`}>View Details</Link>
          </Button>
          {onUpvote && (
            <Button 
              onClick={(e) => {
                e.preventDefault();
                onUpvote(complaint.id, upvotes);
              }}
              variant={hasUpvoted ? "default" : "outline"}
              className={`h-9 px-3 text-xs flex items-center gap-1.5 transition-all ${
                hasUpvoted 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-none shadow-sm' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              title={hasUpvoted ? "Remove Support" : "Support Issue"}
            >
              <ThumbsUp size={14} className={hasUpvoted ? "fill-white text-white" : "text-slate-400 dark:text-slate-500"} />
              <span className="font-bold">{upvoteCount}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

