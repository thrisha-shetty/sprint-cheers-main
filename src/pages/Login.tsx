import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowRight, LockKeyhole, User, ShieldCheck, Briefcase, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { auth, UserRole } from "@/lib/localStorage";

const Login = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
  });

  // --- API PART (Preserved) ---
  const [data, setData] = useState<any>([]);
  const handleClick = () => {
    fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_login: "tina.rodriguez", password: "Tina@123" })
    })
      .then(response => response.json())
      .then(result => setData(result))
      .catch(error => console.log(error));
    console.log(data);
  };
  // ----------------------------------------

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsSignUp(false); 
    setFormData({ firstName: "", lastName: "", password: "" });
  };

  // MAIN AUTH HANDLER
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        if (isSignUp) {
            // REGISTER
            const result = auth.signup(formData.firstName, formData.lastName, formData.password, selectedRole);
            if (result.success) {
                const approver = selectedRole === 'employee' ? 'Art Manager' : 'Admin';
                toast.success("Request Sent", { description: `Please wait for ${approver} approval.` });
                setIsSignUp(false); 
            } else {
                toast.error("Registration Failed", { description: result.error });
            }
        } else {
            // LOGIN
            const result = auth.login(formData.firstName, formData.lastName, formData.password, selectedRole);
            if (result.success && result.user) {
                if (result.user.needsPasswordChange) {
                    setTempUserId(result.user.id);
                    setShowChangePassword(true);
                    toast.info("Security Update Required", { description: "Please set a new password." });
                } else {
                    toast.success("Welcome back!");
                    // handleClick(); // Optional: Trigger your API here if needed
                    
                    if (selectedRole === 'admin') navigate('/admin');
                    else if (selectedRole === 'art-manager') navigate('/manager');
                    else navigate('/home');
                }
            } else {
                toast.error("Login Failed", { description: result.error });
            }
        }
    } catch(e) {
        toast.error("An unexpected error occurred");
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!tempUserId) return;
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = auth.changePassword(tempUserId, newPassword);
    
    if (result.success) {
      toast.success("Password Updated", { description: "You are now logged in." });
      
      if (selectedRole === 'admin') navigate('/admin');
      else if (selectedRole === 'art-manager') navigate('/manager');
      else navigate('/home');
    } else {
      toast.error("Error updating password");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative">
       {/* Background */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-6 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Elevate</h1>
          <p className="text-slate-500 mt-2 text-lg">The Employee Recognition Platform</p>
        </div>

        {!selectedRole ? (
            /* ROLE SELECTION CARDS */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Card 
                    title="Admin" 
                    icon={<ShieldCheck className="w-10 h-10" />} 
                    desc="System oversight & Manager approval" 
                    color="purple"
                    onClick={() => handleRoleSelect('admin')} 
                />
                <Card 
                    title="Art Manager" 
                    icon={<Briefcase className="w-10 h-10" />} 
                    desc="Manage Teams, Sprints & Employees" 
                    color="indigo"
                    onClick={() => handleRoleSelect('art-manager')} 
                />
                <Card 
                    title="Employee" 
                    icon={<User className="w-10 h-10" />} 
                    desc="Join a team & Nominate peers" 
                    color="emerald"
                    onClick={() => handleRoleSelect('employee')} 
                />
            </div>
        ) : (
            /* LOGIN / SIGNUP FORM */
            <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative animate-in fade-in slide-in-from-right-8">
                <button 
                    onClick={() => { setSelectedRole(null); setIsSignUp(false); setShowChangePassword(false); }}
                    className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="text-center mb-8 pt-4">
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">
                        {selectedRole === 'art-manager' ? 'Art Manager' : selectedRole} Portal
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {showChangePassword ? "Security Update Required" : (isSignUp ? "Submit request for access" : "Enter your credentials")}
                    </p>
                </div>

                {showChangePassword ? (
                    /* PASSWORD CHANGE FORM */
                    <form onSubmit={handleChangePassword} className="space-y-4">
                         <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <LockKeyhole className="w-6 h-6" />
                            </div>
                            <p className="text-xs text-slate-500">Please set a new secure password for your account.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input 
                                type="password" 
                                placeholder="Enter strong password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white mt-2" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password & Login"}
                        </Button>
                    </form>
                ) : (
                    /* NORMAL FORM - This is where the error was */
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input placeholder="John" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input placeholder="Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        </div>

                        <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <div className="flex items-center gap-2">
                                    {isSignUp ? "Submit Request" : "Sign In"} <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    </form>
                )}

                {!showChangePassword && (
                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">{isSignUp ? "Already have access? " : "Need an account? "}</span>
                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-indigo-600 hover:underline">
                            {isSignUp ? "Sign In" : "Request Access"}
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

// Helper Card Component
const Card = ({ title, icon, desc, color, onClick }: any) => {
    const bgColors: any = { purple: 'bg-purple-50 text-purple-600 border-purple-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    const hoverColors: any = { purple: 'group-hover:border-purple-500', indigo: 'group-hover:border-indigo-500', emerald: 'group-hover:border-emerald-500' };

    return (
        <div onClick={onClick} className={`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${hoverColors[color]}`}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto transition-colors ${bgColors[color]}`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">{title}</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">{desc}</p>
        </div>
    );
};

export default Login;