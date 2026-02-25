import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Lock, CalendarRange, Clock, Users } from "lucide-react";
import { Employee, Badge as BadgeType } from "@/types/employee";
import { employeeStorage, nominationStorage, artManagerActions, auth } from "@/lib/localStorage";
import { LeaderboardCard } from "@/components/LeaderboardCard"; 
import { BadgeDetailModal } from "@/components/BadgeDetailModal";

const SCALING_FACTOR = 3.0;
const BASE_VOTE_VALUE = 50;

interface SprintCard {
  id: number;
  title: string;
  period: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'locked';
}

interface TeamLeaderboard {
  teamId: string;
  teamName: string;
  performers: Employee[];
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<SprintCard[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number>(1);
  const [teamLeaderboards, setTeamLeaderboards] = useState<TeamLeaderboard[]>([]);
  
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const tempSprints: SprintCard[] = [
      { 
        id: 1, 
        title: "Sprint 1", 
        period: "Jan - Mar", 
        startDate: new Date(currentYear, 0, 1), 
        endDate: new Date(currentYear, 3, 0, 23, 59, 59) 
      },
      { 
        id: 2, 
        title: "Sprint 2", 
        period: "Apr - Jun", 
        startDate: new Date(currentYear, 3, 1), 
        endDate: new Date(currentYear, 6, 0, 23, 59, 59) 
      },
      { 
        id: 3, 
        title: "Sprint 3", 
        period: "Jul - Sep", 
        startDate: new Date(currentYear, 6, 1), 
        endDate: new Date(currentYear, 9, 0, 23, 59, 59) 
      },
      { 
        id: 4, 
        title: "Sprint 4", 
        period: "Oct - Dec", 
        startDate: new Date(currentYear, 9, 1), 
        endDate: new Date(currentYear, 12, 0, 23, 59, 59) 
      },
    ].map(s => {
      if (today < s.startDate) return { ...s, status: 'locked' };
      if (today >= s.startDate && today <= s.endDate) return { ...s, status: 'active' };
      return { ...s, status: 'completed' };
    }) as SprintCard[];

    setSprints(tempSprints);

    const active = tempSprints.find(s => s.status === 'active');
    if (active) setSelectedSprintId(active.id);
    else setSelectedSprintId(1); 

  }, []);

  useEffect(() => {
    if (sprints.length === 0) return;

    const currentSprint = sprints.find(s => s.id === selectedSprintId);
    if (!currentSprint) return;

    const allEmployees = employeeStorage.getEmployees();
    const user = auth.getCurrentUser();

    let relevantTeams = artManagerActions.getTeams();
    
    if (user && user.role === 'employee' && user.teamId) {
        relevantTeams = relevantTeams.filter(t => t.id === user.teamId);
    } else if (user && user.role === 'art-manager') {
        const myArts = artManagerActions.getARTs().filter(a => a.managerId === user.id);
        const myArtIds = myArts.map(a => a.id);
        relevantTeams = relevantTeams.filter(t => myArtIds.includes(t.artId));
    }

    const boards = relevantTeams.map(team => {
        const teamEmps = allEmployees.filter(e => e.teamId === team.id);
        
        const sprintEmployees = teamEmps.map(emp => {
            const allBadges = nominationStorage.getNominationsForEmployee(emp.id);
            const sprintBadges = allBadges.filter(badge => {
                const badgeDate = new Date(badge.timestamp);
                return badgeDate >= currentSprint.startDate && badgeDate <= currentSprint.endDate;
            });

            // FIXED MATH: Subtract 1 because employee cannot vote for self
            const empTeamSize = teamEmps.length;
            const potentialVoters = Math.max(1, empTeamSize - 1);
            const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
            
            let sprintScore = 0;
            sprintBadges.forEach(() => {
                sprintScore += Math.round(BASE_VOTE_VALUE * fairnessMultiplier);
            });

            return { ...emp, badges: sprintBadges, totalScore: sprintScore };
        });

        // Top 3 for this specific team
        const sorted = sprintEmployees
            .filter(e => e.totalScore > 0)
            .sort((a, b) => b.totalScore - a.totalScore || b.badges.length - a.badges.length || a.name.localeCompare(b.name))
            .slice(0, 3);

        return {
            teamId: team.id,
            teamName: team.name,
            performers: sorted
        };
    });

    setTeamLeaderboards(boards);

  }, [selectedSprintId, sprints]);

  const handleBadgeClick = (badge: BadgeType, employeeId: string) => {
    setSelectedBadge(badge);
    setSelectedEmployeeId(employeeId);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
                Champions Board
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Celebrating Excellence in {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sprints.map((sprint) => {
              const isLocked = sprint.status === 'locked';
              const isActive = sprint.status === 'active';
              const isSelected = selectedSprintId === sprint.id;

              return (
                <button
                  key={sprint.id}
                  disabled={isLocked}
                  onClick={() => setSelectedSprintId(sprint.id)}
                  className={`
                    relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left
                    ${isLocked 
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {sprint.title}
                    </span>
                    {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                    {isActive && !isLocked && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {sprint.period}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    {isLocked ? (
                      <span>Opens {sprint.startDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    ) : (
                      isActive ? <span className="text-green-600 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> In Progress</span> : <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3"/> Completed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        <div className="mb-6 flex items-center justify-between">
           <h2 className="text-lg font-bold text-slate-800">
             Top Performers by Team <span className="text-slate-400 font-normal mx-2">|</span> <span className="text-indigo-600">{sprints.find(s => s.id === selectedSprintId)?.title}</span>
           </h2>
        </div>

        {teamLeaderboards.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">Leaderboard Empty</h3>
             <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
               No teams have been created or no data is available for this period.
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamLeaderboards.map(board => (
               <div key={board.teamId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                     <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                         <Users className="w-5 h-5 text-indigo-500" />
                         {board.teamName}
                     </h3>
                     <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Top 3</Badge>
                 </div>
                 
                 {board.performers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed text-sm">
                        No activity yet for {board.teamName}.
                    </div>
                 ) : (
                    <div className="space-y-4">
                      {board.performers.map((employee, index) => {
                        const currentRank = index === 0 ? 1 : 
                             (employee.totalScore === board.performers[index-1].totalScore ? 
                                (index === 1 ? 1 : (board.performers[1].totalScore === board.performers[0].totalScore ? 1 : 2))
                              : index + 1);

                        return (
                          <LeaderboardCard 
                            key={employee.id}
                            employee={employee}
                            rank={currentRank}
                            onBadgeClick={handleBadgeClick}
                          />
                        );
                      })}
                    </div>
                 )}
               </div>
            ))}
          </div>
        )}
      </main>

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