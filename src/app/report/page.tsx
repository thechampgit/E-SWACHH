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
import { AlertCircle, Camera, Loader2, MapPin, Sparkles } from 'lucide-react';
import { categorizeComplaint } from '@/ai/flows/ai-complaint-categorization';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  category: z.string(),
  description: z.string().min(20, { message: "Please provide a more detailed description." }),
  location: z.string().min(5, { message: "Please provide a valid location or landmark." }),
  priority: z.enum(['Low', 'Medium', 'High']),
});

export default function ReportPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "Other",
      description: "",
      location: "",
      priority: "Medium",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      console.error(error);
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
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (imagePreview) {
        const storageRef = ref(storage, `complaints/${Date.now()}`);
        await uploadString(storageRef, imagePreview, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      const docRef = await addDoc(collection(db, "complaints"), {
        ...values,
        imageUrl,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Report Submitted",
        description: `Thank you for your contribution. Your report ID is ${docRef.id}`,
      });

      router.push(`/track/${docRef.id}`);
    } catch (error) {
      console.error(error);
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

        <div className="grid gap-8">
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
                          <Input placeholder="Brief title of the issue" {...field} />
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
                            placeholder="Please provide details about the location, extent of damage, and how it's affecting the community." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location / Landmark</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Enter address or nearby landmark" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Photo Upload</FormLabel>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-slate-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => setImagePreview(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
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
    </div>
  );
}