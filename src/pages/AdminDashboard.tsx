import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Users, Key, ShieldCheck, Activity } from "lucide-react";
import { auth, StoredUser, employeeStorage } from "@/lib/localStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [createdManagers, setCreatedManagers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalEmployees: 0, totalManagers: 0 });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadManagers(user.id);
    
    // Load global stats
    const allEmps = employeeStorage.getEmployees();
    const allUsers = JSON.parse(localStorage.getItem("sprintwise_users_v26") || "[]");
    setStats({
        totalEmployees: allEmps.length,
        totalManagers: allUsers.filter((u: any) => u.role === 'train-manager').length
    });
  }, [navigate]);

  const loadManagers = (adminId: string) => {
      const managers = auth.getUsersCreatedBy(adminId);
      setCreatedManagers(managers);
  };

  const handleCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const result = auth.createManager(currentUser, name, password);
    if (result.success) {
      toast.success("Train Manager created successfully!");
      setName("");
      setPassword("");
      loadManagers(currentUser.id);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate("/home")} className="pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Admin Console</h1>
        </div>

        {/* SYSTEM STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <Card className="bg-slate-900 text-white border-0 shadow-lg">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-400 text-sm font-medium">Total Managers</p><h3 className="text-4xl font-bold mt-1">{stats.totalManagers}</h3></div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-white" /></div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-500 text-sm font-medium">Total Employees</p><h3 className="text-4xl font-bold mt-1 text-slate-800">{stats.totalEmployees}</h3></div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-slate-500 text-sm font-medium">System Status</p><h3 className="text-xl font-bold mt-1 text-green-600 flex items-center gap-2"><Activity className="w-5 h-5"/> Operational</h3></div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-600" /> Register Train Manager</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleCreateManager} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Manager Name</label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Temp Password</label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" /></div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">Create Account</Button>
                </form>
            </CardContent>
            </Card>

            <Card className="h-fit">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Management Team</CardTitle></CardHeader>
            <CardContent>
                {createdManagers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No managers found.</p> : 
                    <div className="space-y-4">
                        {createdManagers.map((mgr) => (
                            <div key={mgr.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div><p className="font-semibold text-slate-900">{mgr.name}</p><p className="text-xs text-slate-500">Added: {new Date(mgr.createdAt || "").toLocaleDateString()}</p></div>
                                <div className="text-right">
                                     <Badge variant="outline" className="mb-1">{mgr.role}</Badge>
                                     <div className="flex items-center gap-1 text-xs text-slate-400"><Key className="w-3 h-3" /> {mgr.password}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;