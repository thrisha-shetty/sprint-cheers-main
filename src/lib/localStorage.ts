import { Employee, Badge, AwardType } from "@/types/employee";

// VERSION UPDATE: _v53 (Fixing feed rendering & team visibility)
const STORAGE_KEYS = {
  USERS: "sprintwise_users_v53",
  CURRENT_USER: "sprintwise_current_user_v53",
  EMPLOYEES: "sprintwise_employees_v53",
  NOMINATIONS: "sprintwise_nominations_v53",
  SPRINTS: "sprintwise_sprints_v53",
  ARTS: "sprintwise_arts_v53",
  TEAMS: "sprintwise_teams_v53",
  NOTIFICATIONS: "sprintwise_notifications_v53",
  AWARDS: "sprintwise_awards_v53",
};

const BASE_VOTE_VALUE = 50; 
const SCALING_FACTOR = 3.0;

export type UserRole = 'admin' | 'art-manager' | 'employee';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  needsPasswordChange: boolean;
  artId?: string; 
  teamId?: string; 
  createdAt: string;
  createdBy?: string;
}

export interface StoredNomination {
  id: string;
  nomineeId: string;
  nominatorId: string;
  givenBy?: string; 
  awardType: AwardType;
  comment: string;
  rating: number;
  timestamp: string;
}

export interface StoredSprint {
  id: string;
  title: string;
  startDate: string; 
  endDate: string;   
  status: 'locked' | 'active' | 'completed';
}

export interface StoredAward {
    id: string;
    type: string;
    description: string;
    icon: string;
    color?: string;
    points?: number;
}

export interface ART {
  id: string;
  name: string;
  department: string;
  managerId: string;
}

export interface Team {
  id: string;
  artId: string;
  name: string;
  description: string;
}

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const initializeDefaultAwards = (): StoredAward[] => [
    { id: "aw_1", type: "Culture Champion", icon: "Heart", color: "#e11d48", description: "Promoting positive team culture", points: 50 },
    { id: "aw_2", type: "Bug Slayer", icon: "Sword", color: "#dc2626", description: "Fixing critical issues", points: 30 },
    { id: "aw_3", type: "Team Player", icon: "Users", color: "#2563eb", description: "Helping others succeed", points: 40 },
    { id: "aw_4", type: "Innovator", icon: "Lightbulb", color: "#d97706", description: "Creative solutions", points: 60 },
    { id: "aw_5", type: "Customer Hero", icon: "Smile", color: "#059669", description: "Going above and beyond for clients", points: 50 },
    { id: "aw_6", type: "Early Bird", icon: "Sunrise", color: "#f59e0b", description: "First to start, always prepared", points: 20 },
    { id: "aw_7", type: "Night Owl", icon: "Moon", color: "#4338ca", description: "Dedication beyond standard hours", points: 20 },
    { id: "aw_8", type: "Code Wizard", icon: "Wand2", color: "#7c3aed", description: "Exceptional technical problem solving", points: 45 },
];

const initializeDefaults = () => {
  const now = new Date().toISOString();
  
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: StoredUser[] = [
      { id: "user_admin", firstName: "John", lastName: "Doe", password: "John@123", role: "admin", status: "approved", needsPasswordChange: false, createdAt: now },
      { id: "user_manager", firstName: "Steven", lastName: "Strange", password: "password123", role: "art-manager", status: "approved", needsPasswordChange: false, createdAt: now },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.AWARDS)) localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(initializeDefaultAwards()));
  
  if (!localStorage.getItem(STORAGE_KEYS.SPRINTS)) {
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify([
          { id: "sp_default", title: "Sprint 1 (Onboarding)", startDate: now, endDate: '9999-12-31T23:59:59.999Z', status: 'active' }
      ]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ARTS)) localStorage.setItem(STORAGE_KEYS.ARTS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
};

