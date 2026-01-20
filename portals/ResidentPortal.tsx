
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';
import { ResidentProfile, PropertyRequest } from '../types';
import { CheckCircle, User, Lock, ArrowLeft, AlertCircle, ScanFace, CreditCard, LogIn, ShieldCheck, ShieldAlert, Plus, Trash2, Home, BadgeCheck, Camera, RefreshCw, XCircle, QrCode } from 'lucide-react';

// Use lh3.googleusercontent.com format for better embedding reliability
const LOGO_URL = "https://lh3.googleusercontent.com/d/1MVJkilhkDs4l5oWQmbVgqOeXdUfYA7vp";

const AVAILABLE_STATES = ['CA', 'TX', 'NY', 'FL', 'AZ'];
const CITIES_BY_STATE: Record<string, string[]> = {
  CA: ['Los Angeles', 'San Diego', 'San Francisco', 'Sacramento'],
  TX: ['Austin', 'Houston', 'Dallas', 'San Antonio', 'Fort Worth'],
  NY: ['New York', 'Buffalo', 'Albany'],
  FL: ['Miami', 'Orlando', 'Tampa'],
  AZ: ['Phoenix', 'Tucson', 'Scottsdale']
};

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
          <button onClick={onCancel} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Cancel</button>
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

const ResidentPortal = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'INITIAL' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'SUCCESS'>('INITIAL');
  const [tab, setTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE');
  const [cameraMode, setCameraMode] = useState<'NONE' | 'DL' | 'FACE'>('NONE');
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [currentUser, setCurrentUser] = useState<ResidentProfile | null>(null);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ResidentProfile>>({
    complex: '', firstName: '', lastName: '', unitNumber: '',
    dateOfBirth: '', moveInDate: '', leaseExpirationDate: '', dlNumber: '',
    credentials: { username: '', password: '' }
  });

  const [photos, setPhotos] = useState<{dl: string | null, site: string | null}>({ dl: null, site: null });
  const [newAllowedName, setNewAllowedName] = useState('');

  // Dropdown States
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availableProperties, setAvailableProperties] = useState<PropertyRequest[]>([]);

  useEffect(() => {
    // Update available properties when filters change
    const allApproved = db.getApprovedProperties();
    const filtered = allApproved.filter(p => 
      (!selectedState || p.state === selectedState) &&
      (!selectedCity || p.city === selectedCity)
    );
    setAvailableProperties(filtered);
  }, [selectedState, selectedCity]);

  const resetForm = () => {
    setFormData({
      complex: '', firstName: '', lastName: '', unitNumber: '',
      dateOfBirth: '', moveInDate: '', leaseExpirationDate: '', dlNumber: '',
      credentials: { username: '', password: '' }
    });
    setPhotos({ dl: null, site: null });
    setSelectedState('');
    setSelectedCity('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.authenticateResident(creds);
    if (user) {
      setCurrentUser(user);
      setMode('DASHBOARD');
      setError('');
    } else {
      setError('Credentials invalid or profile pending approval.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complex) { setError('Property selection is required.'); return; }
    
    // Validate complex is an approved one (double check)
    if (!db.isPropertyNameValid(formData.complex)) {
      setError('Selected property is not valid.');
      return;
    }

    if (!photos.dl || !photos.site) { setError('Both State ID and Selfie photos are mandatory for security clearance.'); return; }
    
    if (formData.dlNumber && db.isDlNumberTaken(formData.dlNumber)) {
        setError('Registration Rejected: This State ID / DL Number is already active in the system.');
        return;
    }

    if (formData.credentials?.username && db.isUsernameTaken(formData.credentials.username)) {
        setError('Registration Rejected: This username is already taken. Please select a different one.');
        return;
    }

    try {
      db.createResidentRequest({
        ...formData,
        dlImageUrl: photos.dl,
        residentImageUrl: photos.site
      } as any);
      resetForm();
      setMode('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updatePreferences = () => {
    if (currentUser) {
      db.updateResidentPreferences(currentUser.id, {
        acceptingVisitors: currentUser.acceptingVisitors,
        allowedVisitors: currentUser.allowedVisitors
      });
      alert('Security preferences updated.');
    }
  };

  const addAllowedVisitor = () => {
    if (newAllowedName.trim() && currentUser) {
      const updated = { ...currentUser, allowedVisitors: [...currentUser.allowedVisitors, newAllowedName.trim()] };
      setCurrentUser(updated);
      setNewAllowedName('');
    }
  };

  const removeAllowedVisitor = (index: number) => {
    if (currentUser) {
      const updatedList = [...currentUser.allowedVisitors];
      updatedList.splice(index, 1);
      setCurrentUser({ ...currentUser, allowedVisitors: updatedList });
    }
  };

  if (mode === 'INITIAL') {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <img src={LOGO_URL} alt="Logo" className="w-48 mx-auto mb-8" referrerPolicy="no-referrer" />
        <h1 className="text-4xl font-black text-brand-900 tracking-tighter uppercase mb-2">Resident Access</h1>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mb-12">Resident Authorization Portal</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => { resetForm(); setMode('LOGIN'); }} className="bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center group">
            <LogIn className="w-12 h-12 text-brand-600 mb-6 group-hover:scale-110 transition-transform" />
            <span className="font-black uppercase text-sm tracking-widest text-gray-900">Login to Portal</span>
          </button>
          <button onClick={() => { resetForm(); setMode('REGISTER'); }} className="bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-brand-500 transition-all flex flex-col items-center group">
            <User className="w-12 h-12 text-brand-600 mb-6 group-hover:scale-110 transition-transform" />
            <span className="font-black uppercase text-sm tracking-widest text-gray-900">Request Access</span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'LOGIN') {
    return (
      <div className="max-w-md mx-auto py-24 px-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center">
          <img src={LOGO_URL} alt="Logo" className="w-32 mx-auto mb-6" referrerPolicy="no-referrer" />
          <button onClick={() => setMode('INITIAL')} className="mb-6 flex items-center text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-brand-900 transition-colors mx-auto"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-gray-900">Secure Login</h2>
          {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-2" /> {error}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="USERNAME" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-500 outline-none font-medium text-gray-900 placeholder-gray-500" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
            <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-500 outline-none font-medium text-gray-900 placeholder-gray-500" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
            <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl shadow-lg hover:bg-brand-800 transition-colors">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'REGISTER') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        {cameraMode !== 'NONE' && (
          <CameraCapture 
            label={cameraMode === 'DL' ? 'State ID / Driver License' : 'Profile Photo'}
            onCancel={() => setCameraMode('NONE')}
            onCapture={(img) => {
              if (cameraMode === 'DL') setPhotos(prev => ({ ...prev, dl: img }));
              if (cameraMode === 'FACE') setPhotos(prev => ({ ...prev, site: img }));
              setCameraMode('NONE');
            }}
          />
        )}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
            <div><h2 className="text-2xl font-black uppercase tracking-tighter">Resident Account Request</h2></div>
            <button onClick={() => { resetForm(); setMode('INITIAL'); }} className="text-brand-300 hover:text-white uppercase text-[10px] font-black transition-colors">Cancel</button>
          </div>
          <form onSubmit={handleRegister} className="p-10 space-y-8">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> {error}</div>}
            
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Step 1: Personal Details</h3>
              <div className="grid grid-cols-2 gap-8">
                 <input type="text" placeholder="FIRST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                 <input type="text" placeholder="LAST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" value={selectedState} onChange={e => {setSelectedState(e.target.value); setSelectedCity(''); setFormData({...formData, complex: ''})}}>
                      <option value="">Filter State</option>
                      {AVAILABLE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" value={selectedCity} onChange={e => {setSelectedCity(e.target.value); setFormData({...formData, complex: ''})}} disabled={!selectedState}>
                      <option value="">Filter City</option>
                      {selectedState && CITIES_BY_STATE[selectedState]?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" 
                    value={formData.complex} 
                    onChange={e => setFormData({...formData, complex: e.target.value})} 
                    disabled={availableProperties.length === 0}
                  >
                    <option value="">SELECT PROPERTY</option>
                    {availableProperties.map(p => <option key={p.id} value={p.propertyName}>{p.propertyName}</option>)}
                  </select>
                  <p className="text-[9px] font-bold text-gray-400 uppercase ml-2">Properties {selectedState ? 'Filtered' : 'Listed'}: {availableProperties.length}</p>
                </div>
                
                <input type="text" placeholder="UNIT NUMBER" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500 h-[60px]" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-8 mt-4">
                <div className="relative">
                   <input type="date" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                   <span className="absolute -top-6 left-2 text-[10px] font-bold text-gray-500 uppercase">Date of Birth</span>
                </div>
                <input type="text" placeholder="STATE ID / DL NUMBER" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 placeholder-gray-500" value={formData.dlNumber} onChange={e => setFormData({...formData, dlNumber: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Step 2: Security Verification</h3>
              <p className="text-[10px] font-bold text-brand-600 uppercase">Live camera capture required for verification photos.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <div onClick={() => setCameraMode('DL')} className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-white overflow-hidden relative transition-all border-gray-200 hover:border-brand-300 group">
                       {photos.dl ? (
                         <>
                           <img src={photos.dl} className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <RefreshCw className="text-white w-8 h-8" />
                           </div>
                         </>
                       ) : (
                         <>
                           <CreditCard className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform" />
                           <span className="mt-3 text-[10px] font-black uppercase text-gray-500">Capture State ID</span>
                         </>
                       )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div onClick={() => setCameraMode('FACE')} className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-white overflow-hidden relative transition-all border-gray-200 hover:border-brand-300 group">
                       {photos.site ? (
                         <>
                           <img src={photos.site} className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <RefreshCw className="text-white w-8 h-8" />
                           </div>
                         </>
                       ) : (
                         <>
                           <ScanFace className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform" />
                           <span className="mt-3 text-[10px] font-black uppercase text-gray-500">Capture Selfie</span>
                         </>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-brand-50 p-8 rounded-[2.5rem] border border-brand-100">
               <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-6">Step 3: Access Credentials</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input type="text" placeholder="USERNAME" required className="w-full p-4 bg-white rounded-xl font-medium text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-brand-500 outline-none shadow-sm" value={formData.credentials?.username} onChange={e => setFormData({...formData, credentials: {...formData.credentials!, username: e.target.value}})} />
                    <span className="absolute -bottom-5 left-2 text-[9px] font-bold text-brand-600 uppercase">Must be globally unique</span>
                  </div>
                  <input type="password" placeholder="PASSWORD" required className="p-4 bg-white rounded-xl font-medium text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-brand-500 outline-none shadow-sm" value={formData.credentials?.password} onChange={e => setFormData({...formData, credentials: {...formData.credentials!, password: e.target.value}})} />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={!photos.dl || !photos.site}
              className={`w-full font-black uppercase py-6 rounded-3xl shadow-2xl transition-all active:scale-95 ${(!photos.dl || !photos.site) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-900 text-white hover:bg-brand-800'}`}
            >
              Submit Account Request
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'SUCCESS') {
    return (
      <div className="max-md mx-auto py-24 px-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900">Protocol Pending</h2>
          <p className="text-gray-700 font-medium mb-8 uppercase text-[10px] tracking-widest leading-relaxed">Your request is being reviewed. Credentials will activate upon approval.</p>
          <button onClick={() => navigate('/')} className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-800 transition-colors">
            <Home className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'DASHBOARD' && currentUser) {
    return (
      <div className="relative min-h-screen">
         {showQrModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md" onClick={() => setShowQrModal(false)}></div>
                <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up text-center">
                    <div className="bg-brand-900 p-8 text-white">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Digital Access Pass</h3>
                        <p className="text-[10px] font-bold text-brand-300 uppercase mt-1">Scan at Checkpoint</p>
                    </div>
                    <div className="p-10 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-brand-50 mb-6">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({
                                    id: currentUser.id,
                                    name: `${currentUser.firstName} ${currentUser.lastName}`,
                                    unit: currentUser.unitNumber,
                                    complex: currentUser.complex
                                }))}`} 
                                className="w-48 h-48"
                                alt="Resident QR Code"
                            />
                        </div>
                        <h4 className="text-lg font-black uppercase text-gray-900">{currentUser.firstName} {currentUser.lastName}</h4>
                        <p className="text-xs font-bold text-gray-500 uppercase">Unit {currentUser.unitNumber}</p>
                        <button onClick={() => setShowQrModal(false)} className="mt-8 bg-gray-100 text-gray-600 px-8 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-gray-200 transition-colors">
                            Close Pass
                        </button>
                    </div>
                </div>
            </div>
         )}

         {/* Watermark */}
         <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
            <img src={LOGO_URL} className="w-[600px] opacity-[0.05]" alt="Watermark" referrerPolicy="no-referrer" />
         </div>

         <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative">
                      <img src={currentUser.residentImageUrl} className="w-40 h-40 rounded-[2rem] object-cover ring-8 ring-brand-50" />
                      <button 
                          onClick={() => setShowQrModal(true)}
                          className="absolute -bottom-4 -right-4 bg-brand-900 text-white p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform"
                      >
                          <QrCode className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="flex-grow text-center md:text-left">
                      <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{currentUser.firstName} {currentUser.lastName}</h1>
                      <p className="text-brand-600 font-black uppercase text-xs tracking-widest mt-2">{currentUser.complex} • UNIT {currentUser.unitNumber}</p>
                      <div className="mt-8 flex gap-4 justify-center md:justify-start">
                        <button onClick={() => setTab('PROFILE')} className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] ${tab === 'PROFILE' ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'}`}>My Profile</button>
                        <button onClick={() => setTab('SECURITY')} className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] ${tab === 'SECURITY' ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Visitor Rules</button>
                        <button onClick={() => setShowQrModal(true)} className="px-6 py-2 rounded-xl font-black uppercase text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2">
                             <QrCode className="w-3 h-3"/> Digital ID
                        </button>
                      </div>
                  </div>
                  <button onClick={() => { setCurrentUser(null); setCreds({ username: '', password: '' }); setMode('INITIAL'); }} className="text-[10px] font-black uppercase text-gray-600 hover:text-red-500 transition-colors">Sign Out</button>
                </div>

                <div className="p-10">
                  {tab === 'PROFILE' ? (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-gray-600">Move-In Date</label>
                          <p className="p-4 bg-gray-50 rounded-xl font-bold text-gray-900">{currentUser.moveInDate}</p>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-gray-600">Lease Expiration</label>
                          <p className="p-4 bg-gray-50 rounded-xl font-bold text-gray-900">{currentUser.leaseExpirationDate}</p>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2rem]">
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
                                {currentUser.acceptingVisitors ? <ShieldCheck className="text-emerald-500"/> : <ShieldAlert className="text-red-500"/>}
                                {currentUser.acceptingVisitors ? 'Access Allowed' : 'Access Restricted'}
                              </h3>
                              <p className="text-xs font-medium text-gray-700 mt-1 uppercase">Global Visitor Permission Toggle</p>
                          </div>
                          <button 
                              onClick={() => {
                                const updated = { ...currentUser, acceptingVisitors: !currentUser.acceptingVisitors };
                                setCurrentUser(updated);
                                db.updateResidentPreferences(currentUser.id, { acceptingVisitors: updated.acceptingVisitors, allowedVisitors: updated.allowedVisitors });
                              }}
                              className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${currentUser.acceptingVisitors ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-600 text-white'}`}
                          >
                              {currentUser.acceptingVisitors ? 'Stop All Visitors' : 'Start Accepting'}
                          </button>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Only Allow These Visitors</h3>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Full name of allowed guest..." 
                                className="flex-grow p-4 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 ring-brand-100 text-gray-900 placeholder-gray-500" 
                                value={newAllowedName}
                                onChange={e => setNewAllowedName(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && addAllowedVisitor()}
                              />
                              <button onClick={addAllowedVisitor} className="bg-brand-900 text-white p-4 rounded-xl hover:bg-brand-800"><Plus/></button>
                          </div>
                          <div className="grid gap-2">
                              {currentUser.allowedVisitors.length === 0 ? (
                                <p className="text-xs text-gray-600 font-black uppercase italic p-4 text-center bg-gray-50 rounded-xl">No whitelist restrictions set. All visitors permitted (if toggle is ON).</p>
                              ) : (
                                currentUser.allowedVisitors.map((name, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
                                      <span className="font-bold uppercase text-sm text-gray-900">{name}</span>
                                      <button onClick={() => removeAllowedVisitor(idx)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))
                              )}
                          </div>
                          {currentUser.allowedVisitors.length > 0 && (
                            <button onClick={updatePreferences} className="w-full bg-brand-900 text-white py-4 rounded-xl font-black uppercase text-[10px] hover:bg-brand-800 transition-colors">Save Allowed List</button>
                          )}
                        </div>
                    </div>
                  )}
                </div>
            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default ResidentPortal;
