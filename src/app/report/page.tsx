
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Camera, Loader2, MapPin, Sparkles, X, ShieldAlert } from 'lucide-react';
import { categorizeComplaint } from '@/ai/flows/ai-complaint-categorization';
import { aiComplaintModeration } from '@/ai/flows/ai-complaint-moderation';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { LocationPicker } from '@/components/LocationPicker';
import { addHours, addDays } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  category: z.string(),
  description: z.string().min(20, { message: "Please provide a more detailed description." }),
  location: z.object({
    address: z.string().min(5),
    latitude: z.number(),
    longitude: z.number(),
  }),
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
        toast({ title: "AI Insights Applied", description: `Detected: ${result.category}` });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const moderation = await aiComplaintModeration({
        title: values.title,
        description: values.description,
        category: values.category,
        imageUrl: imagePreview || undefined
      });

      if (moderation.isSuspicious && !aiWarning) {
        setAiWarning({ isSuspicious: true, reason: moderation.reason });
        setIsSubmitting(false);
        return;
      }

      let imageUrl = "";
      if (imagePreview) {
        const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}`);
        await uploadString(storageRef, imagePreview, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      // Calculate SLA Deadline
      let slaDeadline = addDays(new Date(), 7); // Default Low
      if (values.priority === 'Critical') slaDeadline = addHours(new Date(), 24);
      if (values.priority === 'High') slaDeadline = addDays(new Date(), 2);
      if (values.priority === 'Medium') slaDeadline = addDays(new Date(), 4);

      const complaintData = {
        ...values,
        userId: user.uid,
        userName: user.displayName || "Citizen",
        imageUrl,
        status: "Pending",
        slaDeadline: slaDeadline.toISOString(),
        isEscalated: false,
        aiAnalysis: {
          category: values.category,
          priority: values.priority,
          isSuspicious: moderation.isSuspicious,
          moderationReason: moderation.reason,
          confidence: moderation.confidenceScore
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "complaints"), complaintData);

      // Update User Contribution
      await updateDoc(doc(db, 'users', user.uid), {
        contributionLevel: increment(10)
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "SLA Tracker Active",
        message: `Your report has been logged. Based on priority, our resolution target is ${slaDeadline.toLocaleDateString()}.`,
        type: "info",
        complaintId: docRef.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Report Submitted", description: "Tracking is now active." });
      router.push(`/track/${docRef.id}`);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-slate-900">Governance Submittal</h1>
            <p className="text-muted-foreground">High-accountability civic issue reporting.</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>

        {aiWarning && (
          <Card className="mb-6 border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 flex gap-3">
              <ShieldAlert className="text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-900">AI Validation Check</p>
                <p className="text-xs text-orange-700 mt-1">{aiWarning.reason}</p>
                <Button variant="outline" size="sm" className="mt-3 text-[10px] h-7" onClick={() => setAiWarning(null)}>Override & Fix</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl bg-white p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Title</FormLabel>
                    <FormControl><Input placeholder="Clear and concise..." {...field} /></FormControl>
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Road Damage', 'Garbage', 'Water Supply', 'Electricity', 'Streetlight', 'Drainage', 'Other'].map(c => (
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
                      <FormLabel>Impact Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                      <FormLabel>Detailed Narrative</FormLabel>
                      <Button type="button" variant="ghost" size="sm" className="text-primary gap-1 font-bold text-xs" onClick={handleAiCategorize} disabled={isAnalyzing}>
                        {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Smart Fill
                      </Button>
                    </div>
                    <FormControl><Textarea placeholder="Describe the severity and impact..." className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t">
                <FormLabel className="mb-4 block"><MapPin className="inline mr-2 h-4 w-4" /> Pinpoint Location</FormLabel>
                <MapProvider>
                  <LocationPicker onLocationSelect={(loc) => form.setValue('location', loc)} />
                </MapProvider>
              </div>

              <div className="pt-4 border-t">
                <FormLabel className="mb-4 block"><Camera className="inline mr-2 h-4 w-4" /> Photographic Proof</FormLabel>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <Camera className="w-8 h-8 text-slate-300" />
                    <span className="text-xs text-slate-500 mt-2">Upload Visual Evidence</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                ) : (
                  <div className="relative h-60 rounded-xl overflow-hidden shadow-sm">
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setImagePreview(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-md font-bold rounded-full shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Initiate Governance Track"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
