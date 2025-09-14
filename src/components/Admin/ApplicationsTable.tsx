import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, MessageSquare, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";

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

interface ApplicationsTableProps {
  applications: Application[];
  onStatusUpdate: (applicationId: string, newStatus: string, notes?: string) => void;
  onDownloadResume: (filePath: string, fileName: string) => void;
}

const ApplicationsTable = ({ applications, onStatusUpdate, onDownloadResume }: ApplicationsTableProps) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "in_review": return "default";
      case "interview_scheduled": return "outline";
      case "offer_extended": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_review": return "In Review";
      case "interview_scheduled": return "Interview Scheduled";
      case "offer_extended": return "Offer Extended";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    onStatusUpdate(applicationId, newStatus);
  };

  const handleNotesUpdate = () => {
    if (selectedApp) {
      onStatusUpdate(selectedApp.id, selectedApp.status, notes);
      setSelectedApp(null);
      setNotes("");
    }
  };

  const openDetailsModal = (app: Application) => {
    setSelectedApp(app);
    setNotes(app.admin_notes || "");
  };

  if (applications.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No applications match your current search criteria. Try adjusting your filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{app.full_name}</CardTitle>
                  <CardDescription>
                    Applied for {app.jobs?.title} • {app.jobs?.department}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {getStatusLabel(app.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsModal(app)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadResume(app.resume_file_path, app.resume_file_name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {app.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {app.phone}
                </div>
                <div>
                  <span className="font-medium">Visa Status:</span> {app.visa_status}
                </div>
                <div>
                  <span className="font-medium">Location Preference:</span> {app.preferred_location}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Select
                    value={app.status}
                    onValueChange={(value) => handleStatusChange(app.id, value)}
                  >
                    <SelectTrigger className="w-auto h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="offer_extended">Offer Extended</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Details Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details - {selectedApp?.full_name}</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Email:</span> {selectedApp.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedApp.phone}</p>
                    {selectedApp.linkedin_profile && (
                      <p>
                        <span className="font-medium">LinkedIn:</span>{" "}
                        <a
                          href={selectedApp.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedApp.linkedin_profile}
                        </a>
                      </p>
                    )}
                    {selectedApp.portfolio_website && (
                      <p>
                        <span className="font-medium">Portfolio:</span>{" "}
                        <a
                          href={selectedApp.portfolio_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedApp.portfolio_website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Preferences</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Visa Status:</span> {selectedApp.visa_status}</p>
                    <p><span className="font-medium">Location:</span> {selectedApp.preferred_location}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Application Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Applied:</span> {new Date(selectedApp.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> {getStatusLabel(selectedApp.status)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Application Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Position:</span> {selectedApp.jobs?.title}</p>
                    <p><span className="font-medium">Department:</span> {selectedApp.jobs?.department}</p>
                    <p><span className="font-medium">Applied:</span> {new Date(selectedApp.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> {getStatusLabel(selectedApp.status)}</p>
                  </div>
                </div>
              </div>

              {selectedApp.cover_letter && (
                <div>
                  <h4 className="font-semibold mb-2">Cover Letter</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    {selectedApp.cover_letter}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Resume</h4>
                <Button
                  variant="outline"
                  onClick={() => onDownloadResume(selectedApp.resume_file_path, selectedApp.resume_file_name)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedApp.resume_file_name}
                </Button>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  className="mt-2"
                />
                <Button onClick={handleNotesUpdate} className="mt-2">
                  Update Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationsTable;