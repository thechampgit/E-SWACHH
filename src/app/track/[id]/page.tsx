"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  AlertTriangle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusMap: Record<string, { color: string, progress: number, icon: any }> = {
  "Pending": { color: "bg-slate-500", progress: 20, icon: Clock },
  "In Review": { color: "bg-blue-500", progress: 40, icon: Search },
  "Assigned": { color: "bg-purple-500", progress: 60, icon: User },
  "In Progress": { color: "bg-orange-500", progress: 80, icon: Activity },
  "Resolved": { color: "bg-green-500", progress: 100, icon: CheckCircle2 },
};

import { Search } from 'lucide-react';

export default function TrackPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "complaints", id as string), (doc) => {
      if (doc.exists()) {
        setComplaint({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Complaint Not Found</h1>
        <p className="text-muted-foreground">The report ID you provided doesn't exist or has been removed.</p>
        <Button onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    );
  }

  const currentStatus = statusMap[complaint.status || "Pending"];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" className="mb-8" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-lg overflow-hidden">
              <div className={`h-2 ${currentStatus.color}`} />
              <CardHeader className="bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs uppercase tracking-wider mb-2">ID: {complaint.id}</Badge>
                    <CardTitle className="text-3xl font-headline font-bold">{complaint.title}</CardTitle>
                  </div>
                  <Badge className={`${currentStatus.color} text-white px-4 py-1 text-sm rounded-full`}>
                    <StatusIcon className="mr-2 h-4 w-4" />
                    {complaint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="bg-white p-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <Progress value={currentStatus.progress} className="h-2 flex-1" />
                    <span className="text-sm">{currentStatus.progress}%</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {Object.keys(statusMap).map((status) => {
                      const isActive = complaint.status === status;
                      const isCompleted = currentStatus.progress >= statusMap[status].progress;
                      return (
                        <div key={status} className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : ''}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-tighter text-center ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Category
                    </p>
                    <p className="font-medium">{complaint.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Submitted On
                    </p>
                    <p className="font-medium">
                      {complaint.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </p>
                    <p className="font-medium">{complaint.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Priority
                    </p>
                    <Badge variant={complaint.priority === 'High' ? 'destructive' : 'secondary'}>
                      {complaint.priority}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-6 border-t">
                  <h4 className="font-bold text-slate-900">Description</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                    "{complaint.description}"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg">Update Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  <TimelineItem 
                    title="Complaint Resolved" 
                    date="Pending" 
                    description="Our team will verify the resolution once the maintenance work is finished."
                    isActive={complaint.status === 'Resolved'}
                    isPending={complaint.status !== 'Resolved'}
                  />
                  <TimelineItem 
                    title="Maintenance In Progress" 
                    date={complaint.status === 'In Progress' ? 'Current State' : ''} 
                    description="Contractors have been dispatched to the site to address the issue."
                    isActive={complaint.status === 'In Progress'}
                    isPending={!['In Progress', 'Resolved'].includes(complaint.status)}
                  />
                  <TimelineItem 
                    title="Officer Assigned" 
                    date={complaint.status === 'Assigned' ? 'Current State' : ''} 
                    description="Your report has been assigned to the Department of Works for action."
                    isActive={complaint.status === 'Assigned'}
                    isPending={!['Assigned', 'In Progress', 'Resolved'].includes(complaint.status)}
                  />
                  <TimelineItem 
                    title="Report Submitted" 
                    date={complaint.createdAt?.toDate().toLocaleDateString() || 'Just now'} 
                    description="We have successfully received your report and added it to our review queue."
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
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={complaint.imageUrl} 
                      alt="Complaint Evidence" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 rounded-lg bg-slate-50 flex items-center justify-center border-2 border-dashed">
                    <p className="text-muted-foreground text-sm italic">No photo provided</p>
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

function TimelineItem({ title, date, description, isActive, isPending }: any) {
  return (
    <div className={`relative ${isPending ? 'opacity-40' : 'opacity-100'}`}>
      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isActive ? 'bg-primary ring-4 ring-primary/20' : isPending ? 'bg-slate-200' : 'bg-green-500'}`} />
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h5 className="font-bold text-slate-900">{title}</h5>
          {date && <span className="text-[10px] uppercase font-bold text-muted-foreground">{date}</span>}
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}