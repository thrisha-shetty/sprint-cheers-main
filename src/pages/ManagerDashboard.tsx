import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Users, Key, BarChart3 } from "lucide-react";
import { auth, employeeStorage } from "@/lib/localStorage";
import { toast } from "sonner";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", password: "", dept: "Engineering", title: "Developer" });
  const [createdEmployees, setCreatedEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadEmployees(user.id);
  }, [navigate]);

  const loadEmployees = (managerId: string) => {
    const users = auth.getUsersCreatedBy(managerId);
    const allProfiles = employeeStorage.getEmployees();
    const mergedData = users.map(u => {
        const profile = allProfiles.find(p => p.name === u.name);
        return {
            ...u,
            dept: profile?.department || "N/A",
            title: profile?.jobTitle || "N/A"
        };
    });
    setCreatedEmployees(mergedData);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const result = auth.createEmployee(currentUser, formData.name, formData.password, formData.dept, formData.title);
    if (result.success) {
      toast.success("Employee added successfully!");
      setFormData({ name: "", password: "", dept: "Engineering", title: "Developer" });
      loadEmployees(currentUser.id);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate("/home")} className="pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
        </div>

        {/* TEAM STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Total Team Members</p>
                        <h3 className="text-4xl font-bold mt-1">{createdEmployees.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Pending Setup</p>
                        <h3 className="text-4xl font-bold mt-1 text-slate-800">
                            {createdEmployees.filter(e => e.needsPasswordChange).length}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                        <Key className="w-6 h-6 text-amber-600" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Active Departments</p>
                        <h3 className="text-4xl font-bold mt-1 text-slate-800">
                             {new Set(createdEmployees.map(e => e.dept)).size}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: CREATE FORM */}
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Add New Employee
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateEmployee} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Full Name</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Department</label><Input value={formData.dept} onChange={(e) => setFormData({...formData, dept: e.target.value})} required className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Job Title</label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Temp Password</label><Input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required className="mt-1" /></div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Add to Team</Button>
                    </form>
                </CardContent>
                </Card>
            </div>

            {/* RIGHT: LIST */}
            <div className="lg:col-span-2">
                <Card className="h-full">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-indigo-600" /> My Team Directory</CardTitle></CardHeader>
                <CardContent>
                    {createdEmployees.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No employees added yet.</p> : 
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase pb-2 border-b border-slate-100">
                                <div className="col-span-4">Profile</div>
                                <div className="col-span-4">Role</div>
                                <div className="col-span-4 text-right">Login Key</div>
                            </div>
                            {createdEmployees.map((emp) => (
                                <div key={emp.id} className="grid grid-cols-12 items-center p-3 bg-slate-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                                    <div className="col-span-4 font-medium text-slate-900">{emp.name}</div>
                                    <div className="col-span-4"><p className="text-xs font-medium text-slate-700">{emp.title}</p><p className="text-[10px] text-slate-500">{emp.dept}</p></div>
                                    <div className="col-span-4 text-right flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                            <Key className="w-3 h-3 text-slate-400" /><span className="text-xs font-mono text-slate-600">{emp.password}</span>
                                        </div>
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
    </div>
  );
};
export default ManagerDashboard;