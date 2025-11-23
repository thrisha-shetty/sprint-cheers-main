import { Employee, Badge, AwardType } from "@/types/employee";

const STORAGE_KEYS = {
  USERS: "sprintwise_users",
  CURRENT_USER: "sprintwise_current_user",
  EMPLOYEES: "sprintwise_employees",
  NOMINATIONS: "sprintwise_nominations",
};

// Updated StoredUser (email removed, role added)
interface StoredUser {
  id: string;
  name: string;       // employee name (used for login)
  password: string;
  role: string;       // admin | train-manager | employee
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

// Dummy employees initializer
const initializeDummyEmployees = (): Employee[] => {
  return [
    {
      id: "emp1",
      name: "Sarah Johnson",
      jobTitle: "Senior Frontend Developer",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      badges: [],
      totalScore: 0,
    },
    {
      id: "emp2",
      name: "John Doe",
      jobTitle: "Backend Developer",
      profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      badges: [],
      totalScore: 0,
    },
    {
      id: "emp3",
      name: "Mike Chen",
      jobTitle: "Full Stack Developer",
      profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      badges: [],
      totalScore: 0,
    },
    {
      id: "emp4",
      name: "Emily Brown",
      jobTitle: "UX Designer",
      profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      badges: [],
      totalScore: 0,
    },
    {
      id: "emp5",
      name: "Alex Rodriguez",
      jobTitle: "DevOps Engineer",
      profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      badges: [],
      totalScore: 0,
    },
    {
      id: "emp6",
      name: "Lisa Park",
      jobTitle: "QA Engineer",
      profilePicture: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
      badges: [],
      totalScore: 0,
    },
  ];
};

export const auth = {
  // SIGN UP
  signup: (
    name: string,
    password: string,
    role: string
  ): { success: boolean; error?: string } => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    // Check duplicate user with same name + role
    if (users.find((u) => u.name === name && u.role === role)) {
      return { success: false, error: "User already exists for this role" };
    }

    const newUser: StoredUser = {
      id: `user_${Date.now()}`,
      name,
      password,
      role,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return { success: true };
  },

  // LOGIN
  login: (
    name: string,
    password: string,
    role: string
  ): { success: boolean; error?: string; user?: StoredUser } => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    const user = users.find(
      (u) => u.name === name && u.password === password && u.role === role
    );

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): StoredUser | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
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

  updateEmployeeScore: (employeeId: string, scoreToAdd: number) => {
    const employees = employeeStorage.getEmployees();
    const employee = employees.find((e) => e.id === employeeId);

    if (employee) {
      employee.totalScore += scoreToAdd;
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    }
  },
};

export const nominationStorage = {
  getNominations: (): StoredNomination[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.NOMINATIONS);
    return stored ? JSON.parse(stored) : [];
  },

  // NEW FUNCTION: Check if user has already nominated for a specific award type
  hasUserNominatedForAward: (nominatorId: string, awardType: AwardType): boolean => {
    const nominations = nominationStorage.getNominations();
    // Return true if any nomination exists with same nominator and same award type
    return nominations.some(
      (n) => n.nominatorId === nominatorId && n.awardType === awardType
    );
  },

  addNomination: (
    nomineeId: string,
    nominatorId: string,
    awardType: AwardType,
    comment: string,
    rating: number
  ) => {
    const nominations = nominationStorage.getNominations();

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

    // Update employee score
    employeeStorage.updateEmployeeScore(nomineeId, rating * 10);

    return newNomination;
  },

  getNominationsForEmployee: (employeeId: string): Badge[] => {
    const nominations = nominationStorage.getNominations();
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    return nominations
      .filter((n) => n.nomineeId === employeeId)
      .map((n) => {
        const nominator = users.find((u) => u.id === n.nominatorId);

        return {
          id: n.id,
          type: n.awardType,
          givenBy: nominator?.name || "Unknown",
          givenById: n.nominatorId,
          comment: n.comment,
          rating: n.rating,
          timestamp: new Date(n.timestamp),
          reactions: [],
        };
      });
  },
};