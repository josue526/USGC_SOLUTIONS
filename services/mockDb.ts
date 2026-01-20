
import { ResidentProfile, VisitorProfile, ComplexName, LogEntry, PropertyRequest, SecurityOfficerRequest, Credentials, MaintenanceRequest, AlertNote, VisitorOverstayAlert, ManagementStaffRequest, ResidentCheckInLog } from '../types';

class MockDatabase {
  private residents: ResidentProfile[] = [];
  private visitors: VisitorProfile[] = [];
  private propertyRequests: PropertyRequest[] = [];
  private staffRequests: ManagementStaffRequest[] = [];
  private officerRequests: SecurityOfficerRequest[] = [];
  private maintenanceRequests: MaintenanceRequest[] = [];
  private alertNotes: AlertNote[] = [];
  private residentCheckInLogs: ResidentCheckInLog[] = [];
  private logs: LogEntry[] = [];

  constructor() {
    this.seedData();
  }

  private seedData() {
    // 1. Create the Property Management Account
    const pmCreds: Credentials = { username: 'user', password: 'pass' };

    const esperanza: PropertyRequest = {
      id: 'prop-esperanza',
      propertyName: 'Casa de Esperanza',
      status: 'APPROVED',
      requestDate: Date.now(),
      credentials: pmCreds,
      managerName: 'Lead Manager',
      contactEmail: 'esperanza@management.com',
      city: 'Los Angeles',
      state: 'CA'
    };

    const suenos: PropertyRequest = {
      id: 'prop-suenos',
      propertyName: 'Casa de Los Sueños',
      status: 'APPROVED',
      requestDate: Date.now(),
      credentials: pmCreds,
      managerName: 'Lead Manager',
      contactEmail: 'suenos@management.com',
      city: 'San Diego',
      state: 'CA'
    };

    this.propertyRequests.push(esperanza, suenos);

    // 2. Seed Resident Roster for Casa de Esperanza (80 Residents)
    const fNamesEsp = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma', 'Benjamin', 'Samantha'];
    const lNamesEsp = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'];

    for (let i = 0; i < 80; i++) {
         const floor = Math.floor(i / 20) + 1;
         const room = (i % 20) + 1;
         const unit = `${floor}${String(room).padStart(2, '0')}`;
         const fName = fNamesEsp[i % fNamesEsp.length];
         const lName = lNamesEsp[i % lNamesEsp.length];
         
         this.residents.push({
            id: `res-ce-${i}`,
            complex: 'Casa de Esperanza',
            unitNumber: unit,
            firstName: fName,
            lastName: lName,
            dateOfBirth: '01/01/1985',
            moveInDate: '2023-01-01',
            leaseExpirationDate: '2025-12-31',
            dlNumber: unit, // Set DL Number to Unit Number
            dlImageUrl: 'https://picsum.photos/400/250',
            residentImageUrl: `https://i.pravatar.cc/150?u=ce-${i}`,
            status: 'APPROVED',
            acceptingVisitors: true,
            allowedVisitors: [],
            internalSecurityNotes: [],
            credentials: {
                username: `${fName}${lName}`,
                password: `${fName}${lName}`
            }
         });
    }

    // 3. Seed Resident Roster for Casa de Los Sueños (61 Residents)
    const fNamesSuenos = [...fNamesEsp].reverse();
    const lNamesSuenos = [...lNamesEsp].reverse();

    for (let i = 0; i < 61; i++) {
         const floor = Math.floor(i / 20) + 1;
         const room = (i % 20) + 1;
         const unit = `S-${floor}${String(room).padStart(2, '0')}`;
         const fName = fNamesSuenos[i % fNamesSuenos.length];
         const lName = lNamesSuenos[i % lNamesSuenos.length];
         
         this.residents.push({
            id: `res-cls-${i}`,
            complex: 'Casa de Los Sueños',
            unitNumber: unit,
            firstName: fName,
            lastName: lName,
            dateOfBirth: '05/15/1990',
            moveInDate: '2022-06-01',
            leaseExpirationDate: '2024-06-01',
            dlNumber: unit, // Set DL Number to Unit Number
            dlImageUrl: 'https://picsum.photos/400/250',
            residentImageUrl: `https://i.pravatar.cc/150?u=cls-${i}`,
            status: 'APPROVED',
            acceptingVisitors: true,
            allowedVisitors: [],
            internalSecurityNotes: [],
            credentials: {
                username: `${fName}${lName}`,
                password: `${fName}${lName}`
            }
         });
    }
  }

