
"use client"

import { useMemo, useState } from 'react';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/NotificationCenter';

export default function AdminComplaintsPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const complaintsQuery = useMemo(() => query(collection(db, "complaints"), orderBy("createdAt", "desc")), [db]);
  const { data: complaints, loading } = useCollection(complaintsQuery);

  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchTerm, statusFilter]);

  const handleUpdateStatus = async (complaint: any, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaint.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        resolvedAt: newStatus === "Resolved" ? serverTimestamp() : null,
        updatedBy: adminUser?.uid
      });

      // Create Notification for the Citizen
      await addDoc(collection(db, "notifications"), {
        userId: complaint.userId,
        title: `Update: ${complaint.title}`,
        message: `Your report has been updated to "${newStatus}". Our maintenance team is actively working on it.`,
        type: newStatus === "Resolved" ? "resolved" : "info",
        complaintId: complaint.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Status Updated",
        description: `Complaint status changed to ${newStatus}. Citizen has been notified.`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the complaint status.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-slate-900">Manage Reports</h1>
          <p className="text-muted-foreground">Monitor and update the status of community issues.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by ID or title..." 
                className="pl-9 h-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {["All", "Pending", "In Review", "In Progress", "Resolved"].map((status) => (
                <Button 
                  key={status} 
                  variant={statusFilter === status ? "default" : "outline"} 
                  size="sm"
                  className="h-8 rounded-full text-[11px] font-bold uppercase tracking-tight"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[120px]">Reference</TableHead>
                <TableHead>Citizen / Issue</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                  </TableRow>
                ))
              ) : filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={40} strokeWidth={1} />
                      <p className="font-medium">No complaints found matching filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((c: any) => (
                  <TableRow key={c.id} className="group transition-colors">
                    <TableCell className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                      {c.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">{c.title}</span>
                        <span className="text-xs text-slate-500">{c.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">{c.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", getPriorityColor(c.priority))}>{c.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", getStatusColor(c.status))}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-xs uppercase font-bold text-slate-400">Moderation</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/track/${c.id}`} className="flex items-center gap-2">
                              <Eye size={14} /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs uppercase font-bold text-slate-400">Update Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(c, "In Review")}>
                            <Clock size={14} className="mr-2" /> Mark In Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(c, "In Progress")}>
                            <AlertTriangle size={14} className="mr-2" /> Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Resolved")}>
                            <CheckCircle size={14} className="mr-2 text-emerald-500" /> Mark Resolved
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-600';
    case 'In Review': return 'bg-blue-100 text-blue-600';
    case 'Assigned': return 'bg-purple-100 text-purple-600';
    case 'In Progress': return 'bg-orange-100 text-orange-600';
    case 'Resolved': return 'bg-green-100 text-green-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'High': return 'bg-red-50 text-red-600 border-red-100';
    case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100';
    default: return 'bg-slate-50 text-slate-600';
  }
}
