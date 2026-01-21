

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/mockDb';
import { VisitorProfile, ResidentProfile, SecurityOfficerRequest, MaintenanceType, AlertNote, PropertyRequest, VisitorOverstayAlert, MaintenanceRequest } from '../types';
import { ShieldCheck, UserCog, AlertCircle, Home, Camera, CheckCircle2, ShieldAlert, Building, Wrench, MessageSquare, FileText, Upload, ChevronRight, Check, Edit3, Save, X, Eye, FileBadge, PlusCircle, ArrowLeft, BadgeCheck, XCircle, ScanFace, CreditCard, RefreshCw, Search, Clock, Users, Activity, Bell, MapPin, UserCheck, LogOut, CheckCircle, Siren, Lock, Unlock, KeyRound, AlertTriangle, Timer, QrCode, ClipboardCheck, Briefcase, LayoutDashboard, Database, Power, Globe, Trash2, Filter } from 'lucide-react';
import { format, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import jsQR from 'jsqr';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1MVJkilhkDs4l5oWQmbVgqOeXdUfYA7vp";

// --- Components ---

const CameraCapture = ({ onCapture, onCancel, label }: { onCapture: (img: string) => void, onCancel: () => void, label: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Camera access denied. Please check permissions.");
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg');
        onCapture(data);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-gray-800">
        <div className="bg-brand-900 p-6 text-white text-center">
          <h3 className="font-black uppercase tracking-widest text-sm">{label}</h3>
        </div>
        
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {error ? (
            <p className="text-white text-xs font-bold uppercase">{error}</p>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 flex justify-between items-center bg-gray-50">
          <button onClick={onCancel} className="text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors">Cancel</button>
          <button onClick={capture} className="bg-brand-900 text-white p-6 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-brand-700">
            <Camera className="w-8 h-8" />
          </button>
          <div className="w-12" />
        </div>
      </div>
      <p className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">Center {label} in frame</p>
    </div>
  );
};

const QRScanner = ({ onScan, onCancel }: { onScan: (data: string) => void, onCancel: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        
        async function startCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.play();
                    scan();
                }
            } catch (err) {
                console.error("Camera error:", err);
            }
        }

        const scan = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        onScan(code.data);
                        return;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(scan);
        };

        startCamera();
        return () => {
            cancelAnimationFrame(animationFrameId);
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
             <div className="relative w-full max-w-sm aspect-square bg-black border-4 border-brand-500/30 rounded-3xl overflow-hidden shadow-2xl">
                 <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                 <canvas ref={canvasRef} className="hidden" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-48 h-48 border-2 border-brand-400/80 rounded-2xl relative">
                         <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan-line"></div>
                     </div>
                 </div>
             </div>
             <p className="text-white text-xs font-black uppercase tracking-widest mt-8 animate-pulse">Scanning for Resident Code...</p>
             <button onClick={onCancel} className="mt-8 bg-white/10 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-white/20 transition-colors">Cancel Scan</button>
             <style>{`
               @keyframes scan-line { 0% { top: 10%; opacity: 0; } 50% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
               .animate-scan-line { animation: scan-line 2s linear infinite; }
             `}</style>
        </div>
    );
};