  // --- BATCH IMPORT ---
  batchAddResidents(propertyName: string, rawData: {unit: string, last: string, first: string}[]) {
      rawData.forEach((d, i) => {
          this.residents.push({
            id: `res-import-${Date.now()}-${i}`,
            complex: propertyName as ComplexName,
            unitNumber: d.unit,
            firstName: d.first,
            lastName: d.last,
            dateOfBirth: '01/01/1980', 
            moveInDate: new Date().toISOString().split('T')[0],
            leaseExpirationDate: '2025-12-31',
            dlNumber: d.unit,
            dlImageUrl: 'https://picsum.photos/400/250',
            residentImageUrl: `https://i.pravatar.cc/150?u=${Date.now()}-${i}`,
            status: 'APPROVED',
            acceptingVisitors: true,
            allowedVisitors: [],
            internalSecurityNotes: [],
            credentials: { username: `${d.first}${d.last}`, password: `${d.first}${d.last}` }
          });
      });
  }

  // --- VALIDATION & UTILS ---

  isDlNumberTaken(dlNumber: string): boolean {
    return this.residents.some(r => r.dlNumber.toLowerCase() === dlNumber.toLowerCase());
  }

  isUsernameTaken(username: string): boolean {
    const inResidents = this.residents.some(r => r.credentials?.username.toLowerCase() === username.toLowerCase());
    const inStaff = this.staffRequests.some(s => s.credentials?.username.toLowerCase() === username.toLowerCase());
    const inPMs = this.propertyRequests.some(p => p.credentials?.username.toLowerCase() === username.toLowerCase());
    const inOfficers = this.officerRequests.some(o => o.credentials?.username.toLowerCase() === username.toLowerCase());
    return inResidents || inStaff || inPMs || inOfficers;
  }

  isPropertyNameValid(name: string): boolean {
    const approved = this.propertyRequests
      .filter(p => p.status === 'APPROVED')
      .map(p => p.propertyName);
    return approved.some(vn => vn.toLowerCase() === name.toLowerCase());
  }

  // --- MAINTENANCE ---

  createMaintenanceRequest(req: Omit<MaintenanceRequest, 'id' | 'status' | 'reportedAt'>) {
    const newReq: MaintenanceRequest = {
      ...req,
      id: `maint-${Date.now()}`,
      status: 'PENDING_REVIEW',
      reportedAt: Date.now()
    };
    this.maintenanceRequests.push(newReq);
    return newReq;
  }

  getMaintenanceRequests() { return this.maintenanceRequests; }

  updateMaintenanceStatus(id: string, status: MaintenanceRequest['status'], adminNotes?: string) {
    const req = this.maintenanceRequests.find(r => r.id === id);
    if (req) {
      req.status = status;
      if (adminNotes) req.adminNotes = adminNotes;
    }
  }

  // --- ALERTS / NOTES ---

  createAlertNote(note: Omit<AlertNote, 'id' | 'status' | 'timestamp'>) {
    const newNote: AlertNote = {
      ...note,
      id: `alert-${Date.now()}`,
      status: 'UNDER_REVIEW',
      timestamp: Date.now()
    };
    this.alertNotes.push(newNote);
    return newNote;
  }

  getAlertNotes() { return this.alertNotes; }

