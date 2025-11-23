import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, LogOut, Trophy, X, Vote, Users, TrendingUp, 
  ArrowLeft, Zap, Calendar, Star, Sparkles, Heart, Activity,
  Globe, Briefcase, Crown, Medal, Loader2
} from "lucide-react";
import { AwardCategoryCard } from "@/components/AwardCategoryCard";
import { EmployeeCard } from "@/components/EmployeeCard";
import { NominationModal } from "@/components/NominationModal";
import { awardCategories } from "@/data/mockData";
import { Employee, AwardType } from "@/types/employee";
import { auth, employeeStorage, nominationStorage } from "@/lib/localStorage";
import { toast } from "sonner";

const Home = () => {
  const navigate = useNavigate();
  
  // View State
  const [view, setView] = useState<'dashboard' | 'nomination'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topLeader, setTopLeader] = useState<Employee | null>(null);
  const [topPerformers, setTopPerformers] = useState<Employee[]>([]); 
  const [userStats, setUserStats] = useState({
    badgesEarned: 0,
    nominationsMade: 0,
    avgRating: 0
  });

  // Nomination State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAward, setSelectedAward] = useState<AwardType | null>(null);
  const [isNominationOpen, setIsNominationOpen] = useState(false);
  const [filterAward, setFilterAward] = useState<AwardType | null>(null);

  useEffect(() => {
    // STANDARD AUTH CHECK
    const user = auth.getCurrentUser();
    if (!user) {
      navigate("/"); // Send back to login if no user
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
        toast.error("Something went wrong loading your dashboard.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser]);

  const fetchData = () => {
    const allEmployees = employeeStorage.getEmployees();
    
    // 1. Process Employees & Badges
    const employeesWithBadges = allEmployees.map(emp => ({
      ...emp,
      badges: nominationStorage.getNominationsForEmployee(emp.id),
    }));
    setEmployees(employeesWithBadges);

    // 2. Calculate Top Leader & Top 3 (Sort by Badge Count then Score)
    const sortedByRank = [...employeesWithBadges].sort((a, b) => {
      // Primary sort: Badge Count
      if (b.badges.length !== a.badges.length) {
        return b.badges.length - a.badges.length;
      }
      // Secondary sort: Total Score
      return b.totalScore - a.totalScore;
    });
    
    // Set the top employee as the leader
    if (sortedByRank.length > 0) {
      setTopLeader(sortedByRank[0]);
      setTopPerformers(sortedByRank.slice(0, 3)); 
    }

    // 3. Calculate User Stats
    const myEmployeeRecord = employeesWithBadges.find(e => e.name === currentUser.name) || 
                             employeesWithBadges.find(e => e.id === currentUser.id);

    let myBadges: any[] = [];
    if (myEmployeeRecord) {
      myBadges = myEmployeeRecord.badges;
    }

    // Count nominations made by ME
    let nominationsMadeCount = 0;
    employeesWithBadges.forEach(emp => {
      emp.badges.forEach(badge => {
        if (badge.givenById === currentUser.id) {
          nominationsMadeCount++;
        }
      });
    });

    // Calculate Avg Rating Received
    const totalStars = myBadges.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = myBadges.length > 0 ? (totalStars / myBadges.length).toFixed(1) : "0.0";

    setUserStats({
      badgesEarned: myBadges.length,
      nominationsMade: nominationsMadeCount,
      avgRating: Number(avgRating)
    });

    // 4. Generate Recent Activity Feed
    const allBadges = employeesWithBadges.flatMap(emp => 
      emp.badges.map(badge => ({
        ...badge,
        receiverName: emp.name,
        receiverImg: emp.profilePicture,
      }))
    );

    const sortedActivity = allBadges.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10); 

    setRecentActivity(sortedActivity);
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

  const filteredEmployees = employees.filter((emp) => emp.id !== currentUser?.id);

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

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-repeat [background-size:100px_100px] [background-image:radial-gradient(#000_1px,transparent_1px)]" />
      </div>

      {/* Header - UPDATED WITH USER INFO */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Elevate
            </h1>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{currentUser.name}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border-indigo-100">
                {currentUser.role || 'Team Member'}
              </Badge>
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* --- VIEW 1: DASHBOARD --- */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            
            {/* 1. Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Trophy size={180} />
              </div>
              <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                 <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border-2 border-white/30">
                    {currentUser.name.charAt(0)}
                 </div>
                 <div className="text-center md:text-left">
                   <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name.split(' ')[0]}! 👋</h2>
                   <p className="text-indigo-100 text-lg max-w-xl">
                     "Celebrate achievements. Empower people." <br/>
                     <span className="text-sm opacity-80 mt-1 block">You have new activity in your team today.</span>
                   </p>
                 </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Stats, Overview, & Actions */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 2. User Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all group">
                    <div className="mb-2 p-2 bg-yellow-50 text-yellow-600 rounded-full group-hover:scale-110 transition-transform">
                      <Trophy size={20} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{userStats.badgesEarned}</span>
                    <span className="text-xs text-muted-foreground font-medium">Badges Earned</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all group">
                    <div className="mb-2 p-2 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                      <Vote size={20} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{userStats.nominationsMade}</span>
                    <span className="text-xs text-muted-foreground font-medium">Votes Cast</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all group">
                    <div className="mb-2 p-2 bg-green-50 text-green-600 rounded-full group-hover:scale-110 transition-transform">
                      <Star size={20} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{userStats.avgRating}</span>
                    <span className="text-xs text-muted-foreground font-medium">Avg Rating</span>
                  </div>
                </div>

                {/* 3. Team Overview Block */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Organization Pulse
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
                    <div className="flex flex-col items-center justify-center text-center px-2">
                      <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" /> Total Employees
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-2">
                      <div className="text-2xl font-bold text-gray-900">3</div>
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3" /> Countries
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-2">
                      <div className="text-2xl font-bold text-emerald-600">{Math.max(0, employees.length - 2)}</div>
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" /> Active Today
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-2">
                      <div className="text-2xl font-bold text-gray-900">6</div>
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3" /> Teams
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Top Performers Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" /> Top Performers This Week
                    </h3>
                    <Button variant="link" className="text-xs text-indigo-600 p-0 h-auto" onClick={() => navigate('/leaderboard')}>
                      View full leaderboard →
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {topPerformers.map((emp, index) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                         <div className="flex items-center gap-3">
                           <div className="flex items-center justify-center w-6 font-bold text-slate-400">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                           </div>
                           <img src={emp.profilePicture} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" />
                           <div>
                             <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                             <p className="text-[10px] text-muted-foreground">{emp.jobTitle}</p>
                           </div>
                         </div>
                         <Badge variant="secondary" className="bg-white border border-slate-200 text-indigo-600 font-bold">
                           {emp.totalScore} pts
                         </Badge>
                      </div>
                    ))}
                    {topPerformers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No data available yet.</p>
                    )}
                  </div>
                </div>

                {/* 5. Improved Quick Actions */}
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nomination Card */}
                  <div 
                    onClick={() => setView('nomination')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                        <Vote size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Nominate Peer</h3>
                      <p className="text-sm text-gray-500 mb-6">Recognize amazing work. Make someone's day special.</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                          Avg time: 1 min
                        </span>
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                          →
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Card */}
                  <div 
                    onClick={() => navigate('/leaderboard')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:-rotate-6 transition-transform">
                        <Trophy size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Leaderboard</h3>
                      <p className="text-sm text-gray-500 mb-6">See who's leading the charts this month.</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                          {/* UPDATED: Now displays the actual topLeader name */}
                          Top: {topLeader?.name.split(' ')[0] || 'None'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Recent Feed (Span 1) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
                    </h3>
                    <Badge variant="secondary" className="text-xs">Live</Badge>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No activity yet. Be the first to nominate!
                      </div>
                    ) : (
                      recentActivity.map((item) => (
                        <div key={item.id} className="flex gap-3 items-start animate-in slide-in-from-right-4 duration-500">
                          <div className="relative">
                            <img 
                              src={item.receiverImg} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full object-cover border border-slate-100"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">
                              <span className="font-semibold">{item.givenBy}</span> recognized <span className="font-semibold">{item.receiverName}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-blue-200 text-blue-700 bg-blue-50">
                                {item.type}
                              </Badge>
                              <div className="flex text-yellow-400">
                                {[...Array(item.rating)].map((_, i) => (
                                  <Star key={i} size={10} fill="currentColor" />
                                ))}
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                              <Calendar size={10} />
                              {/* Simple date formatting fallback */}
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-slate-100 text-center">
                    <Button variant="ghost" size="sm" className="text-xs w-full text-muted-foreground">
                      View All History
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW 2: NOMINATION FLOW --- */}
        {view === 'nomination' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            
            <Button 
              variant="ghost" 
              className="mb-6 pl-0 hover:bg-transparent hover:text-primary group" 
              onClick={() => setView('dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>

            {/* Award Categories */}
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Select an Award</h2>
                  <p className="text-muted-foreground">Filter team members by the category closest to their achievement.</p>
                </div>
                {filterAward && (
                  <Badge variant="secondary" className="gap-2 cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => setFilterAward(null)}>
                    {filterAward}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {awardCategories.map((category) => (
                  <AwardCategoryCard 
                    key={category.type} 
                    category={category}
                    onClick={() => setFilterAward(filterAward === category.type ? null : category.type)}
                    isSelected={filterAward === category.type}
                  />
                ))}
              </div>
            </section>

            {/* Employee List */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {filterAward ? `Nominate for ${filterAward}` : "Team Members"}
                </h2>
                <p className="text-muted-foreground">
                  Select a colleague below to start your nomination.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onNominate={filterAward ? (emp) => handleNominate(emp, filterAward) : handleNominate}
                    preselectedAward={filterAward}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

      </main>

      <NominationModal
        isOpen={isNominationOpen}
        onClose={() => {
          setIsNominationOpen(false);
          fetchData(); // Refresh data immediately
          setView('dashboard'); // Return to dashboard
        }}
        employee={selectedEmployee}
        awardType={selectedAward}
      />
    </div>
  );
};

export default Home;