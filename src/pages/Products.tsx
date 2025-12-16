import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, Brain, TrendingUp, Database, Eye, Zap, ShoppingCart, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Products = () => {
  const productCategories = [
    {
      title: "Data Analytics Platforms",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      products: [
        {
          name: "SmartAnalytics Pro",
          description: "Enterprise-grade data analytics platform with real-time processing capabilities and advanced visualization tools."
        },
        {
          name: "DataFlow Enterprise",
          description: "Comprehensive data pipeline management system with automated ETL processes and data quality monitoring."
        },
        {
          name: "InsightHub",
          description: "Self-service analytics platform enabling business users to create reports and dashboards without technical expertise."
        }
      ]
    },
    {
      title: "AI-Powered Dashboards",
      icon: <Brain className="w-8 h-8 text-accent" />,
      products: [
        {
          name: "AI Command Center",
          description: "Intelligent dashboard that automatically surfaces key insights and anomalies using machine learning algorithms."
        },
        {
          name: "Predictive Insights Dashboard", 
          description: "Real-time dashboard with predictive analytics capabilities for proactive decision-making and trend identification."
        },
        {
          name: "Smart KPI Monitor",
          description: "AI-driven KPI tracking system that provides contextual insights and automated alerts for performance metrics."
        }
      ]
    },
    {
      title: "Predictive Analytics Tools",
      icon: <TrendingUp className="w-8 h-8 text-success" />,
      products: [
        {
          name: "ForecastPro AI",
          description: "Advanced forecasting engine using ensemble machine learning models for accurate demand and sales predictions."
        },
        {
          name: "Risk Predictor Suite",
          description: "Comprehensive risk assessment platform with predictive modeling for financial, operational, and compliance risks."
        },
        {
          name: "Customer Intelligence Platform",
          description: "Predictive customer analytics solution for churn prevention, lifetime value optimization, and personalization."
        }
      ]
    },
    {
      title: "Business Intelligence Solutions",
      icon: <Eye className="w-8 h-8 text-warning" />,
      products: [
        {
          name: "Executive Intelligence Suite",
          description: "C-suite focused BI platform providing strategic insights, executive reporting, and performance monitoring."
        },
        {
          name: "Operational BI Toolkit",
          description: "Department-level business intelligence tools for operational efficiency, resource optimization, and process improvement."
        },
        {
          name: "Financial Analytics Platform",
          description: "Specialized BI solution for financial analysis, budgeting, forecasting, and regulatory reporting."
        }
      ]
    },
    {
      title: "Retail Verticals",
      icon: <ShoppingCart className="w-8 h-8 text-primary" />,
      products: [
        {
          name: "Himali Pasal LLC",
          description: "E-commerce platform connecting customers with authentic Himalayan products. Visit www.himalipasal.com to explore our retail solutions."
        },
        {
          name: "ScanShop",
          description: "Retail software solution providing inventory management, point-of-sale systems, and customer analytics for modern retail businesses."
        }
      ]
    },
    {
      title: "Data Quality",
      icon: <Shield className="w-8 h-8 text-accent" />,
      products: [
        {
          name: "DataFlow Engine",
          description: "Software product ensuring data integrity, validation, and quality monitoring across your entire data ecosystem and e-commerce operations."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Our Products - AI Analytics Solutions | Smart Tech Analytics</title>
        <meta name="description" content="Cutting-edge analytics and AI solutions designed to accelerate your digital transformation. Explore our data analytics platforms, AI-powered dashboards, and predictive analytics tools." />
        <link rel="canonical" href="https://www.smarttechanalytics.com/products" />
        <meta property="og:url" content="https://www.smarttechanalytics.com/products" />
        <meta property="og:title" content="Our Products - AI Analytics Solutions" />
      </Helmet>
      <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Our Products
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed">
              Cutting-edge analytics and AI solutions designed to accelerate your digital transformation and drive measurable business outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            {productCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      {category.icon}
                    </div>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4 text-foreground">
                    {category.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.products.map((product, productIndex) => (
                    <Card 
                      key={productIndex} 
                      className="gradient-card border-border shadow-medium transition-smooth hover:shadow-strong hover:-translate-y-1"
                    >
                      <CardHeader>
                        <CardTitle className="text-xl font-heading text-foreground">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {product.description}
                        </p>
                        <div className="flex flex-col space-y-3">
                          {product.name === "Himali Pasal LLC" ? (
                            <>
                              <Button variant="default" size="sm" asChild>
                                <a href="https://www.himalipasal.com" target="_blank" rel="noopener noreferrer">Learn More</a>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href="https://www.himalipasal.com" target="_blank" rel="noopener noreferrer">View Case Studies</a>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="default" size="sm" asChild>
                                <Link to="/contact">Learn More</Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link to="/contact">View Case Studies</Link>
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-foreground">
              Why Choose Our Products?
            </h2>
            <p className="text-lg text-muted-foreground">
              Our solutions are built with enterprise-grade security, scalability, and performance in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-primary" />,
                title: "Real-time Processing",
                description: "Process and analyze data in real-time for immediate insights and faster decision-making."
              },
              {
                icon: <Database className="w-8 h-8 text-accent" />,
                title: "Scalable Architecture",
                description: "Built to handle enterprise-scale data volumes with cloud-native, scalable infrastructure."
              },
              {
                icon: <Brain className="w-8 h-8 text-success" />,
                title: "AI-Powered Insights",
                description: "Advanced machine learning algorithms automatically discover patterns and generate insights."
              },
              {
                icon: <Eye className="w-8 h-8 text-warning" />,
                title: "Intuitive Interface",
                description: "User-friendly interfaces designed for both technical and business users across all skill levels."
              }
            ].map((feature, index) => (
              <Card key={index} className="gradient-card border-border shadow-medium text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
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
              Ready to Experience Our Products?
            </h2>
            <p className="text-xl text-white mb-8 font-semibold">
              Schedule a demo to see how our solutions can transform your data into actionable insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact">Request Demo</Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20" asChild>
                <Link to="/contact">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Products;