  updateAlertNoteStatus(id: string, status: AlertNote['status'], editedDetails?: string) {
    const note = this.alertNotes.find(n => n.id === id);
    if (note) {
      note.status = status;
      if (editedDetails) note.details = editedDetails;
      if (status === 'STORED_INTERNAL') {
        const res = this.residents.find(r => r.id === note.residentId);
        if (res) {
            if (!res.internalSecurityNotes) res.internalSecurityNotes = [];
            res.internalSecurityNotes.push(note.details);
        }
      }
    }
  }

  // --- RESIDENT CHECK-IN ---

  lookupResidentByIdOrDob(query: string, propertyName: string): ResidentProfile | undefined {
    const q = query.trim().toLowerCase();
    return this.residents.find(r => 
      r.status === 'APPROVED' && 
      r.complex === propertyName && 
      (r.dlNumber.toLowerCase() === q || r.dateOfBirth === query)
    );
  }

  logResidentCheckIn(log: Omit<ResidentCheckInLog, 'id' | 'timestamp'>) {
    this.residentCheckInLogs.push({
      ...log,
      id: `res-log-${Date.now()}`,
      timestamp: Date.now()
    });
  }

  getResidentCheckInLogs() {
    return this.residentCheckInLogs;
  }

  // --- VISITORS ---

  checkInVisitor(data: Omit<VisitorProfile, 'id' | 'status' | 'checkInTime' | 'expirationTime'>) {
    let resident: ResidentProfile | undefined;

    // 1. Try finding by ID first (Explicit selection)
    if (data.residentId && data.residentId !== 'lookup') {
        resident = this.residents.find(r => r.id === data.residentId);
    }

    // 2. Fallback to Unit lookup (Legacy/Fallback)
    if (!resident) {
        resident = this.residents.find(r => 
            r.complex.toLowerCase() === data.complex.toLowerCase() && 
            r.unitNumber === data.residentUnit && 
            r.status === 'APPROVED'
        );
    }
    
    if (!resident) throw new Error("SECURITY ALERT: Invalid Unit or No Resident on File.");
    if (!resident.acceptingVisitors) throw new Error(`ACCESS DENIED: Resident is NOT ACCEPTING VISITORS.`);

    // Whitelist Check
    if (resident.allowedVisitors && resident.allowedVisitors.length > 0) {
        const visitorName = `${data.firstName} ${data.lastName}`.toLowerCase();
        const isAllowed = resident.allowedVisitors.some(name => name.toLowerCase() === visitorName);
        if (!isAllowed) {
            throw new Error(`ACCESS DENIED: Visitor "${data.firstName} ${data.lastName}" is not on the Guest List.`);
        }
    }

    const activeVisit = this.visitors.find(v => 
        v.firstName === data.firstName && 
        v.lastName === data.lastName && 
        v.status === 'ACTIVE'
    );
    
    let flagged = false;
    if (activeVisit) {
      flagged = true;
    }

    const checkInTime = Date.now();
    // Cap duration at 72 hours (3 days)
    const maxHours = 72;
    const requestedHours = data.expectedDurationHours || 4;
    const durationHours = Math.min(requestedHours, maxHours);
    
    const expirationTime = checkInTime + (durationHours * 3600000); 

    const v: VisitorProfile = {
      ...data,
      residentId: resident.id, // Ensure we store the resolved ID
      id: `vis-${Date.now()}`,
      status: 'ACTIVE',
      checkInTime,
      expirationTime,
      expectedDurationHours: durationHours,
      reEntryWithoutCheckOut: flagged
    };
    this.visitors.push(v);
    return v;
  }

  checkOutVisitor(id: string) {
    const v = this.visitors.find(vis => vis.id === id);
    if (v) {
      v.status = 'CHECKED_OUT';
      v.checkOutTime = Date.now();
    }
  }

