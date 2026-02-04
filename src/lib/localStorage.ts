import { Employee, Badge, AwardType } from "@/types/employee";

// Keeping version consistent
const STORAGE_KEYS = {
  USERS: "sprintwise_users_v26",
  CURRENT_USER: "sprintwise_current_user_v26",
  EMPLOYEES: "sprintwise_employees_v26",
  NOMINATIONS: "sprintwise_nominations_v26",
  SPRINTS: "sprintwise_sprints_v26",
};

const BASE_VOTE_VALUE = 50; 
const SCALING_FACTOR = 3.0;

export interface StoredUser {
  id: string;
  name: string;
  password: string;
  role: string;
  needsPasswordChange?: boolean;
  createdBy?: string;
  createdAt?: string;
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

const initializeDefaultSprints = (): StoredSprint[] => {
  const currentYear = new Date().getFullYear();
  return [
    { id: "sprint_1", title: "Sprint 1 (Jan-Mar)", startDate: new Date(currentYear, 0, 1).toISOString(), endDate: new Date(currentYear, 3, 0, 23, 59, 59).toISOString(), status: 'completed' },
    { id: "sprint_2", title: "Sprint 2 (Apr-Jun)", startDate: new Date(currentYear, 3, 1).toISOString(), endDate: new Date(currentYear, 6, 0, 23, 59, 59).toISOString(), status: 'active' },
    { id: "sprint_3", title: "Sprint 3 (Jul-Sep)", startDate: new Date(currentYear, 6, 1).toISOString(), endDate: new Date(currentYear, 9, 0, 23, 59, 59).toISOString(), status: 'locked' },
    { id: "sprint_4", title: "Sprint 4 (Oct-Dec)", startDate: new Date(currentYear, 9, 1).toISOString(), endDate: new Date(currentYear, 12, 0, 23, 59, 59).toISOString(), status: 'locked' },
  ];
};

const initializeDefaultUsers = (): StoredUser[] => {
  const now = new Date().toISOString();
  return [
    { id: "user_admin", name: "Admin", password: "admin123", role: "admin", needsPasswordChange: false, createdAt: now },
    { id: "user_manager", name: "Steven Strange", password: "password123", role: "train-manager", needsPasswordChange: false, createdAt: now },
    { id: "user_sarah", name: "Sarah Johnson", password: "password123", role: "employee", needsPasswordChange: false, createdAt: now },
    { id: "user_john", name: "John Doe", password: "password123", role: "employee", needsPasswordChange: false, createdAt: now },
  ];
};

const initializeDummyEmployees = (): Employee[] => {
  return [
    { id: "emp1", name: "Sarah Johnson", jobTitle: "Senior Frontend Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", badges: [], totalScore: 0 },
    { id: "emp2", name: "John Doe", jobTitle: "Backend Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", badges: [], totalScore: 0 },
    { id: "emp3", name: "Mike Chen", jobTitle: "Full Stack Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", badges: [], totalScore: 0 },
    { id: "emp5", name: "Alex Rodriguez", jobTitle: "DevOps Engineer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400", badges: [], totalScore: 0 },
    { id: "emp7", name: "David Lee", jobTitle: "Mobile Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400", badges: [], totalScore: 0 },
    { id: "emp8", name: "Sophie Taylor", jobTitle: "QA Engineer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400", badges: [], totalScore: 0 },
    { id: "emp9", name: "Ryan Cole", jobTitle: "Security Engineer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400", badges: [], totalScore: 0 },
    { id: "emp10", name: "James Wilson", jobTitle: "Frontend Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400", badges: [], totalScore: 0 },
    { id: "emp11", name: "Maria Garcia", jobTitle: "Backend Developer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", badges: [], totalScore: 0 },
    { id: "emp12", name: "Robert Chen", jobTitle: "Data Engineer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", badges: [], totalScore: 0 },
    { id: "emp13", name: "Linda Wang", jobTitle: "Site Reliability Engineer", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400", badges: [], totalScore: 0 },
    { id: "emp14", name: "Kevin Scott", jobTitle: "System Architect", department: "Engineering", profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", badges: [], totalScore: 0 },
    { id: "emp4", name: "Emily Brown", jobTitle: "UX Designer", department: "Design", profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", badges: [], totalScore: 0 },
    { id: "emp6", name: "Lisa Park", jobTitle: "UI Designer", department: "Design", profilePicture: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400", badges: [], totalScore: 0 },
    { id: "emp15", name: "Anna Kim", jobTitle: "Graphic Designer", department: "Design", profilePicture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400", badges: [], totalScore: 0 },
    { id: "emp16", name: "Tom Baker", jobTitle: "Product Designer", department: "Design", profilePicture: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400", badges: [], totalScore: 0 },
    { id: "emp17", name: "Rachel Green", jobTitle: "UX Researcher", department: "Design", profilePicture: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400", badges: [], totalScore: 0 },
    { id: "emp18", name: "Gary White", jobTitle: "Motion Designer", department: "Design", profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400", badges: [], totalScore: 0 },
    { id: "emp19", name: "Steven Strange", jobTitle: "Product Manager", department: "Product", profilePicture: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400", badges: [], totalScore: 0 },
    { id: "emp20", name: "Natasha Romanoff", jobTitle: "Product Owner", department: "Product", profilePicture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400", badges: [], totalScore: 0 },
    { id: "emp21", name: "Bruce Banner", jobTitle: "Business Analyst", department: "Product", profilePicture: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400", badges: [], totalScore: 0 },
    { id: "emp22", name: "Tony Stark", jobTitle: "Strategy Lead", department: "Product", profilePicture: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400", badges: [], totalScore: 0 },
    { id: "emp23", name: "Peter Parker", jobTitle: "Content Strategist", department: "Marketing", profilePicture: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=400", badges: [], totalScore: 0 },
    { id: "emp24", name: "Wanda Maximoff", jobTitle: "Social Media Manager", department: "Marketing", profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400", badges: [], totalScore: 0 },
    { id: "emp25", name: "Clint Barton", jobTitle: "SEO Specialist", department: "Marketing", profilePicture: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400", badges: [], totalScore: 0 },
  ];
};

export const auth = {
  // ... (keeping existing auth functions createManager, createEmployee, signup, login, changePassword, logout, getCurrentUser)
  createManager: (adminUser: StoredUser, name: string, password: string) => {
    if (adminUser.role !== 'admin') return { success: false, error: "Unauthorized" };
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    if (users.find(u => u.name === name)) return { success: false, error: "User exists" };
    users.push({ id: `user_${Date.now()}`, name, password, role: 'train-manager', needsPasswordChange: true, createdBy: adminUser.id, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },
  createEmployee: (managerUser: StoredUser, name: string, password: string, dept: string, title: string) => {
    if (managerUser.role !== 'train-manager' && managerUser.role !== 'admin') return { success: false, error: "Unauthorized" };
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    if (users.find(u => u.name === name)) return { success: false, error: "User exists" };
    users.push({ id: `user_${Date.now()}`, name, password, role: 'employee', needsPasswordChange: true, createdBy: managerUser.id, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const employees = employeeStorage.getEmployees();
    employees.push({ id: `emp_${Date.now()}`, name, jobTitle: title, department: dept, profilePicture: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`, badges: [], totalScore: 0 });
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return { success: true };
  },
  signup: (name: string, password: string, role: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    if (users.find((u) => u.name.toLowerCase() === name.toLowerCase())) return { success: false, error: "User already exists." };
    if (name === "Admin" && role === "admin") {
         const newUser = { id: `user_${Date.now()}`, name, password, role, needsPasswordChange: false };
         users.push(newUser);
         localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
         return { success: true };
    }
    const newUser = { id: `user_${Date.now()}`, name, password, role, needsPasswordChange: false };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },
  login: (name: string, password: string, selectedRole: string) => {
    let users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    if (users.length === 0) {
        users = initializeDefaultUsers();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    const user = users.find((u) => u.name === name && u.password === password);
    if (!user) return { success: false, error: "Invalid credentials" };
    if (user.role !== selectedRole) return { success: false, error: `Incorrect Role: You are registered as a "${user.role}", not "${selectedRole}".` };
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  },
  changePassword: (userId: string, newPassword: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].password = newPassword;
        users[index].needsPasswordChange = false;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[index]));
        return { success: true };
    }
    return { success: false, error: "User not found" };
  },
  logout: () => {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  getCurrentUser: () => {
    const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },
  getUsersCreatedBy: (creatorId: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    return users.filter(u => u.createdBy === creatorId);
  }
};

export const sprintStorage = {
    getSprints: (): StoredSprint[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.SPRINTS);
        if (!stored) {
            const defaults = initializeDefaultSprints();
            localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(stored);
    },
    updateSprint: (sprint: StoredSprint) => {
        const sprints = sprintStorage.getSprints();
        const index = sprints.findIndex(s => s.id === sprint.id);
        if (index !== -1) {
            sprints[index] = sprint;
            localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
        }
    },
};

export const employeeStorage = {
  getEmployees: (): Employee[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!stored) {
      const dummyEmployees = initializeDummyEmployees();
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(dummyEmployees));
      return dummyEmployees;
    }
    return JSON.parse(stored);
  },
  
  // NEW: Update Profile Picture
  updateProfilePicture: (employeeId: string, photoBase64: string) => {
      const employees = employeeStorage.getEmployees();
      const index = employees.findIndex(e => e.id === employeeId);
      if (index !== -1) {
          employees[index].profilePicture = photoBase64;
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
          return true;
      }
      return false;
  }
};

export const nominationStorage = {
  getNominations: (): StoredNomination[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.NOMINATIONS);
    return stored ? JSON.parse(stored) : [];
  },
  getNominationsForEmployee: (employeeId: string): Badge[] => {
    const nominations = nominationStorage.getNominations();
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    return nominations.filter((n) => n.nomineeId === employeeId).map((n) => {
        const nominator = users.find((u) => u.id === n.nominatorId);
        return { id: n.id, type: n.awardType, givenBy: nominator?.name || "Unknown", givenById: n.nominatorId, comment: n.comment, rating: n.rating, timestamp: n.timestamp, reactions: [] };
    });
  },
  hasUserNominatedForAward: (nominatorId: string, awardType: AwardType): boolean => {
    const nominations = nominationStorage.getNominations();
    return nominations.some((n) => n.nominatorId === nominatorId && n.awardType === awardType);
  },
  addNomination: (nomineeId: string, nominatorId: string, awardType: AwardType, comment: string, rating: number) => {
    const nominations = nominationStorage.getNominations();
    const employees = employeeStorage.getEmployees();
    const nominee = employees.find(e => e.id === nomineeId);
    if (!nominee) return; 
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const nominator = users.find(u => u.id === nominatorId);
    if (nominator && nominator.name === nominee.name) return null;
    const teamSize = employees.length; 
    const potentialVoters = Math.max(1, teamSize - 1); 
    const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
    const weightedPoints = Math.round(BASE_VOTE_VALUE * fairnessMultiplier);
    const newNom = { id: `nom_${Date.now()}`, nomineeId, nominatorId, awardType, comment, rating, timestamp: new Date().toISOString() };
    nominations.push(newNom);
    localStorage.setItem(STORAGE_KEYS.NOMINATIONS, JSON.stringify(nominations));
    nominee.totalScore += weightedPoints;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return newNom;
  },
};