export const auth = {
  getCurrentUser: () => {
    const u = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!u) return null;
    const sessionUser = JSON.parse(u);
    const allUsers = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return allUsers.find(u => u.id === sessionUser.id) || sessionUser;
  },
  signup: (firstName: string, lastName: string, password: string, role: UserRole) => {
    initializeDefaults();
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    if (users.some(u => u.firstName === firstName && u.lastName === lastName)) return { success: false, error: "User exists" };
    
    const newUser: StoredUser = { 
      id: `user_${Date.now()}`, firstName, lastName, password, role, 
      status: (firstName === 'John' && lastName === 'Doe' && role === 'admin') ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      needsPasswordChange: false
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },
  login: (firstName: string, lastName: string, password: string, selectedRole: UserRole) => {
    initializeDefaults();
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.firstName === firstName && u.lastName === lastName && u.password === password);
    if (!user) return { success: false, error: "Invalid credentials" };
    if (user.role !== selectedRole) return { success: false, error: "Incorrect portal" };
    if (user.status !== 'approved') return { success: false, error: `Account ${user.status}` };
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  },
  logout: () => sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
};

export const artManagerActions = {
  getPendingEmployees: () => safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []).filter(u => u.role === 'employee' && u.status === 'pending'),
  
  getManagedEmployees: (managerId: string) => {
      const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const arts = safeParse<ART[]>(STORAGE_KEYS.ARTS, []);
      const myArtIds = arts.filter(a => a.managerId === managerId).map(a => a.id);
      return users.filter(u => u.role === 'employee' && u.status === 'approved' && (u.createdBy === managerId || (u.artId && myArtIds.includes(u.artId))));
  },

  approveEmployee: (userId: string, artId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].status = 'approved';
      users[idx].artId = artId;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    return false;
  },

  removeEmployeeFromTeam: (userId: string) => {
      const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
          users[idx].teamId = undefined; 
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          
          const employees = safeParse<any[]>(STORAGE_KEYS.EMPLOYEES, []);
          const empIdx = employees.findIndex((e: any) => e.id === userId);
          if (empIdx !== -1) {
              employees[empIdx].teamId = undefined;
              localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
          }
          return true;
      }
      return false;
  },

  createART: (name: string, department: string, managerId: string) => {
    const arts = safeParse<ART[]>(STORAGE_KEYS.ARTS, []);
    arts.push({ id: `art_${Date.now()}`, name, department, managerId });
    localStorage.setItem(STORAGE_KEYS.ARTS, JSON.stringify(arts));
  },
  getARTs: () => safeParse<ART[]>(STORAGE_KEYS.ARTS, []),
  
  createTeam: (artId: string, name: string, description: string) => {
    const teams = safeParse<Team[]>(STORAGE_KEYS.TEAMS, []);
    const newTeamId = `team_${Date.now()}`;
    teams.push({ id: newTeamId, artId, name, description });
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));

    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const employees = safeParse<any[]>(STORAGE_KEYS.EMPLOYEES, []);
    const arts = safeParse<ART[]>(STORAGE_KEYS.ARTS, []);
    
    const art = arts.find(a => a.id === artId);
    const dept = art ? art.department : "Engineering";
    const now = new Date().toISOString();

    const dummyNames = [
      { f: "Carol", l: "Brown" }, { f: "David", l: "Miller" }, { f: "Eve", l: "Davis" },
      { f: "Frank", l: "Green" }, { f: "Grace", l: "Harris" }, { f: "Henry", l: "Martin" }
    ];

    dummyNames.forEach((dummy, idx) => {
        const dummyId = `dummy_${newTeamId}_${idx}`; 
        
        users.push({
            id: dummyId, firstName: dummy.f, lastName: dummy.l, password: "dummy", 
            role: "employee", status: "approved", needsPasswordChange: false, 
            artId: artId, teamId: newTeamId, createdAt: now, createdBy: "system"
        });
        
        employees.push({
            id: dummyId, name: `${dummy.f} ${dummy.l}`, jobTitle: "Team Member", 
            department: dept, profilePicture: `https://ui-avatars.com/api/?name=${dummy.f}+${dummy.l}&background=random`,
            badges: [], totalScore: 0, teamId: newTeamId
        });
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getTeams: () => safeParse<Team[]>(STORAGE_KEYS.TEAMS, []),
  deleteTeam: (id: string) => {
    const teams = safeParse<Team[]>(STORAGE_KEYS.TEAMS, []).filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  },
  getEnrollmentCount: (teamId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return users.filter(u => u.teamId === teamId).length;
  }
};

export const adminActions = {
  getAllUsers: () => safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []),
  getPendingRequests: (roles: UserRole[]) => safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []).filter(u => u.status === 'pending' && roles.includes(u.role)),
  approveUser: (id: string) => {
      const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) { users[idx].status = 'approved'; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return true; }
      return false;
  },
  rejectUser: (id: string) => {
      const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) { users[idx].status = 'rejected'; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return true; }
      return false;
  }
};