const SecurityDashboard = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REQUEST' | 'PROPERTY_SELECT' | 'DASHBOARD' | 'ADMIN_DASHBOARD' | 'SUCCESS'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SUMMARY' | 'MONITOR' | 'CHECKIN' | 'RESIDENT_CHECKIN' | 'MAINTENANCE' | 'INTERACTION' | 'ADMIN' | 'OVERWATCH'>('DASHBOARD');
  
  // Admin State
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'OFFICERS' | 'PROPERTIES' | 'MAINTENANCE' | 'ALERTS' | 'ACCOUNTS'>('OVERVIEW');
  const [pendingMaintenance, setPendingMaintenance] = useState<MaintenanceRequest[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<AlertNote[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any[]>([]);

  // Auth State
  const [onDutyProperty, setOnDutyProperty] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [officerForm, setOfficerForm] = useState({ firstName: '', lastName: '', badgeNumber: '', credentials: { username: '', password: '' } });
  const [error, setError] = useState('');

  // Officer Workflows
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [foundResident, setFoundResident] = useState<ResidentProfile | null>(null);
  const [resCheckInResult, setResCheckInResult] = useState<'GRANTED' | 'DENIED' | null>(null);
  const [visitorForm, setVisitorForm] = useState({ firstName: '', lastName: '', residentUnit: '', complex: '', relationship: '', duration: 4 });
  const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);

  // Camera/QR
  const [cameraTarget, setCameraTarget] = useState<'NONE' | 'VISITOR' | 'ID'>('NONE');
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Data
  const [availableProperties, setAvailableProperties] = useState<PropertyRequest[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorProfile[]>([]);
  const [overstayAlerts, setOverstayAlerts] = useState<VisitorOverstayAlert[]>([]);
  const [pendingOfficers, setPendingOfficers] = useState<SecurityOfficerRequest[]>([]);
  const [pendingProperties, setPendingProperties] = useState<PropertyRequest[]>([]);

  useEffect(() => {
    setAvailableProperties(db.getApprovedProperties());
    if (isSuperAdmin) refreshAdminData();
  }, [isSuperAdmin, mode, adminTab]);

  useEffect(() => {
    if (isLoggedIn && onDutyProperty) refreshData();
  }, [isLoggedIn, onDutyProperty, activeTab]);

  const refreshData = () => {
      const visitors = db.getAllActiveVisitors().filter(v => v.complex === onDutyProperty);
      setActiveVisitors(visitors);
      setOverstayAlerts(db.getConsecutiveVisitAlerts().filter(a => a.propertyName === onDutyProperty));
  };

  const refreshAdminData = () => {
      setPendingOfficers(db.getOfficerRequests().filter(o => o.status === 'PENDING'));
      setPendingProperties(db.getPropertyRequests().filter(p => p.status === 'PENDING'));
      setPendingMaintenance(db.getMaintenanceRequests().filter(m => m.status === 'PENDING_REVIEW'));
      setPendingAlerts(db.getAlertNotes().filter(a => a.status === 'UNDER_REVIEW'));
      setAllAccounts(db.getAllUserCredentials());

      const visitors = db.getAllActiveVisitors();
      const props = db.getApprovedProperties();
      const stats = props.map(p => ({
          name: p.propertyName,
          activeVisitors: visitors.filter(v => v.complex === p.propertyName).length,
          alerts: db.getAlertNotes().filter(n => n.propertyName === p.propertyName && n.status === 'UNDER_REVIEW').length,
          maintenance: db.getMaintenanceRequests().filter(m => m.propertyName === p.propertyName && m.status === 'PENDING_REVIEW').length
      }));
      setGlobalStats(stats);
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const username = creds.username.trim();
      const password = creds.password.trim();
      
      if (username.toLowerCase() === 'josue@usguardco' && password === 'solutions') {
          setIsSuperAdmin(true);
          setMode('ADMIN_DASHBOARD');
          setError('');
          return;
      }

      const officer = db.authenticateOfficer({ username, password });
      if (officer) {
          setIsLoggedIn(true);
          if (officer.onDutyProperty) {
              setOnDutyProperty(officer.onDutyProperty);
              setMode('DASHBOARD');
          } else {
              setMode('PROPERTY_SELECT');
          }
          setError('');
      } else {
          setError('Invalid Credentials');
      }
  };

  const handleOfficerRegister = (e: React.FormEvent) => {
      e.preventDefault();
      try {
          db.createOfficerRequest(officerForm);
          setMode('SUCCESS');
      } catch (err: any) { setError(err.message); }
  };

  const checkInVisitor = (e: React.FormEvent) => {
      e.preventDefault();
      try {
          db.checkInVisitor({
              ...visitorForm,
              complex: onDutyProperty,
              visitorImageUrl: visitorPhoto || undefined,
              visitorIdImageUrl: idPhoto || undefined,
              residentId: 'lookup'
          } as any);
          setVisitorForm({ firstName: '', lastName: '', residentUnit: '', complex: '', relationship: '', duration: 4 });
          setVisitorPhoto(null);
          setIdPhoto(null);
          setActiveTab('MONITOR');
          refreshData();
          alert('Visitor Checked In Successfully');
      } catch (err: any) { setError(err.message); }
  };

  const handleResidentScan = (data: string) => {
      try {
          const parsed = JSON.parse(data);
          if (parsed.id) {
             const resident = db.lookupResidentByIdOrDob(parsed.id, onDutyProperty);
             if (resident) {
                 setFoundResident(resident);
                 setResCheckInResult('GRANTED');
                 db.logResidentCheckIn({
                     residentId: resident.id,
                     residentName: `${resident.firstName} ${resident.lastName}`,
                     propertyName: onDutyProperty,
                     officerName: creds.username,
                     status: 'GRANTED',
                     searchQuery: 'QR_SCAN'
                 });
             } else { setResCheckInResult('DENIED'); }
          }
      } catch (e) { setError('Invalid QR Data'); }
      setShowQrScanner(false);
  };

  const resetAccount = (id: string) => {
      alert(`Password reset requested for User ID: ${id}. A system email has been dispatched.`);
  };

  const handlePropertySelect = (propertyName: string) => {
      setOnDutyProperty(propertyName);
      setMode('DASHBOARD');
  };

  // --- VIEWS ---

  if (mode === 'LOGIN') {
      return (
          <div className="max-w-md mx-auto py-24 px-4">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center">
              <img src={LOGO_URL} alt="Logo" className="w-32 mx-auto mb-6" referrerPolicy="no-referrer" />
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Security Terminal</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">Officer Auth Required</p>
              {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
              <form onSubmit={handleLogin} className="space-y-6">
                <input type="text" placeholder="BADGE / USERNAME" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
                <input type="password" placeholder="PASSWORD" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
                <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl hover:bg-brand-800 transition-colors shadow-lg">Officer Login</button>
                <button type="button" onClick={() => { setError(''); setMode('REQUEST'); }} className="text-brand-600 font-black uppercase text-[10px] py-1 hover:text-brand-800 tracking-widest">Apply for Officer Badge</button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                  <button 
                      onClick={() => { setCreds({username: 'josue@usguardco', password: 'solutions'}); setError(''); }} 
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-brand-600 flex items-center justify-center gap-2 mx-auto transition-colors"
                  >
                      <Lock className="w-3 h-3"/> System Admin Access
                  </button>
              </div>
            </div>
          </div>
      );
  }

  if (mode === 'REQUEST') {
      return (
          <div className="max-w-xl mx-auto py-24 px-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                      <div><h2 className="text-2xl font-black uppercase tracking-tighter">New Officer Application</h2><p className="text-[10px] text-brand-300 font-bold uppercase tracking-[0.3em]">Clearance Request</p></div>
                      <button onClick={() => setMode('LOGIN')} className="text-brand-300 hover:text-white transition-colors"><XCircle className="w-6 h-6"/></button>
                  </div>
                  <form onSubmit={handleOfficerRegister} className="p-10 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="FIRST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={officerForm.firstName} onChange={e => setOfficerForm({...officerForm, firstName: e.target.value})} />
                          <input type="text" placeholder="LAST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={officerForm.lastName} onChange={e => setOfficerForm({...officerForm, lastName: e.target.value})} />
                      </div>
                      <input type="text" placeholder="BADGE NUMBER" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={officerForm.badgeNumber} onChange={e => setOfficerForm({...officerForm, badgeNumber: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4 border-t pt-6">
                           <input type="text" placeholder="USERNAME" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={officerForm.credentials.username} onChange={e => setOfficerForm({...officerForm, credentials: {...officerForm.credentials, username: e.target.value}})} />
                           <input type="password" placeholder="PASSWORD" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={officerForm.credentials.password} onChange={e => setOfficerForm({...officerForm, credentials: {...officerForm.credentials, password: e.target.value}})} />
                      </div>
                      <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-5 rounded-2xl shadow-xl">Submit Application</button>
                  </form>
              </div>
          </div>
      );
  }

  if (mode === 'SUCCESS') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900">Application Sent</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-8">Pending Super Admin approval.</p>
          <button onClick={() => setMode('LOGIN')} className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl">Return to Login</button>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (mode === 'ADMIN_DASHBOARD') {
      return (
          <div className="min-h-screen bg-gray-900 pb-20 font-sans">
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
              
              <div className="bg-black text-white p-6 sticky top-0 z-40 shadow-xl border-b border-gray-800">
                  <div className="max-w-7xl mx-auto flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <ShieldAlert className="w-10 h-10 text-red-500" />
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Super Admin</h1>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global System Override</p>
                          </div>
                      </div>
                      <button onClick={() => { setIsSuperAdmin(false); setMode('LOGIN'); setCreds({username: '', password: ''}); }} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors text-xs font-black uppercase px-4 text-gray-300">Logoff</button>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto p-4 mt-8">
                   <div className="flex overflow-x-auto gap-3 mb-8 pb-4 scrollbar-hide">
                       <button onClick={() => setAdminTab('OVERVIEW')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'OVERVIEW' ? 'bg-white text-gray-900 shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <Globe className="w-4 h-4"/> Global Monitor
                       </button>
                       <button onClick={() => setAdminTab('MAINTENANCE')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'MAINTENANCE' ? 'bg-orange-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <Wrench className="w-4 h-4"/> Maintenance ({pendingMaintenance.length})
                       </button>
                       <button onClick={() => setAdminTab('ALERTS')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'ALERTS' ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <Bell className="w-4 h-4"/> Interaction Alerts ({pendingAlerts.length})
                       </button>
                       <button onClick={() => setAdminTab('OFFICERS')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'OFFICERS' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <BadgeCheck className="w-4 h-4"/> Officer Approvals ({pendingOfficers.length})
                       </button>
                       <button onClick={() => setAdminTab('PROPERTIES')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'PROPERTIES' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <Building className="w-4 h-4"/> Property Requests ({pendingProperties.length})
                       </button>
                       <button onClick={() => setAdminTab('ACCOUNTS')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap transition-all ${adminTab === 'ACCOUNTS' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                           <Database className="w-4 h-4"/> Accounts
                       </button>
                   </div>

                   {adminTab === 'OVERVIEW' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                           {globalStats.map((stat: any) => (
                               <div key={stat.name} className="bg-gray-800 p-6 rounded-[2.5rem] border border-gray-700 shadow-xl hover:border-gray-600 transition-colors">
                                   <div className="flex justify-between items-start mb-6">
                                       <div>
                                           <h3 className="text-lg font-black uppercase text-white tracking-tight">{stat.name}</h3>
                                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Status</p>
                                       </div>
                                       <div className="p-3 bg-gray-900 rounded-2xl border border-gray-700"><Building className="w-5 h-5 text-gray-500"/></div>
                                   </div>
                                   <div className="grid grid-cols-3 gap-3">
                                       <div className="bg-gray-900 p-4 rounded-2xl text-center border border-gray-700">
                                           <span className="block text-2xl font-black text-white">{stat.activeVisitors}</span>
                                           <span className="text-[8px] font-bold text-gray-500 uppercase">Visitors</span>
                                       </div>
                                       <div className="bg-gray-900 p-4 rounded-2xl text-center border border-gray-700">
                                           <span className="block text-2xl font-black text-red-500">{stat.alerts}</span>
                                           <span className="text-[8px] font-bold text-gray-500 uppercase">Alerts</span>
                                       </div>
                                       <div className="bg-gray-900 p-4 rounded-2xl text-center border border-gray-700">
                                           <span className="block text-2xl font-black text-orange-500">{stat.maintenance}</span>
                                           <span className="text-[8px] font-bold text-gray-500 uppercase">Maint.</span>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}

                   {adminTab === 'MAINTENANCE' && (
                       <div className="grid gap-4 animate-slide-up">
                           {pendingMaintenance.length === 0 ? (
                               <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[3rem] text-gray-400 font-black uppercase">No pending maintenance requests.</div>
                           ) : pendingMaintenance.map(m => (
                               <div key={m.id} className="bg-gray-800 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between border border-gray-700 gap-6">
                                   <div className="flex items-start gap-4">
                                       <div className="p-4 bg-orange-900/20 rounded-2xl"><Wrench className="w-8 h-8 text-orange-500"/></div>
                                       <div>
                                           <h3 className="text-xl font-black uppercase text-white">{m.type}</h3>
                                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{m.propertyName} • {format(m.reportedAt, 'MM/dd HH:mm')}</p>
                                           <p className="text-sm text-gray-300 italic">"{m.details}"</p>
                                           <p className="text-[10px] font-bold text-gray-500 uppercase mt-2">Reported by: {m.reportedBy}</p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => { db.updateMaintenanceStatus(m.id, 'APPROVED'); refreshAdminData(); }} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] flex-1 md:flex-none whitespace-nowrap">Approve & Forward</button>
                                       <button onClick={() => { db.updateMaintenanceStatus(m.id, 'REJECTED'); refreshAdminData(); }} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-black uppercase text-[10px] flex-1 md:flex-none whitespace-nowrap">Deny</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}

                   {adminTab === 'ALERTS' && (
                       <div className="grid gap-4 animate-slide-up">
                           {pendingAlerts.length === 0 ? (
                               <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[3rem] text-gray-400 font-black uppercase">No pending security alerts.</div>
                           ) : pendingAlerts.map(a => (
                               <div key={a.id} className="bg-gray-800 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between border border-red-900/30 gap-6">
                                   <div className="flex items-start gap-4">
                                       <div className="p-4 bg-red-900/20 rounded-2xl"><ShieldAlert className="w-8 h-8 text-red-500"/></div>
                                       <div>
                                           <h3 className="text-xl font-black uppercase text-white">{a.residentName} <span className="text-gray-500 text-sm">UNIT {a.unitNumber}</span></h3>
                                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{a.propertyName} • {format(a.timestamp, 'MM/dd HH:mm')}</p>
                                           <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                               <p className="text-sm text-red-200 italic">"{a.details}"</p>
                                           </div>
                                           {a.thermsStatus === 'YES' && <p className="mt-2 text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded inline-block uppercase">POLICE DISPATCHED</p>}
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => { db.updateAlertNoteStatus(a.id, 'FORWARDED_TO_PM'); refreshAdminData(); }} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] flex-1 md:flex-none whitespace-nowrap">Approve & Forward</button>
                                       <button onClick={() => { db.updateAlertNoteStatus(a.id, 'STORED_INTERNAL'); refreshAdminData(); }} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-black uppercase text-[10px] flex-1 md:flex-none whitespace-nowrap">Internal Archive</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}

                   {adminTab === 'ACCOUNTS' && (
                       <div className="space-y-6 animate-slide-up">
                           <div className="bg-gray-800 p-8 rounded-[3rem] border border-gray-700">
                               <h3 className="text-xl font-black uppercase text-white mb-6">System Account Database</h3>
                               <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                                   {allAccounts.map((acc: any) => (
                                       <div key={acc.id} className="bg-gray-900 p-4 rounded-2xl flex justify-between items-center border border-gray-800">
                                           <div className="flex items-center gap-4">
                                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.role === 'RESIDENT' ? 'bg-blue-900/50 text-blue-400' : acc.role === 'SECURITY' ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                                                   {acc.role === 'RESIDENT' ? <Users className="w-5 h-5"/> : acc.role === 'SECURITY' ? <ShieldCheck className="w-5 h-5"/> : <Briefcase className="w-5 h-5"/>}
                                               </div>
                                               <div>
                                                   <p className="text-sm font-black text-white uppercase">{acc.name}</p>
                                                   <p className="text-[10px] text-gray-500 font-bold uppercase">{acc.role} • {acc.username}</p>
                                               </div>
                                           </div>
                                           <button onClick={() => resetAccount(acc.id)} className="text-[10px] font-black uppercase bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-700">
                                               <RefreshCw className="w-3 h-3"/> Reset Pass
                                           </button>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {adminTab === 'OFFICERS' && (
                       <div className="grid gap-4 animate-slide-up">
                           {pendingOfficers.length === 0 ? (
                               <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[3rem] text-gray-400 font-black uppercase">No pending officer applications.</div>
                           ) : pendingOfficers.map(o => (
                               <div key={o.id} className="bg-gray-800 p-6 rounded-[2rem] flex items-center justify-between border border-gray-700">
                                   <div className="flex items-center gap-4">
                                       <div className="p-4 bg-gray-900 rounded-2xl"><UserCog className="w-8 h-8 text-gray-400"/></div>
                                       <div>
                                           <h3 className="text-xl font-black uppercase text-white">{o.firstName} {o.lastName}</h3>
                                           <p className="text-xs font-bold text-gray-500 uppercase">Badge: {o.badgeNumber} • User: {o.credentials?.username}</p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => { db.approveOfficer(o.id); refreshAdminData(); }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px]">Approve Badge</button>
                                       <button onClick={() => { db.rejectOfficer(o.id); refreshAdminData(); }} className="px-6 py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-xl font-black uppercase text-[10px]">Reject</button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>

                   {adminTab === 'PROPERTIES' && (
                       <div className="grid gap-4 animate-slide-up">
                           {pendingProperties.length === 0 ? (
                               <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[3rem] text-gray-400 font-black uppercase">No pending property requests.</div>
                           ) : pendingProperties.map(p => (
                               <div key={p.id} className="bg-gray-800 p-6 rounded-[2rem] flex items-center justify-between border border-gray-700">
                                   <div className="flex items-center gap-4">
                                       <div className="p-4 bg-gray-900 rounded-2xl"><Building className="w-8 h-8 text-gray-400"/></div>
                                       <div>
                                           <h3 className="text-xl font-black uppercase text-white">{p.propertyName}</h3>
                                           <p className="text-xs font-bold text-gray-500 uppercase">{p.city}, {p.state} • Manager: {p.managerName}</p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => { db.approveProperty(p.id); refreshAdminData(); }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px]">Activate Property</button>
                                       <button onClick={() => { db.rejectProperty(p.id); refreshAdminData(); }} className="px-6 py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-xl font-black uppercase text-[10px]">Reject</button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
              </div>
          </div>
      );
  }

  // --- PROPERTY SELECT FOR OFFICERS ---
  if (mode === 'PROPERTY_SELECT') {
      return (
          <div className="max-w-4xl mx-auto py-24 px-4 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-900 mb-8">Select Active Post</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableProperties.map(p => (
                      <button key={p.id} onClick={() => handlePropertySelect(p.propertyName)} className="bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-brand-500 group">
                          <Building className="w-12 h-12 text-gray-400 group-hover:text-brand-600 mx-auto mb-4" />
                          <h3 className="text-xl font-black uppercase text-gray-900">{p.propertyName}</h3>
                          <p className="text-xs font-bold text-gray-500 uppercase mt-2">{p.city}, {p.state}</p>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // --- OFFICER DASHBOARD ---
  return (
      <div className="min-h-screen pb-20 font-sans">
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
          
          {showQrScanner && <QRScanner onScan={handleResidentScan} onCancel={() => setShowQrScanner(false)} />}
          {cameraTarget !== 'NONE' && (
              <CameraCapture 
                  label={cameraTarget === 'VISITOR' ? 'Visitor Photo' : 'ID Document'} 
                  onCancel={() => setCameraTarget('NONE')} 
                  onCapture={(img) => {
                      if (cameraTarget === 'VISITOR') setVisitorPhoto(img);
                      else setIdPhoto(img);
                      setCameraTarget('NONE');
                  }} 
              />
          )}

          <div className="bg-brand-900 text-white p-4 sticky top-0 z-40 shadow-xl">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <ShieldCheck className="w-8 h-8 text-brand-300" />
                      <div>
                          <h1 className="text-xl font-black uppercase tracking-tighter">Security Ops</h1>
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{onDutyProperty}</p>
                      </div>
                  </div>
                  <button onClick={() => setMode('LOGIN')} className="bg-brand-800 p-2 rounded-lg hover:bg-brand-700 transition-colors"><LogOut className="w-5 h-5"/></button>
              </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 mt-6">
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide mb-6">
                  {['DASHBOARD', 'CHECKIN', 'RESIDENT_CHECKIN', 'MONITOR'].map(t => (
                      <button 
                          key={t}
                          onClick={() => setActiveTab(t as any)}
                          className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] whitespace-nowrap transition-all ${activeTab === t ? 'bg-brand-900 text-white shadow-lg scale-105' : 'bg-white text-gray-500'}`}
                      >
                          {t.replace('_', ' ')}
                      </button>
                  ))}
              </div>

              {activeTab === 'DASHBOARD' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                      <div onClick={() => setActiveTab('MONITOR')} className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-brand-500 cursor-pointer hover:translate-y-1 transition-transform">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-brand-50 rounded-xl"><Users className="w-6 h-6 text-brand-600"/></div>
                              <span className="text-3xl font-black text-gray-900">{activeVisitors.length}</span>
                          </div>
                          <h3 className="font-black uppercase text-gray-400 text-xs tracking-widest">Active Guests</h3>
                      </div>
                      
                      <div className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-red-500">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600"/></div>
                              <span className="text-3xl font-black text-gray-900">{overstayAlerts.length}</span>
                          </div>
                          <h3 className="font-black uppercase text-gray-400 text-xs tracking-widest">Overstay Alerts</h3>
                      </div>
                  </div>
              )}

              {activeTab === 'CHECKIN' && (
                  <div className="bg-white rounded-[2.5rem] shadow-xl p-8 animate-slide-up">
                      <h2 className="text-2xl font-black uppercase text-gray-900 mb-6">Visitor Processing</h2>
                      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
                      <form onSubmit={checkInVisitor} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="FIRST NAME" required className="p-4 bg-gray-50 rounded-xl font-bold uppercase text-sm" value={visitorForm.firstName} onChange={e => setVisitorForm({...visitorForm, firstName: e.target.value})} />
                              <input type="text" placeholder="LAST NAME" required className="p-4 bg-gray-50 rounded-xl font-bold uppercase text-sm" value={visitorForm.lastName} onChange={e => setVisitorForm({...visitorForm, lastName: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="UNIT NO." required className="p-4 bg-gray-50 rounded-xl font-bold uppercase text-sm" value={visitorForm.residentUnit} onChange={e => setVisitorForm({...visitorForm, residentUnit: e.target.value})} />
                              <select className="p-4 bg-gray-50 rounded-xl font-bold uppercase text-sm" value={visitorForm.duration} onChange={e => setVisitorForm({...visitorForm, duration: Number(e.target.value)})}>
                                  <option value={4}>4 Hours Pass</option>
                                  <option value={12}>12 Hours Pass</option>
                                  <option value={24}>24 Hours Pass</option>
                                  <option value={72}>72 Hours (Weekend)</option>
                              </select>
                          </div>
                          
                          <div className="flex gap-4">
                              <button type="button" onClick={() => setCameraTarget('VISITOR')} className={`flex-1 p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${visitorPhoto ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-brand-500'}`}>
                                  {visitorPhoto ? <CheckCircle className="w-6 h-6 text-emerald-500"/> : <Camera className="w-6 h-6 text-gray-400"/>}
                                  <span className="text-[10px] font-black uppercase text-gray-500">Visitor Photo</span>
                              </button>
                              <button type="button" onClick={() => setCameraTarget('ID')} className={`flex-1 p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${idPhoto ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-brand-500'}`}>
                                  {idPhoto ? <CheckCircle className="w-6 h-6 text-emerald-500"/> : <CreditCard className="w-6 h-6 text-gray-400"/>}
                                  <span className="text-[10px] font-black uppercase text-gray-500">ID Scan</span>
                              </button>
                          </div>

                          <button type="submit" className="w-full bg-brand-900 text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-brand-800 transition-all">Authorize Entry</button>
                      </form>
                  </div>
              )}

              {activeTab === 'RESIDENT_CHECKIN' && (
                  <div className="bg-white rounded-[2.5rem] shadow-xl p-8 animate-slide-up text-center">
                      <h2 className="text-2xl font-black uppercase text-gray-900 mb-8">Resident Quick Entry</h2>
                      
                      {!foundResident ? (
                        <div className="space-y-8">
                            <button onClick={() => setShowQrScanner(true)} className="w-full py-12 bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all group flex flex-col items-center justify-center">
                                <QrCode className="w-20 h-20 text-gray-300 group-hover:text-brand-600 mb-4 transition-colors"/>
                                <span className="text-sm font-black uppercase text-gray-500 group-hover:text-brand-900">Scan Digital ID</span>
                            </button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-black text-gray-400 uppercase">Or Manual Search</span></div>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter Unit Number or Name" 
                                    className="flex-grow p-4 bg-gray-50 rounded-xl font-bold uppercase text-gray-900"
                                    value={resSearchQuery}
                                    onChange={e => setResSearchQuery(e.target.value)}
                                />
                                <button 
                                    onClick={() => {
                                        const r = db.lookupResidentByIdOrDob(resSearchQuery, onDutyProperty);
                                        setFoundResident(r || null);
                                        setResCheckInResult(r ? 'GRANTED' : 'DENIED');
                                    }}
                                    className="bg-brand-900 text-white px-6 rounded-xl"
                                >
                                    <Search />
                                </button>
                            </div>
                        </div>
                      ) : (
                          <div className={`p-8 rounded-[2rem] border-4 ${resCheckInResult === 'GRANTED' ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
                               {resCheckInResult === 'GRANTED' ? <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4"/> : <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4"/>}
                               <h3 className={`text-3xl font-black uppercase ${resCheckInResult === 'GRANTED' ? 'text-emerald-900' : 'text-red-900'}`}>{resCheckInResult}</h3>
                               <p className="font-bold text-gray-700 mt-2 uppercase text-lg">{foundResident.firstName} {foundResident.lastName}</p>
                               <p className="font-black text-gray-400 uppercase tracking-widest">Unit {foundResident.unitNumber}</p>
                               <button onClick={() => { setFoundResident(null); setResSearchQuery(''); }} className="mt-8 bg-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-md">Reset Scanner</button>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'MONITOR' && (
                  <div className="grid gap-4">
                      {activeVisitors.length === 0 && <p className="text-center text-gray-400 font-bold uppercase py-10">No Active Visitors</p>}
                      {activeVisitors.map(v => (
                          <div key={v.id} className="bg-white p-6 rounded-[2rem] shadow-md flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                  <img src={v.visitorImageUrl || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover" />
                                  <div>
                                      <h4 className="font-black uppercase text-gray-900">{v.firstName} {v.lastName}</h4>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Visiting Unit {v.residentUnit}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => { db.checkOutVisitor(v.id); refreshData(); }}
                                  className="bg-brand-50 text-brand-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-brand-100"
                              >
                                  Check Out
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );
};

export default SecurityDashboard;
