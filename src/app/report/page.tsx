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
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Camera, Loader2, MapPin, Sparkles, X, ShieldAlert } from 'lucide-react';
import { categorizeComplaint } from '@/ai/flows/ai-complaint-categorization';
import { aiComplaintModeration } from '@/ai/flows/ai-complaint-moderation';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { LocationPicker } from '@/components/LocationPicker';
import { Badge } from '@/components/ui/badge';

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
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image must be under 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAiCategorize = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 15) {
      toast({ title: "More info needed", description: "Describe the issue first.", variant: "destructive" });
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
        toast({ title: "AI Categorized", description: `Selected: ${result.category}` });
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
      // First, run moderation
      const moderation = await aiComplaintModeration({
        title: values.title,
        description: values.description,
        category: values.category,
        imageUrl: imagePreview || undefined
      });

      if (moderation.isSuspicious && !aiWarning) {
        setAiWarning({ isSuspicious: true, reason: moderation.reason });
        setIsSubmitting(false);
        toast({
          variant: "destructive",
          title: "AI Quality Warning",
          description: "Our AI detected potential issues with this report. Please review the warning above."
        });
        return;
      }

      let imageUrl = "";
      if (imagePreview) {
        const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}`);
        await uploadString(storageRef, imagePreview, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      const complaintData = {
        ...values,
        userId: user.uid,
        userName: user.displayName || "Citizen",
        imageUrl,
        status: "Pending",
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

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Report Logged",
        message: `Your report "${values.title}" has been successfully submitted and is under review.`,
        type: "success",
        complaintId: docRef.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Success", description: "Issue reported successfully." });
      router.push(`/track/${docRef.id}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-slate-900">Report Civic Issue</h1>
            <p className="text-muted-foreground">AI-assisted reporting for faster city response.</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>

        {aiWarning && (
          <Card className="mb-6 border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 flex gap-3">
              <ShieldAlert className="text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-900">AI Quality Warning</p>
                <p className="text-xs text-orange-700 mt-1">{aiWarning.reason}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-[10px] h-7 bg-white"
                  onClick={() => setAiWarning(null)}
                >
                  Edit Report Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg">
          <CardContent className="p-6 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="What is the issue?" {...field} />
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
                        <FormLabel>Priority</FormLabel>
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
                        <FormLabel>Description</FormLabel>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] font-bold text-primary flex gap-1 items-center hover:bg-primary/5"
                          onClick={handleAiCategorize}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          AI Assistant
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Explain the situation..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <FormLabel className="mb-4 block"><MapPin className="inline mr-2 h-4 w-4" /> Issue Location</FormLabel>
                  <MapProvider>
                    <LocationPicker onLocationSelect={(loc) => form.setValue('location', loc)} />
                  </MapProvider>
                </div>

                <div className="pt-4 border-t">
                  <FormLabel className="mb-4 block"><Camera className="inline mr-2 h-4 w-4" /> Visual Evidence</FormLabel>
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-xs text-slate-500 mt-2">Upload Photo</span>
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

                <Button type="submit" className="w-full h-12 text-md font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Report"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}