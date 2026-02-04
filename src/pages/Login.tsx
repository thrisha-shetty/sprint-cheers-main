import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowRight, CheckCircle2, Trophy, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/localStorage";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "employee",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (isSignUp) {
        // --- SIGN UP ---
        const result = auth.signup(formData.name, formData.password, formData.role);
        
        if (result.success) {
          toast.success("Account created successfully", {
            description: "Logging you in now...",
          });
          const loginResult = auth.login(formData.name, formData.password, formData.role);
          if (loginResult.success) {
            navigate("/home");
          }
        } else {
          toast.error("Registration Failed", { description: result.error });
        }
      } else {
        // --- LOGIN ---
        const result = auth.login(formData.name, formData.password, formData.role);

        if (result.success && result.user) {
          if (result.user.needsPasswordChange) {
            setTempUserId(result.user.id);
            setShowChangePassword(true);
            toast.info("Security Update Required", { description: "Please set a new password to continue." });
          } else {
            toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
            navigate("/home");
          }
        } else {
          // This displays the "Incorrect Role" error from localStorage
          toast.error("Login Failed", { description: result.error, duration: 5000 });
        }
      }
    } catch (error) {
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
      navigate("/home");
    } else {
      toast.error("Error updating password");
    }
    setIsLoading(false);
  };

  const toggleMode = () => {
    const nextIsSignUp = !isSignUp;
    setIsSignUp(nextIsSignUp);
    setFormData({ 
      name: "", 
      password: "", 
      role: nextIsSignUp ? "admin" : "employee" 
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      
      {/* LEFT SIDE: BRANDING PANEL */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative items-center justify-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-600/20 blur-3xl animate-in fade-in duration-1000" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-purple-600/20 blur-3xl animate-in fade-in duration-1000 delay-300" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        <div className="relative z-10 max-w-lg px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-8 backdrop-blur-md">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span>#1 Employee Recognition Platform</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Recognize value. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Inspire greatness.
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Elevate helps forward-thinking companies build a culture of appreciation, one badge at a time.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <span>Celebrate wins in real-time</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <span>Track team performance metrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTH FORM */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
               <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Elevate</h1>
            <p className="text-sm text-slate-500 mt-1">The Employee Recognition Platform</p>
          </div>

          {showChangePassword ? (
             <form onSubmit={handleChangePassword} className="space-y-5 animate-in slide-in-from-right-8">
               <div className="text-center space-y-2 mb-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                   <LockKeyhole className="w-5 h-5" />
                 </div>
                 <h2 className="text-lg font-semibold text-slate-900">Set New Password</h2>
                 <p className="text-sm text-slate-500">Your account requires a new password for security.</p>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="Enter new strong password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
               </div>

               <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update & Login"}
               </Button>
             </form>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isSignUp ? "Admin Registration" : "Welcome back"}
                </h2>
                <p className="text-sm text-slate-500">
                  {isSignUp 
                    ? "Setup the initial Administrator account." 
                    : "Please enter your credentials to sign in."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase text-slate-500 font-bold tracking-wider">Full Name</Label>
                    <Input id="name" placeholder="e.g. Sarah Johnson" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs uppercase text-slate-500 font-bold tracking-wider">Role</Label>
                    <div className="relative">
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        disabled={isSignUp} 
                        className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all appearance-none ${isSignUp ? 'opacity-70 cursor-not-allowed bg-slate-100 text-slate-500' : 'cursor-pointer focus:bg-white'}`}
                      >
                        {isSignUp ? (
                            <option value="admin">Admin</option>
                        ) : (
                            <>
                                <option value="employee">Employee</option>
                                <option value="train-manager">Train Manager</option>
                                <option value="admin">Admin</option>
                            </>
                        )}
                      </select>
                      {!isSignUp && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" class="text-xs uppercase text-slate-500 font-bold tracking-wider">Password</Label>
                      {!isSignUp && <span className="text-xs text-indigo-600 hover:underline cursor-pointer font-medium">Forgot password?</span>}
                    </div>
                    <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl mt-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="flex items-center gap-2">{isSignUp ? "Create Admin Account" : "Sign In to Workspace"} <ArrowRight className="w-4 h-4" /></div>}
                </Button>
              </form>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">System Setup</span></div>
              </div>

              <div className="text-center text-sm mt-6">
                <span className="text-slate-500">{isSignUp ? "Already set up? " : "First time setup? "}</span>
                <button type="button" onClick={toggleMode} className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors">
                  {isSignUp ? "Login" : "Admin Registration"}
                </button>
              </div>
            </>
          )}

        </div>
        <div className="absolute bottom-4 text-center w-full lg:w-1/2 left-0 lg:left-auto text-xs text-slate-400">
          © {new Date().getFullYear()} Elevate Platform. Secure Login.
        </div>
      </div>
    </div>
  );
};

export default Login;