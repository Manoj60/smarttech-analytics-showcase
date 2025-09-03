import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, CheckCircle, ArrowRight } from 'lucide-react';

const CaseStudies = () => {
  const caseStudies = [
    {
      title: "Global Retail Chain: AI-Powered Demand Forecasting",
      client: "Fortune 500 Retail Company",
      industry: "Retail & E-commerce",
      challenge: "A leading global retail chain was struggling with inventory management across 2,000+ stores, experiencing frequent stockouts and overstock situations that resulted in $50M annual losses. Their existing forecasting system relied on historical averages and couldn't account for seasonal trends, promotional impacts, or external factors.",
      solution: "Smart Tech Analytics implemented an AI-powered demand forecasting platform that integrated real-time sales data, weather patterns, economic indicators, and social media sentiment. We deployed machine learning models including ensemble forecasting algorithms and deep learning networks to predict demand at SKU-store level with 95% accuracy.",
      results: [
        "40% reduction in stockouts",
        "25% decrease in excess inventory", 
        "$35M annual cost savings",
        "15% improvement in customer satisfaction",
        "ROI achieved within 8 months"
      ],
      metrics: {
        timeframe: "12 months",
        roi: "350%",
        improvement: "40% reduction in stockouts"
      },
      icon: <TrendingUp className="w-8 h-8 text-success" />
    },
    {
      title: "Healthcare Network: Predictive Patient Analytics",
      client: "Regional Healthcare System",
      industry: "Healthcare",
      challenge: "A major healthcare network with 15 hospitals needed to optimize patient flow and reduce readmission rates. They faced challenges with emergency department overcrowding, inefficient bed management, and 18% readmission rate that exceeded industry benchmarks, resulting in significant financial penalties.",
      solution: "We developed a comprehensive predictive analytics platform that analyzed patient data, treatment patterns, and operational metrics. The solution included real-time patient risk scoring, predictive discharge planning, and resource optimization algorithms that helped clinical staff make data-driven decisions for patient care.",
      results: [
        "22% reduction in patient readmissions",
        "30% improvement in bed utilization",
        "45 minutes average reduction in ED wait times",
        "$12M annual savings from penalty avoidance",
        "95% staff adoption rate within 6 months"
      ],
      metrics: {
        timeframe: "18 months",
        roi: "420%",
        improvement: "22% reduction in readmissions"
      },
      icon: <Target className="w-8 h-8 text-primary" />
    },
    {
      title: "Manufacturing Giant: Smart Factory Optimization",
      client: "Global Manufacturing Corporation",
      industry: "Manufacturing",
      challenge: "A multinational manufacturing company needed to optimize production efficiency across 50 facilities worldwide. They experienced unpredictable equipment failures, suboptimal production scheduling, and quality control issues that resulted in 15% overall equipment effectiveness (OEE) below industry standards.",
      solution: "Smart Tech Analytics implemented an Industrial IoT and AI-driven smart factory solution. We deployed sensors across production lines, developed predictive maintenance models, and created real-time optimization algorithms for production scheduling and quality control. The platform integrated with existing ERP systems and provided actionable insights through executive dashboards.",
      results: [
        "35% increase in overall equipment effectiveness",
        "60% reduction in unplanned downtime",
        "20% improvement in production throughput",
        "$25M annual operational savings",
        "50% faster issue resolution time"
      ],
      metrics: {
        timeframe: "24 months",
        roi: "280%",
        improvement: "35% increase in OEE"
      },
      icon: <CheckCircle className="w-8 h-8 text-accent" />
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Case Studies
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed">
              Real-world success stories showcasing how our AI and analytics solutions have transformed businesses and delivered measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover how we've helped organizations across industries achieve breakthrough results through innovative data and AI solutions.
            </p>
          </div>

          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <Card 
                key={index} 
                className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong"
              >
                <CardContent className="p-8 lg:p-12">
                  {/* Header */}
                  <div className="flex items-start space-x-4 mb-8">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      {study.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-heading font-bold mb-2 text-foreground">
                        {study.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">Client: {study.client}</span>
                        <span>•</span>
                        <span className="font-medium">Industry: {study.industry}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-secondary/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{study.metrics.timeframe}</div>
                      <div className="text-sm text-muted-foreground">Project Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success mb-1">{study.metrics.roi}</div>
                      <div className="text-sm text-muted-foreground">Return on Investment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent mb-1">{study.metrics.improvement}</div>
                      <div className="text-sm text-muted-foreground">Key Improvement</div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Challenge & Solution */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-heading font-semibold mb-3 text-foreground">
                          The Challenge
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {study.challenge}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-heading font-semibold mb-3 text-foreground">
                          Our Solution
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {study.solution}
                        </p>
                      </div>
                    </div>

                    {/* Results */}
                    <div>
                      <h4 className="text-lg font-heading font-semibold mb-4 text-foreground">
                        Results Achieved
                      </h4>
                      <ul className="space-y-3">
                        {study.results.map((result, resultIndex) => (
                          <li key={resultIndex} className="flex items-start space-x-3">
                            <CheckCircle size={20} className="text-success mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{result}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6 pt-6 border-t border-border">
                        <Button variant="default" asChild>
                          <Link to="/contact" className="flex items-center">
                            Discuss Your Project
                            <ArrowRight className="ml-2" size={16} />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Expertise */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Industry Expertise
            </h2>
            <p className="text-lg text-muted-foreground">
              We've successfully delivered solutions across diverse industries, understanding unique challenges and requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Financial Services",
              "Healthcare",
              "Retail & E-commerce",
              "Manufacturing",
              "Energy & Utilities",
              "Technology",
              "Government",
              "Education"
            ].map((industry, index) => (
              <Card key={index} className="gradient-card border-border shadow-soft text-center hover:shadow-medium transition-smooth">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground">{industry}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-white">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-white mb-8 font-semibold">
              Join our growing list of satisfied clients who have transformed their businesses with our solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="bg-green-600 text-white hover:bg-green-700 font-bold text-lg" asChild>
                <Link to="/contact">Start Your Project</Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20" asChild>
                <Link to="/contact">Explore Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CaseStudies;