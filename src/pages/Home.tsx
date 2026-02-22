import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, LogOut, Trophy, X, Vote, Users, TrendingUp, 
  ArrowLeft, Zap, Calendar, Star, Sparkles, Heart, Activity,
  Globe, Briefcase, Crown, Medal, Loader2, Info, Shield, Settings, UserCircle, ChevronRight, RefreshCw
} from "lucide-react";
import { AwardCategoryCard } from "@/components/AwardCategoryCard";
import { EmployeeCard } from "@/components/EmployeeCard";
import { NominationModal } from "@/components/NominationModal";
import { ProfileSettings } from "@/components/ProfileSettings"; 
import { Employee, AwardType, Badge as BadgeType } from "@/types/employee";
import { auth, employeeStorage, nominationStorage, artManagerActions, employeeActions, getARTById, getTeamById, sprintStorage, awardStorage, StoredAward } from "@/lib/localStorage";
import { toast } from "sonner";
import { Card } from "@/components/ui/card"; 

const SCALING_FACTOR = 3.0;
const BASE_VOTE_VALUE = 50;

interface EmployeeWithHistory extends Employee {
  pastBadges: BadgeType[];
}

const Home = () => {
  const navigate = useNavigate();
  
  const [view, setView] = useState<'dashboard' | 'nomination' | 'history'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Join Team State
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  // Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployeeRecord, setCurrentEmployeeRecord] = useState<Employee | undefined>(undefined);
  const [employees, setEmployees] = useState<EmployeeWithHistory[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivity, setAllActivity] = useState<any[]>([]); 
  const [topLeader, setTopLeader] = useState<Employee | null>(null);
  const [topPerformers, setTopPerformers] = useState<Employee[]>([]); 
  const [userStats, setUserStats] = useState({ badgesEarned: 0, nominationsMade: 0, avgRating: 0 });
  const [teamCount, setTeamCount] = useState(0);
  
  // DYNAMIC AWARDS STATE
  const [systemAwards, setSystemAwards] = useState<StoredAward[]>([]);
  const [currentSprintName, setCurrentSprintName] = useState<string>("Loading Phase...");

  // Nomination State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAward, setSelectedAward] = useState<AwardType | null>(null);
  const [isNominationOpen, setIsNominationOpen] = useState(false);
  const [filterAward, setFilterAward] = useState<AwardType | null>(null);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) {
      navigate("/");
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      try {
        fetchData();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser]);

  const handleJoinTeam = (teamId: string) => {
    if (employeeActions.joinTeam(currentUser.id, teamId)) {
        toast.success("Joined Team Successfully!");
        const updatedUser = auth.getCurrentUser();
        setCurrentUser(updatedUser);
        setShowTeamSelection(false);
    } else {
        toast.error("Failed to join team.");
    }
  };

  const fetchData = () => {
    if (!currentUser) return; 

    setSystemAwards(awardStorage.getAwards());

    const allEmployees = employeeStorage.getEmployees();
    
    const sprints = sprintStorage.getSprints();
    const currentSprint = sprints.find(s => s.status === 'active') || sprints[sprints.length - 1];
    if (currentSprint) {
        setCurrentSprintName(currentSprint.title);
    }

    const allTeams = artManagerActions.getTeams();
    const myArtTeams = currentUser.artId ? allTeams.filter(t => t.artId === currentUser.artId) : [];
    setTeamCount(myArtTeams.length);

    let teamEmployees = allEmployees;
    if (currentUser.role === 'employee' && currentUser.teamId) {
        teamEmployees = allEmployees.filter(e => e.teamId === currentUser.teamId);
    }

    const employeesWithSprintData = teamEmployees.map(emp => {
      const allBadges = nominationStorage.getNominationsForEmployee(emp.id);
      
      const currentSprintBadges = allBadges.filter(b => {
        const d = new Date(b.timestamp).getTime();
        const start = new Date(currentSprint.startDate).getTime();
        if (currentSprint.status === 'active') return d >= start;
        const end = new Date(currentSprint.endDate).getTime();
        return d >= start && d <= end;
      });

      const historicalBadges = allBadges.filter(b => new Date(b.timestamp).getTime() < new Date(currentSprint.startDate).getTime());

      const potentialVoters = Math.max(1, teamEmployees.length);
      const fairnessMultiplier = SCALING_FACTOR / Math.sqrt(potentialVoters);
      
      let sprintScore = 0;
      currentSprintBadges.forEach(() => { sprintScore += Math.round(BASE_VOTE_VALUE * fairnessMultiplier); });

      return { ...emp, badges: currentSprintBadges, pastBadges: historicalBadges, totalScore: sprintScore };
    });
    
    setEmployees(employeesWithSprintData);

    const activePerformers = employeesWithSprintData.filter(e => e.totalScore > 0);
    const sortedByRank = [...activePerformers].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.name.localeCompare(b.name);
    });
    
    if (sortedByRank.length > 0) {
      setTopLeader(sortedByRank[0]);
      setTopPerformers(sortedByRank.slice(0, 3)); 
    } else {
      setTopLeader(null);
      setTopPerformers([]);
    }

    const normalizedCurrentName = currentUser.name.trim().toLowerCase();
    const myEmployeeRecord = allEmployees.find(e => e.name.trim().toLowerCase() === normalizedCurrentName);
    setCurrentEmployeeRecord(myEmployeeRecord);

    let myLifetimeBadges: BadgeType[] = [];
    if (myEmployeeRecord) {
      myLifetimeBadges = nominationStorage.getNominationsForEmployee(myEmployeeRecord.id);
    } else {
      myLifetimeBadges = nominationStorage.getNominationsForEmployee(currentUser.id);
    }

    const mySprintBadges = myLifetimeBadges.filter(b => {
        const d = new Date(b.timestamp).getTime();
        const start = new Date(currentSprint.startDate).getTime();
        if (currentSprint.status === 'active') return d >= start;
        return d >= start && d <= new Date(currentSprint.endDate).getTime();
    });

    const allNominationsInSystem = nominationStorage.getNominations();
    const nominationsMadeCount = allNominationsInSystem.filter(n => {
        const d = new Date(n.timestamp).getTime();
        const start = new Date(currentSprint.startDate).getTime();
        const isCurrent = currentSprint.status === 'active' ? (d >= start) : (d >= start && d <= new Date(currentSprint.endDate).getTime());
        return n.nominatorId === currentUser.id && isCurrent;
    }).length;

    const mySprintRecord = employeesWithSprintData.find(e => e.name.trim().toLowerCase() === normalizedCurrentName);

    setUserStats({ badgesEarned: mySprintBadges.length, nominationsMade: nominationsMadeCount, avgRating: mySprintRecord ? mySprintRecord.totalScore : 0 });

    // BULLETPROOF FEED LOGIC: Maps directly from calculated badges guaranteeing display if points exist.
    let feed: any[] = [];
    employeesWithSprintData.forEach(emp => {
        emp.badges.forEach(badge => {
            let giver = badge.givenBy;
            if (!giver) {
                const u = allEmployees.find(e => e.id === badge.nominatorId);
                giver = u ? u.name : "A Peer";
            }
            feed.push({ ...badge, givenBy: giver, receiverName: emp.name, receiverImg: emp.profilePicture });
        });
    });

    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAllActivity(feed);
    setRecentActivity(feed.slice(0, 10));
  };

  const handleLogout = () => {
    auth.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleNominate = (employee: Employee, awardType: AwardType) => {
    setSelectedEmployee(employee);
    setSelectedAward(awardType);
    setIsNominationOpen(true);
  };

  // EXCLUDES CURRENT USER SO YOU CANNOT NOMINATE YOURSELF
  const filteredEmployees = employees.filter((emp) => emp.id !== currentUser?.id);

  const renderRankIcon = (index: number, score: number, allTop: Employee[]) => {
    let rank = 1;
    if (index > 0 && score < allTop[index - 1].totalScore) rank = index + 1;
    else if (index > 0 && score === allTop[index - 1].totalScore) {
      if (index === 1) rank = 1;
      if (index === 2) rank = allTop[1].totalScore === allTop[0].totalScore ? 1 : 2;
    }
    if (rank === 1) return <span className="text-2xl" role="img">🥇</span>;
    if (rank === 2) return <span className="text-2xl" role="img">🥈</span>;
    if (rank === 3) return <span className="text-2xl" role="img">🥉</span>;
    return <span className="text-slate-500 font-bold">#{rank}</span>;
  };

  if (!currentUser || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  }

  // --- VIEW 1: DYNAMIC JOIN TEAM FLOW ---
  if (currentUser.role === 'employee' && currentUser.artId && !currentUser.teamId) {
      const art = getARTById(currentUser.artId);
      const allSystemTeams = artManagerActions.getTeams(); 
      // Compute teams on the fly to avoid missing newly created teams
      const availableDynamicTeams = allSystemTeams.filter(t => t.artId === currentUser.artId);

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome aboard, {currentUser.firstName}! 🚂</h1>
                    <p className="text-slate-500">You have been assigned to the <strong>{art?.name}</strong> ART. <br/>Please join your specific team to start nominating peers.</p>
                </div>

                {!showTeamSelection ? (
                     <div 
                        onClick={() => setShowTeamSelection(true)}
                        className="bg-white p-8 rounded-3xl border-2 border-indigo-100 hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-xl transition-all group flex items-center justify-between"
                     >
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Briefcase className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{art?.name}</h2>
                                <p className="text-slate-500">{art?.department}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600" />
                     </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setShowTeamSelection(false)} className="pl-0"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
                            <Button variant="outline" size="sm" onClick={() => fetchData()} className="text-indigo-600"><RefreshCw className="w-4 h-4 mr-2"/> Refresh Teams</Button>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-slate-800">Available Teams in {art?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableDynamicTeams.length === 0 ? (
                                <div className="col-span-2 text-center py-10 bg-white rounded-2xl border">
                                  <p className="text-slate-400">No teams created in this ART yet.</p>
                                  <Button variant="ghost" onClick={() => setShowTeamSelection(false)} className="mt-2">Go Back</Button>
                                </div>
                            ) : (
                                availableDynamicTeams.map(t => (
                                    <div key={t.id} className="bg-white p-6 rounded-2xl border hover:shadow-lg transition-all space-y-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900">{t.name}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                                        </div>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleJoinTeam(t.id)}>Join Team</Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      );
  }

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Team Member';
  const profilePic = currentEmployeeRecord?.profilePicture;
  const isEmployee = currentUser.role === 'employee';
  const myTeam = getTeamById(currentUser.teamId);

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
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
                 <div className="text-center md:text-left">
                     <h2 className="text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
                     <p className="text-indigo-100 text-lg max-w-xl">
                        {myTeam ? `Team: ${myTeam.name}` : "Celebrate achievements. Empower people."}
                     </p>
                     <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/30 text-sm font-semibold text-white shadow-sm">
                        <Calendar className="w-4 h-4 text-indigo-100" />
                        Current Phase: {currentSprintName}
                     </div>
                 </div>
              </div>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                 {isEmployee && (
                   <>
                     {/* QUICK ACTIONS */}
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

                     {/* STATS */}
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.badgesEarned}</span><br/><span className="text-xs text-muted-foreground font-medium">Badges</span></div>
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.nominationsMade}</span><br/><span className="text-xs text-muted-foreground font-medium">Votes</span></div>
                        <div className="bg-white p-4 rounded-2xl border text-center"><span className="text-2xl font-bold text-gray-900">{userStats.avgRating}</span><br/><span className="text-xs text-muted-foreground font-medium">Sprint Pts</span></div>
                     </div>

                     {/* ORGANIZATIONAL PULSE */}
                     <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500" /> Organizational Pulse
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
                          <div className="flex flex-col items-center justify-center text-center px-2 group">
                            <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{employeeStorage.getEmployees().length}</div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Users className="w-3 h-3"/> Active Users</div>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center px-2 group">
                            <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{teamCount}</div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3"/> ART Teams</div>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center px-2 group">
                            <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">3</div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Globe className="w-3 h-3"/> Countries</div>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center px-2 group">
                            <div className="text-2xl font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">High</div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1"><Zap className="w-3 h-3"/> Engagement</div>
                          </div>
                        </div>
                     </div>
                   </>
                 )}

                 {/* TOP PERFORMERS */}
                 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Top Performers ({currentSprintName})</h3>
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

               {/* RIGHT COLUMN: ACTIVITY */}
               <div className="lg:col-span-1">
                 <div className="bg-white rounded-2xl border shadow-sm h-full p-4 overflow-y-auto max-h-[500px]">
                    <h3 className="font-semibold mb-4">Activity in {currentSprintName}</h3>
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
                {systemAwards.map(cat => (
                    <AwardCategoryCard 
                        key={cat.id} 
                        category={{...cat, name: cat.type} as any}
                        onClick={() => setFilterAward(filterAward === cat.type ? null : (cat.type as AwardType))} 
                        isSelected={filterAward === cat.type} 
                    />
                ))}
               </div>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-4 text-slate-800">Select Teammate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* FILTERED TO PREVENT SELF NOMINATION */}
                {filteredEmployees.map(emp => <EmployeeCard key={emp.id} employee={emp} onNominate={filterAward ? (e) => handleNominate(e, filterAward) : handleNominate} preselectedAward={filterAward} isDisabled={false} />)}
              </div>
            </section>
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