  getConsecutiveVisitAlerts(): VisitorOverstayAlert[] {
    const alerts: VisitorOverstayAlert[] = [];
    const grouped = new Map<string, VisitorProfile[]>();
    
    // Group all visitors
    this.visitors.forEach(v => {
      // Logic: Group by Unique Visitor ID (Name + Property). Unit is secondary for the "property in general" check.
      const key = `${v.firstName.trim().toLowerCase()}-${v.lastName.trim().toLowerCase()}-${v.complex}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(v);
    });

    grouped.forEach((visits, key) => {
      // Sort by check-in time ascending
      const sorted = visits.sort((a, b) => a.checkInTime - b.checkInTime);
      
      let consecutiveDays = 1;
      let streakStart = sorted[0].checkInTime;
      
      // We need at least 3 distinct days to flag
      const uniqueDays = new Set<string>();
      
      sorted.forEach(visit => {
          const dateStr = new Date(visit.checkInTime).toDateString();
          uniqueDays.add(dateStr);
      });

      if (uniqueDays.size >= 3) {
          // Check for consecutiveness
          const daysArray = Array.from(uniqueDays).map(d => new Date(d).getTime()).sort((a,b) => a - b);
          let currentStreak = 1;
          
          for(let i = 1; i < daysArray.length; i++) {
              const prev = daysArray[i-1];
              const curr = daysArray[i];
              // Approx check for 24h difference (allowing slight margin for "next day")
              const diffHours = (curr - prev) / 3600000;
              
              if (diffHours <= 30 && diffHours >= 12) { // 12-30 hours gap implies next day visit usually
                  currentStreak++;
              } else if (diffHours < 12) {
                  // Same day, ignore
              } else {
                  currentStreak = 1; // Reset streak
              }

              if (currentStreak >= 3) {
                  // Get the latest visit details
                  const latest = sorted[sorted.length - 1];
                  const res = this.residents.find(r => r.id === latest.residentId);
                  
                  // Avoid duplicates
                  if (!alerts.some(a => a.visitorName === `${latest.firstName} ${latest.lastName}` && a.propertyName === latest.complex)) {
                      alerts.push({
                        id: `alert-pattern-${key}`,
                        visitorName: `${latest.firstName} ${latest.lastName}`,
                        residentName: res ? `${res.firstName} ${res.lastName}` : 'Unknown',
                        unitNumber: latest.residentUnit,
                        propertyName: latest.complex,
                        consecutiveDays: currentStreak,
                        lastCheckIn: latest.checkInTime
                      });
                  }
              }
          }
      }
    });
    
    return alerts;
  }

  // --- ACCESSORS & AUTH ---

  getResidents() { return this.residents; }
  getApprovedResidents() { return this.residents.filter(r => r.status === 'APPROVED'); }
  
  authenticateResident(creds: Credentials) { 
    return this.residents.find(r => r.status === 'APPROVED' && r.credentials?.username === creds.username && r.credentials?.password === creds.password); 
  }
  
  authenticatePM(creds: Credentials) { 
    const managers = this.propertyRequests.filter(p => 
      p.status === 'APPROVED' && 
      p.credentials?.username === creds.username && 
      p.credentials?.password === creds.password
    );
    const staff = this.staffRequests.filter(s => 
      s.status === 'APPROVED' && 
      s.credentials?.username === creds.username && 
      s.credentials?.password === creds.password
    ).map(s => {
      const prop = this.propertyRequests.find(p => p.propertyName.toLowerCase() === s.propertyName.toLowerCase());
      return { ...prop, id: s.id, isStaff: true, propertyName: s.propertyName } as any;
    });

    return [...managers, ...staff]; 
  }
  
  authenticateOfficer(creds: Credentials) { 
    return this.officerRequests.find(o => o.status === 'APPROVED' && o.credentials?.username === creds.username && o.credentials?.password === creds.password); 
  }

  // --- SUPER ADMIN UTILS ---
  getAllUserCredentials() {
    const res = this.residents.map(r => ({ id: r.id, name: `${r.firstName} ${r.lastName}`, role: 'RESIDENT', username: r.credentials?.username, password: r.credentials?.password, status: r.status }));
    const pm = this.propertyRequests.map(p => ({ id: p.id, name: p.managerName || 'PM', role: 'PROPERTY_MANAGER', username: p.credentials?.username, password: p.credentials?.password, status: p.status }));
    const staff = this.staffRequests.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, role: 'STAFF', username: s.credentials?.username, password: s.credentials?.password, status: s.status }));
    const off = this.officerRequests.map(o => ({ id: o.id, name: `${o.firstName} ${o.lastName}`, role: 'SECURITY', username: o.credentials?.username, password: o.credentials?.password, status: o.status }));
    
    return [...res, ...pm, ...staff, ...off];
  }
  
  // --- REQUEST CREATION & APPROVALS ---

  createResidentRequest(profile: any) { 
    this.residents.push({ 
        ...profile, 
        id: `res-${Date.now()}`, 
        status: 'PENDING', 
        acceptingVisitors: true, 
        allowedVisitors: [], 
        internalSecurityNotes: [] 
    }); 
  }
  approveResident(id: string, actor: string) { const r = this.residents.find(res => res.id === id); if (r) r.status = 'APPROVED'; }
  rejectResident(id: string) { const r = this.residents.find(res => res.id === id); if (r) r.status = 'REJECTED'; }
  
  createPropertyRequest(request: any) { 
    this.propertyRequests.push({ 
        ...request, 
        id: `prop-${Date.now()}`, 
        status: 'PENDING', 
        requestDate: Date.now() 
    }); 
  }
  approveProperty(id: string) { const r = this.propertyRequests.find(req => req.id === id); if (r) r.status = 'APPROVED'; }
  rejectProperty(id: string) { const r = this.propertyRequests.find(req => req.id === id); if (r) r.status = 'REJECTED'; }
  getPropertyRequests() { return this.propertyRequests; }
  getApprovedProperties() { return this.propertyRequests.filter(p => p.status === 'APPROVED'); }

  createStaffRequest(request: any) { 
    this.staffRequests.push({ 
        ...request, 
        id: `staff-${Date.now()}`, 
        status: 'PENDING', 
        requestDate: Date.now() 
    }); 
  }
  getStaffRequests(propertyName: string) { 
    return this.staffRequests.filter(s => s.propertyName.toLowerCase() === propertyName.toLowerCase() && s.status === 'PENDING'); 
  }
  approveStaff(id: string) { const s = this.staffRequests.find(st => st.id === id); if (s) s.status = 'APPROVED'; }
  rejectStaff(id: string) { const s = this.staffRequests.find(st => st.id === id); if (s) s.status = 'REJECTED'; }
  
  createOfficerRequest(request: any) { 
    this.officerRequests.push({ 
        ...request, 
        id: `off-${Date.now()}`, 
        status: 'PENDING', 
        requestDate: Date.now() 
    }); 
  }
  approveOfficer(id: string) { const r = this.officerRequests.find(req => req.id === id); if (r) r.status = 'APPROVED'; }
  rejectOfficer(id: string) { const r = this.officerRequests.find(req => req.id === id); if (r) r.status = 'REJECTED'; }
  getOfficerRequests() { return this.officerRequests; }
  
  // --- HELPERS ---
  
  getAllActiveVisitors() { return this.visitors.filter(v => v.status === 'ACTIVE'); }
  getAllVisitors() { return this.visitors; } 
  updateResidentPreferences(id: string, prefs: any) { 
    const r = this.residents.find(res => res.id === id); 
    if (r) { 
        r.acceptingVisitors = prefs.acceptingVisitors; 
        r.allowedVisitors = prefs.allowedVisitors; 
    } 
  }
  updateResidentProfile(id: string, updates: Partial<ResidentProfile>) {
    const idx = this.residents.findIndex(r => r.id === id);
    if (idx !== -1) {
        this.residents[idx] = { ...this.residents[idx], ...updates };
    }
  }
}

export const db = new MockDatabase();
