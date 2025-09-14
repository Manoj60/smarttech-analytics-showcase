import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Archive, Trash2, Users, Download, Search, Filter } from "lucide-react";
import JobForm from "@/components/Admin/JobForm";
import ApplicationsTable from "@/components/Admin/ApplicationsTable";

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
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  visa_status: string;
  preferred_location: string;
  linkedin_profile: string;
  portfolio_website: string;
  cover_letter: string;
  resume_file_name: string;
  resume_file_path: string;
  status: string;
  admin_notes: string;
  created_at: string;
  jobs: { title: string; department: string };
}

const AdminDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { userProfile, signOut } = useAuth();

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs (
            title,
            department
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    }
  };

  const handleJobSubmit = async () => {
    setShowJobForm(false);
    setEditingJob(null);
    await fetchJobs();
    toast({
      title: "Success",
      description: editingJob ? "Job updated successfully" : "Job created successfully",
    });
  };

  const handleArchiveJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: false })
        .eq("id", jobId);

      if (error) throw error;
      await fetchJobs();
      toast({
        title: "Success",
        description: "Job archived successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to archive job",
        variant: "destructive",
      });
    }
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

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from("job_applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;
      await fetchApplications();
      toast({
        title: "Success",
        description: "Application status updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const downloadResume = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Admin Dashboard
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed mb-8">
              Welcome back, {userProfile?.full_name || 'Admin'} - Manage your platform with powerful administrative tools.
            </p>
            <Button onClick={signOut} variant="outline" size="lg" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20">
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">

        {/* Stats Cards */}
        <section className="py-20 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
                Dashboard Overview
              </h2>
              <p className="text-lg text-muted-foreground">
                Monitor your platform's key metrics and performance indicators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Active Jobs</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">📋</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{jobs.filter(job => job.is_active).length}</div>
                </CardContent>
              </Card>
              <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{applications.length}</div>
                </CardContent>
              </Card>
              <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Pending Review</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">⏳</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {applications.filter(app => app.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="jobs" className="space-y-6">
              <div className="text-center mb-12">
                <TabsList className="bg-secondary">
                  <TabsTrigger value="jobs" className="text-foreground">Job Management</TabsTrigger>
                  <TabsTrigger value="applications" className="text-foreground">Applications</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="jobs" className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-heading font-bold text-foreground">Job Listings</h2>
              <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingJob ? "Edit Job" : "Create New Job"}
                    </DialogTitle>
                  </DialogHeader>
                  <JobForm
                    job={editingJob}
                    onSubmit={handleJobSubmit}
                    onCancel={() => {
                      setShowJobForm(false);
                      setEditingJob(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
                </div>

                <div className="grid gap-6">
                  {jobs.map((job) => (
                    <Card key={job.id} className={`gradient-card border-border shadow-medium transition-smooth hover:shadow-strong ${job.is_active ? "" : "opacity-60"}`}>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-foreground">
                          {job.title}
                          {!job.is_active && (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {job.company} • {job.department} • {job.location} • {job.employment_type} • {job.work_status}
                          </CardDescription>
                        </div>
                      <div className="flex gap-2">
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
                        {job.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveJob(job.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {job.experience_level} • {job.salary_range}
                          {job.application_deadline && (
                            <span className="ml-2">• Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                  <h2 className="text-3xl font-heading font-bold text-foreground">Applications</h2>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="offer_extended">Offer Extended</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ApplicationsTable
                  applications={filteredApplications}
                  onStatusUpdate={handleStatusUpdate}
                  onDownloadResume={downloadResume}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;