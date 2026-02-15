import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, LogOut, Trophy, X, Vote, Users, TrendingUp, 
  ArrowLeft, Zap, Calendar, Star, Sparkles, Heart, Activity,
  Globe, Briefcase, Crown, Medal, Loader2, Info, Shield, Settings, UserCircle
} from "lucide-react";
import { AwardCategoryCard } from "@/components/AwardCategoryCard";
import { EmployeeCard } from "@/components/EmployeeCard";
import { NominationModal } from "@/components/NominationModal";
import { ProfileSettings } from "@/components/ProfileSettings"; 
import { awardCategories } from "@/data/mockData";
import { Employee, AwardType, Badge as BadgeType } from "@/types/employee";
import { auth, employeeStorage, nominationStorage } from "@/lib/localStorage";
import { toast } from "sonner";
import { getSprintList } from "@/lib/sprintUtils"; 

// Constants for Client-Side Calculation
const SCALING_FACTOR = 3.0;
const BASE_VOTE_VALUE = 50;

interface EmployeeWithHistory extends Employee {
  pastBadges: BadgeType[];
}

const Home = () => {
  const navigate = useNavigate();
  
  // View State
  const [view, setView] = useState<'dashboard' | 'nomination' | 'history'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployeeRecord, setCurrentEmployeeRecord] = useState<Employee | undefined>(undefined);
  const [employees, setEmployees] = useState<EmployeeWithHistory[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivity, setAllActivity] = useState<any[]>([]); 
  const [topLeader, setTopLeader] = useState<Employee | null>(null);
  const [topPerformers, setTopPerformers] = useState<Employee[]>([]); 
  const [userStats, setUserStats] = useState({
    badgesEarned: 0,
    nominationsMade: 0,
    avgRating: 0
  });
  const [teamCount, setTeamCount] = useState(0);

  // Nomination State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAward, setSelectedAward] = useState<AwardType | null>(null);
  const [isNominationOpen, setIsNominationOpen] = useState(false);
  const [filterAward, setFilterAward] = useState<AwardType | null>(null);

  useEffect(() => {
    try {
      const user = auth.getCurrentUser();
      if (!user) {
        navigate("/");
      } else {
        setCurrentUser(user);
      }
    } catch (e) {
      console.error("Auth check failed:", e);
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      try {
        fetchData();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Dashboard failed to load data correctly.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser]);

  const fetchData = () => {
    if (!currentUser) return; 

    try {
      // Safely get data with fallbacks
      const allEmployees = employeeStorage.getEmployees() || [];
      const sprints = getSprintList() || [];
      
      // SAFETY CHECK: Ensure sprints exist before proceeding
      const currentSprint = (sprints.length > 0) 
        ? (sprints.find(s => s.status === 'active') || sprints[0]) 
        : null;

      // Calculate Dynamic Team Count (Safety check for department property)
      const uniqueDepts = new Set(
          allEmployees
              .filter(e => e && e.department)
              .map(e => e.department)
      );
      setTeamCount(uniqueDepts.size);

      // 1. Process Employees & Calculate SPRINT Scores
      const validEmployees = allEmployees.filter(e => e && e.id);
      
      const employeesWithSprintData = validEmployees.map(emp => {
        const allBadges = nominationStorage.getNominationsForEmployee(emp.id) || [];
        
        let currentSprintBadges: BadgeType[] = [];
        let historicalBadges: BadgeType[] = [];
        let sprintScore = 0;

        if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
            currentSprintBadges = allBadges.filter(b => {
              if (!b.timestamp) return false;
              const d = new Date(b.timestamp);
              return d >= currentSprint.startDate && d <= currentSprint.endDate;
            });

            historicalBadges = allBadges.filter(b => {
              if (!b.timestamp) return false;
              const d = new Date(b.timestamp);
              return d < currentSprint.startDate;
            });

            const potentialVoters = Math.max(1, validEmployees.length - 1);
            const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
            
            currentSprintBadges.forEach(() => {
              sprintScore += Math.round(BASE_VOTE_VALUE * fairnessMultiplier);
            });
        } else {
            historicalBadges = allBadges; 
        }

        return {
          ...emp,
          badges: currentSprintBadges, 
          pastBadges: historicalBadges,
          totalScore: sprintScore 
        };
      }).filter(e => e && e.id);
      
      setEmployees(employeesWithSprintData);

      // 2. Rank for Top Performers
      const activePerformers = employeesWithSprintData.filter(e => e.totalScore > 0);
      const sortedByRank = [...activePerformers].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return (a.name || "").localeCompare(b.name || "");
      });
      
      if (sortedByRank.length > 0) {
        setTopLeader(sortedByRank[0]);
        setTopPerformers(sortedByRank.slice(0, 3)); 
      } else {
        setTopLeader(null);
        setTopPerformers([]);
      }

      // 3. Calculate User Stats
      const normalizedCurrentName = currentUser.name ? currentUser.name.trim().toLowerCase() : "";
      
      const myEmployeeRecord = validEmployees.find(e => e.name && e.name.trim().toLowerCase() === normalizedCurrentName);
      setCurrentEmployeeRecord(myEmployeeRecord);

      let myLifetimeBadges: BadgeType[] = [];
      if (myEmployeeRecord && myEmployeeRecord.id) {
        myLifetimeBadges = nominationStorage.getNominationsForEmployee(myEmployeeRecord.id);
      } else if (currentUser.id) {
        myLifetimeBadges = nominationStorage.getNominationsForEmployee(currentUser.id);
      }

      let mySprintBadges: BadgeType[] = [];
      if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
          mySprintBadges = myLifetimeBadges.filter(b => {
              if (!b.timestamp) return false;
              const d = new Date(b.timestamp);
              return d >= currentSprint.startDate && d <= currentSprint.endDate;
          });
      }

      const allNominationsInSystem = nominationStorage.getNominations() || [];
      let nominationsMadeCount = 0;
      if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
          nominationsMadeCount = allNominationsInSystem.filter(n => {
              if (!n.timestamp) return false;
              const d = new Date(n.timestamp);
              return n.nominatorId === currentUser.id && d >= currentSprint.startDate && d <= currentSprint.endDate;
          }).length;
      }

      const mySprintRecord = employeesWithSprintData.find(e => e.name && e.name.trim().toLowerCase() === normalizedCurrentName);

      setUserStats({
        badgesEarned: mySprintBadges.length,
        nominationsMade: nominationsMadeCount,
        avgRating: mySprintRecord ? mySprintRecord.totalScore : 0
      });

      // 4. Generate Recent Activity Feed
      const allBadgesForFeed = validEmployees.flatMap(emp => {
        const empBadges = nominationStorage.getNominationsForEmployee(emp.id) || [];
        
        let badgesToUse = empBadges;
        if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
           badgesToUse = empBadges.filter(badge => {
             if (!badge.timestamp) return false;
             const d = new Date(badge.timestamp);
             return d >= currentSprint.startDate && d <= currentSprint.endDate;
          });
        }

        return badgesToUse.map(badge => ({
            ...badge,
            receiverName: emp.name || "Unknown",
            receiverImg: emp.profilePicture,
        }));
      });

      const sortedActivity = allBadgesForFeed.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      setAllActivity(sortedActivity);
      setRecentActivity(sortedActivity.slice(0, 10));

    } catch (err) {
      console.error("Critical error in fetchData:", err);
    }
  };

  const handleLogout = () => {
    auth.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleNominate = (employee: Employee, awardType: AwardType) => {
    if (currentUser && employee && currentUser.name === employee.name) return;
    
    setSelectedEmployee(employee);
    setSelectedAward(awardType);
    setIsNominationOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => emp && emp.name !== currentUser?.name);

  const renderRankIcon = (index: number, score: number, allTop: Employee[]) => {
    let rank = 1;
    if (index > 0 && allTop[index-1] && score < allTop[index - 1].totalScore) rank = index + 1;
    else if (index > 0 && allTop[index-1] && score === allTop[index - 1].totalScore) {
      if (index === 1) rank = 1;
      if (index === 2) {
         const prevScore = allTop[1] ? allTop[1].totalScore : 0;
         const topScore = allTop[0] ? allTop[0].totalScore : 0;
         rank = prevScore === topScore ? 1 : 2;
      }
    }
    if (rank === 1) return <span className="text-2xl" role="img" aria-label="Gold Medal">🥇</span>;
    if (rank === 2) return <span className="text-2xl" role="img" aria-label="Silver Medal">🥈</span>;
    if (rank === 3) return <span className="text-2xl" role="img" aria-label="Bronze Medal">🥉</span>;
    return <span className="text-slate-500 font-bold">#{rank}</span>;
  };

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const firstName = (currentUser.name && typeof currentUser.name === 'string') ? currentUser.name.split(' ')[0] : 'Team Member';
  const profilePic = currentEmployeeRecord?.profilePicture;
  
  const isEmployee = currentUser.role === 'employee';

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white"><Sparkles className="w-5 h-5" /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Elevate</h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser.role === 'admin' && <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100" onClick={() => navigate('/admin')}><Shield className="w-4 h-4 mr-2" /> Admin</Button>}
            {currentUser.role === 'art-manager' && <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" onClick={() => navigate('/manager')}><Settings className="w-4 h-4 mr-2" /> Manage</Button>}
            
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1.5 rounded-full pr-4 transition-colors" onClick={() => setIsProfileOpen(true)}>
              {profilePic ? <img src={profilePic} className="w-8 h-8 rounded-full border border-slate-200 object-cover" /> : <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><UserCircle className="w-5 h-5" /></div>}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 leading-none mb-0.5">{currentUser.name}</p>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border-indigo-100">{currentUser.role || 'Team Member'}</Badge>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 hover:bg-red-50"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {view === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/20">
               <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                 <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border-2 border-white/30 overflow-hidden">{profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : firstName.charAt(0)}</div>
                 <div className="text-center md:text-left"><h2 className="text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h2><p className="text-indigo-100 text-lg max-w-xl">"Celebrate achievements. Empower people."</p></div>
              </div>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                 
                 {isEmployee && (
                   <>
                     {/* Quick Actions */}
                     <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => setView('nomination')} className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                          <div className="relative z-10"><h3 className="text-xl font-bold text-gray-900 mb-2"><Vote className="inline w-5 h-5 mr-2"/> Nominate Peer</h3><p className="text-sm text-gray-500">Recognize amazing work.</p></div>
                        </div>
                        <div onClick={() => navigate('/leaderboard')} className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                          <div className="relative z-10"><h3 className="text-xl font-bold text-gray-900 mb-2"><Trophy className="inline w-5 h-5 mr-2"/> Leaderboard</h3><p className="text-sm text-gray-500">See the charts.</p></div>
                        </div>
                      </div>
                     </div>

                     {/* Stats */}
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.badgesEarned}</span><br/><span className="text-xs text-muted-foreground font-medium">Badges</span></div>
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.nominationsMade}</span><br/><span className="text-xs text-muted-foreground font-medium">Votes</span></div>
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.avgRating}</span><br/><span className="text-xs text-muted-foreground font-medium">Sprint Pts</span></div>
                     </div>
                     
                     {/* Pulse */}
                     <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Organization Pulse
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
                        <div className="flex flex-col items-center justify-center text-center px-2">
                          <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Users className="w-3 h-3"/> Total Employees</div>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center px-2">
                          <div className="text-2xl font-bold text-gray-900">3</div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Globe className="w-3 h-3"/> Countries</div>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center px-2">
                          <div className="text-2xl font-bold text-emerald-600">{Math.max(0, employees.length - 2)}</div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Zap className="w-3 h-3"/> Active Today</div>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center px-2">
                          <div className="text-2xl font-bold text-gray-900">{teamCount}</div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3"/> Teams</div>
                        </div>
                      </div>
                     </div>
                   </>
                 )}

                 {/* Top Performers (Visible to ALL roles) */}
                 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Top 3 Performers This Sprint</h3>
                     <Button variant="link" className="text-xs text-indigo-600 p-0 h-auto" onClick={() => navigate('/leaderboard')}>View full leaderboard →</Button>
                   </div>
                   <div className="space-y-3">
                     {topPerformers.length === 0 ? <p className="text-center text-sm text-muted-foreground py-4">No data yet.</p> : 
                       topPerformers.map((emp, i) => (
                         <div key={emp.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="w-6 text-center text-xl font-bold">{renderRankIcon(i, emp.totalScore, topPerformers)}</div>
                             <img src={emp.profilePicture} className="w-8 h-8 rounded-full"/>
                             <div>
                               <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                               <p className="text-[10px] text-muted-foreground">{emp.jobTitle}</p>
                             </div>
                           </div>
                           <Badge variant="secondary" className="bg-white border border-slate-200 text-indigo-600 font-bold">{emp.totalScore} pts</Badge>
                         </div>
                       ))
                     }
                   </div>
                 </div>
               </div>

               {/* Right Column: Recent Feed (Visible to ALL roles) */}
               <div className="lg:col-span-1">
                 <div className="bg-white rounded-2xl border shadow-sm h-full p-4 overflow-y-auto max-h-[500px]">
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    {recentActivity.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No activity yet.</div> : 
                    recentActivity.map(item => (
                        <div key={item.id} className="flex gap-3 text-sm mb-4">
                          <img src={item.receiverImg} className="w-8 h-8 rounded-full" />
                          <div><span className="font-bold">{item.givenBy}</span> recognized <span className="font-bold">{item.receiverName}</span></div>
                        </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        )}
        
        {view === 'nomination' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <Button variant="ghost" className="mb-6 pl-0" onClick={() => setView('dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
             <section className="mb-12">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {awardCategories.map(cat => <AwardCategoryCard key={cat.type} category={cat} onClick={() => setFilterAward(filterAward === cat.type ? null : cat.type)} isSelected={filterAward === cat.type} />)}
               </div>
            </section>
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(emp => <EmployeeCard key={emp.id} employee={emp} onNominate={filterAward ? (e) => handleNominate(e, filterAward) : handleNominate} preselectedAward={filterAward} isDisabled={false} />)}
              </div>
            </section>
          </div>
        )}

        {view === 'history' && (
           <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <Button variant="ghost" className="mb-6 pl-0" onClick={() => setView('dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
             <div className="bg-white rounded-2xl border p-4">
               {allActivity.map(item => <div key={item.id} className="p-4 border-b">{item.givenBy} recognized {item.receiverName}</div>)}
             </div>
           </div>
        )}
      </main>

      <NominationModal isOpen={isNominationOpen} onClose={() => { setIsNominationOpen(false); fetchData(); setView('dashboard'); }} employee={selectedEmployee} awardType={selectedAward} />
      
      <ProfileSettings 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        currentUser={currentUser} 
        employeeRecord={currentEmployeeRecord}
        onUpdate={() => { fetchData(); }}
      />
    </div>
  );
};

export default Home;