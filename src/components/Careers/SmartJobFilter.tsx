import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface SmartJobFilterProps {
  jobs: Job[];
  onFilteredJobs: (filteredJobs: Job[]) => void;
  loading?: boolean;
}

const SmartJobFilter: React.FC<SmartJobFilterProps> = ({ 
  jobs, 
  onFilteredJobs, 
  loading = false 
}) => {
  const [query, setQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const { toast } = useToast();

  const predefinedFilters = [
    'Remote jobs',
    'Senior positions',
    'Entry level roles',
    'Full-time positions',
    'Recently posted jobs',
    'Engineering roles',
    'Jobs starting with "S"',
    'High paying positions',
  ];

  const handleSmartFilter = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return;

    setIsFiltering(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-job-filter', {
        body: {
          query: searchQuery.trim(),
          jobs: jobs
        }
      });

      if (error) throw error;

      const filteredJobs = data?.filteredJobs || [];
      onFilteredJobs(filteredJobs);
      setLastQuery(searchQuery.trim());
      setIsFiltered(true);

      toast({
        title: "Smart Filter Applied",
        description: `Found ${filteredJobs.length} matching positions`,
      });

    } catch (error: any) {
      console.error('Smart filter error:', error);
      toast({
        title: "Filter Error",
        description: "Failed to apply smart filter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilter = () => {
    onFilteredJobs(jobs);
    setQuery('');
    setLastQuery('');
    setIsFiltered(false);
    toast({
      title: "Filter Cleared",
      description: "Showing all available positions",
    });
  };

  const handlePredefinedFilter = (filterText: string) => {
    setQuery(filterText);
    handleSmartFilter(filterText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSmartFilter(query);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* AI Filter Input */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ask AI to filter jobs... e.g., 'remote senior developer roles' or 'jobs posted this week'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4"
              disabled={isFiltering || loading}
            />
            <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <Button 
            type="submit" 
            disabled={!query.trim() || isFiltering || loading}
            className="gradient-primary"
          >
            {isFiltering ? (
              <>
                <Filter className="h-4 w-4 mr-2 animate-spin" />
                Filtering...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Filter
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Quick Filter Suggestions */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Try these smart filters:</p>
        <div className="flex flex-wrap gap-2">
          {predefinedFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handlePredefinedFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      {/* Active Filter Display */}
      {isFiltered && lastQuery && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <strong>Active Filter:</strong> "{lastQuery}"
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartJobFilter;