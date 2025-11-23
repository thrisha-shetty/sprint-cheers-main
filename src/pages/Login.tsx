import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/localStorage";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "employee", // Default role
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const result = auth.signup(formData.name, formData.password, formData.role);
        
        if (result.success) {
          toast.success("Account created! Logging you in...");
          // Auto login after signup
          const loginResult = auth.login(formData.name, formData.password, formData.role);
          if (loginResult.success && loginResult.user) {
            navigate("/home");
          }
        } else {
          toast.error(result.error || "Signup failed");
        }
      } else {
        // --- LOGIN LOGIC ---
        const result = auth.login(formData.name, formData.password, formData.role);

        if (result.success && result.user) {
          toast.success(`Welcome back, ${result.user.name}!`);
          navigate("/home");
        } else {
          toast.error(result.error || "Invalid credentials");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: "", password: "", role: "employee" }); // Reset form
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Elevate
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create a new account to get started" : "Enter your details to access your workspace"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Employee Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Sarah Johnson" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
                className="bg-white/50"
              />
            </div>

            {/* Role Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="employee">Employee</option>
                  <option value="train-manager">Train Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {/* Custom arrow for better styling */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="bg-white/50"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
                  {isSignUp ? "Sign Up" : "Sign In"}
                </>
              )}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button 
                type="button"
                onClick={toggleMode}
                className="font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                {isSignUp ? "Login" : "Sign Up"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;