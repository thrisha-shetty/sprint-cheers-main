import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Briefcase, Calendar, Award, Trash2, Plus, Check, X, Clock, Map, UserMinus } from "lucide-react";
import { auth, artManagerActions, adminActions, sprintStorage, awardStorage, StoredUser, ART, Team, StoredSprint, StoredAward } from "@/lib/localStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [pendingEmployees, setPendingEmployees] = useState<StoredUser[]>([]);
  const [managedEmployees, setManagedEmployees] = useState<StoredUser[]>([]);
  const [arts, setArts] = useState<ART[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<StoredSprint[]>([]);
  const [awards, setAwards] = useState<StoredAward[]>([]);

  const [artName, setArtName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [sprintTitle, setSprintTitle] = useState("");
  const [awardName, setAwardName] = useState("");

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'art-manager') {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadData(user.id);
  }, [navigate]);

  const loadData = (managerId: string) => {
    setPendingEmployees(artManagerActions.getPendingEmployees());
    setManagedEmployees(artManagerActions.getManagedEmployees(managerId)); 
    
    const allArts = artManagerActions.getARTs();
    const myArts = allArts.filter(a => a.managerId === managerId);
    setArts(myArts);

    const allTeams = artManagerActions.getTeams();
    const myTeams = allTeams.filter(t => myArts.some(a => a.id === t.artId));
    setTeams(myTeams);

    setSprints(sprintStorage.getSprints());
    setAwards(awardStorage.getAwards());
  };

  const handleApprove = (id: string) => {
    if (arts.length === 0) {
         toast.error("Please create your ART first.");
         return;
    }
    const artToAssign = arts[0].id;
    if(artManagerActions.approveEmployee(id, artToAssign)) {
        toast.success(`Employee approved & assigned to ${arts[0].name}`);
        loadData(currentUser.id);
    }
  };

  const handleReject = (id: string) => {
    if(adminActions.rejectUser(id)) {
        toast.success("Request rejected");
        loadData(currentUser.id);
    }
  };

  const handleCreateART = (e: React.FormEvent) => {
    e.preventDefault();
    if (arts.length > 0) {
        toast.error("You can only manage one ART.");
        return;
    }
    artManagerActions.createART(artName, deptName, currentUser.id);
    toast.success("ART Created");
    setArtName(""); setDeptName("");
    loadData(currentUser.id);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (arts.length === 0) return toast.error("Create an ART first");
    
    artManagerActions.createTeam(arts[0].id, teamName, teamDesc);
    toast.success("Team Created");
    setTeamName(""); setTeamDesc("");
    loadData(currentUser.id);
  };

  const handleDeleteTeam = (id: string) => {
    artManagerActions.deleteTeam(id);
    toast.success("Team deleted");
    loadData(currentUser.id);
  };

  const handleRemoveFromTeam = (empId: string) => {
      if(artManagerActions.removeEmployeeFromTeam(empId)) {
          toast.success("Employee removed from team");
          loadData(currentUser.id);
      } else {
          toast.error("Failed to remove employee");
      }
  };

  const activeSprint = sprints.find(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/home")} className="pl-0"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace</Button>
            <h1 className="text-2xl font-bold text-slate-800">Train Manager Console</h1>
        </div>

        {/* 1. PENDING REQUESTS */}
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2 text-amber-800"><Clock className="w-5 h-5"/> Pending Employee Requests ({pendingEmployees.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {pendingEmployees.length === 0 ? <p className="text-sm text-amber-600 italic">No pending requests</p> : 
                    pendingEmployees.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                            <div><p className="font-bold text-slate-900">{req.firstName} {req.lastName}</p><p className="text-xs text-slate-500">Requested: {new Date(req.createdAt).toLocaleDateString()}</p></div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
                                    Assigning to: <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">{arts.length > 0 ? arts[0].name : "No ART"}</Badge>
                                </span>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleReject(req.id)}><X className="w-4 h-4" /></Button>
                                <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)} disabled={arts.length === 0}><Check className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))
                }
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* SETUP ART */}
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Map className="w-5 h-5 text-indigo-600"/> Your ART</CardTitle></CardHeader>
                    <CardContent>
                        {arts.length > 0 ? (
                             <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl text-center space-y-2">
                                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-indigo-600"><Briefcase className="w-6 h-6"/></div>
                                 <div>
                                    <p className="text-lg text-indigo-900 font-bold">{arts[0].name}</p>
                                    <p className="text-sm text-indigo-600 font-medium">{arts[0].department}</p>
                                 </div>
                                 <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-200 border-0 mt-2">Active</Badge>
                             </div>
                        ) : (
                            <form onSubmit={handleCreateART} className="space-y-3">
                                <Input placeholder="ART Name (e.g. Omega Train)" value={artName} onChange={e => setArtName(e.target.value)} required />
                                <Input placeholder="Department" value={deptName} onChange={e => setDeptName(e.target.value)} required />
                                <Button type="submit" className="w-full bg-indigo-600">Create ART</Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {/* MANAGE TEAMS */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/> Manage Teams</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {arts.length > 0 ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-bold mb-4">Create New Team under {arts[0].name}</h4>
                                <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                                    <Input placeholder="Description" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} className="md:col-span-2" />
                                    <Button type="submit" className="md:col-span-2 bg-slate-900 text-white">Add Team</Button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 border-2 border-dashed rounded-xl">Create an ART first to add teams.</div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Teams</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teams.map(t => {
                                    const members = managedEmployees.filter(e => e.teamId === t.id);

                                    return (
                                        <div key={t.id} className="p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold text-slate-900">{t.name}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="text-slate-300 hover:text-red-500" onClick={() => handleDeleteTeam(t.id)}><Trash2 className="w-3 h-3"/></Button>
                                            </div>
                                            
                                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                    <span>Members</span>
                                                    <span className="bg-slate-200 px-1.5 rounded text-slate-600">{members.length}</span>
                                                </div>
                                                {members.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic text-center py-2">No members enrolled</p>
                                                ) : (
                                                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                        {members.map(m => (
                                                            <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs shadow-sm">
                                                                <span className="font-medium text-slate-700 truncate max-w-[120px]">{m.firstName} {m.lastName}</span>
                                                                <button onClick={() => handleRemoveFromTeam(m.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"><UserMinus className="w-3 h-3" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SPRINTS & AWARDS */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between w-full">
                            <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-600"/> Manage Sprint Phase</span>
                            {activeSprint && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active: {activeSprint.title}</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-slate-500 mb-2">Creating a new phase will close the current one and reset the active leaderboard for employees.</p>
                        <Input placeholder="New Sprint Phase Title (e.g. Q3 Release)" value={sprintTitle} onChange={e => setSprintTitle(e.target.value)} />
                        <Button className="w-full bg-emerald-600" onClick={() => {
                            sprintStorage.addSprint(sprintTitle);
                            setSprintTitle(""); loadData(currentUser.id); toast.success("New Phase Started!");
                        }}>Start New Sprint Phase</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-purple-600"/> Manage Awards</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input placeholder="Award Title (e.g., Code Wizard)" value={awardName} onChange={e => setAwardName(e.target.value)} />
                            <Button size="icon" onClick={() => {
                                if(!awardName.trim()) return;
                                awardStorage.addAward(awardName.trim());
                                setAwardName(""); loadData(currentUser.id); toast.success("Award Added");
                            }}><Plus className="w-4 h-4"/></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {awards.map(aw => (
                                <Badge key={aw.id} variant="secondary" className="pl-3 pr-1 py-1 gap-2 border shadow-sm">
                                    <span style={{color: aw.color}} className="font-bold">{aw.type}</span>
                                    <button onClick={() => { awardStorage.deleteAward(aw.id); loadData(currentUser.id); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;