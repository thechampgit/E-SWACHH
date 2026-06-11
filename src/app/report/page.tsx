'use client';

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
import { Camera, Loader2, MapPin, Sparkles, X, ShieldAlert, ArrowLeft, Globe } from 'lucide-react';
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
async function onSubmit(values: z.infer<typeof formSchema>) {
  if (!user || !db || !storage) {
    toast({
      title: "Service not available",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);

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

    let slaDeadline = addDays(new Date(), 7);

    if (values.priority === "Critical") {
      slaDeadline = addHours(new Date(), 24);
    }

    if (values.priority === "High") {
      slaDeadline = addDays(new Date(), 2);
    }

    if (values.priority === "Medium") {
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

      aiAnalysis: {
        category: values.category,
        priority: values.priority,
        isSuspicious: false,
        moderationReason: "",
        confidence: 0,
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
      title: "Report Submitted",
      message: `Your report has been logged. Priority: ${values.priority}.`,
      type: "info",
      complaintId: docRef.id,
      read: false,
      createdAt: serverTimestamp(),
    }).catch((e) =>
      console.warn("Failed to send notification", e)
    );

    toast({
      title: "Report Submitted Successfully",
    });

    router.push(`/track/${docRef.id}`);

  } catch (error) {
    console.error(error);

    toast({
      title: "Submission error",
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
      </div>
    </div>
  )
  }
