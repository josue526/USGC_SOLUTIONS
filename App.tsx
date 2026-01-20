import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck, Users, Menu, X, Home, Lock, ChevronRight } from 'lucide-react';
import ResidentPortal from './portals/ResidentPortal';
import ManagementPortal from './portals/ManagementPortal';
import SecurityDashboard from './portals/SecurityDashboard';

// Use lh3.googleusercontent.com format for better embedding reliability
export const HERO_BG_URL = "https://lh3.googleusercontent.com/d/1PqgXyxIvCRlpyv0PvsRuqoqm9tXYrmmy";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Residents', path: '/resident', icon: <Users className="w-5 h-5" /> },
    { name: 'Management', path: '/management', icon: <Building2 className="w-5 h-5" /> },
    { name: 'Security', path: '/security', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-brand-900 text-white shadow-lg sticky top-0 z-50 border-b border-brand-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex flex-col group transition-transform active:scale-95 px-4 py-2">
              <div className="relative z-10 flex flex-col">
                <span className="font-black text-2xl tracking-tighter leading-none text-white group-hover:text-brand-100 drop-shadow-md">U.S. GUARD CO.</span>
                <span className="text-[10px] text-brand-300 font-bold tracking-[0.2em] uppercase mt-1">Solutions</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-brand-700 text-white shadow-inner scale-105'
                      : 'text-brand-100 hover:bg-brand-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-brand-100 hover:bg-brand-700 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-brand-800 border-t border-brand-700">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-semibold ${
                  location.pathname === item.path ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex flex-col items-center md:items-start">
           <span className="font-black text-xl tracking-tighter text-brand-900">U.S. GUARD CO.</span>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Client Authorization Terminal</p>
        </div>
        <div className="text-center md:text-right">
           <p className="text-gray-500 text-sm font-medium">Licensed & Insured Security Operations</p>
           <p className="text-gray-400 text-xs mt-1">&copy; {new Date().getFullYear()} USG Custom Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
);

const RoleCard = ({ to, icon: Icon, title, description, colorClass, delay }: any) => (
  <Link 
    to={to} 
    className={`group relative overflow-hidden bg-white p-1 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-slide-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="p-8 h-full flex flex-col items-center text-center">
      <div className={`p-5 rounded-2xl mb-6 ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-12 h-12 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight group-hover:text-brand-700 transition-colors">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-medium mb-8 text-sm">{description}</p>
      
      <div className="mt-auto flex items-center text-brand-600 font-bold text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
        Enter Portal <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
    <div className={`absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
      <Lock className="w-5 h-5 text-gray-300" />
    </div>
  </Link>
);

const Landing = () => (
  <div className="flex-grow flex flex-col justify-center items-center py-16 px-4 bg-gray-50 relative overflow-hidden">
    <div className="max-w-6xl w-full relative z-10">
      {/* Header Section with Background Image */}
      <div className="text-center mb-16 animate-fade-in relative flex flex-col items-center justify-center min-h-[300px]">
        {/* Background Image */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img 
              src={HERO_BG_URL} 
              alt="Background" 
              className="w-auto h-full max-h-[400px] object-contain opacity-20" 
              referrerPolicy="no-referrer"
            /> 
        </div>
        
        {/* Text Content */}
        <div className="relative z-10">
            <div className="inline-block bg-brand-100/90 backdrop-blur-sm text-brand-700 text-[10px] font-black tracking-[0.3em] uppercase px-4 py-2 rounded-full mb-6 shadow-sm border border-brand-200">
            Securing Public Safety and Maintaining Client Interests at All Costs
            </div>
            <h2 className="text-6xl font-black text-brand-900 tracking-tighter mb-4 drop-shadow-sm">
            US GUARD CO SOLUTIONS
            </h2>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto uppercase tracking-[0.2em] font-black">
            Serve. Secure. Lead. Protect
            </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <RoleCard 
          to="/resident" 
          icon={Users} 
          title="Resident Login" 
          description="Access your secure resident profile, update IDs, and request visitor pre-authorization."
          colorClass="bg-blue-600"
          delay={100}
        />
        <RoleCard 
          to="/management" 
          icon={Building2} 
          title="Property Login" 
          description="Property Manager portal for lease verification, resident approval, and site reporting."
          colorClass="bg-emerald-600"
          delay={200}
        />
        <RoleCard 
          to="/security" 
          icon={ShieldCheck} 
          title="Security Login" 
          description="Active duty officer terminal for visitor check-in, real-time monitoring, and enforcement."
          colorClass="bg-red-600"
          delay={300}
        />
      </div>

      <div className="mt-20 pt-10 border-t border-gray-200 text-center animate-fade-in">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center">
          <Lock className="w-3 h-3 mr-2" /> Encrypted Connection • Biometric Integration Ready
        </p>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col selection:bg-brand-200">
        <Navigation />
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/resident" element={<ResidentPortal />} />
            <Route path="/management" element={<ManagementPortal />} />
            <Route path="/security" element={<SecurityDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;