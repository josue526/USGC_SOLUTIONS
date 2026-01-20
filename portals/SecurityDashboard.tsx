
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/mockDb';
import { VisitorProfile, ResidentProfile, SecurityOfficerRequest, MaintenanceType, AlertNote, PropertyRequest, VisitorOverstayAlert } from '../types';
import { ShieldCheck, UserCog, AlertCircle, Home, Camera, CheckCircle2, ShieldAlert, Building, Wrench, MessageSquare, FileText, Upload, ChevronRight, Check, Edit3, Save, X, Eye, FileBadge, PlusCircle, ArrowLeft, BadgeCheck, XCircle, ScanFace, CreditCard, RefreshCw, Search, Clock, Users, Activity, Bell, MapPin, UserCheck, LogOut, CheckCircle, Siren, Lock, Unlock, KeyRound, AlertTriangle, Timer } from 'lucide-react';
import { format, differenceInMinutes, formatDistanceToNow } from 'date-fns';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1MVJkilhkDs4l5oWQmbVgqOeXdUfYA7vp";

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
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
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
          <button onClick={capture} className="bg-brand-900 text-white p-6 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <Camera className="w-8 h-8" />
          </button>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>
      <p className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">Center {label} in frame</p>
    </div>
  );
};

const SecurityDashboard = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REQUEST' | 'PROPERTY_SELECT' | 'DASHBOARD' | 'SUCCESS'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SUMMARY' | 'MONITOR' | 'CHECKIN' | 'RESIDENT_CHECKIN' | 'MAINTENANCE' | 'INTERACTION' | 'ADMIN' | 'OVERWATCH'>('DASHBOARD');
  
  const [onDutyProperty, setOnDutyProperty] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminRole, setAdminRole] = useState<'NONE' | 'SUPER_ADMIN'>('NONE');
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState('');

  // Resident Check-in workflow
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [foundResident, setFoundResident] = useState<ResidentProfile | null>(null);
  const [resCheckInResult, setResCheckInResult] = useState<'NONE' | 'GRANTED' | 'DENIED'>('NONE');

  // Monitor Logic
  const [activeVisitors, setActiveVisitors] = useState<VisitorProfile[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [consecutiveAlerts, setConsecutiveAlerts] = useState<VisitorOverstayAlert[]>([]);

  // Forms
  const [visForm, setVisForm] = useState({ complex: '', residentUnit: '', residentId: '', firstName: '', lastName: '', relationship: '', expectedDurationHours: 4 });
  const [visFacePhoto, setVisFacePhoto] = useState<string | null>(null);
  const [visIdPhoto, setVisIdPhoto] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'NONE' | 'FACE' | 'ID'>('NONE');
  const [visSuccess, setVisSuccess] = useState<VisitorProfile | null>(null);

  // Visitor Check-in Search States
  const [availableProperties, setAvailableProperties] = useState<PropertyRequest[]>([]);
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [filteredUnits, setFilteredUnits] = useState<{unit: string, name: string, id: string}[]>([]);

  const [maintForm, setMaintForm] = useState<{ type: MaintenanceType, details: string, property: string }>({ type: 'Lights Out', details: '', property: '' });
  const [maintSuccess, setMaintSuccess] = useState(false);

  const [interactionForm, setInteractionForm] = useState({
    residentUnit: '', residentId: '', residentName: '', details: '', thermsStatus: 'NO' as AlertNote['thermsStatus'], thermsReportNumber: '', attachment: null as string | null
  });
  const [interactionSuccess, setInteractionSuccess] = useState(false);

  // Registration Form
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', badgeNumber: '', username: '', password: '' });

  // Super Admin Review Data
  const [pendingProperties, setPendingProperties] = useState<PropertyRequest[]>([]);
  const [pendingOfficers, setPendingOfficers] = useState<SecurityOfficerRequest[]>([]);

  // Credential Vault
  const [userCredentials, setUserCredentials] = useState<any[]>([]);
  const [areCredentialsRevealed, setAreCredentialsRevealed] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCreds, setUnlockCreds] = useState({ username: '', password: '' });

  const refreshData = useCallback(() => {
    setPendingProperties(db.getPropertyRequests().filter(p => p.status === 'PENDING'));
    setPendingOfficers(db.getOfficerRequests().filter(o => o.status === 'PENDING'));
    setUserCredentials(db.getAllUserCredentials());
    
    const props = db.getApprovedProperties();
    setAvailableProperties(props);

    // Filter by onDutyProperty if set
    let visitors = db.getAllActiveVisitors();
    if (onDutyProperty) {
      visitors = visitors.filter(v => v.complex === onDutyProperty);
    }
    setActiveVisitors(visitors);

    const alerts = db.getConsecutiveVisitAlerts().filter(a => onDutyProperty ? a.propertyName === onDutyProperty : true);
    setConsecutiveAlerts(alerts);

    const allVisitors = db.getAllVisitors().map(v => ({ type: 'VISITOR' as const, data: v, time: v.checkInTime }));
    const allMaint = db.getMaintenanceRequests().map(m => ({ type: 'MAINTENANCE' as const, data: m, time: m.reportedAt }));
    const allNotes = db.getAlertNotes().map(n => ({ type: 'ALERT' as const, data: n, time: n.timestamp }));
    
    let feed = [...allVisitors, ...allMaint, ...allNotes];

    if (onDutyProperty && onDutyProperty !== 'HEADQUARTERS') {
      feed = feed.filter(item => {
        if (item.type === 'VISITOR') return item.data.complex === onDutyProperty;
        if (item.type === 'MAINTENANCE') return item.data.propertyName === onDutyProperty;
        if (item.type === 'ALERT') return item.data.propertyName === onDutyProperty;
        return true;
      });
    }

    setRecentActivity(feed.sort((a, b) => b.time - a.time).slice(0, 20));
  }, [onDutyProperty]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData, activeTab]);

  useEffect(() => {
    if (visForm.complex || onDutyProperty) {
      const complex = onDutyProperty || visForm.complex;
      const residents = db.getApprovedResidents().filter(r => r.complex === complex);
      const query = residentSearchQuery.toLowerCase();
      const filtered = residents
        .filter(r => !query || (r.firstName + ' ' + r.lastName).toLowerCase().includes(query) || r.unitNumber.toLowerCase().includes(query))
        .map(r => ({ unit: r.unitNumber, name: `${r.firstName} ${r.lastName}`, id: r.id }))
        .sort((a, b) => a.unit.localeCompare(b.unit, undefined, {numeric: true}));
      
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits([]);
    }
  }, [visForm.complex, onDutyProperty, residentSearchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSuperAdminLogin) {
      if (creds.username === 'josue@usguardco' && creds.password === 'pass') {
        setIsLoggedIn(true); 
        setAdminRole('SUPER_ADMIN'); 
        setMode('PROPERTY_SELECT'); 
      } else setError('Super Admin Auth Failed');
    } else {
      if (db.authenticateOfficer(creds)) { 
        setIsLoggedIn(true); 
        setMode('PROPERTY_SELECT'); 
      }
      else setError('Officer Auth Failed: Invalid credentials or account not approved.');
    }
  };

  const selectDutyProperty = (propName: string) => {
    setOnDutyProperty(propName);
    setVisForm(prev => ({ ...prev, complex: propName }));
    setMode('DASHBOARD');
    setActiveTab('DASHBOARD');
  };

  const handleLogoff = () => {
    setCreds({ username: '', password: '' });
    setIsSuperAdminLogin(false);
    setIsLoggedIn(false);
    setAdminRole('NONE');
    setMode('LOGIN');
    setOnDutyProperty('');
    setAreCredentialsRevealed(false);
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    db.createOfficerRequest({
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        badgeNumber: regForm.badgeNumber,
        credentials: { username: regForm.username, password: regForm.password }
    });
    setMode('SUCCESS');
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintForm.details || !onDutyProperty) return;
    
    db.createMaintenanceRequest({
      type: maintForm.type,
      details: maintForm.details,
      propertyName: onDutyProperty,
      reportedBy: 'Officer Terminal'
    });
    
    setMaintSuccess(true);
    setMaintForm({ type: 'Lights Out', details: '', property: '' });
    setTimeout(() => {
        setMaintSuccess(false);
        setActiveTab('DASHBOARD');
    }, 2000);
  };

  const handleInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prioritize ID lookup if available
    const residents = db.getApprovedResidents();
    let resident: ResidentProfile | undefined;
    
    if (interactionForm.residentId) {
        resident = residents.find(r => r.id === interactionForm.residentId);
    }

    if (!resident && interactionForm.residentUnit) {
        // Fallback for safety, though UI enforces selection
        resident = residents.find(r => r.complex === onDutyProperty && r.unitNumber === interactionForm.residentUnit);
    }
    
    if (resident) {
        db.createAlertNote({
            residentId: resident.id,
            residentName: `${resident.firstName} ${resident.lastName}`,
            unitNumber: resident.unitNumber,
            propertyName: onDutyProperty,
            officerName: 'Officer Terminal',
            details: interactionForm.details,
            thermsStatus: interactionForm.thermsStatus,
            thermsReportNumber: interactionForm.thermsReportNumber,
            attachmentUrl: interactionForm.attachment || undefined
        });
        setInteractionSuccess(true);
        setInteractionForm({ residentUnit: '', residentId: '', residentName: '', details: '', thermsStatus: 'NO', thermsReportNumber: '', attachment: null });
        setTimeout(() => {
            setInteractionSuccess(false);
            setActiveTab('DASHBOARD');
        }, 2000);
    } else {
        setError('Resident Not Found. Please select from the list.');
    }
  };

  // RESIDENT CHECK-IN LOGIC
  const searchResident = (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.lookupResidentByIdOrDob(resSearchQuery, onDutyProperty);
    if (res) {
      setFoundResident(res);
      setError('');
    } else {
      setError('RESIDENT NOT FOUND: Identity does not match any active profiles for this location.');
    }
  };

  const finalizeResidentCheckIn = (status: 'GRANTED' | 'DENIED') => {
    if (foundResident) {
      db.logResidentCheckIn({
        residentId: foundResident.id,
        residentName: `${foundResident.firstName} ${foundResident.lastName}`,
        propertyName: onDutyProperty,
        officerName: 'On-Duty Officer',
        status,
        searchQuery: resSearchQuery
      });
      setResCheckInResult(status);
      setTimeout(() => {
        setFoundResident(null);
        setResSearchQuery('');
        setResCheckInResult('NONE');
        setActiveTab('DASHBOARD');
      }, 2000);
    }
  };

  const handleVisitorCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const v = db.checkInVisitor({ 
        ...visForm, 
        complex: onDutyProperty, 
        // Pass residentId to ensure unique identification
        residentId: visForm.residentId || 'lookup',
        visitorImageUrl: visFacePhoto || '', 
        visitorIdImageUrl: visIdPhoto || '' 
      });
      setVisSuccess(v);
      setVisFacePhoto(null);
      setVisIdPhoto(null);
      setVisForm(prev => ({ ...prev, residentUnit: '', residentId: '', firstName: '', lastName: '', relationship: '', expectedDurationHours: 4 }));
      setResidentSearchQuery('');
      setError('');
    } catch (err: any) { setError(err.message); }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '00000') {
      setAdminRole('SUPER_ADMIN');
      setAdminPin('');
      setError('');
    } else setError('Invalid Authorization PIN.');
  };

  const handleUnlockCredentials = (e: React.FormEvent) => {
      e.preventDefault();
      if (unlockCreds.username === 'josue@usguardco' && unlockCreds.password === 'pass') {
          setAreCredentialsRevealed(true);
          setShowUnlockModal(false);
          setUnlockCreds({username: '', password: ''});
      } else {
          alert('Invalid Super Admin Credentials');
      }
  };

  const getRemainingTime = (expiration: number) => {
    const diff = differenceInMinutes(expiration, now);
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  if (mode === 'LOGIN') {
    return (
      <div className="max-w-md mx-auto py-24 px-4">
        <div className={`bg-white p-12 rounded-[3rem] shadow-2xl border-t-8 transition-all duration-500 ${isSuperAdminLogin ? 'border-red-600' : 'border-brand-900'}`}>
          <div className="text-center mb-10">
            <img src={LOGO_URL} alt="Logo" className="w-32 mx-auto mb-6" referrerPolicy="no-referrer" />
            <h2 className="text-3xl font-black uppercase tracking-tighter">{isSuperAdminLogin ? 'Super Admin' : 'Officer Login'}</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Authorized Access Point</p>
          </div>
          {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="USERNAME" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
            <input type="password" placeholder="PASSWORD" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
            <button type="submit" className={`w-full ${isSuperAdminLogin ? 'bg-red-600' : 'bg-brand-900'} text-white font-black uppercase py-4 rounded-2xl shadow-lg transition-transform active:scale-95`}>Authenticate</button>
            <div className="flex flex-col gap-2 mt-4 text-center">
               <button type="button" onClick={() => { setIsSuperAdminLogin(!isSuperAdminLogin); setError(''); }} className="text-[10px] font-black uppercase text-gray-500 hover:text-brand-900 transition-colors">Switch Terminal Mode</button>
               {!isSuperAdminLogin && (
                   <button type="button" onClick={() => setMode('REQUEST')} className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-800 transition-colors flex items-center justify-center gap-1"><PlusCircle className="w-3 h-3"/> New Registration</button>
               )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'REQUEST') {
    return (
       <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
             <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4"><ShieldCheck className="w-10 h-10 text-brand-300"/><div><h2 className="text-2xl font-black uppercase tracking-tighter">Officer Access Request</h2></div></div>
                <button onClick={() => setMode('LOGIN')} className="text-brand-300 hover:text-white flex items-center gap-1 text-[10px] font-black uppercase"><XCircle className="w-5 h-5"/> Cancel</button>
             </div>
             <form onSubmit={handleRegistration} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input type="text" placeholder="FIRST NAME" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={regForm.firstName} onChange={e => setRegForm({...regForm, firstName: e.target.value})} />
                   <input type="text" placeholder="LAST NAME" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={regForm.lastName} onChange={e => setRegForm({...regForm, lastName: e.target.value})} />
                </div>
                <input type="text" placeholder="BADGE / EMPLOYEE ID" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={regForm.badgeNumber} onChange={e => setRegForm({...regForm, badgeNumber: e.target.value})} />
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                   <div className="space-y-4">
                      <input type="text" placeholder="USERNAME" required className="w-full p-4 bg-white rounded-xl font-medium text-gray-900 placeholder-gray-500" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                      <input type="password" placeholder="PASSWORD" required className="w-full p-4 bg-white rounded-xl font-medium text-gray-900 placeholder-gray-500" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                   </div>
                </div>
                <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-5 rounded-2xl shadow-xl">Submit Request</button>
             </form>
          </div>
       </div>
    );
  }

  if (mode === 'PROPERTY_SELECT') {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <img src={LOGO_URL} alt="Logo" className="w-40 mx-auto mb-10" referrerPolicy="no-referrer" />
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-gray-900">Deployment Site Selection</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-12">Select On-Duty Location to Access Terminal</p>
        
        {adminRole === 'SUPER_ADMIN' && (
             <button 
                onClick={() => {
                    setOnDutyProperty('HEADQUARTERS'); // Set a dummy property for admin
                    setMode('DASHBOARD');
                    setActiveTab('ADMIN');
                }}
                className="mb-12 bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 mx-auto"
             >
                <ShieldAlert className="w-4 h-4"/> Enter System Admin Console
             </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {availableProperties.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-[2.5rem] shadow-xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-black uppercase text-xs">No active property contracts found.</p>
            </div>
          ) : availableProperties.map(prop => (
            <button 
              key={prop.id} 
              onClick={() => selectDutyProperty(prop.propertyName)}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all group flex flex-col items-center"
            >
              <div className="p-5 bg-brand-50 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Building className="w-12 h-12 text-brand-900" />
              </div>
              <span className="font-black uppercase text-lg tracking-tight text-gray-900">{prop.propertyName}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase mt-2">{prop.city}, {prop.state}</span>
            </button>
          ))}
        </div>
        <button onClick={handleLogoff} className="mt-12 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 mx-auto"><LogOut className="w-4 h-4"/> Logoff Session</button>
      </div>
    );
  }

  if (mode === 'SUCCESS') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl">
          <BadgeCheck className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Request Filed</h2>
          <button onClick={() => setMode('LOGIN')} className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {showUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md" onClick={() => setShowUnlockModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                  <div className="bg-red-600 p-8 text-white flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Security Challenge</h3>
                      <button onClick={() => setShowUnlockModal(false)} className="text-red-200 hover:text-white"><XCircle/></button>
                  </div>
                  <form onSubmit={handleUnlockCredentials} className="p-10 space-y-6">
                      <p className="text-xs font-bold text-gray-500 uppercase text-center">Re-enter Super Admin credentials to reveal sensitive data.</p>
                      <input 
                        type="text" 
                        placeholder="USERNAME" 
                        required 
                        className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" 
                        value={unlockCreds.username} 
                        onChange={e => setUnlockCreds({...unlockCreds, username: e.target.value})} 
                      />
                      <input 
                        type="password" 
                        placeholder="PASSWORD" 
                        required 
                        className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" 
                        value={unlockCreds.password} 
                        onChange={e => setUnlockCreds({...unlockCreds, password: e.target.value})} 
                      />
                      <button type="submit" className="w-full bg-red-600 text-white font-black uppercase py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2">
                          <Unlock className="w-5 h-5"/> Unlock Vault
                      </button>
                  </form>
              </div>
          </div>
      )}

      {foundResident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-md"></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-10 text-center">
              <h3 className="text-[10px] font-black uppercase text-brand-600 tracking-[0.3em] mb-6">Identity Verification</h3>
              <div className="w-48 h-48 mx-auto rounded-[3rem] overflow-hidden border-8 border-brand-50 mb-6 shadow-xl">
                <img src={foundResident.residentImageUrl} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">{foundResident.firstName} {foundResident.lastName}</h4>
              <p className="text-brand-700 font-black uppercase text-xs mb-8">Unit {foundResident.unitNumber} • Active Profile</p>
              
              <div className="bg-gray-50 p-6 rounded-3xl mb-10 border border-gray-100">
                <p className="text-sm font-bold text-gray-600 uppercase">Does this picture match who you are checking-in?</p>
              </div>

              {resCheckInResult === 'NONE' ? (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => finalizeResidentCheckIn('GRANTED')} className="bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group">
                    <Check className="group-hover:scale-125 transition-transform"/> YES
                  </button>
                  <button onClick={() => finalizeResidentCheckIn('DENIED')} className="bg-red-50 text-red-600 py-5 rounded-3xl font-black uppercase shadow-inner hover:bg-red-100 transition-all flex items-center justify-center gap-2 group">
                    <X className="group-hover:scale-125 transition-transform"/> NO
                  </button>
                </div>
              ) : (
                <div className={`p-8 rounded-3xl flex flex-col items-center gap-4 animate-bounce ${resCheckInResult === 'GRANTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                   {resCheckInResult === 'GRANTED' ? <ShieldCheck className="w-12 h-12"/> : <ShieldAlert className="w-12 h-12"/>}
                   <span className="text-3xl font-black uppercase tracking-tighter">{resCheckInResult === 'GRANTED' ? 'Access Granted' : 'Access Denied'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {cameraMode !== 'NONE' && (
        <CameraCapture label={cameraMode === 'FACE' ? 'Visitor Face' : 'Visitor ID'} onCancel={() => setCameraMode('NONE')} onCapture={(img) => {
            if (cameraMode === 'FACE') setVisFacePhoto(img); else setVisIdPhoto(img);
            setCameraMode('NONE');
        }} />
      )}
      
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img src={LOGO_URL} className="w-[600px] opacity-[0.05]" alt="Watermark" referrerPolicy="no-referrer" />
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-md border-b p-6 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-brand-900 w-8 h-8"/>
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none">Duty Terminal</h1>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {onDutyProperty}</p>
            </div>
          </div>
          <div className="hidden lg:flex bg-gray-100 p-1 rounded-2xl overflow-x-auto border border-gray-200">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Actions</button>
            <button onClick={() => setActiveTab('MONITOR')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'MONITOR' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Live Monitor</button>
            <button onClick={() => setActiveTab('OVERWATCH')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'OVERWATCH' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Overwatch</button>
            <button onClick={() => setActiveTab('INTERACTION')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'INTERACTION' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Interactions</button>
            <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'MAINTENANCE' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Report</button>
            {adminRole === 'SUPER_ADMIN' && <button onClick={() => setActiveTab('SUMMARY')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'SUMMARY' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Summary</button>}
            {adminRole === 'SUPER_ADMIN' && <button onClick={() => setActiveTab('ADMIN')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'ADMIN' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Admin</button>}
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setMode('PROPERTY_SELECT')} className="text-[10px] font-black uppercase text-gray-500 hover:text-brand-900 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Switch Site</button>
             <button onClick={handleLogoff} className="text-[10px] font-black uppercase text-red-500 font-black hover:text-red-700 transition-colors">Logoff</button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full p-10 flex-grow">
        {activeTab === 'DASHBOARD' && (
          <div className="animate-fade-in">
             <div className="mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Operations Control</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Active On-Duty Site: {onDutyProperty}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => setActiveTab('CHECKIN')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-brand-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <Users className="w-16 h-16 text-brand-900" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Check-in Visitor</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Manual Entry • Biometric Capture</p>
                </button>

                <button onClick={() => setActiveTab('RESIDENT_CHECKIN')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-emerald-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <UserCheck className="w-16 h-16 text-emerald-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Resident Entry</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">ID Verify • Profile Sync</p>
                </button>

                <button onClick={() => setActiveTab('MONITOR')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-red-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-red-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <Clock className="w-16 h-16 text-red-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Check-out Log</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Active Session Management</p>
                </button>

                <button onClick={() => setActiveTab('MAINTENANCE')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-orange-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <Wrench className="w-16 h-16 text-orange-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Maintenance</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Report Site Issues</p>
                </button>

                <button onClick={() => setActiveTab('INTERACTION')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-blue-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <FileText className="w-16 h-16 text-blue-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Resident Note</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Log Incident / Interaction</p>
                </button>

                <button onClick={() => setActiveTab('OVERWATCH')} className="group bg-white p-12 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center text-center">
                   <div className="p-8 bg-purple-50 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-16 h-16 text-purple-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Alerts & Watch</h3>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Overstays • Consecutive</p>
                </button>
             </div>

             <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] shadow-lg border border-gray-100">
                    <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-2"><Activity className="text-brand-900"/> Recent Activity Log</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {recentActivity.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${item.type === 'VISITOR' ? 'bg-brand-500' : item.type === 'MAINTENANCE' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                <div>
                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 mb-1 inline-block">{item.type}</span>
                                    <p className="text-sm font-black text-gray-800 uppercase leading-none">
                                    {item.type === 'VISITOR' && `${item.data.firstName} ${item.data.lastName}`}
                                    {item.type === 'MAINTENANCE' && `${item.data.type}`}
                                    {item.type === 'ALERT' && `Note: ${item.data.residentName}`}
                                    </p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{item.data.complex || item.data.propertyName}</p>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold text-gray-400">{format(item.time, 'HH:mm')}</span>
                          </div>
                       ))}
                    </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="w-20 h-20 text-brand-50 mb-6"/>
                    <h4 className="text-lg font-black uppercase tracking-tight text-gray-400">Secure Duty Station</h4>
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] mt-2">All actions encrypted and logged</p>
                </div>
             </div>
          </div>
        )}

        {/* ... (Existing tabs: SUMMARY, RESIDENT_CHECKIN, CHECKIN) ... */}

        {activeTab === 'OVERWATCH' && (
            <div className="animate-fade-in space-y-8">
               <button onClick={() => setActiveTab('DASHBOARD')} className="mb-4 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
               
               <div className="flex justify-between items-end">
                  <div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Overwatch</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Pattern Detection & Violation Alerts</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[3rem] shadow-lg border border-red-100">
                       <h3 className="text-xl font-black uppercase text-red-600 mb-6 flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> Consecutive Visit Alerts</h3>
                       <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {consecutiveAlerts.length === 0 ? (
                               <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                   <p className="text-xs font-black text-gray-400 uppercase">No consecutive violations detected.</p>
                               </div>
                           ) : consecutiveAlerts.map(alert => (
                               <div key={alert.id} className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h4 className="text-lg font-black text-red-900 uppercase">{alert.visitorName}</h4>
                                           <p className="text-xs font-bold text-red-700 uppercase mt-1">Visiting Unit {alert.unitNumber}</p>
                                       </div>
                                       <span className="bg-red-200 text-red-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">{alert.consecutiveDays} Day Streak</span>
                                   </div>
                                   <div className="mt-4 pt-4 border-t border-red-100 flex gap-4">
                                       <div>
                                           <p className="text-[9px] font-black text-red-400 uppercase">Resident</p>
                                           <p className="text-xs font-bold text-red-800 uppercase">{alert.residentName}</p>
                                       </div>
                                       <div>
                                           <p className="text-[9px] font-black text-red-400 uppercase">Last Check-In</p>
                                           <p className="text-xs font-bold text-red-800 uppercase">{format(alert.lastCheckIn, 'MMM dd HH:mm')}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[3rem] shadow-lg border border-orange-100">
                       <h3 className="text-xl font-black uppercase text-orange-600 mb-6 flex items-center gap-2"><Clock className="w-6 h-6"/> Active Overstays</h3>
                       <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {activeVisitors.filter(v => now > v.expirationTime).length === 0 ? (
                               <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                   <p className="text-xs font-black text-gray-400 uppercase">No current overstays.</p>
                               </div>
                           ) : activeVisitors.filter(v => now > v.expirationTime).map(v => (
                               <div key={v.id} className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h4 className="text-lg font-black text-orange-900 uppercase">{v.firstName} {v.lastName}</h4>
                                           <p className="text-xs font-bold text-orange-700 uppercase mt-1">Unit {v.residentUnit}</p>
                                       </div>
                                       <span className="bg-orange-200 text-orange-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">EXPIRED</span>
                                   </div>
                                   <p className="text-xs font-bold text-orange-800 mt-2 uppercase">Overdue by {formatDistanceToNow(v.expirationTime)}</p>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
            </div>
        )}

        {activeTab === 'MONITOR' && (
          <div className="animate-fade-in">
             <button onClick={() => setActiveTab('DASHBOARD')} className="mb-8 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
             <div className="mb-8 flex justify-between items-end">
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Active Site Visitors</h2>
                   <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1">Location: {onDutyProperty}</p>
                </div>
                <div className="flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-xl border border-brand-100">
                    <Timer className="w-4 h-4 text-brand-900"/>
                    <span className="text-[10px] font-black text-brand-900 uppercase">Max Limit: 72 Hours</span>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVisitors.length === 0 ? (
                   <div className="col-span-full py-20 text-center text-gray-400 uppercase font-black tracking-widest text-xs bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-200">No active visitors.</div>
                ) : activeVisitors.map(v => (
                  <div key={v.id} className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <img src={v.visitorImageUrl || 'https://picsum.photos/100/100'} className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                           <h4 className="font-black uppercase text-lg tracking-tight text-gray-900">{v.firstName} {v.lastName}</h4>
                           <span className="text-[10px] font-black text-gray-500 uppercase">Unit {v.residentUnit}</span>
                        </div>
                     </div>
                     <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase border-b border-gray-200 pb-2">
                           <span>Elapsed</span>
                           <span className="text-gray-900">{formatDistanceToNow(v.checkInTime)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
                           <span>Remaining</span>
                           <span className={`${v.expirationTime < now ? 'text-red-600' : 'text-emerald-600'}`}>
                               {v.expirationTime < now ? 'EXPIRED' : formatDistanceToNow(v.expirationTime)}
                           </span>
                        </div>
                     </div>
                     <button onClick={() => {db.checkOutVisitor(v.id); refreshData();}} className="w-full bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-xl font-black uppercase text-[10px] hover:text-red-600 hover:border-red-100 transition-colors">Process Check-out</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'SUMMARY' && adminRole === 'SUPER_ADMIN' && (
          <div className="animate-fade-in space-y-12">
             <button onClick={() => setActiveTab('DASHBOARD')} className="mb-4 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
             
             <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Executive Summary</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Global System Overview</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">System Status</p>
                    <p className="text-xl font-black text-emerald-600 uppercase">Operational</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 bg-brand-50 rounded-2xl"><Building className="w-6 h-6 text-brand-900"/></div>
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">TOTAL</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{availableProperties.length}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Active Properties</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 bg-blue-50 rounded-2xl"><BadgeCheck className="w-6 h-6 text-blue-600"/></div>
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">TOTAL</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{db.getOfficerRequests().filter(o => o.status === 'APPROVED').length}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Security Officers</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl"><UserCheck className="w-6 h-6 text-emerald-600"/></div>
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">TOTAL</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{db.getApprovedResidents().length}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Residents</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 bg-orange-50 rounded-2xl"><Activity className="w-6 h-6 text-orange-600"/></div>
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">TODAY</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{db.getAllVisitors().filter(v => v.checkInTime > new Date().setHours(0,0,0,0)).length}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Visitor Entries</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] shadow-lg border border-gray-100">
                    <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-2"><Activity className="text-brand-900"/> Global Activity Feed</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {recentActivity.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${item.type === 'VISITOR' ? 'bg-brand-500' : item.type === 'MAINTENANCE' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                <div>
                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 mb-1 inline-block">{item.type}</span>
                                    <p className="text-sm font-black text-gray-800 uppercase leading-none">
                                    {item.type === 'VISITOR' && `${item.data.firstName} ${item.data.lastName}`}
                                    {item.type === 'MAINTENANCE' && `${item.data.type}`}
                                    {item.type === 'ALERT' && `Note: ${item.data.residentName}`}
                                    </p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{item.data.complex || item.data.propertyName}</p>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold text-gray-400">{format(item.time, 'HH:mm')}</span>
                          </div>
                       ))}
                    </div>
                </div>

                <div className="bg-brand-900 text-white p-10 rounded-[3rem] shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black uppercase tracking-tight mb-4">System Alerts</h4>
                        {pendingProperties.length > 0 || pendingOfficers.length > 0 ? (
                            <div className="space-y-4">
                                {pendingProperties.length > 0 && (
                                    <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4">
                                        <Building className="w-8 h-8 text-brand-300"/>
                                        <div>
                                            <p className="text-lg font-black">{pendingProperties.length}</p>
                                            <p className="text-[10px] font-bold text-brand-300 uppercase">Pending Properties</p>
                                        </div>
                                    </div>
                                )}
                                {pendingOfficers.length > 0 && (
                                    <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4">
                                        <BadgeCheck className="w-8 h-8 text-brand-300"/>
                                        <div>
                                            <p className="text-lg font-black">{pendingOfficers.length}</p>
                                            <p className="text-[10px] font-bold text-brand-300 uppercase">Pending Officers</p>
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => setActiveTab('ADMIN')} className="w-full bg-white text-brand-900 py-4 rounded-2xl font-black uppercase text-xs mt-4 hover:bg-brand-50 transition-colors">Review Pending Items</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 opacity-50">
                                <CheckCircle className="w-16 h-16 mb-4"/>
                                <p className="text-xs font-black uppercase tracking-widest">All Systems Normal</p>
                            </div>
                        )}
                    </div>
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-800 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-600 rounded-full blur-3xl -ml-16 -mb-16 opacity-20"></div>
                </div>
             </div>
          </div>
        )}

        {/* ... (Existing tabs: RESIDENT_CHECKIN, CHECKIN, MAINTENANCE, INTERACTION, ADMIN) ... */}
        
        {activeTab === 'RESIDENT_CHECKIN' && (
          <div className="max-w-3xl mx-auto animate-slide-up">
            <button onClick={() => setActiveTab('DASHBOARD')} className="mb-8 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
            <div className="bg-white/90 backdrop-blur-sm p-12 rounded-[3.5rem] shadow-2xl border border-emerald-50 text-center">
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <UserCheck className="w-10 h-10 text-emerald-600"/>
               </div>
               <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-gray-900">Resident Entry Verification</h2>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-10">Cross-reference with Location: {onDutyProperty}</p>
               
               <form onSubmit={searchResident} className="space-y-6">
                  {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><ShieldAlert className="w-4 h-4"/> {error}</div>}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ENTER ID NUMBER OR D.O.B (MM/DD/YYYY)" 
                      required 
                      className="w-full p-6 bg-gray-50 rounded-3xl text-center text-xl font-bold tracking-wide outline-none border-2 border-transparent focus:border-emerald-500 text-gray-900 placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400" 
                      value={resSearchQuery} 
                      onChange={e => setResSearchQuery(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white font-black uppercase py-6 rounded-[2rem] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <Search className="w-5 h-5"/> Initiate Identify Lookup
                  </button>
               </form>
            </div>
          </div>
        )}

        {activeTab === 'CHECKIN' && (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <button onClick={() => setActiveTab('DASHBOARD')} className="mb-8 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
            {visSuccess ? (
              <div className="bg-white/90 backdrop-blur-sm p-12 rounded-[3rem] shadow-2xl text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-gray-900">Visitor Logged</h2>
                <button onClick={() => setVisSuccess(null)} className="mt-8 bg-brand-900 text-white px-10 py-5 rounded-3xl font-black uppercase shadow-lg">Process Next Guest</button>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Visitor Protocol</h2>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-brand-300 uppercase leading-none">Site Location</p>
                      <p className="text-sm font-black uppercase tracking-tight">{onDutyProperty}</p>
                   </div>
                </div>
                <form onSubmit={handleVisitorCheckIn} className="p-10 space-y-8">
                  {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-bounce"><ShieldAlert className="w-4 h-4"/>{error}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-2">Guest Details</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                             <input type="text" placeholder="UNIT SEARCH" className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500 outline-none border-2 border-transparent focus:border-brand-500" value={residentSearchQuery} onChange={e => setResidentSearchQuery(e.target.value)} />
                          </div>
                          <select required className="w-full p-4 bg-gray-50 rounded-xl font-medium outline-none text-gray-900" value={visForm.residentUnit} onChange={e => setVisForm({...visForm, residentUnit: e.target.value})} >
                             <option value="">SELECT RESIDENT</option>
                             {filteredUnits.map((u, i) => <option key={i} value={u.unit}>UNIT {u.unit} - {u.name}</option>)}
                          </select>
                       </div>
                       <input type="text" placeholder="GUEST FIRST NAME" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={visForm.firstName} onChange={e => setVisForm({...visForm, firstName: e.target.value})} />
                       <input type="text" placeholder="GUEST LAST NAME" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={visForm.lastName} onChange={e => setVisForm({...visForm, lastName: e.target.value})} />
                       <input type="text" placeholder="RELATIONSHIP" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={visForm.relationship} onChange={e => setVisForm({...visForm, relationship: e.target.value})} />
                    </div>
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-2">Verification Photos</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div onClick={() => setCameraMode('ID')} className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative">
                             {visIdPhoto ? <img src={visIdPhoto} className="w-full h-full object-cover"/> : <div className="text-center"><Camera className="mx-auto text-gray-300"/><p className="text-[8px] font-black uppercase mt-1 text-gray-400">Capture ID</p></div>}
                          </div>
                          <div onClick={() => setCameraMode('FACE')} className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative">
                             {visFacePhoto ? <img src={visFacePhoto} className="w-full h-full object-cover"/> : <div className="text-center"><Camera className="mx-auto text-gray-300"/><p className="text-[8px] font-black uppercase mt-1 text-gray-400">Capture Face</p></div>}
                          </div>
                       </div>
                    </div>
                  </div>
                  <button type="submit" disabled={!visFacePhoto || !visIdPhoto} className={`w-full font-black uppercase py-6 rounded-3xl shadow-xl transition-all ${(!visFacePhoto || !visIdPhoto) ? 'bg-gray-200 text-gray-400' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>Process Check-in</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'MAINTENANCE' && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <button onClick={() => setActiveTab('DASHBOARD')} className="mb-8 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
            
            {maintSuccess ? (
                <div className="bg-white/90 backdrop-blur-sm p-12 rounded-[3rem] shadow-2xl text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">Report Filed</h2>
                </div>
            ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                    <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Maintenance Report</h2>
                    </div>
                    <form onSubmit={handleMaintenanceSubmit} className="p-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Issue Type</label>
                            <select 
                                className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none"
                                value={maintForm.type}
                                onChange={e => setMaintForm({...maintForm, type: e.target.value as MaintenanceType})}
                            >
                                <option value="Lights Out">Lights Out</option>
                                <option value="Broken Fence">Broken Fence</option>
                                <option value="Broken Window">Broken Window</option>
                                <option value="Gate Malfunction">Gate Malfunction</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Description</label>
                             <textarea 
                                required
                                rows={4}
                                placeholder="Describe the issue location and severity..."
                                className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500 outline-none"
                                value={maintForm.details}
                                onChange={e => setMaintForm({...maintForm, details: e.target.value})}
                             />
                        </div>
                        <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-5 rounded-2xl shadow-xl hover:bg-brand-800">Submit Report</button>
                    </form>
                </div>
            )}
          </div>
        )}

        {activeTab === 'INTERACTION' && (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <button onClick={() => setActiveTab('DASHBOARD')} className="mb-8 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
                
                {interactionSuccess ? (
                    <div className="bg-white/90 backdrop-blur-sm p-12 rounded-[3rem] shadow-2xl text-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">Interaction Logged</h2>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                        <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                           <div className="flex items-center gap-3">
                               <Siren className="w-8 h-8"/>
                               <h2 className="text-2xl font-black uppercase tracking-tighter">Incident / Resident Note</h2>
                           </div>
                        </div>
                        <form onSubmit={handleInteractionSubmit} className="p-10 space-y-6">
                            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Resident Unit</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none"
                                    value={interactionForm.residentUnit}
                                    onChange={e => setInteractionForm({...interactionForm, residentUnit: e.target.value})}
                                >
                                    <option value="">SELECT UNIT</option>
                                    {filteredUnits.map((u, i) => <option key={i} value={u.unit}>UNIT {u.unit} - {u.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Details / Notes</label>
                                <textarea 
                                    required
                                    rows={4}
                                    placeholder="Describe the interaction, violation, incident, or general note..."
                                    className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500 outline-none"
                                    value={interactionForm.details}
                                    onChange={e => setInteractionForm({...interactionForm, details: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Police/Therms Contacted?</label>
                                    <select 
                                        className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none"
                                        value={interactionForm.thermsStatus}
                                        onChange={e => setInteractionForm({...interactionForm, thermsStatus: e.target.value as any})}
                                    >
                                        <option value="NO">No</option>
                                        <option value="YES">Yes</option>
                                    </select>
                                </div>
                                {interactionForm.thermsStatus === 'YES' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Report Number</label>
                                        <input 
                                            type="text"
                                            className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none"
                                            value={interactionForm.thermsReportNumber}
                                            onChange={e => setInteractionForm({...interactionForm, thermsReportNumber: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-5 rounded-2xl shadow-xl hover:bg-brand-800">Submit Log</button>
                        </form>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'ADMIN' && adminRole === 'SUPER_ADMIN' && (
          <div className="animate-fade-in space-y-12">
             <button onClick={() => setActiveTab('DASHBOARD')} className="mb-4 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Operations</button>
             <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-6">System Administration</h2>
                
                {/* Property Requests */}
                <section className="mb-12">
                    <h3 className="text-xl font-black uppercase text-brand-900 mb-6 flex items-center gap-2"><Building className="w-6 h-6"/> Pending Property Contracts</h3>
                    {pendingProperties.length === 0 ? (
                        <p className="text-gray-400 font-bold uppercase text-xs bg-white/50 p-8 rounded-[2rem] border border-dashed border-gray-200 text-center">No pending property requests.</p>
                    ) : (
                        <div className="grid gap-4">
                        {pendingProperties.map(p => (
                            <div key={p.id} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h4 className="font-black uppercase text-xl text-gray-900">{p.propertyName}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-widest">{p.city}, {p.state} • Mgr: {p.managerName}</p>
                                    <div className="flex gap-4 mt-3">
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase">{p.phoneNumber}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase">{p.contactEmail}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => { db.approveProperty(p.id); refreshData(); }} className="flex-1 md:flex-none bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-200">Approve</button>
                                    <button onClick={() => { db.rejectProperty(p.id); refreshData(); }} className="flex-1 md:flex-none bg-red-50 text-red-500 px-8 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-red-100 border border-red-100">Reject</button>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </section>

                {/* Officer Requests */}
                <section>
                    <h3 className="text-xl font-black uppercase text-brand-900 mb-6 flex items-center gap-2"><BadgeCheck className="w-6 h-6"/> Pending Officer Access</h3>
                    {pendingOfficers.length === 0 ? (
                        <p className="text-gray-400 font-bold uppercase text-xs bg-white/50 p-8 rounded-[2rem] border border-dashed border-gray-200 text-center">No pending officer requests.</p>
                    ) : (
                        <div className="grid gap-4">
                        {pendingOfficers.map(o => (
                            <div key={o.id} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h4 className="font-black uppercase text-xl text-gray-900">{o.lastName}, {o.firstName}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-widest">Badge: {o.badgeNumber} • User: {o.credentials?.username}</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => { db.approveOfficer(o.id); refreshData(); }} className="flex-1 md:flex-none bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-200">Authorize</button>
                                    <button onClick={() => { db.rejectOfficer(o.id); refreshData(); }} className="flex-1 md:flex-none bg-red-50 text-red-500 px-8 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-red-100 border border-red-100">Deny</button>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </section>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
