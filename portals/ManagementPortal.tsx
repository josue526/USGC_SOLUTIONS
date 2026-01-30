import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ResidentProfile, VisitorProfile, MaintenanceRequest, AlertNote, VisitorOverstayAlert, PropertyRequest, ManagementStaffRequest } from '../types';
import { Building, ShieldAlert, Wrench, Clock, ArrowRight, Home, History, User, AlertTriangle, X, CheckCircle2, AlertCircle, UserCheck, XCircle, PlusCircle, ChevronDown, UserPlus, MapPin, Phone, LogOut, Archive, Check, Eye, Edit3, Save, Activity, Search, Building2, List, FileUp, Timer, Lock, KeyRound, FileText, CreditCard, QrCode } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1MVJkilhkDs4l5oWQmbVgqOeXdUfYA7vp";

const AVAILABLE_STATES = ['CA', 'TX', 'NY', 'FL', 'AZ'];

const ManagementPortal = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'STAFF_REGISTER' | 'DASHBOARD' | 'SUCCESS'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'ISSUES' | 'RESIDENTS' | 'VISITORS' | 'APPROVALS' | 'MONITOR' | 'MAINTENANCE'>('RESIDENTS');
  
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  const [myProperties, setMyProperties] = useState<(PropertyRequest & { isStaff?: boolean })[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  
  const currentPm = myProperties.find(p => p.id === selectedPropId) || null;
  const isStaff = currentPm?.isStaff || false;

  // Data states
  const [maintItems, setMaintItems] = useState<MaintenanceRequest[]>([]);
  const [alertNotes, setAlertNotes] = useState<AlertNote[]>([]);
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [pendingResidents, setPendingResidents] = useState<ResidentProfile[]>([]);
  const [pendingStaff, setPendingStaff] = useState<ManagementStaffRequest[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorProfile[]>([]);
  const [historicalVisitors, setHistoricalVisitors] = useState<VisitorProfile[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyRequest[]>([]);
  const [requirePassword, setRequirePassword] = useState(true);
  
  // Live Timer
  const [now, setNow] = useState(Date.now());

  // Editing state
  const [editingResident, setEditingResident] = useState<ResidentProfile | null>(null);
  const [viewingQrResident, setViewingQrResident] = useState<ResidentProfile | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'DETAILS' | 'HISTORY'>('DETAILS');
  const [resetPassword, setResetPassword] = useState('');

  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Forms
  const [propForm, setPropForm] = useState({
    propertyName: '', state: '', city: '', zipCode: '', phoneNumber: '', address: '',
    managerName: '', contactEmail: '', credentials: { username: '', password: '' }
  });

  const [staffForm, setStaffForm] = useState({
    propertyName: '', firstName: '', lastName: '',
    credentials: { username: '', password: '' }
  });

  useEffect(() => {
    setAvailableProperties(db.getApprovedProperties());
    
    // Check Global Settings
    const settings = db.getSettings();
    setRequirePassword(settings.requirePropertyPassword);
  }, [mode]);

  // Live clock for duration updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode === 'DASHBOARD' && currentPm) {
      refreshDashboard();
    }
  }, [mode, currentPm, activeTab, selectedPropId, now]); // Added now to auto-refresh data

  const refreshDashboard = () => {
    if (!currentPm) return;
    const propNameLower = currentPm.propertyName.toLowerCase();

    // Residents - Sorted by Unit Number
    const propRes = db.getApprovedResidents().filter(r => r.complex.toLowerCase() === propNameLower);
    propRes.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
    setResidents(propRes);
    
    // Maintenance
    const allMaint = db.getMaintenanceRequests().filter(r => r.propertyName.toLowerCase() === propNameLower);
    setMaintItems(isStaff ? allMaint.filter(m => m.status === 'APPROVED') : allMaint);

    // Visitor Data
    const allVisits = db.getAllVisitors().filter(v => v.complex.toLowerCase() === propNameLower);
    setActiveVisitors(allVisits.filter(v => v.status === 'ACTIVE'));
    
    if (isStaff) {
      const yesterday = subDays(new Date(), 1);
      const startOfYesterday = startOfDay(yesterday).getTime();
      const endOfYesterday = endOfDay(yesterday).getTime();
      setHistoricalVisitors(allVisits.filter(v => 
        v.checkInTime >= startOfYesterday && v.checkInTime <= endOfYesterday
      ));
    } else {
      setHistoricalVisitors(allVisits.filter(v => v.status !== 'ACTIVE'));
    }

    if (!isStaff) {
      setAlertNotes(db.getAlertNotes().filter(n => n.status === 'FORWARDED_TO_PM' && n.propertyName.toLowerCase() === propNameLower));
      setPendingResidents(db.getResidents().filter(r => r.status === 'PENDING' && r.complex.toLowerCase() === propNameLower));
      setPendingStaff(db.getStaffRequests(currentPm.propertyName));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionCreds = requirePassword ? creds : { ...creds, password: '' };
    const pms = db.authenticatePM(submissionCreds);
    if (pms.length > 0) {
      setMyProperties(pms);
      setSelectedPropId(pms[0].id);
      setMode('DASHBOARD');
      setActiveTab(pms[0].isStaff ? 'MONITOR' : 'RESIDENTS');
      setError('');
    } else {
      setError('Invalid Credentials or Account Pending Approval.');
    }
  };

  const handleLogoff = () => {
    setCreds({ username: '', password: '' });
    setMode('LOGIN');
    setMyProperties([]);
    setSelectedPropId('');
  };

  const handleResidentUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResident) {
      const updates: Partial<ResidentProfile> = {
          unitNumber: editingResident.unitNumber,
          leaseExpirationDate: editingResident.leaseExpirationDate,
          dlNumber: editingResident.dlNumber,
          notes: editingResident.notes
      };

      if (resetPassword) {
          updates.credentials = {
              username: editingResident.credentials?.username || '',
              password: resetPassword
          };
      }

      db.updateResidentProfile(editingResident.id, updates);
      setEditingResident(null);
      setResetPassword('');
      refreshDashboard();
    }
  };

  const handleBulkImport = () => {
      if (!importText.trim() || !currentPm) return;
      
      const lines = importText.split('\n');
      const parsedData: {unit: string, last: string, first: string}[] = [];
      
      lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3) {
              const unit = parts[0].trim();
              const last = parts[1].trim();
              const first = parts[2].trim();
              if (unit && last && first) {
                  parsedData.push({ unit, last, first });
              }
          }
      });

      if (parsedData.length > 0) {
          db.batchAddResidents(currentPm.propertyName, parsedData);
          refreshDashboard();
          setImportText('');
          setShowImport(false);
          alert(`Successfully imported ${parsedData.length} residents.`);
      } else {
          alert('No valid rows found. Please ensure format: Unit, Last Name, First Name');
      }
  };

  if (mode === 'LOGIN') {
    return (
      <div className="max-w-md mx-auto py-24 px-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center">
          <img src={LOGO_URL} alt="Logo" className="w-32 mx-auto mb-6" referrerPolicy="no-referrer" />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">PM Portal</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">Management Authorization Terminal</p>
          {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="USERNAME" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
            {requirePassword && (
                <input type="password" placeholder="PASSWORD" required className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 border-2 border-transparent focus:border-brand-500 outline-none" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
            )}
            <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl hover:bg-brand-800 transition-colors shadow-lg">Sign In</button>
            <div className="flex flex-col gap-2 mt-4">
              <button type="button" onClick={() => {setError(''); setMode('REGISTER');}} className="text-brand-600 font-black uppercase text-[10px] py-1 hover:text-brand-800 tracking-widest">Register New Property</button>
              <button type="button" onClick={() => {setError(''); setMode('STAFF_REGISTER');}} className="text-brand-600 font-black uppercase text-[10px] py-1 hover:text-brand-800 tracking-widest">Request Staff Access</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ... (Keep existing REGISTER, STAFF_REGISTER, SUCCESS modes same as original) ...
  if (mode === 'REGISTER' || mode === 'STAFF_REGISTER') {
    const isRequestingStaff = mode === 'STAFF_REGISTER';
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black uppercase tracking-tighter">{isRequestingStaff ? 'Staff Access Request' : 'Property Manager Request'}</h2>
               <p className="text-[10px] text-brand-300 font-bold uppercase tracking-[0.3em]">{isRequestingStaff ? 'Subject to PM Approval' : 'Subject to Admin Approval'}</p>
            </div>
            <button onClick={() => setMode('LOGIN')} className="text-brand-300 hover:text-white transition-colors"><XCircle className="w-6 h-6"/></button>
          </div>
          <form onSubmit={isRequestingStaff ? (e) => { e.preventDefault(); db.createStaffRequest(staffForm); setMode('SUCCESS'); } : (e) => { e.preventDefault(); db.createPropertyRequest(propForm); setMode('SUCCESS'); }} className="p-10 space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
            
            {isRequestingStaff ? (
              <>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Select Target Property</label>
                    <select required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900 border-2 border-transparent focus:border-brand-500 outline-none" value={staffForm.propertyName} onChange={e => setStaffForm({...staffForm, propertyName: e.target.value})}>
                        <option value="">SELECT PROPERTY</option>
                        {availableProperties.map(p => <option key={p.id} value={p.propertyName}>{p.propertyName}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="FIRST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={staffForm.firstName} onChange={e => setStaffForm({...staffForm, firstName: e.target.value})} />
                    <input type="text" placeholder="LAST NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={staffForm.lastName} onChange={e => setStaffForm({...staffForm, lastName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="USERNAME" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={staffForm.credentials.username} onChange={e => setStaffForm({...staffForm, credentials: {...staffForm.credentials, username: e.target.value}})} />
                    <input type="password" placeholder="PASSWORD" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={staffForm.credentials.password} onChange={e => setStaffForm({...staffForm, credentials: {...staffForm.credentials, password: e.target.value}})} />
                </div>
              </>
            ) : (
              <>
                <input type="text" placeholder="PROPERTY NAME" required className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={propForm.propertyName} onChange={e => setPropForm({...propForm, propertyName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <select className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900 outline-none" value={propForm.state} onChange={e => setPropForm({...propForm, state: e.target.value})}>
                     <option value="">STATE</option>
                     {AVAILABLE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                   <input type="text" placeholder="CITY" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={propForm.city} onChange={e => setPropForm({...propForm, city: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="FULL NAME" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={propForm.managerName} onChange={e => setPropForm({...propForm, managerName: e.target.value})} />
                   <input type="text" placeholder="PHONE" required className="p-4 bg-gray-50 rounded-xl font-medium text-gray-900" value={propForm.phoneNumber} onChange={e => setPropForm({...propForm, phoneNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                   <input type="text" placeholder="USERNAME" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={propForm.credentials.username} onChange={e => setPropForm({...propForm, credentials: {...propForm.credentials, username: e.target.value}})} />
                   <input type="password" placeholder="PASSWORD" required className="p-4 bg-white border rounded-xl font-medium text-gray-900" value={propForm.credentials.password} onChange={e => setPropForm({...propForm, credentials: {...propForm.credentials, password: e.target.value}})} />
                </div>
              </>
            )}
            <button type="submit" className="w-full bg-brand-900 text-white font-black uppercase py-5 rounded-2xl shadow-xl">{isRequestingStaff ? 'Send Staff Request' : 'Send PM Request'}</button>
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
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900">Request Sent</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-8">Authorization will be reviewed by the appropriate system level.</p>
          <button onClick={() => setMode('LOGIN')} className="w-full bg-brand-900 text-white font-black uppercase py-4 rounded-2xl">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
       <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img src={LOGO_URL} className="w-[600px] opacity-[0.05]" alt="Watermark" referrerPolicy="no-referrer" />
       </div>

       {showImport && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md" onClick={() => setShowImport(false)}></div>
             <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                <div className="bg-brand-900 p-8 text-white flex justify-between items-center">
                   <h3 className="text-xl font-black uppercase tracking-tighter">Bulk Import Residents</h3>
                   <button onClick={() => setShowImport(false)} className="text-brand-300 hover:text-white"><XCircle/></button>
                </div>
                <div className="p-10 space-y-6">
                    <p className="text-xs text-gray-500 font-bold">Paste resident list in the format: <br/> <span className="font-mono bg-gray-100 p-1 rounded">Apartment Number, Last Name, First Name</span></p>
                    <textarea 
                        className="w-full h-64 p-4 bg-gray-50 rounded-xl font-mono text-sm border-2 border-transparent focus:border-brand-500 outline-none" 
                        placeholder={`101, Smith, John\n102, Doe, Jane`}
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                    />
                    <button onClick={handleBulkImport} className="w-full bg-brand-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2">
                        <FileUp className="w-5 h-5"/> Process Import
                    </button>
                </div>
             </div>
           </div>
       )}

       {viewingQrResident && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md" onClick={() => setViewingQrResident(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up text-center">
                <div className="bg-brand-900 p-8 text-white">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Resident Digital ID</h3>
                    <p className="text-[10px] font-bold text-brand-300 uppercase mt-1">Official Access Token</p>
                </div>
                <div className="p-10 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-brand-50 mb-6">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({
                                id: viewingQrResident.id,
                                name: `${viewingQrResident.firstName} ${viewingQrResident.lastName}`,
                                unit: viewingQrResident.unitNumber,
                                complex: viewingQrResident.complex
                            }))}`} 
                            className="w-48 h-48"
                            alt="Resident QR Code"
                        />
                    </div>
                    <h4 className="text-lg font-black uppercase text-gray-900">{viewingQrResident.firstName} {viewingQrResident.lastName}</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase">Unit {viewingQrResident.unitNumber}</p>
                    <button onClick={() => setViewingQrResident(null)} className="mt-8 bg-gray-100 text-gray-600 px-8 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-gray-200 transition-colors">
                        Close
                    </button>
                </div>
            </div>
         </div>
       )}

       {editingResident && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md" onClick={() => { setEditingResident(null); setResetPassword(''); }}></div>
           <form onSubmit={handleResidentUpdate} className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              {/* ... (Existing Modal Content) ... */}
              <div className="bg-brand-900 p-8 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                    <img src={editingResident.residentImageUrl} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-700" />
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">{editingResident.firstName} {editingResident.lastName}</h3>
                        <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">Resident Profile Editor</p>
                    </div>
                </div>
                <button type="button" onClick={() => { setEditingResident(null); setResetPassword(''); }} className="text-brand-300 hover:text-white"><XCircle className="w-8 h-8"/></button>
              </div>

              <div className="flex border-b border-gray-100 flex-shrink-0">
                  <button type="button" onClick={() => setActiveModalTab('DETAILS')} className={`flex-1 py-4 font-black uppercase text-xs tracking-widest transition-colors ${activeModalTab === 'DETAILS' ? 'bg-white text-brand-900 border-b-4 border-brand-900' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Profile Details</button>
                  <button type="button" onClick={() => setActiveModalTab('HISTORY')} className={`flex-1 py-4 font-black uppercase text-xs tracking-widest transition-colors ${activeModalTab === 'HISTORY' ? 'bg-white text-brand-900 border-b-4 border-brand-900' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>History & Logs</button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-grow">
                 {activeModalTab === 'DETAILS' && (
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Unit Number</label>
                            <input type="text" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 ring-brand-100" value={editingResident.unitNumber} onChange={e => setEditingResident({...editingResident, unitNumber: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Lease Expiration</label>
                            <input type="date" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 ring-brand-100" value={editingResident.leaseExpirationDate} onChange={e => setEditingResident({...editingResident, leaseExpirationDate: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">ID / DL Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-4 text-gray-400 w-5 h-5"/>
                                <input type="text" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 ring-brand-100" value={editingResident.dlNumber} onChange={e => setEditingResident({...editingResident, dlNumber: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2 flex items-center gap-2"><KeyRound className="w-3 h-3"/> Reset Password (Optional)</label>
                            <input type="text" placeholder="Enter new password to reset..." className="w-full p-4 bg-red-50 rounded-2xl font-bold text-red-900 placeholder-red-300 outline-none focus:ring-2 ring-red-100" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Internal Management Notes</label>
                            <textarea rows={4} className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-900 outline-none focus:ring-2 ring-brand-100" value={editingResident.notes || ''} onChange={e => setEditingResident({...editingResident, notes: e.target.value})} />
                        </div>
                     </div>
                 )}

                 {activeModalTab === 'HISTORY' && (
                     <div className="space-y-8">
                         {/* ... (Existing History Content) ... */}
                         <section>
                             <h4 className="text-sm font-black uppercase text-brand-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> Active Visitors</h4>
                             <div className="space-y-2">
                                 {db.getAllActiveVisitors().filter(v => v.residentId === editingResident.id).length === 0 ? (
                                     <p className="text-xs text-gray-400 italic">No active guests.</p>
                                 ) : db.getAllActiveVisitors().filter(v => v.residentId === editingResident.id).map(v => (
                                     <div key={v.id} className="bg-emerald-50 p-3 rounded-xl flex items-center justify-between border border-emerald-100">
                                         <span className="font-bold text-xs uppercase text-emerald-900">{v.firstName} {v.lastName}</span>
                                         <span className="text-[10px] font-black text-emerald-600 uppercase">In since {format(v.checkInTime, 'HH:mm')}</span>
                                     </div>
                                 ))}
                             </div>
                         </section>

                         <section>
                             <h4 className="text-sm font-black uppercase text-gray-500 mb-4 flex items-center gap-2"><History className="w-4 h-4"/> Visitor History</h4>
                             <div className="bg-gray-50 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                                 {db.getAllVisitors().filter(v => v.residentId === editingResident.id && v.status !== 'ACTIVE').length === 0 ? (
                                     <p className="text-xs text-gray-400 italic">No historical visits.</p>
                                 ) : db.getAllVisitors().filter(v => v.residentId === editingResident.id && v.status !== 'ACTIVE').map(v => (
                                     <div key={v.id} className="flex justify-between items-center text-xs border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                         <span className="font-bold text-gray-700">{v.firstName} {v.lastName}</span>
                                         <span className="text-gray-400">{format(v.checkInTime, 'MM/dd/yy HH:mm')}</span>
                                     </div>
                                 ))}
                             </div>
                         </section>

                         <section>
                             <h4 className="text-sm font-black uppercase text-orange-500 mb-4 flex items-center gap-2"><Wrench className="w-4 h-4"/> Unit Maintenance</h4>
                             <div className="space-y-2">
                                 {db.getMaintenanceRequests().filter(m => m.propertyName === editingResident.complex && m.details.includes(editingResident.unitNumber)).length === 0 ? (
                                     <p className="text-xs text-gray-400 italic">No maintenance requests found explicitly mentioning Unit {editingResident.unitNumber}.</p>
                                 ) : db.getMaintenanceRequests().filter(m => m.propertyName === editingResident.complex && m.details.includes(editingResident.unitNumber)).map(m => (
                                     <div key={m.id} className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                         <div className="flex justify-between mb-1">
                                             <span className="font-bold text-xs uppercase text-orange-900">{m.type}</span>
                                             <span className="text-[9px] font-black text-orange-400">{format(m.reportedAt, 'MM/dd')}</span>
                                         </div>
                                         <p className="text-[10px] text-orange-800 italic truncate">{m.details}</p>
                                     </div>
                                 ))}
                             </div>
                         </section>

                         <section>
                             <h4 className="text-sm font-black uppercase text-red-500 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Security Notices</h4>
                             <div className="space-y-2">
                                 {db.getAlertNotes().filter(n => n.residentId === editingResident.id).length === 0 ? (
                                     <p className="text-xs text-gray-400 italic">No security notices on file.</p>
                                 ) : db.getAlertNotes().filter(n => n.residentId === editingResident.id).map(n => (
                                     <div key={n.id} className="bg-red-50 p-3 rounded-xl border border-red-100">
                                         <div className="flex justify-between mb-1">
                                             <span className="font-black text-[10px] uppercase text-red-400">{format(n.timestamp, 'MM/dd/yy')}</span>
                                             {n.thermsStatus === 'YES' && <span className="text-[9px] bg-red-200 text-red-800 px-1 rounded">POLICE CALLED</span>}
                                         </div>
                                         <p className="text-xs text-red-900 font-medium">{n.details}</p>
                                     </div>
                                 ))}
                             </div>
                         </section>
                     </div>
                 )}
              </div>
              
              <div className="p-8 border-t border-gray-100 flex-shrink-0 bg-gray-50">
                  <button type="submit" className="w-full bg-brand-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-brand-800 transition-colors">
                    <Save className="w-5 h-5"/> Save Profile Changes
                 </button>
              </div>
           </form>
         </div>
       )}

       <div className="relative z-10 max-w-7xl mx-auto py-10 px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
             {/* ... (Existing Header) ... */}
             <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <Building2 className="w-10 h-10 text-brand-900"/>
                </div>
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none">Management Dashboard</h1>
                   <div className="flex items-center gap-3 mt-3">
                      <select className="bg-brand-50 text-[10px] font-black uppercase text-brand-900 px-3 py-1 rounded-full border border-brand-100 outline-none cursor-pointer" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}>
                         {myProperties.map(p => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
                      </select>
                      {isStaff && <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-1 rounded">Staff Mode</span>}
                   </div>
                </div>
             </div>

             <div className="w-full lg:w-auto overflow-x-auto pb-2 scrollbar-hide">
                <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-100 flex whitespace-nowrap gap-2 min-w-max">
                   <button onClick={() => setActiveTab('MONITOR')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'MONITOR' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Live Monitor</button>
                   <button onClick={() => setActiveTab('RESIDENTS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'RESIDENTS' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Resident Roster</button>
                   <button onClick={() => setActiveTab('VISITORS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'VISITORS' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Visitor Logs</button>
                   <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'MAINTENANCE' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Maintenance</button>
                   {!isStaff && <button onClick={() => setActiveTab('ISSUES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'ISSUES' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Security Feed</button>}
                   {!isStaff && <button onClick={() => setActiveTab('APPROVALS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'APPROVALS' ? 'bg-brand-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Pending</button>}
                   <button onClick={handleLogoff} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors">Logoff</button>
                </div>
             </div>
          </div>

          <div className="animate-fade-in">
             {/* ... (Existing Tabs: MONITOR) ... */}
             {activeTab === 'MONITOR' && (
               <div className="space-y-6">
                  {/* ... Same content ... */}
                  <div className="flex items-center gap-3 mb-6">
                     <Activity className="text-brand-900 w-8 h-8"/>
                     <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Active Site Guests</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activeVisitors.length === 0 ? (
                       <div className="col-span-full py-20 bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed text-center">
                          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
                          <p className="text-xs font-black uppercase text-gray-400">No guests currently checked-in.</p>
                       </div>
                     ) : activeVisitors.map(v => (
                       <div key={v.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
                          <img src={v.visitorImageUrl || 'https://picsum.photos/100/100'} className="w-16 h-16 rounded-2xl object-cover" />
                          <div>
                             <h4 className="font-black uppercase text-gray-900">{v.firstName} {v.lastName}</h4>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Visiting Unit {v.residentUnit}</p>
                             <div className="flex flex-col gap-1 mt-2">
                                 <div className="text-[9px] font-black bg-brand-50 text-brand-700 px-2 py-0.5 rounded inline-block uppercase w-max">
                                     In since {format(v.checkInTime, 'HH:mm')}
                                 </div>
                                 <div className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded inline-block uppercase flex items-center gap-1 w-max">
                                     <Timer className="w-3 h-3"/> {formatDistanceToNow(v.checkInTime)}
                                 </div>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'RESIDENTS' && (
               <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <List className="text-brand-900 w-8 h-8"/>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Resident Roster</h2>
                     </div>
                     {!isStaff && (
                         <button onClick={() => setShowImport(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-2xl font-black uppercase text-[10px] transition-colors">
                             <FileUp className="w-4 h-4"/> Bulk Import
                         </button>
                     )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {residents.length === 0 ? (
                       <div className="col-span-full py-20 bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed text-center text-gray-400 font-black uppercase text-xs">No residents currently listed.</div>
                     ) : residents.map(r => (
                       <div key={r.id} className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group">
                          <div className="flex items-center gap-5">
                             <img src={r.residentImageUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-4 ring-gray-50" />
                             <div>
                                <h4 className="text-sm font-black uppercase text-gray-900">{r.lastName}, {r.firstName}</h4>
                                <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mt-0.5">UNIT {r.unitNumber}</p>
                                <div className="mt-1 flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${r.acceptingVisitors ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                   <span className="text-[8px] font-black uppercase text-gray-400">{r.acceptingVisitors ? 'Access On' : 'Access Off'}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingResident(r)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-900 hover:bg-brand-100 transition-all">
                                <Edit3 className="w-4 h-4"/>
                            </button>
                            <button onClick={() => setViewingQrResident(r)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-900 hover:bg-brand-100 transition-all">
                                <QrCode className="w-4 h-4"/>
                            </button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {/* ... (Existing Tabs: VISITORS, MAINTENANCE, ISSUES, APPROVALS) ... */}
             {activeTab === 'VISITORS' && (
               <div className="space-y-6">
                   {/* ... same content ... */}
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <History className="text-brand-900 w-8 h-8"/>
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Visitor Activity</h2>
                           {isStaff && <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1">Previous Day Logs Only</p>}
                        </div>
                     </div>
                  </div>
                  <div className="grid gap-4">
                     {historicalVisitors.length === 0 ? (
                       <div className="py-20 bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed text-center text-gray-400 font-black uppercase text-xs">No log entries found.</div>
                     ) : (
                       <div className="bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                                   <th className="px-8 py-4">Guest</th>
                                   <th className="px-8 py-4">Resident</th>
                                   <th className="px-8 py-4">Date/Time</th>
                                   <th className="px-8 py-4">Status</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y">
                                {historicalVisitors.map(v => (
                                  <tr key={v.id} className="hover:bg-brand-50/30 transition-colors">
                                     <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                           <img src={v.visitorImageUrl || 'https://picsum.photos/50/50'} className="w-10 h-10 rounded-xl object-cover" />
                                           <span className="font-black uppercase text-gray-900 text-sm">{v.firstName} {v.lastName}</span>
                                        </div>
                                     </td>
                                     <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-gray-700 uppercase">Unit {v.residentUnit}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">{v.relationship}</p>
                                     </td>
                                     <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                           <span className="text-xs font-black text-gray-900 uppercase">{format(v.checkInTime, 'MMM dd')}</span>
                                           <span className="text-[10px] font-bold text-gray-500 uppercase">{format(v.checkInTime, 'HH:mm')}</span>
                                        </div>
                                     </td>
                                     <td className="px-8 py-6">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${v.status === 'CHECKED_OUT' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                           {v.status}
                                        </span>
                                     </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                     )}
                  </div>
               </div>
             )}

             {activeTab === 'MAINTENANCE' && (
                 <div className="space-y-6">
                     {/* ... same content ... */}
                     <div className="flex items-center gap-3 mb-6">
                     <Wrench className="text-brand-900 w-8 h-8"/>
                     <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Site Maintenance</h2>
                        {isStaff && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Pending items hidden</p>}
                     </div>
                  </div>
                  <div className="grid gap-6">
                     {maintItems.length === 0 ? (
                        <div className="py-20 bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed text-center text-gray-400 font-black uppercase text-xs">No maintenance reports found.</div>
                     ) : maintItems.map(m => (
                       <div key={m.id} className={`bg-white/90 backdrop-blur-sm p-8 rounded-[3rem] shadow-sm border-l-8 ${m.status === 'APPROVED' ? 'border-emerald-500' : 'border-brand-900'} border-r border-t border-b flex justify-between items-center`}>
                          <div>
                             <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${m.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>{m.status}</span>
                                <h4 className="text-xl font-black uppercase text-gray-900">{m.type}</h4>
                             </div>
                             <p className="text-sm font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100 italic text-gray-700 mt-4 leading-relaxed">"{m.details}"</p>
                             <div className="flex gap-4 mt-4">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logged by {m.reportedBy}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">• {format(m.reportedAt, 'MM/dd HH:mm')}</span>
                             </div>
                          </div>
                          {!isStaff && m.status === 'PENDING_REVIEW' && (
                             <button onClick={() => { db.updateMaintenanceStatus(m.id, 'APPROVED'); refreshDashboard(); }} className="bg-emerald-600 text-white p-5 rounded-3xl shadow-lg hover:bg-emerald-700 transition-all">
                                <Check />
                             </button>
                          )}
                       </div>
                     ))}
                  </div>
                 </div>
             )}

             {activeTab === 'ISSUES' && !isStaff && (
                 <div className="space-y-6">
                     {/* ... same content ... */}
                     <div className="flex items-center gap-3 mb-6">
                     <ShieldAlert className="text-red-600 w-8 h-8"/>
                     <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Incident Feed</h2>
                  </div>
                  <div className="grid gap-6">
                     {alertNotes.length === 0 ? (
                       <div className="py-20 bg-white/90 backdrop-blur-sm rounded-[3rem] border border-dashed text-center text-gray-400 font-black uppercase text-xs">No security alerts logged.</div>
                     ) : alertNotes.map(n => (
                       <div key={n.id} className="bg-white/90 backdrop-blur-sm p-8 rounded-[3rem] shadow-sm border border-red-100 flex justify-between items-center">
                          <div>
                             <h4 className="font-black uppercase text-xl text-gray-900">{n.residentName} <span className="text-gray-400">• UNIT {n.unitNumber}</span></h4>
                             <p className="bg-red-50 text-red-900 p-5 rounded-2xl font-bold text-xs border border-red-100 mt-6 italic">"{n.details}"</p>
                          </div>
                          <button onClick={() => { db.updateAlertNoteStatus(n.id, 'STORED_INTERNAL'); refreshDashboard(); }} className="p-5 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-3xl transition-all">
                             <Archive className="w-6 h-6"/>
                          </button>
                       </div>
                     ))}
                  </div>
                 </div>
             )}

             {activeTab === 'APPROVALS' && !isStaff && (
                 <div className="space-y-12">
                     {/* ... same content ... */}
                     <section>
                     <div className="flex items-center gap-3 mb-6">
                        <UserPlus className="text-brand-900 w-8 h-8"/>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Staff Authorization</h2>
                     </div>
                     {pendingStaff.length === 0 ? <p className="text-xs text-gray-400 font-black uppercase italic p-10 bg-white/50 rounded-[3rem] border border-dashed text-center">No pending requests.</p> : (
                       <div className="grid gap-4">
                          {pendingStaff.map(s => (
                             <div key={s.id} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                   <h4 className="font-black uppercase text-lg text-gray-900">{s.firstName} {s.lastName}</h4>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Username: {s.credentials?.username}</p>
                                </div>
                                <div className="flex gap-2">
                                   <button onClick={() => { db.approveStaff(s.id); refreshDashboard(); }} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg">Approve</button>
                                   <button onClick={() => { db.rejectStaff(s.id); refreshDashboard(); }} className="bg-red-50 text-red-600 px-8 py-3 rounded-2xl text-[10px] font-black uppercase">Deny</button>
                                </div>
                             </div>
                          ))}
                       </div>
                     )}
                  </section>

                  <section>
                     <div className="flex items-center gap-3 mb-6">
                        <UserCheck className="text-brand-900 w-8 h-8"/>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">New Resident Verification</h2>
                     </div>
                     {pendingResidents.length === 0 ? <p className="text-xs text-gray-400 font-black uppercase italic p-10 bg-white/50 rounded-[3rem] border border-dashed text-center">No pending profiles.</p> : (
                       <div className="grid gap-4">
                          {pendingResidents.map(r => (
                             <div key={r.id} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                   <img src={r.residentImageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                                   <div>
                                      <h4 className="font-black uppercase text-lg text-gray-900">{r.firstName} {r.lastName}</h4>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">UNIT {r.unitNumber}</p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   <button onClick={() => { db.approveResident(r.id, currentPm?.managerName || 'PM'); refreshDashboard(); }} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase">Verify</button>
                                   <button onClick={() => { db.rejectResident(r.id); refreshDashboard(); }} className="bg-red-50 text-red-600 px-8 py-3 rounded-2xl text-[10px] font-black uppercase">Reject</button>
                                </div>
                             </div>
                          ))}
                       </div>
                     )}
                  </section>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ManagementPortal;