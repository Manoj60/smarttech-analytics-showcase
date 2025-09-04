import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, LinkedinIcon, Send } from 'lucide-react';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent Successfully!",
      description: "Thank you for your interest. We'll get back to you within 24 hours.",
    });

    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed">
              Ready to transform your business with data-driven solutions? Let's start the conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-heading font-bold mb-6 text-foreground">
                Let's Connect
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Fill out the form below and our team will get back to you within 24 hours. We're here to help you achieve your data and analytics goals.
              </p>

              <Card className="gradient-card border-border shadow-medium">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-foreground font-medium">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-2 transition-smooth focus:ring-2 focus:ring-primary"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-2 transition-smooth focus:ring-2 focus:ring-primary"
                        placeholder="Enter your email address"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-foreground font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="mt-2 transition-smooth focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Tell us about your project or how we can help you..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2" size={20} />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-heading font-bold mb-6 text-foreground">
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Reach out to us through any of the channels below. Our team is available to discuss your needs and provide expert guidance.
              </p>

              <div className="space-y-6">
                {/* Email */}
                <Card className="gradient-card border-border shadow-soft transition-smooth hover:shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Email</h3>
                        <p className="text-muted-foreground">info@smarttechanalytics.com</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          For general inquiries and project discussions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone */}
                <Card className="gradient-card border-border shadow-soft transition-smooth hover:shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                        <p className="text-muted-foreground">657 216 0194</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Monday - Friday, 9:00 AM - 6:00 PM EST
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Office Address */}
                <Card className="gradient-card border-border shadow-soft transition-smooth hover:shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-success-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Office</h3>
                        <p className="text-muted-foreground">
                          Boulder, Colorado<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card className="gradient-card border-border shadow-soft transition-smooth hover:shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-warning-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Business Hours</h3>
                        <div className="text-muted-foreground space-y-1">
                          <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                          <p>Saturday: 10:00 AM - 2:00 PM EST</p>
                          <p>Sunday: Closed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <Card className="gradient-card border-border shadow-soft transition-smooth hover:shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <LinkedinIcon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">LinkedIn</h3>
                        <p className="text-muted-foreground">
                          <a href="https://www.linkedin.com/company/smarttechanalytics/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                            Smart Tech Analytics
                          </a>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Follow us for industry insights and updates
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Quick answers to common questions about our services and process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: "What is your typical project timeline?",
                  answer: "Project timelines vary based on scope and complexity, typically ranging from 3-18 months. We provide detailed timelines during our initial consultation."
                },
                {
                  question: "Do you work with small businesses?",
                  answer: "Yes, we work with organizations of all sizes, from startups to Fortune 500 companies. Our solutions are scalable and tailored to your specific needs and budget."
                },
                {
                  question: "What industries do you specialize in?",
                  answer: "We have expertise across multiple industries including healthcare, finance, retail, manufacturing, and technology. Our solutions are adaptable to various business domains."
                },
                {
                  question: "Do you provide ongoing support?",
                  answer: "Absolutely. We offer comprehensive support packages including maintenance, optimization, training, and 24/7 technical support to ensure your continued success."
                }
              ].map((faq, index) => (
                <Card key={index} className="gradient-card border-border shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-heading text-foreground">
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-white">
              Let's Transform Your Business Together
            </h2>
            <p className="text-xl text-white mb-8 font-semibold">
              Schedule a free consultation to discuss your data and analytics challenges and discover how we can help.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">Schedule Free Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;