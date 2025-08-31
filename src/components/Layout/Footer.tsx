import { Link } from 'react-router-dom';
import { LinkedinIcon, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">STA</span>
              </div>
              <span className="font-heading font-bold text-xl">
                Smart Tech Analytics
              </span>
            </div>
            <p className="text-primary-light text-sm">
              Empowering businesses with cutting-edge AI and analytics solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {[
                { name: 'Home', href: '/' },
                { name: 'Products', href: '/products' },
                { name: 'Services', href: '/services' },
                { name: 'Case Studies', href: '/case-studies' }
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-primary-light hover:text-primary-foreground transition-smooth text-sm"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">Services</h3>
            <div className="space-y-2">
              {[
                'Data Strategy & Governance',
                'AI/ML Consulting',
                'Cloud Infrastructure',
                'Business Intelligence'
              ].map((service) => (
                <p key={service} className="text-primary-light text-sm">
                  {service}
                </p>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-primary" />
                <span className="text-primary-light text-sm">info@smarttechanalytics.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-primary" />
                <span className="text-primary-light text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-primary" />
                <span className="text-primary-light text-sm">New York, NY</span>
              </div>
              <div className="flex items-center space-x-2">
                <LinkedinIcon size={16} className="text-primary hover:text-primary-foreground cursor-pointer transition-smooth" />
                <span className="text-primary-light text-sm">LinkedIn</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-8 text-center">
          <p className="text-primary-light text-sm">
            © 2024 Smart Tech Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;