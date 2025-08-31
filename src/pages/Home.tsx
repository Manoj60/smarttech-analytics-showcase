import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Lightbulb, Award } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Home = () => {
  const leadership = [
    {
      name: "Sarah Johnson",
      role: "Chief Executive Officer",
      bio: "15+ years of experience leading digital transformation initiatives at Fortune 500 companies.",
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      name: "Dr. Michael Chen",
      role: "Chief Technology Officer", 
      bio: "Former AI research lead at top tech companies with 20+ published papers in machine learning.",
      icon: <Lightbulb className="w-6 h-6 text-primary" />
    },
    {
      name: "Emma Rodriguez",
      role: "VP of Analytics",
      bio: "Data science expert specializing in predictive analytics and business intelligence solutions.",
      icon: <Target className="w-6 h-6 text-primary" />
    }
  ];

  const partners = [
    "Microsoft Azure",
    "Amazon Web Services", 
    "Google Cloud Platform",
    "Snowflake",
    "Tableau",
    "Power BI"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6 leading-tight">
              Transforming Data Into 
              <span className="text-accent-light"> Strategic Advantage</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-primary-light leading-relaxed">
              Smart Tech Analytics empowers organizations with cutting-edge AI and analytics solutions that drive innovation, optimize operations, and accelerate growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact" className="flex items-center">
                  Get Started Today
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20" asChild>
                <Link to="/services">Explore Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6 text-foreground">
              About Smart Tech Analytics
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are a premier technology and analytics consulting firm dedicated to helping organizations unlock the full potential of their data through innovative AI-powered solutions and strategic insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 text-foreground">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To be the leading catalyst for data-driven transformation, enabling businesses to thrive in the digital age through intelligent analytics and AI solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 text-foreground">Our Expertise</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Deep technical knowledge in AI, machine learning, cloud computing, and advanced analytics, combined with strategic business acumen and industry experience.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-success-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 text-foreground">Our Commitment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Delivering measurable results through tailored solutions, ensuring our clients achieve their strategic objectives and maintain competitive advantage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6 text-foreground">
              Leadership Team
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet the visionary leaders driving innovation and excellence at Smart Tech Analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leadership.map((leader, index) => (
              <Card key={index} className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    {leader.icon}
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">
                    {leader.name}
                  </h3>
                  <p className="text-primary font-medium mb-4">{leader.role}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {leader.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Partners Section */}
      <section className="py-20 bg-primary-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6 text-primary-foreground">
              Trusted Partners
            </h2>
            <p className="text-lg text-primary-light">
              We collaborate with industry-leading technology partners to deliver world-class solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20 transition-smooth hover:bg-white/20"
              >
                <p className="text-primary-foreground font-semibold">{partner}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-primary-foreground">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-primary-light mb-8">
              Let's discuss how our AI and analytics solutions can drive your success.
            </p>
            <Button variant="hero" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/contact" className="flex items-center">
                Start Your Journey
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;