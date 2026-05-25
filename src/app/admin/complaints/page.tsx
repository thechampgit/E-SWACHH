
"use client"

import { useMemo, useState } from 'react';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Flag,
  Calendar,
  Building2
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
import { formatDistanceToNow } from 'date-fns';

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

      await addDoc(collection(db, "notifications"), {
        userId: complaint.userId,
        title: `Update: ${complaint.title}`,
        message: `Your report has been updated to "${newStatus}". Our department is prioritizing this resolution.`,
        type: newStatus === "Resolved" ? "resolved" : "info",
        complaintId: complaint.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Status Updated",
        description: `Status changed to ${newStatus}. Citizen notified.`
      });
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleAssignDepartment = async (complaintId: string, department: string) => {
    await updateDoc(doc(db, "complaints", complaintId), {
      department,
      updatedAt: serverTimestamp()
    });
    toast({ title: "Department Assigned", description: `Assigned to ${department}` });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-slate-900">Governance Portal</h1>
          <p className="text-muted-foreground">Managing civic accountability and department workflows.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4 bg-slate-50/50 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by ID or title..." 
                className="pl-9 h-10 bg-white" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {["All", "Pending", "In Progress", "Resolved"].map((status) => (
                <Button 
                  key={status} 
                  variant={statusFilter === status ? "default" : "outline"} 
                  size="sm"
                  className="h-8 rounded-full text-[10px] font-bold uppercase tracking-tight"
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
                <TableHead>Issue / Citizen</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>SLA Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" /></TableRow>
                ))
              ) : filteredComplaints.map((c: any) => (
                <TableRow key={c.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 line-clamp-1">{c.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">By {c.userName} • {c.createdAt?.toDate() ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true }) : 'Recent'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold flex items-center gap-1 w-fit">
                      <Building2 size={10} /> {c.department || "Unassigned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", getPriorityColor(c.priority))}>{c.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.slaDeadline && (
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", isOverdue(c.slaDeadline) ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                        <span className="text-[10px] font-bold text-slate-500">
                          {isOverdue(c.slaDeadline) ? "OVERDUE" : "ON TRACK"}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", getStatusColor(c.status))}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">Department</DropdownMenuLabel>
                        {["Roads", "Electricity", "Sanitation", "Water", "Emergency"].map(dept => (
                          <DropdownMenuItem key={dept} onClick={() => handleAssignDepartment(c.id, dept)}>
                            Assign to {dept}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">Moderation</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/track/${c.id}`} className="flex items-center gap-2"><Eye size={14} /> View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateStatus(c, "In Progress")}>Mark In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Resolved")} className="text-emerald-600 font-bold">Mark Resolved</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function isOverdue(deadline: any) {
  if (!deadline) return false;
  const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
  return d < new Date();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-600';
    case 'In Review': return 'bg-blue-100 text-blue-600';
    case 'In Progress': return 'bg-orange-100 text-orange-600';
    case 'Resolved': return 'bg-green-100 text-green-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Critical': return 'bg-red-500 text-white';
    case 'High': return 'bg-red-50 text-red-600 border-red-100';
    case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100';
    default: return 'bg-slate-50 text-slate-600';
  }
}
