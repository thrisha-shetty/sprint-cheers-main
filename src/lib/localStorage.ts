import { Employee, Badge, AwardType } from "@/types/employee";

// VERSION UPDATE: _v48 (Fixing Syntax Error & Missing Exports)
const STORAGE_KEYS = {
  USERS: "sprintwise_users_v48",
  CURRENT_USER: "sprintwise_current_user_v48",
  EMPLOYEES: "sprintwise_employees_v48",
  NOMINATIONS: "sprintwise_nominations_v48",
  SPRINTS: "sprintwise_sprints_v48",
  ARTS: "sprintwise_arts_v48",
  TEAMS: "sprintwise_teams_v48",
  AWARDS: "sprintwise_awards_v48",
  NOTIFICATIONS: "sprintwise_notifications_v48",
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
    icon: string;
    color: string;
    description: string;
    points: number;
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

// --- HELPER: Safe JSON Parsing ---
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error parsing ${key}`, error);
    return fallback;
  }
};

// --- INITIALIZATION ---
const initializeDefaultAwards = (): StoredAward[] => [
    { type: "Culture Champion", icon: "Heart", color: "#e11d48", description: "Promoting positive team culture", points: 50, id: "aw_1" },
    { type: "Bug Slayer", icon: "Sword", color: "#dc2626", description: "Fixing critical issues", points: 30, id: "aw_2" },
    { type: "Team Player", icon: "Users", color: "#2563eb", description: "Helping others succeed", points: 40, id: "aw_3" },
    { type: "Innovator", icon: "Lightbulb", color: "#d97706", description: "Creative solutions", points: 60, id: "aw_4" },
    { type: "Customer Hero", icon: "Smile", color: "#059669", description: "Going above and beyond for clients", points: 50, id: "aw_5" },
    { type: "Early Bird", icon: "Sunrise", color: "#f59e0b", description: "First to start, always prepared", points: 20, id: "aw_6" },
    { type: "Night Owl", icon: "Moon", color: "#4338ca", description: "Dedication beyond standard hours", points: 20, id: "aw_7" },
    { type: "Code Wizard", icon: "Wand2", color: "#7c3aed", description: "Exceptional technical problem solving", points: 45, id: "aw_8" },
];

const initializeDefaultSprints = (): StoredSprint[] => {
  const currentYear = new Date().getFullYear();
  return [
    { id: "sprint_1", title: "Sprint 1 (Jan-Mar)", startDate: new Date(currentYear, 0, 1).toISOString(), endDate: new Date(currentYear, 3, 0, 23, 59, 59).toISOString(), status: 'active' },
    { id: "sprint_2", title: "Sprint 2 (Apr-Jun)", startDate: new Date(currentYear, 3, 1).toISOString(), endDate: new Date(currentYear, 6, 0, 23, 59, 59).toISOString(), status: 'locked' },
    { id: "sprint_3", title: "Sprint 3 (Jul-Sep)", startDate: new Date(currentYear, 6, 1).toISOString(), endDate: new Date(currentYear, 9, 0, 23, 59, 59).toISOString(), status: 'locked' },
    { id: "sprint_4", title: "Sprint 4 (Oct-Dec)", startDate: new Date(currentYear, 9, 1).toISOString(), endDate: new Date(currentYear, 12, 0, 23, 59, 59).toISOString(), status: 'locked' },
  ];
};

const initializeDefaults = () => {
  const now = new Date().toISOString();
  
  // Create default users if they don't exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: StoredUser[] = [
      { id: "user_admin_john", firstName: "John", lastName: "Doe", password: "John@123", role: "admin", status: "approved", needsPasswordChange: false, createdAt: now },
      { id: "user_manager", firstName: "Steven", lastName: "Strange", password: "password123", role: "art-manager", status: "approved", needsPasswordChange: false, createdAt: now },
      { id: "user_sarah", firstName: "Sarah", lastName: "Johnson", password: "password123", role: "employee", status: "approved", needsPasswordChange: false, createdAt: now }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Ensure other defaults exist
  if (!localStorage.getItem(STORAGE_KEYS.AWARDS)) localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(initializeDefaultAwards()));
  if (!localStorage.getItem(STORAGE_KEYS.SPRINTS)) localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(initializeDefaultSprints()));
  if (!localStorage.getItem(STORAGE_KEYS.ARTS)) localStorage.setItem(STORAGE_KEYS.ARTS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.NOMINATIONS)) localStorage.setItem(STORAGE_KEYS.NOMINATIONS, JSON.stringify([]));
};

// --- AUTH ACTIONS ---
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
    
    if (users.some(u => u.firstName.toLowerCase() === firstName.toLowerCase() && u.lastName.toLowerCase() === lastName.toLowerCase())) {
        return { success: false, error: "User already exists." };
    }
    
    const isSuperAdmin = firstName.toLowerCase() === 'john' && lastName.toLowerCase() === 'doe' && role === 'admin';

    const newUser: StoredUser = { 
      id: `user_${Date.now()}`, 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      password, 
      role, 
      status: isSuperAdmin ? 'approved' : 'pending',
      needsPasswordChange: false,
      createdAt: new Date().toISOString() 
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },

  login: (firstName: string, lastName: string, password: string, selectedRole: UserRole) => {
    initializeDefaults();
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    
    const user = users.find(u => 
        u.firstName.toLowerCase() === firstName.toLowerCase() && 
        u.lastName.toLowerCase() === lastName.toLowerCase() && 
        u.password === password
    );

    if (!user) return { success: false, error: "Invalid credentials" };
    
    if (user.role !== selectedRole) return { success: false, error: "Incorrect portal selection" };
    
    if (user.status === 'pending') return { success: false, error: "Your account is pending approval." };
    if (user.status === 'rejected') return { success: false, error: "Your account request was declined." };

    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  },

  logout: () => sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER),

  changePassword: (userId: string, newPassword: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].password = newPassword;
        users[index].needsPasswordChange = false;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return { success: true };
    }
    return { success: false, error: "User not found" };
  },

  getUsersCreatedBy: (creatorId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return users.filter(u => u.createdBy === creatorId);
  },

  createManager: (adminUser: StoredUser, firstName: string, lastName: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    if (users.find(u => u.firstName === firstName && u.lastName === lastName)) return { success: false, error: "User exists" };
    
    users.push({ 
        id: `user_${Date.now()}`, firstName, lastName, password: "password123", role: 'art-manager', 
        status: 'approved', needsPasswordChange: true, createdBy: adminUser.id, createdAt: new Date().toISOString() 
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },

  createEmployee: (managerUser: StoredUser, firstName: string, lastName: string, dept: string, title: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    if (users.find(u => u.firstName === firstName && u.lastName === lastName)) return { success: false, error: "User exists" };
    
    const newUserId = `user_${Date.now()}`;
    users.push({ 
        id: newUserId, firstName, lastName, password: "password123", role: 'employee', 
        status: 'approved', needsPasswordChange: true, createdBy: managerUser.id, createdAt: new Date().toISOString() 
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const employees = safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    employees.push({
        id: newUserId,
        name: `${firstName} ${lastName}`,
        jobTitle: title,
        department: dept,
        profilePicture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        badges: [],
        totalScore: 0
    });
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return { success: true };
  },
};

// --- ADMIN ACTIONS ---
export const adminActions = {
  getAllUsers: () => safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []),

  getPendingRequests: (roles: UserRole[]) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return users.filter(u => u.status === 'pending' && roles.includes(u.role));
  },
  
  approveUser: (userId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx].status = 'approved';
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    }
    return false;
  },
  
  rejectUser: (userId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx].status = 'rejected';
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    }
    return false;
  }
};

// --- ART MANAGER ACTIONS ---
export const artManagerActions = {
  getPendingEmployees: () => safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []).filter(u => u.role === 'employee' && u.status === 'pending'),
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
  createART: (name: string, department: string, managerId: string) => {
    const arts = safeParse<ART[]>(STORAGE_KEYS.ARTS, []);
    arts.push({ id: `art_${Date.now()}`, name, department, managerId });
    localStorage.setItem(STORAGE_KEYS.ARTS, JSON.stringify(arts));
  },
  getARTs: () => safeParse<ART[]>(STORAGE_KEYS.ARTS, []),
  createTeam: (artId: string, name: string, description: string) => {
    const teams = safeParse<Team[]>(STORAGE_KEYS.TEAMS, []);
    teams.push({ id: `team_${Date.now()}`, artId, name, description });
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
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

// --- EMPLOYEE ACTIONS ---
export const employeeActions = {
  joinTeam: (userId: string, teamId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].teamId = teamId;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    return false;
  },
  getTeamPeers: (teamId: string, myId: string) => {
    const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return users
      .filter(u => u.teamId === teamId && u.id !== myId)
      .map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        department: "Team Member",
        profilePicture: `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random`
      }));
  }
};

// --- STORAGES ---
export const employeeStorage = {
  getEmployees: () => safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, []),
  updateProfilePicture: (employeeId: string, photoBase64: string) => {
      const employees = safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const index = employees.findIndex(e => e.id === employeeId);
      if (index !== -1) {
          employees[index].profilePicture = photoBase64;
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
          return true;
      }
      return false;
  }
};

export const sprintStorage = {
  getSprints: () => safeParse<StoredSprint[]>(STORAGE_KEYS.SPRINTS, []),
  addSprint: (title: string) => {
    const sprints = safeParse<StoredSprint[]>(STORAGE_KEYS.SPRINTS, []);
    sprints.push({ 
        id: `sp_${Date.now()}`, 
        title, 
        startDate: new Date().toISOString(), 
        endDate: new Date().toISOString(), 
        status: 'active' 
    });
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
  }
};

export const awardStorage = {
  getAwards: () => safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []),
  addAward: (type: string, description: string) => {
    const awards = safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []);
    awards.push({ id: `aw_${Date.now()}`, type, description, icon: 'Star', color: '#6366f1', points: 50 });
    localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(awards));
  },
  deleteAward: (id: string) => {
    const awards = safeParse<StoredAward[]>(STORAGE_KEYS.AWARDS, []).filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(awards));
  }
};

export const nominationStorage = {
  addNomination: (nomineeId: string, nominatorId: string, awardType: string, comment: string, rating: number) => {
    const nominations = safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []);
    const employees = safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    
    const nominee = employees.find((e: any) => e.id === nomineeId);
    if (!nominee) return;
    
    // Damped Scoring Logic
    let potentialVoters = 10; 
    if (nominee.teamId) {
        // Find how many people are in this team
        const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
        const teamMembers = users.filter((u: any) => u.teamId === nominee.teamId);
        potentialVoters = Math.max(1, teamMembers.length - 1);
    }
    
    const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
    const weightedPoints = Math.round(BASE_VOTE_VALUE * fairnessMultiplier);

    nominations.push({ 
        id: `nom_${Date.now()}`, 
        nominatorId, 
        nomineeId, 
        awardType: awardType as AwardType, 
        comment, 
        rating, 
        timestamp: new Date().toISOString() 
    });
    localStorage.setItem(STORAGE_KEYS.NOMINATIONS, JSON.stringify(nominations));
    
    nominee.totalScore = (nominee.totalScore || 0) + weightedPoints;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },
  
  getNominations: () => safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []),
  
  getNominationsForEmployee: (id: string) => {
      const noms = safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []);
      const users = safeParse<StoredUser[]>(STORAGE_KEYS.USERS, []);
      return noms.filter((n:any) => n.nomineeId === id).map((n:any) => {
           const sender = users.find((u:any) => u.id === n.nominatorId);
           return { 
             ...n, 
             givenBy: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown" 
           };
      });
  },
  
  hasUserNominatedForAward: (userId: string, awardType: string) => {
      const noms = safeParse<StoredNomination[]>(STORAGE_KEYS.NOMINATIONS, []);
      return noms.some((n: any) => n.nominatorId === userId && n.awardType === awardType);
  }
};

export const getARTById = (id: string) => safeParse<ART[]>(STORAGE_KEYS.ARTS, []).find(a => a.id === id);
export const getTeamById = (id: string) => safeParse<Team[]>(STORAGE_KEYS.TEAMS, []).find(t => t.id === id);