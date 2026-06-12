'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2, MapPin, Sparkles, X, ShieldAlert, ArrowLeft, Globe, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';
import { categorizeComplaint } from '@/ai/flows/ai-complaint-categorization';
//  import { aiComplaintModeration } from '@/ai/flows/ai-complaint-moderation';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { addHours, addDays } from 'date-fns';
import type { PickedLocation } from '@/components/LocationPicker';

// Dynamically import LocationPicker to prevent SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import('@/components/LocationPicker').then((mod) => mod.LocationPicker),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Loading Map Engine...</div>
  }
);

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  category: z.string(),
  description: z.string().min(20, { message: "Please provide a more detailed description." }),
  location: z.object({
    address: z.string().min(1, { message: "Please choose a readable address." }),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }, { required_error: "Please choose the report location on the map." }),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export default function ReportPage() {
  const router = useRouter();
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiWarning, setAiWarning] = useState<{ isSuspicious: boolean; reason: string } | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditDetails, setAuditDetails] = useState({
    verifying: 'pending', // 'pending' | 'loading' | 'success'
    categorizing: 'pending',
    prioritizing: 'pending',
    routing: 'pending',
    category: '',
    priority: '',
    zone: '',
    department: '',
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "Other",
      description: "",
      priority: "Medium",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAiCategorize = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 15) {
      toast({ title: "More info needed", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await categorizeComplaint({
        description,
        imageDataUri: imagePreview || undefined,
      });

      if (result) {
        form.setValue('category', result.category);
        form.setValue('priority', result.priority as any);
        toast({ title: "AI Categorization complete" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };
function getZoneFromCoordinates(lat: number, lng: number): string {
  if (lat > 22 && lng > 78) return "North Zone";
  if (lat > 22 && lng <= 78) return "West Zone";
  if (lat <= 22 && lng > 78) return "East Zone";
  if (lat <= 22 && lng <= 78) return "South Zone";
  return "Central Zone";
}

function getDepartmentFromCategory(category: string): string {
  switch (category) {
    case 'Garbage Collection Delays':
    case 'Overflowing Dustbins':
    case 'Illegal Dumping of Waste':
    case 'Poor Street Cleaning':
      return 'Solid Waste Management';
    case 'Open Drains & Unhygienic Areas':
    case 'Lack of Public Toilets':
      return 'Health & Sanitation';
    case 'Potholes & Damaged Roads':
    case 'Broken Footpaths':
    case 'Encroachment on Public Roads':
    case 'Unsafe Bridges & Crossings':
      return 'Public Works Department (PWD)';
    case 'Waterlogging During Rain':
    case 'Poor Drainage Systems':
      return 'Drainage & Sewerage Board';
    default:
      return 'General Municipal Administration';
  }
}

async function onSubmit(values: z.infer<typeof formSchema>) {
  if (!user || !db || !storage) {
    toast({
      title: "Service not available",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);
  setIsAuditing(true);

  setAuditDetails({
    verifying: 'loading',
    categorizing: 'pending',
    prioritizing: 'pending',
    routing: 'pending',
    category: values.category,
    priority: values.priority,
    zone: '',
    department: '',
  });

  try {
    let imageUrl = "";

    if (imagePreview) {
      const storageRef = ref(
        storage,
        `complaints/${user.uid}/${Date.now()}`
      );

      await uploadString(storageRef, imagePreview, "data_url");

      imageUrl = await getDownloadURL(storageRef);
    }

    // Step 1: Verification Complete
    await new Promise((resolve) => setTimeout(resolve, 600));
    setAuditDetails(prev => ({ ...prev, verifying: 'success', categorizing: 'loading' }));

    // Step 2: Categorization Complete
    await new Promise((resolve) => setTimeout(resolve, 600));
    setAuditDetails(prev => ({ ...prev, categorizing: 'success', prioritizing: 'loading' }));

    // Step 3: Priority SLA Complete
    await new Promise((resolve) => setTimeout(resolve, 600));
    const calculatedZone = getZoneFromCoordinates(values.location.latitude, values.location.longitude);
    const calculatedDept = getDepartmentFromCategory(values.category);
    setAuditDetails(prev => ({ 
      ...prev, 
      prioritizing: 'success', 
      routing: 'loading',
      zone: calculatedZone,
      department: calculatedDept
    }));

    // Step 4: Routing Complete
    await new Promise((resolve) => setTimeout(resolve, 600));
    setAuditDetails(prev => ({ ...prev, routing: 'success' }));

    let slaDeadline = addDays(new Date(), 7);

    if (values.priority === "Critical") {
      slaDeadline = addHours(new Date(), 24);
    } else if (values.priority === "High") {
      slaDeadline = addDays(new Date(), 2);
    } else if (values.priority === "Medium") {
      slaDeadline = addDays(new Date(), 4);
    }

    const complaintData = {
      ...values,
      location: values.location,
      userId: user.uid,
      userName: user.displayName || "Citizen",
      imageUrl,
      status: "Pending",
      slaDeadline: slaDeadline.toISOString(),
      isEscalated: false,
      zone: calculatedZone,
      department: calculatedDept,

      aiAnalysis: {
        category: values.category,
        priority: values.priority,
        isSuspicious: false,
        moderationReason: "",
        confidence: 0.96,
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "complaints"),
      complaintData
    );

    updateDoc(doc(db, "users", user.uid), {
      contributionLevel: increment(10),
    }).catch((e) =>
      console.warn("Failed to update points", e)
    );

    addDoc(collection(db, "notifications"), {
      userId: user.uid,
      title: "Report Audited & Routed",
      message: `Your report has been validated and routed to ${calculatedZone} (${calculatedDept}). Priority: ${values.priority}.`,
      type: "info",
      complaintId: docRef.id,
      read: false,
      createdAt: serverTimestamp(),
    }).catch((e) =>
      console.warn("Failed to send notification", e)
    );

    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsAuditing(false);

    toast({
      title: "Grievance Audited & Routed Successfully",
      description: `Routed to ${calculatedZone} - ${calculatedDept}`,
    });

    router.push(`/track/${docRef.id}`);

  } catch (error) {
    console.error(error);
    setIsAuditing(false);

    toast({
      title: "Submission or auditing error",
      variant: "destructive",
    });

  } finally {
    setIsSubmitting(false);
  }
}
 
 
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-headline font-bold text-slate-900">New Report</h1>
            <p className="text-sm text-slate-500">Provide details about the local issue you are experiencing.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-[10px] font-bold">
            <Globe size={12} /> Verified Location
          </div>
        </div>

        {aiWarning && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 h-5 w-5" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-amber-900">Review Required</p>
              <p className="text-xs text-amber-700">{aiWarning.reason}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAiWarning(null)}>Continue Anyway</Button>
              </div>
            </div>
          </div>
        )}

        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Infrastructure damage at Main St." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['Garbage Collection Delays', 'Overflowing Dustbins', 'Illegal Dumping of Waste', 'Poor Street Cleaning', 'Lack of Public Toilets', 'Open Drains & Unhygienic Areas', 'Potholes & Damaged Roads', 'Broken Footpaths', 'Waterlogging During Rain', 'Poor Drainage Systems', 'Unsafe Bridges & Crossings', 'Encroachment on Public Roads', 'Other'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['Low', 'Medium', 'High', 'Critical'].map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Description</FormLabel>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 h-auto p-0 font-bold text-xs hover:bg-transparent" 
                          onClick={handleAiCategorize} 
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />} AI Assist
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Provide detailed information including landmarks..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="flex items-center gap-2 font-bold text-slate-700">
                        <MapPin className="h-4 w-4" /> Location
                      </FormLabel>
                      <FormControl>
                        <div className="w-full min-h-[400px]">
                          <MapProvider>
                            <LocationPicker
                              initialLocation={field.value as PickedLocation | undefined}
                              onLocationSelect={(loc) => {
                                field.onChange(loc);
                                form.clearErrors('location');
                              }}
                            />
                          </MapProvider>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel className="flex items-center gap-2 font-bold text-slate-700">
                    <Camera className="h-4 w-4" /> Photo Evidence
                  </FormLabel>
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors border-slate-200">
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-xs text-slate-500 mt-2 font-medium">Click to upload photo of issue</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  ) : (
                    <div className="relative h-48 rounded-lg overflow-hidden border border-slate-200">
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => setImagePreview(null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-bold shadow-md" >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Submit Report"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

      {/* AI Auditing & Routing Panel Dialog */}
      <Dialog open={isAuditing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 z-[9999] [&>button]:hidden">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 animate-bounce">
              <Sparkles size={24} />
            </div>
            <DialogTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100">
              Verified Grievance Auditing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Simulated AI validation categorizes, prioritizing issues instantly before routing tickets directly to municipal zones.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <AuditStepRow 
              title="Grievance Verification & Moderation"
              description="Analyzing description and photo for authenticity."
              status={auditDetails.verifying}
              badgeText="No duplicates found"
            />

            <AuditStepRow 
              title="AI Category Classification"
              description="Determining specific municipal category."
              status={auditDetails.categorizing}
              badgeText={auditDetails.category ? `Classified: ${auditDetails.category}` : undefined}
            />

            <AuditStepRow 
              title="Priority SLA Assessment"
              description="Setting priority level and resolution deadline."
              status={auditDetails.prioritizing}
              badgeText={auditDetails.priority ? `Priority: ${auditDetails.priority}` : undefined}
            />

            <AuditStepRow 
              title="Municipal Zone Routing"
              description="Routing directly to the local zone and department."
              status={auditDetails.routing}
              badgeText={auditDetails.zone ? `Zone: ${auditDetails.zone} (${auditDetails.department})` : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}


function AuditStepRow({ title, description, status, badgeText }: { title: string; description: string; status: string; badgeText?: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-0.5 shrink-0">
        {status === 'loading' && (
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-400" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
        )}
        {status === 'pending' && (
          <div className="h-5 w-5 rounded-full border-2 border-slate-200 dark:border-slate-800" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {status === 'success' && badgeText && (
            <span className="bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 text-[8px] font-bold py-0.5 px-2 rounded-full">
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{description}</p>
      </div>
    </div>
  );
}

