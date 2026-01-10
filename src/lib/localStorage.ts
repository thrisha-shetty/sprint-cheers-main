import { Employee, Badge, AwardType } from "@/types/employee";

// UPDATED KEYS: v10 – org-wide damped scoring
const STORAGE_KEYS = {
  USERS: "sprintwise_users_v10",
  CURRENT_USER: "sprintwise_current_user_v10",
  EMPLOYEES: "sprintwise_employees_v10",
  NOMINATIONS: "sprintwise_nominations_v10",
};

// CONSTANTS
const BASE_VOTE_VALUE = 50;

// Global scaling factor (baseline ≈ 10-member team)
const SCALING_FACTOR = 3.0;

interface StoredUser {
  id: string;
  name: string;
  password: string;
  role: string;
}

interface StoredNomination {
  id: string;
  nomineeId: string;
  nominatorId: string;
  awardType: AwardType;
  comment: string;
  rating: number;
  timestamp: string;
}

// ---------- DUMMY DATA ----------
const initializeDummyEmployees = (): Employee[] => [
  // ENGINEERING (6)
  {
    id: "emp1",
    name: "Sarah Johnson",
    jobTitle: "Senior Frontend Developer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp2",
    name: "John Doe",
    jobTitle: "Backend Developer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp3",
    name: "Mike Chen",
    jobTitle: "Full Stack Developer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp5",
    name: "Alex Rodriguez",
    jobTitle: "DevOps Engineer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp7",
    name: "David Lee",
    jobTitle: "Mobile Developer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp8",
    name: "Sophie Taylor",
    jobTitle: "QA Engineer",
    department: "Engineering",
    profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
    badges: [],
    totalScore: 0,
  },

  // DESIGN (2)
  {
    id: "emp4",
    name: "Emily Brown",
    jobTitle: "UX Designer",
    department: "Design",
    profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    badges: [],
    totalScore: 0,
  },
  {
    id: "emp6",
    name: "Lisa Park",
    jobTitle: "UI Designer",
    department: "Design",
    profilePicture: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
    badges: [],
    totalScore: 0,
  },
];

// ---------- AUTH ----------
export const auth = {
  signup: (name: string, password: string, role: string) => {
    const users: StoredUser[] =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    if (users.find(u => u.name === name)) return { success: true };

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      password,
      role,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  },

  login: (name: string, password: string) => {
    const users: StoredUser[] =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    const user = users.find(
      u => u.name === name && u.password === password
    );

    if (!user) return { success: false, error: "Invalid credentials" };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },
};

// ---------- EMPLOYEES ----------
export const employeeStorage = {
  getEmployees: (): Employee[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!stored) {
      const dummy = initializeDummyEmployees();
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(dummy));
      return dummy;
    }
    return JSON.parse(stored);
  },
};

// ---------- NOMINATIONS ----------
export const nominationStorage = {
  getNominations: (): StoredNomination[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.NOMINATIONS);
    return stored ? JSON.parse(stored) : [];
  },

  hasUserNominatedForAward: (nominatorId: string, awardType: AwardType) => {
    const nominations = nominationStorage.getNominations();
    return nominations.some(
      n => n.nominatorId === nominatorId && n.awardType === awardType
    );
  },

  getNominationsForEmployee: (employeeId: string): Badge[] => {
    const nominations = nominationStorage.getNominations();
    const users: StoredUser[] =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    return nominations
      .filter(n => n.nomineeId === employeeId)
      .map(n => {
        const nominator = users.find(u => u.id === n.nominatorId);
        return {
          id: n.id,
          type: n.awardType,
          givenBy: nominator?.name || "Unknown",
          givenById: n.nominatorId,
          comment: n.comment,
          rating: n.rating,
          timestamp: n.timestamp,
          reactions: [],
        };
      });
  },

  addNomination: (
    nomineeId: string,
    nominatorId: string,
    awardType: AwardType,
    comment: string,
    rating: number
  ) => {
    const nominations = nominationStorage.getNominations();
    const employees = employeeStorage.getEmployees();

    const nominee = employees.find(e => e.id === nomineeId);
    if (!nominee) return null;

    // Prevent self-nomination
    const users: StoredUser[] =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const nominator = users.find(u => u.id === nominatorId);

    if (nominator && nominator.name === nominee.name) {
      console.warn("Self-nomination blocked.");
      return null;
    }

    // ---------- DAMPED SCORING (ORG-WIDE) ----------
    const teamSize = employees.length; // TOTAL company size
    const potentialVoters = Math.max(1, teamSize - 1);

    const fairnessMultiplier =
      SCALING_FACTOR / Math.sqrt(potentialVoters);

    const weightedPoints = Math.round(
      BASE_VOTE_VALUE * fairnessMultiplier
    );

    console.log(
      `[Damped Logic] Employees: ${teamSize}, ` +
      `Voters: ${potentialVoters}, ` +
      `Sqrt: ${Math.sqrt(potentialVoters).toFixed(2)}, ` +
      `Multiplier: ${fairnessMultiplier.toFixed(2)}x, ` +
      `Points: ${weightedPoints}`
    );

    const newNomination: StoredNomination = {
      id: `nom_${Date.now()}`,
      nomineeId,
      nominatorId,
      awardType,
      comment,
      rating,
      timestamp: new Date().toISOString(),
    };

    nominations.push(newNomination);
    localStorage.setItem(STORAGE_KEYS.NOMINATIONS, JSON.stringify(nominations));

    nominee.totalScore += weightedPoints;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    return newNomination;
  },
};
