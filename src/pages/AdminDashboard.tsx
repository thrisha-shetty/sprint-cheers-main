import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// ADDED: Briefcase to the imports
import { ArrowLeft, Users, ShieldCheck, Check, X, Clock, Briefcase } from "lucide-react";
import { auth, adminActions, StoredUser, employeeStorage } from "@/lib/localStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [managementTeam, setManagementTeam] = useState<StoredUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalEmployees: 0, totalManagement: 0, pending: 0 });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadData();
  }, [navigate]);

  const loadData = () => {
    // 1. Fetch Pending Requests
    const pending = adminActions.getPendingRequests(['art-manager', 'admin']);
    setPendingRequests(pending);

    // 2. Fetch All Users to filter the Active Team
    const allUsers = adminActions.getAllUsers();
    
    // Filter Active Management Team (Approved Admins + Art Managers)
    const activeTeam = allUsers.filter(u => 
        u.status === 'approved' && 
        (u.role === 'art-manager' || u.role === 'admin')
    );
    
    // Sort so Admins appear at top
    activeTeam.sort((a, b) => (a.role === 'admin' ? -1 : 1));
    setManagementTeam(activeTeam);
    
    // 3. Load Global Stats
    const allEmps = employeeStorage.getEmployees();
    
    setStats({
        totalEmployees: allEmps.length,
        totalManagement: activeTeam.length,
        pending: pending.length
    });
  };

  const handleApprove = (userId: string) => {
      if (adminActions.approveUser(userId)) {
          toast.success("Request Approved");
          loadData();
      } else {
          toast.error("Failed to approve");
      }
  };

  const handleReject = (userId: string) => {
      if (adminActions.rejectUser(userId)) {
          toast.success("Request Rejected");
          loadData();
      } else {
          toast.error("Failed to reject");
      }
  };

  const pendingAdmins = pendingRequests.filter(u => u.role === 'admin');
  const pendingManagers = pendingRequests.filter(u => u.role === 'art-manager');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate("/home")} className="pl-0 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Admin Console</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <Card className="bg-slate-900 text-white border-0 shadow-lg">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-400 text-sm">Leadership Team</p><h3 className="text-4xl font-bold mt-1">{stats.totalManagement}</h3></div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-500 text-sm">Pending Requests</p><h3 className="text-4xl font-bold mt-1 text-slate-800">{stats.pending}</h3></div>
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-500 text-sm">Total Employees</p><h3 className="text-4xl font-bold mt-1 text-slate-800">{stats.totalEmployees}</h3></div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            {pendingAdmins.length > 0 && (
                <RequestList title="Pending Admin Access" requests={pendingAdmins} onApprove={handleApprove} onReject={handleReject} color="purple" />
            )}
            {pendingManagers.length > 0 && (
                <RequestList title="Pending Art Manager Access" requests={pendingManagers} onApprove={handleApprove} onReject={handleReject} color="indigo" />
            )}

            {pendingRequests.length === 0 && (
                <div className="text-center py-10 bg-white border border-dashed rounded-3xl text-slate-400">
                    No pending management requests at this time.
                </div>
            )}

            <Card className="rounded-[2rem] overflow-hidden border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Authorized Personnel</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {managementTeam.map((mgr) => (
                            <div key={mgr.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                                        {mgr.firstName.charAt(0)}{mgr.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{mgr.firstName} {mgr.lastName}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                                            {mgr.role === 'art-manager' ? 'Art Manager' : 'Administrator'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <Badge 
                                        variant="outline" 
                                        className={`text-[10px] font-normal ${mgr.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}
                                    >
                                        {mgr.role === 'admin' ? (
                                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>
                                        ) : (
                                            // FIX: Briefcase is now defined and imported
                                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Art Manager</span>
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

const RequestList = ({ title, requests, onApprove, onReject, color }: any) => (
    <Card className={`border-${color}-200 bg-${color}-50/30 rounded-[2rem] overflow-hidden`}>
        <CardHeader className="pb-3 border-b border-white/50"><CardTitle className={`text-lg text-${color}-800 flex items-center gap-2`}>{title} <Badge className={`bg-${color}-100 text-${color}-700 border-0`}>{requests.length}</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-3 p-4">
            {requests.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-${color}-100 text-${color}-700 flex items-center justify-center font-bold`}>{req.firstName.charAt(0)}</div>
                        <div><p className="font-bold text-slate-900">{req.firstName} {req.lastName}</p><span className="text-xs text-slate-400 font-medium">Requested access via portal</span></div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => onReject(req.id)}><X className="w-4 h-4 mr-1"/> Decline</Button>
                        <Button size="sm" className={`bg-${color}-600 hover:bg-${color}-700 text-white shadow-md`} onClick={() => onApprove(req.id)}><Check className="w-4 h-4 mr-1"/> Approve Access</Button>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default AdminDashboard;