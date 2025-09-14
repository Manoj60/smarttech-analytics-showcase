import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  visaStatus: z.enum(["H1B", "Green Card", "Citizen", "Other"], {
    required_error: "Please select your visa status",
  }),
  preferredLocation: z.string().min(2, "Please enter your preferred location"),
  linkedinProfile: z.string().url("Please enter a valid LinkedIn URL").min(1, "LinkedIn profile is required"),
  portfolioWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  coverLetter: z.string().optional(),
  resume: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "Resume is required")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      "File size must be less than 5MB"
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only PDF, DOC, and DOCX files are accepted"
    ),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
}

interface ApplicationFormProps {
  job: Job;
  onClose: () => void;
  onSubmit: () => void;
}

const ApplicationForm = ({ job, onClose, onSubmit }: ApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      visaStatus: undefined,
      preferredLocation: "",
      linkedinProfile: "",
      portfolioWebsite: "",
      coverLetter: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a FileList for react-hook-form
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      form.setValue("resume", dataTransfer.files);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    form.setValue("resume", new DataTransfer().files);
  };

  const onFormSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", job.id);
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("visaStatus", data.visaStatus);
      formData.append("preferredLocation", data.preferredLocation);
      formData.append("linkedinProfile", data.linkedinProfile || "");
      formData.append("portfolioWebsite", data.portfolioWebsite || "");
      formData.append("coverLetter", data.coverLetter || "");
      formData.append("resumeFile", data.resume[0]);

      const { data: response, error } = await supabase.functions.invoke(
        "submit-application",
        {
          body: formData,
        }
      );

      if (error) throw error;

      if (response?.success) {
        onSubmit();
      } else {
        throw new Error(response?.error || "Failed to submit application");
      }
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Apply for {job.title}</DialogTitle>
          <DialogDescription>
            {job.department} • {job.location}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visaStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visa Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="z-50 bg-background">
                          <SelectValue placeholder="Select visa status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg">
                        <SelectItem value="H1B">H1B</SelectItem>
                        <SelectItem value="Green Card">Green Card</SelectItem>
                        <SelectItem value="Citizen">Citizen</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York, NY or Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedinProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile *</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio/Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://johndoe.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Share your motivation and relevant experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume *</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {!selectedFile ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Upload your resume</p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOC, or DOCX files only (max 5MB)
                            </p>
                          </div>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="border border-border rounded-lg p-4 bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationForm;