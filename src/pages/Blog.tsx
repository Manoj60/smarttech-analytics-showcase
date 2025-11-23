import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PlusCircle, Calendar, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  published_at: string | null;
  is_published: boolean;
  featured_image_url: string | null;
  tags: string[] | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: ''
  });
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive"
      });
      return;
    }

    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];

    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: formData.title,
          slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          author_id: user.id,
          author_name: user.email || 'Anonymous',
          tags,
          is_published: true,
          published_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post created successfully"
      });

      setFormData({ title: '', content: '', excerpt: '', tags: '' });
      setShowCreateForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Blog - Smart Tech Analytics</title>
        <meta name="description" content="Read the latest insights, news, and updates from Smart Tech Analytics on AI, data analytics, and technology trends." />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-2">Blog</h1>
              <p className="text-muted-foreground">Insights, news, and updates from our team</p>
            </div>
            {isAdmin() && (
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {showCreateForm ? 'Cancel' : 'New Post'}
              </Button>
            )}
          </div>

          {showCreateForm && isAdmin() && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Blog Post</CardTitle>
                <CardDescription>Share your insights with the community</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
                      Excerpt
                    </label>
                    <Input
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief description of the post"
                    />
                  </div>
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-2">
                      Content
                    </label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-2">
                      Tags (comma separated)
                    </label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="AI, Analytics, Technology"
                    />
                  </div>
                  <Button type="submit">Publish Post</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{post.author_name}</span>
                      </div>
                      {post.published_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Read More</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Blog;