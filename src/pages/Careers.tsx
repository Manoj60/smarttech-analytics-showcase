import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Building, Clock, DollarSign, Calendar, Briefcase, Users, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ApplicationForm from "@/components/Careers/ApplicationForm";
import JobForm from "@/components/Admin/JobForm";
import SmartJobFilter from "@/components/Careers/SmartJobFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  department: string;
  employment_type: string;
  experience_level: string;
  work_status: string;
  salary_range: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  application_deadline: string;
  created_at: string;
}

const Careers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const CACHE_KEY = "careers_jobs_cache_v1";
  const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
  type JobsCache = { timestamp: number; data: Job[] };

  const readJobsCache = (): Job[] | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as JobsCache;
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeJobsCache = (data: Job[]) => {
    try {
      const payload: JobsCache = { timestamp: Date.now(), data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota or serialization errors
    }
  };

  useEffect(() => {
    const cached = readJobsCache();
    if (cached && cached.length) {
      setJobs(cached);
      setFilteredJobs(cached);
      setLoading(false);
    }

    fetchJobs();

    // Set canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', 'https://www.smarttechanalytics.com/careers');
    }
  }, []);

  const fetchJobs = async (retry = 0) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const jobsData = data || [];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      writeJobsCache(jobsData);
    } catch (error: any) {
      if (retry < 2) {
        setTimeout(() => fetchJobs(retry + 1), 500 * Math.pow(2, retry));
        return;
      }

      const cached = readJobsCache();
      if (cached && cached.length) {
        setJobs(cached);
        setFilteredJobs(cached);
        toast({
          title: "Working offline",
          description: "Showing cached job listings due to a temporary server issue.",
        });
      } else {
        toast({
          title: "Error",
          description: navigator.onLine
            ? "Failed to load job listings. Please try again later."
            : "You appear to be offline. Please check your connection and retry.",
          variant: "destructive",
        });
      }
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    toast({
      title: "Application Submitted",
      description: "Thank you for your application. We'll be in touch soon!",
    });
  };

  const refreshJobs = () => {
    fetchJobs();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to permanently delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;
      await fetchJobs();
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExperienceBadgeVariant = (level: string) => {
    switch (level) {
      case "Entry": return "secondary";
      case "Mid": return "default";
      case "Senior": return "destructive";
      case "Executive": return "outline";
      default: return "secondary";
    }
  };

  const getEmploymentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Full-time": return "default";
      case "Part-time": return "secondary";
      case "Contract": return "outline";
      case "Internship": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6 text-foreground leading-tight">
                Career <span className="text-primary">Opportunities</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Build the future of analytics with us. We're looking for passionate individuals 
                to help transform how businesses understand their data.
              </p>
            </div>
            
            {/* Smart AI Filter - At bottom of hero section */}
            <SmartJobFilter 
              jobs={jobs} 
              onFilteredJobs={setFilteredJobs}
              loading={loading}
            />
          </div>
        </section>

        {/* Admin Controls - Only visible to admin users */}
        {isAdmin() && (
          <section className="py-8 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="flex justify-center">
                <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gradient-primary shadow-elegant">
                      <Plus className="h-5 w-5 mr-2" />
                      Post New Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingJob ? "Edit Job Posting" : "Create New Job Posting"}</DialogTitle>
                    </DialogHeader>
                    <JobForm
                      job={editingJob}
                      onSubmit={() => {
                        setShowJobForm(false);
                        setEditingJob(null);
                        refreshJobs();
                        toast({
                          title: "Success",
                          description: editingJob ? "Job updated successfully!" : "Job posted successfully!",
                        });
                      }}
                      onCancel={() => {
                        setShowJobForm(false);
                        setEditingJob(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>
        )}

        {/* Job Listings Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8">
              {filteredJobs.length === 0 ? (
                <Card className="gradient-card border-border shadow-medium">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold mb-4 text-foreground">No Open Positions</h3>
                    <p className="text-muted-foreground text-center max-w-md leading-relaxed">
                      We don't have any open positions at the moment, but we're always 
                      looking for talented individuals. Check back soon!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id} className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-2xl font-heading font-bold mb-2 text-foreground">{job.title}</CardTitle>
                              <CardDescription className="text-base leading-relaxed text-muted-foreground">
                                {job.description}
                              </CardDescription>
                            </div>
                            {isAdmin() && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingJob(job);
                                    setShowJobForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getExperienceBadgeVariant(job.experience_level)}>
                            {job.experience_level}
                          </Badge>
                          <Badge variant={getEmploymentTypeBadgeVariant(job.employment_type)}>
                            {job.employment_type}
                          </Badge>
                          <Badge variant="outline">
                            {job.work_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Job Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{job.department}</span>
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Posted {formatDate(job.created_at)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Responsibilities */}
                    <div>
                      <h4 className="font-heading font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        Key Responsibilities
                      </h4>
                      <ul className="space-y-2">
                        {job.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Qualifications */}
                    <div>
                      <h4 className="font-heading font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {job.qualifications.map((qualification, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                            <span>{qualification}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button 
                        onClick={() => handleApplyClick(job)}
                        variant="hero"
                        size="lg"
                        className="w-full md:w-auto"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <ApplicationForm
          job={selectedJob}
          onClose={() => setShowApplicationForm(false)}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </>
  );
};

export default Careers;