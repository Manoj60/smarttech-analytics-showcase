import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Target, Cloud, Brain, Database, BarChart3, Shield, Users, Zap } from 'lucide-react';

const Services = () => {
  const services = [
    {
      title: "Data Strategy & Governance",
      icon: <Target className="w-8 h-8 text-primary" />,
      description: "Develop comprehensive data strategies aligned with business objectives, establish governance frameworks, and ensure data quality and compliance.",
      offerings: [
        "Data Strategy Development",
        "Data Governance Framework",
        "Data Quality Management",
        "Compliance & Risk Assessment",
        "Data Architecture Planning"
      ]
    },
    {
      title: "Cloud & Infrastructure Services",
      icon: <Cloud className="w-8 h-8 text-accent" />,
      description: "Modernize your infrastructure with scalable cloud solutions, optimize performance, and ensure seamless migration and integration.",
      offerings: [
        "Cloud Migration Strategy",
        "Multi-Cloud Architecture",
        "Infrastructure Optimization",
        "DevOps Implementation",
        "Performance Monitoring"
      ]
    },
    {
      title: "AI/ML Consulting",
      icon: <Brain className="w-8 h-8 text-success" />,
      description: "Leverage artificial intelligence and machine learning to automate processes, gain predictive insights, and drive innovation.",
      offerings: [
        "AI Strategy & Roadmap",
        "Machine Learning Model Development",
        "Natural Language Processing",
        "Computer Vision Solutions",
        "AI Ethics & Governance"
      ]
    },
    {
      title: "Data Integration & Migration",
      icon: <Database className="w-8 h-8 text-warning" />,
      description: "Seamlessly integrate disparate data sources, migrate legacy systems, and create unified data platforms for better decision-making.",
      offerings: [
        "ETL/ELT Pipeline Development",
        "Real-time Data Integration",
        "Legacy System Migration",
        "API Development & Management",
        "Data Warehouse Modernization"
      ]
    },
    {
      title: "Enterprise Reporting & Visualization",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      description: "Create compelling visualizations and comprehensive reporting solutions that provide actionable insights for all stakeholders.",
      offerings: [
        "Interactive Dashboard Development",
        "Executive Reporting Solutions",
        "Self-Service Analytics",
        "Mobile BI Applications",
        "Embedded Analytics"
      ]
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Enterprise Security",
      description: "Industry-leading security practices and compliance with global data protection regulations."
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Expert Team",
      description: "Certified professionals with deep expertise across all major platforms and technologies."
    },
    {
      icon: <Zap className="w-8 h-8 text-success" />,
      title: "Agile Delivery",
      description: "Rapid implementation using agile methodologies with iterative delivery and continuous improvement."
    },
    {
      icon: <Target className="w-8 h-8 text-warning" />,
      title: "Measurable ROI",
      description: "Focus on delivering tangible business value with clear metrics and success indicators."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Our Services
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed">
              Comprehensive consulting and implementation services to accelerate your data-driven transformation and maximize business value.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Specialized Consulting Services
            </h2>
            <p className="text-lg text-muted-foreground">
              Our expert consultants work closely with your team to design, implement, and optimize solutions tailored to your unique business needs.
            </p>
          </div>

          <div className="space-y-12">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong"
              >
                <CardContent className="p-8 lg:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                      <h4 className="font-semibold text-foreground mb-4">Key Offerings:</h4>
                      <ul className="space-y-2">
                        {service.offerings.map((offering, offeringIndex) => (
                          <li key={offeringIndex} className="text-sm text-muted-foreground flex items-start">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            {offering}
                          </li>
                        ))}
                      </ul>
                      <Button variant="default" size="sm" className="mt-6" asChild>
                        <Link to="/contact">Learn More</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Why Partner With Us?
            </h2>
            <p className="text-lg text-muted-foreground">
              Our proven methodology and commitment to excellence ensure successful project delivery and long-term value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="gradient-card border-border shadow-medium text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Our Proven Process
            </h2>
            <p className="text-lg text-muted-foreground">
              A structured approach that ensures successful project delivery and maximum return on investment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Discovery & Assessment",
                description: "Understand your current state, challenges, and objectives through comprehensive analysis."
              },
              {
                step: "02", 
                title: "Strategy & Design",
                description: "Develop tailored solutions and roadmaps aligned with your business goals and constraints."
              },
              {
                step: "03",
                title: "Implementation",
                description: "Execute the solution using agile methodologies with regular checkpoints and iterations."
              },
              {
                step: "04",
                title: "Optimization & Support",
                description: "Continuously monitor, optimize, and provide ongoing support to ensure sustained success."
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary-foreground font-bold text-lg">{process.step}</span>
                </div>
                <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">
                  {process.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {process.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-white">
              Ready to Start Your Transformation?
            </h2>
            <p className="text-xl text-white mb-8 font-semibold">
              Let's discuss your specific needs and develop a customized solution that drives measurable results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="bg-green-600 text-white hover:bg-green-700 font-bold text-lg shadow-lg" asChild>
                <Link to="/contact">Schedule Consultation</Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20" asChild>
                <Link to="/contact">View Success Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;