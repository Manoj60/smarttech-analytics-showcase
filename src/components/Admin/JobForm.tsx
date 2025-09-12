import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const jobSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  department: z.string().min(2, "Department is required"),
  employment_type: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
  experience_level: z.enum(["Entry", "Mid", "Senior", "Executive"]),
  salary_range: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type JobFormData = z.infer<typeof jobSchema>;

interface Job {
  id?: string;
  title: string;
  location: string;
  department: string;
  employment_type: string;
  experience_level: string;
  salary_range: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  is_active?: boolean;
}

interface JobFormProps {
  job?: Job | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const JobForm = ({ job, onSubmit, onCancel }: JobFormProps) => {
  const [responsibilities, setResponsibilities] = useState<string[]>(job?.responsibilities || []);
  const [qualifications, setQualifications] = useState<string[]>(job?.qualifications || []);
  const [newResponsibility, setNewResponsibility] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useAuth();

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || "",
      location: job?.location || "",
      department: job?.department || "",
      employment_type: job?.employment_type as any || "Full-time",
      experience_level: job?.experience_level as any || "Mid",
      salary_range: job?.salary_range || "",
      description: job?.description || "",
    },
  });

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification("");
    }
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: JobFormData) => {
    if (responsibilities.length === 0) {
      alert("Please add at least one responsibility");
      return;
    }
    if (qualifications.length === 0) {
      alert("Please add at least one qualification");
      return;
    }

    setIsSubmitting(true);

    try {
      const jobData = {
        title: data.title,
        location: data.location,
        department: data.department,
        employment_type: data.employment_type,
        experience_level: data.experience_level,
        salary_range: data.salary_range || "",
        description: data.description,
        responsibilities,
        qualifications,
        is_active: true,
        created_by: userProfile?.user_id,
      };

      if (job?.id) {
        // Update existing job
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", job.id);
        
        if (error) throw error;
      } else {
        // Create new job
        const { error } = await supabase
          .from("jobs")
          .insert([jobData]);
        
        if (error) throw error;
      }

      onSubmit();
    } catch (error: any) {
      console.error("Error saving job:", error);
      alert("Failed to save job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="e.g. Senior Software Engineer"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            {...form.register("location")}
            placeholder="e.g. Remote, New York, NY"
          />
          {form.formState.errors.location && (
            <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            {...form.register("department")}
            placeholder="e.g. Engineering, Marketing"
          />
          {form.formState.errors.department && (
            <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Employment Type *</Label>
          <Select
            value={form.watch("employment_type")}
            onValueChange={(value) => form.setValue("employment_type", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Experience Level *</Label>
          <Select
            value={form.watch("experience_level")}
            onValueChange={(value) => form.setValue("experience_level", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Entry">Entry</SelectItem>
              <SelectItem value="Mid">Mid</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_range">Salary Range</Label>
          <Input
            id="salary_range"
            {...form.register("salary_range")}
            placeholder="e.g. $80,000 - $120,000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Brief description of the role..."
          className="min-h-[100px]"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Responsibilities *</Label>
        <div className="flex gap-2">
          <Input
            value={newResponsibility}
            onChange={(e) => setNewResponsibility(e.target.value)}
            placeholder="Add a responsibility..."
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
          />
          <Button type="button" onClick={addResponsibility}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {responsibilities.map((resp, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {resp}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeResponsibility(index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Qualifications *</Label>
        <div className="flex gap-2">
          <Input
            value={newQualification}
            onChange={(e) => setNewQualification(e.target.value)}
            placeholder="Add a qualification..."
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addQualification())}
          />
          <Button type="button" onClick={addQualification}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {qualifications.map((qual, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {qual}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeQualification(index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : job ? "Update Job" : "Create Job"}
        </Button>
      </div>
    </form>
  );
};

export default JobForm;