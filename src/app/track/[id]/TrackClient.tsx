
"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Tag, 
  Activity,
  User,
  AlertTriangle,
  Camera,
  Search as SearchIcon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusMap: Record<string, { color: string, progress: number, icon: any }> = {
  "Pending": { color: "bg-slate-500", progress: 20, icon: Clock },
  "In Review": { color: "bg-blue-500", progress: 40, icon: SearchIcon },
  "Assigned": { color: "bg-purple-500", progress: 60, icon: User },
  "In Progress": { color: "bg-orange-500", progress: 80, icon: Activity },
  "Resolved": { color: "bg-green-500", progress: 100, icon: CheckCircle2 },
};

export default function TrackPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !db) return;

    const unsub = onSnapshot(doc(db, "complaints", id as string), (doc) => {
      if (doc.exists()) {
        setComplaint({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id, db]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Clock className="animate-spin h-10 w-10 text-primary" />
          <p className="text-slate-500 font-medium">Retrieving report details...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Report Not Found</h1>
        <p className="text-muted-foreground max-w-sm">The report ID you provided doesn't exist or you may not have permission to view it.</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const currentStatus = statusMap[complaint.status || "Pending"];
  const StatusIcon = currentStatus.icon;
  const locationAddress = typeof complaint.location === 'string'
    ? complaint.location
    : complaint.location?.address || 'Location provided';

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">REF: {complaint.id.substring(0, 8)}</Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-lg overflow-hidden bg-white">
              <div className={`h-2 ${currentStatus.color}`} />
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-headline font-bold">{complaint.title}</CardTitle>
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <MapPin size={14} /> {locationAddress}
                    </p>
                  </div>
                  <Badge className={`${currentStatus.color} text-white px-4 py-2 text-sm rounded-full font-bold shadow-sm`}>
                    <StatusIcon className="mr-2 h-4 w-4" />
                    {complaint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Progress</span>
                    <span className="text-sm font-bold text-primary">{currentStatus.progress}%</span>
                  </div>
                  <Progress value={currentStatus.progress} className="h-3" />
                  
                  <div className="grid grid-cols-5 gap-1 pt-2">
                    {Object.entries(statusMap).map(([status, config]) => {
                      const isActive = complaint.status === status;
                      const isCompleted = currentStatus.progress >= config.progress;
                      return (
                        <div key={status} className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                          </div>
                          <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tighter text-center leading-tight ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <InfoItem label="Category" value={complaint.category} icon={<Tag size={12} />} />
                  <InfoItem label="Priority" value={complaint.priority} icon={<AlertTriangle size={12} />} isBadge priority={complaint.priority} />
                  <InfoItem label="Submitted" value={complaint.createdAt?.toDate().toLocaleDateString() || 'Recently'} icon={<Calendar size={12} />} />
                  <InfoItem label="Reporter" value={complaint.userName || 'Citizen'} icon={<User size={12} />} />
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Report Description</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-100 italic text-sm">
                    "{complaint.description}"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg">Track History</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  <HistoryItem 
                    title="Expected Resolution" 
                    description="Our maintenance team will mark this as resolved once the site work is verified."
                    isActive={complaint.status === 'Resolved'}
                    isPending={complaint.status !== 'Resolved'}
                  />
                  <HistoryItem 
                    title="Active Work" 
                    description="Field agents are currently at the location or have scheduled the fix."
                    isActive={complaint.status === 'In Progress'}
                    isPending={!['In Progress', 'Resolved'].includes(complaint.status)}
                  />
                  <HistoryItem 
                    title="Processing Report" 
                    description="The department is reviewing the details and assigning a technician."
                    isActive={['In Review', 'Assigned'].includes(complaint.status)}
                    isPending={!['In Review', 'Assigned', 'In Progress', 'Resolved'].includes(complaint.status)}
                  />
                  <HistoryItem 
                    title="Report Received" 
                    date={complaint.createdAt?.toDate().toLocaleDateString()} 
                    description="We have logged your report in our system and it is pending initial review."
                    isActive={true}
                    isPending={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-md overflow-hidden bg-white sticky top-24">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Evidence Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {complaint.imageUrl ? (
                  <div className="rounded-lg overflow-hidden border bg-slate-100">
                    <img 
                      src={complaint.imageUrl} 
                      alt="Complaint Evidence" 
                      className="w-full h-auto object-cover max-h-[400px]"
                    />
                  </div>
                ) : (
                  <div className="h-48 rounded-lg bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed gap-2">
                    <Camera className="text-slate-300" size={32} />
                    <p className="text-slate-400 text-xs italic font-medium">No photo provided</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon, isBadge, priority }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
        {icon} {label}
      </p>
      {isBadge ? (
        <Badge variant={priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary'} className="text-[10px] px-2">
          {value}
        </Badge>
      ) : (
        <p className="font-bold text-slate-800 text-sm">{value}</p>
      )}
    </div>
  );
}

function HistoryItem({ title, date, description, isActive, isPending }: any) {
  return (
    <div className={`relative ${isPending ? 'opacity-30' : 'opacity-100'}`}>
      <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${isActive ? 'bg-primary ring-4 ring-primary/20 scale-110' : isPending ? 'bg-slate-200' : 'bg-green-500'}`} />
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h5 className="font-bold text-slate-900 text-sm">{title}</h5>
          {date && <span className="text-[9px] font-bold text-slate-400">{date}</span>}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
