import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { Employee, Badge } from "@/types/employee";
import { employeeStorage, nominationStorage } from "@/lib/localStorage";
import { LeaderboardCard } from "@/components/LeaderboardCard"; // This matches the export above!
import { BadgeDetailModal } from "@/components/BadgeDetailModal";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // State for the Modal Interaction
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch Employees
    const allEmployees = employeeStorage.getEmployees();
    
    // 2. Attach Badges (Nominations) to each Employee
    const employeesWithBadges = allEmployees.map(emp => ({
      ...emp,
      badges: nominationStorage.getNominationsForEmployee(emp.id),
    }));

    // 3. Sort logic: Most badges first, then highest score
    employeesWithBadges.sort((a, b) => {
      if (b.badges.length !== a.badges.length) {
        return b.badges.length - a.badges.length;
      }
      return b.totalScore - a.totalScore;
    });

    setEmployees(employeesWithBadges);
  }, []);

  // Handler: When a user clicks a badge on any card
  const handleBadgeClick = (badge: Badge, employeeId: string) => {
    setSelectedBadge(badge);
    setSelectedEmployeeId(employeeId);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Trophy className="w-5 h-5 text-amber-500" />
              Leaderboard
            </h1>
            <p className="text-xs text-muted-foreground">Top performers this month</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        {/* Render the list of cards */}
        {employees.map((employee, index) => (
          <LeaderboardCard 
            key={employee.id}
            employee={employee}
            rank={index + 1}
            onBadgeClick={handleBadgeClick}
          />
        ))}

        {employees.length === 0 && (
           <div className="text-center py-12 text-muted-foreground">
             No data available yet.
           </div>
        )}
      </main>

      {/* The Modal that opens when a badge is clicked */}
      <BadgeDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        badge={selectedBadge}
        employeeId={selectedEmployeeId}
      />
    </div>
  );
};

export default Leaderboard;