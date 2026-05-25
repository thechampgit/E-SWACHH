
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
import { AlertCircle, Camera, Loader2, MapPin, Sparkles, X } from 'lucide-react';
import { categorizeComplaint } from '@/ai/flows/ai-complaint-categorization';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { MapProvider } from '@/components/MapProvider';
import { LocationPicker } from '@/components/LocationPicker';

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  category: z.string(),
  description: z.string().min(20, { message: "Please provide a more detailed description." }),
  location: z.object({
    address: z.string().min(5),
    latitude: z.number(),
    longitude: z.number(),
  }),
  priority: z.enum(['Low', 'Medium', 'High']),
});

export default function ReportPage() {
  const router = useRouter();
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiCategorize = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 10) {
      toast({
        title: "Insufficient information",
        description: "Please provide a brief description before using AI analysis.",
        variant: "destructive",
      });
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
        form.setValue('priority', result.priority);
        toast({
          title: "AI Analysis Complete",
          description: `Suggested Category: ${result.category}, Priority: ${result.priority}`,
        });
      }
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "We couldn't analyze the report at this time.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Auth Required", description: "You must be logged in to report.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (imagePreview) {
        const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}`);
        await uploadString(storageRef, imagePreview, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      const complaintData = {
        ...values,
        userId: user.uid,
        userName: user.displayName || "Anonymous Citizen",
        imageUrl,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "complaints"), complaintData)
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: '/complaints',
            operation: 'create',
            requestResourceData: complaintData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw err;
        });

      toast({
        title: "Report Submitted",
        description: `Thank you for your contribution. Your report ID is ${docRef.id}`,
      });

      router.push(`/track/${docRef.id}`);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was an error saving your report. Please try again.",
        variant: "destructive",
      });
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
            <p className="text-muted-foreground">Submit a report to help improve our community.</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Issue Details
            </CardTitle>
            <CardDescription>Fill out the form below with as much detail as possible.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pothole on Main St" {...field} />
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
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Road Damage">Road Damage</SelectItem>
                            <SelectItem value="Garbage">Garbage</SelectItem>
                            <SelectItem value="Water Supply">Water Supply</SelectItem>
                            <SelectItem value="Electricity">Electricity</SelectItem>
                            <SelectItem value="Streetlight">Streetlight</SelectItem>
                            <SelectItem value="Drainage">Drainage</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs flex items-center gap-1 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                          onClick={handleAiCategorize}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          AI Suggest Category
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide details about the extent of damage and how it's affecting the community." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Pinpoint Location
                  </FormLabel>
                  <MapProvider>
                    <LocationPicker 
                      onLocationSelect={(loc) => form.setValue('location', loc)}
                    />
                  </MapProvider>
                  {form.formState.errors.location && (
                    <p className="text-xs font-medium text-destructive">Please select a location on the map.</p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <FormLabel>Photo Evidence</FormLabel>
                  {!imagePreview ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500 font-medium">Click to upload photo</p>
                          <p className="text-xs text-slate-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  ) : (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden group shadow-md border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white text-destructive transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t">
                  <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Report...
                      </>
                    ) : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
