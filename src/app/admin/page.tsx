"use client"

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search as SearchIcon,
  Download,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", id), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast({
        title: "Status Updated",
        description: `The report is now marked as ${newStatus}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      toast({
        title: "Report Deleted",
        description: "The report has been removed from the system."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive"
      });
    }
  };

  const filteredComplaints = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    active: complaints.filter(c => !["Pending", "Resolved"].includes(c.status)).length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar would go here in a real app */}
      <div className="p-8 space-y-8 container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-slate-900">Admin Console</h1>
            <p className="text-muted-foreground">Manage and resolve community civic issues.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
            <Button><Filter className="mr-2 h-4 w-4" /> Filters</Button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <AdminStatCard label="Total Reports" value={stats.total} />
          <AdminStatCard label="Pending Review" value={stats.pending} color="text-orange-600" />
          <AdminStatCard label="Active Maintenance" value={stats.active} color="text-blue-600" />
          <AdminStatCard label="Resolved Issues" value={stats.resolved} color="text-green-600" />
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>All Complaints</CardTitle>
              <CardDescription>View and manage all citizen reports submitted.</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, title, or category..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading reports...</TableCell>
                  </TableRow>
                ) : filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No reports found.</TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id.substring(0, 8)}</TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell>
                        <Badge variant={c.priority === 'High' ? 'destructive' : c.priority === 'Medium' ? 'default' : 'secondary'}>
                          {c.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(c.status)}`}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => window.location.href=`/track/${c.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">Update Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(c.id, "In Review")}>Mark: In Review</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(c.id, "Assigned")}>Mark: Assigned</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(c.id, "In Progress")}>Mark: In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(c.id, "Resolved")}>Mark: Resolved</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Report
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
    </div>
  );
}

function AdminStatCard({ label, value, color = "text-slate-900" }: any) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-4xl font-headline font-bold mt-2 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-700';
    case 'In Review': return 'bg-blue-100 text-blue-700';
    case 'Assigned': return 'bg-purple-100 text-purple-700';
    case 'In Progress': return 'bg-orange-100 text-orange-700';
    case 'Resolved': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}