export const employeeActions = {
  joinTeam: (userId: string, teamId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].teamId = teamId;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      const employees = safeParse<any[]>(STORAGE_KEYS.EMPLOYEES, []);
      const empIdx = employees.findIndex((e: any) => e.id === userId);
      
      if (empIdx !== -1) {
          employees[empIdx].teamId = teamId;
      } else {
          const user = users[idx];
          const arts = safeParse<ART[]>(STORAGE_KEYS.ARTS, []);
          const art = arts.find(a => a.id === user.artId);
          employees.push({
            id: user.id, name: `${user.firstName} ${user.lastName}`, jobTitle: "Team Member", 
            department: art ? art.department : "General", profilePicture: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`,
            badges: [], totalScore: 0, teamId: teamId
          });
      }
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      return true;
    }
    return false;
  },
  getTeamPeers: (teamId: string, myId: string) => {
    const employees = safeParse<any[]>(STORAGE_KEYS.EMPLOYEES, []);
    return employees.filter(e => e.teamId === teamId && e.id !== myId);
  }
};

export const sprintStorage = {
  getSprints: () => safeParse<StoredSprint[]>(STORAGE_KEYS.SPRINTS, []),
  addSprint: (title: string) => {
    const s = safeParse<StoredSprint[]>(STORAGE_KEYS.SPRINTS, []);
    const now = new Date().toISOString();
    s.forEach(sprint => {
        if (sprint.status === 'active') {
            sprint.status = 'completed';
            sprint.endDate = now;
        }
    });
    s.push({ id: `sp_${Date.now()}`, title, startDate: now, endDate: '9999-12-31T23:59:59.999Z', status: 'active' });
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(s));
  }
};

export const awardStorage = {
  getAwards: () => safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []),
  addAward: (type: string, description: string = "Special Recognition") => {
    const a = safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []);
    const colors = ["#8b5cf6", "#14b8a6", "#f43f5e", "#0ea5e9", "#f59e0b"]; 
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    a.push({ id: `aw_${Date.now()}`, type, description, icon: "Star", color: randomColor, points: 50 });
    localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(a));
  },
  deleteAward: (id: string) => {
    const a = safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []).filter(x => x.id !== id);
    localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(a));
  }
};

export const nominationStorage = {
  addNomination: (nomineeId: string, nominatorId: string, awardType: string, comment: string, rating: number) => {
    const nominations = safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []);
    const employees = safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    
    const nominee = employees.find((e: any) => e.id === nomineeId);
    if (!nominee) return;
    
    const nominatorUser = users.find(u => u.id === nominatorId);
    const nominatorName = nominatorUser ? `${nominatorUser.firstName} ${nominatorUser.lastName}` : "A Peer";

    let potentialVoters = 1; 
    if (nominee.teamId) {
        const teamMembers = users.filter((u: any) => u.teamId === nominee.teamId);
        potentialVoters = Math.max(1, teamMembers.length); 
    }
    
    const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
    const weightedPoints = Math.round(BASE_VOTE_VALUE * fairnessMultiplier);
    
    const newNom: StoredNomination = { 
        id: `nom_${Date.now()}`, 
        nomineeId, 
        nominatorId, 
        givenBy: nominatorName, 
        awardType: awardType as AwardType, 
        comment, 
        rating, 
        timestamp: new Date().toISOString() 
    };
    
    nominations.push(newNom);
    localStorage.setItem(STORAGE_KEYS.NOMINATIONS, JSON.stringify(nominations));
    nominee.totalScore = (nominee.totalScore || 0) + weightedPoints;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return newNom;
  },
  getNominations: () => safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []),
  getNominationsForEmployee: (id: string) => safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []).filter(n => n.nomineeId === id),
  hasUserNominatedForAward: (userId: string, awardType: string) => safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []).some(n => n.nominatorId === userId && n.awardType === awardType)
};

export const employeeStorage = {
  getEmployees: () => safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, [])
};

export const getARTById = (id: string) => safeParse<ART[]>(STORAGE_KEYS.ARTS, []).find(a => a.id === id);
export const getTeamById = (id: string) => safeParse<Team[]>(STORAGE_KEYS.TEAMS, []).find(t => t.id === id);