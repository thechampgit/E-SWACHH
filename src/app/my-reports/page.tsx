
"use client"

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  MapPin, 
  Search as SearchIcon,
  LayoutDashboard,
  Filter,
  ArrowLeft,
  Calendar,
  MoreVertical,
  Eye,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function MyReportsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const reportsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "complaints"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: reports, loading } = useCollection(reportsQuery);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <Link href="/dashboard" className="text-primary hover:underline text-sm flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-headline font-bold text-slate-900">My Reports</h1>
            <p className="text-muted-foreground">Manage and track all civic issues you've submitted.</p>
          </div>
          <Button asChild>
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> New Report
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search reports by title or category..." 
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusFilter === "All" ? "default" : "outline"} className="cursor-pointer px-3 py-1" onClick={() => setStatusFilter("All")}>All</Badge>
                <Badge variant={statusFilter === "Pending" ? "default" : "outline"} className="cursor-pointer px-3 py-1" onClick={() => setStatusFilter("Pending")}>Pending</Badge>
                <Badge variant={statusFilter === "In Progress" ? "default" : "outline"} className="cursor-pointer px-3 py-1" onClick={() => setStatusFilter("In Progress")}>Active</Badge>
                <Badge variant={statusFilter === "Resolved" ? "default" : "outline"} className="cursor-pointer px-3 py-1" onClick={() => setStatusFilter("Resolved")}>Resolved</Badge>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Clock className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="border-2 border-dashed p-20 text-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <SearchIcon className="h-12 w-12 text-slate-300" />
                <h3 className="text-xl font-bold">No reports found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}>
                  Clear All Filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report: any) => (
                <ReportListItem key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportListItem({ report }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-700",
    "In Review": "bg-blue-100 text-blue-700",
    "Assigned": "bg-purple-100 text-purple-700",
    "In Progress": "bg-orange-100 text-orange-700",
    "Resolved": "bg-green-100 text-green-700",
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white group">
      <CardContent className="p-0 flex items-stretch">
        <div className="hidden sm:block w-32 md:w-48 overflow-hidden relative border-r">
          {report.imageUrl ? (
            <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <Camera className="text-slate-200" size={32} />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] font-bold opacity-90">{report.category}</Badge>
          </div>
        </div>
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] uppercase font-bold px-2 ${statusColors[report.status || "Pending"]}`}>
                {report.status || "Pending"}
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">ID: {report.id.substring(0, 8)}</Badge>
            </div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Calendar size={12} /> {report.createdAt?.toDate().toLocaleDateString()}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{report.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-1 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {report.location}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge variant={report.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
              {report.priority} Priority
            </Badge>
            <Button size="sm" variant="ghost" className="text-primary font-bold text-xs" asChild>
              <Link href={`/track/${report.id}`}>
                View Progress <Eye className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Camera } from 'lucide-react';
