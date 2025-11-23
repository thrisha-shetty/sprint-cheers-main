export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  profilePicture: string;
  badges: Badge[];
  totalScore: number;
}

export interface Badge {
  id: string;
  type: AwardType;
  givenBy: string;
  givenById: string;
  comment: string;
  rating: number;
  timestamp: Date;
  reactions: Reaction[];
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export type AwardType =
  | "Bug Slayer"
  | "Collaboration Champ"
  | "Customer Obsessed"
  | "Documentation Dynamo"
  | "Innovation Driver"
  | "Most Improved"
  | "Quality Guardian"
  | "Sprint Hero";

export interface AwardCategory {
  type: AwardType;
  icon: string;
  color: string;
  description: string;
}

export type UserRole = "Employee" | "Team Lead" | "Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
