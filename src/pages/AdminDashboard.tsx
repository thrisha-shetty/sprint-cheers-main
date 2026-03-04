import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Shield, Check, X, Clock, Database, Briefcase, Award, LogOut } from "lucide-react";
import { auth, adminActions, artManagerActions, nominationStorage, StoredUser } from "@/lib/localStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [pendingRequests, setPendingRequests] = useState<StoredUser[]>([]);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [stats, setStats] = useState({ totalArts: 0, totalTeams: 0, totalNoms: 0 });

  useEffect(() => {
    const user = auth.getCurrentUser('admin'); 
    if (!user || user.role !== 'admin') {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadData();
  }, [navigate]);

  const loadData = () => {
    setPendingRequests(adminActions.getPendingRequests(['admin', 'art-manager', 'employee']));
    setAllUsers(adminActions.getAllUsers());

    const arts = artManagerActions.getARTs();
    const teams = artManagerActions.getTeams();
    const noms = nominationStorage.getNominations();

    setStats({
        totalArts: arts.length,
        totalTeams: teams.length,
        totalNoms: noms.length
    });
  };

  const handleApprove = (id: string) => {
    if(adminActions.approveUser(id)) {
        toast.success("User access approved/restored.");
        loadData();
    }
  };

  const handleReject = (id: string) => {
    if(adminActions.rejectUser(id)) {
        toast.success("User access has been revoked.");
        loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* BEAUTIFUL WELCOME BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-violet-800 text-white shadow-xl shadow-purple-500/20">
            <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30 overflow-hidden">
                        {currentUser?.firstName?.charAt(0) || 'A'}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.firstName}! 👋</h2>
                        <p className="text-purple-100 text-lg max-w-xl">
                            Oversee system metrics, manage access requests, and control platform settings.
                        </p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => { auth.logout('admin'); navigate("/"); }} className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md whitespace-nowrap">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>
        </section>

        {/* PENDING REQUESTS */}
        <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                    <Clock className="w-5 h-5"/> Pending Access Requests ({pendingRequests.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {pendingRequests.length === 0 ? <p className="text-sm text-purple-600 italic">No pending requests</p> :
                    pendingRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-purple-100 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="font-bold text-slate-900">{req.firstName} {req.lastName}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={
                                        req.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                                        req.role === 'art-manager' ? 'bg-indigo-50 text-indigo-700' : 
                                        'bg-slate-50 text-slate-700'
                                    }>
                                        {req.role === 'admin' ? 'Admin' : req.role === 'art-manager' ? 'Train Manager' : 'Employee'}
                                    </Badge>
                                    Requested: {new Date(req.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleReject(req.id)}><X className="w-4 h-4" /></Button>
                                <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)}><Check className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))
                }
            </CardContent>
        </Card>

        {/* ALL-TIME SYSTEM STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Users className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-900">{allUsers.length}</h3>
                    <p className="text-sm text-slate-500 font-medium">Total Users</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Database className="w-8 h-8 text-indigo-500 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-900">{stats.totalArts}</h3>
                    <p className="text-sm text-slate-500 font-medium">Total ARTs</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Briefcase className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-900">{stats.totalTeams}</h3>
                    <p className="text-sm text-slate-500 font-medium">Total Teams</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Award className="w-8 h-8 text-amber-500 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-900">{stats.totalNoms}</h3>
                    <p className="text-sm text-slate-500 font-medium">All-Time Nominations</p>
                </CardContent>
            </Card>
        </div>

        {/* USER DIRECTORY */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                    <Users className="w-5 h-5 text-purple-600"/> All Registered Users
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase border-b pb-2 px-3">
                        <div className="col-span-5">User</div>
                        <div className="col-span-4">Role</div>
                        <div className="col-span-3 text-right">Status</div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {allUsers.map(user => (
                            <div key={user.id} className="grid grid-cols-12 items-center p-3 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                <div className="col-span-5 font-semibold text-slate-900 flex flex-col">
                                    <span>{user.firstName} {user.lastName}</span>
                                    {user.createdBy === 'system_dummy' && <span className="text-[10px] text-slate-400 font-normal">Dummy Account</span>}
                                </div>
                                <div className="col-span-4">
                                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 uppercase tracking-wider">
                                        {user.role}
                                    </Badge>
                                </div>
                                <div className="col-span-3 text-right flex justify-end">
                                    <Badge variant="outline" className={
                                        user.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                        user.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;