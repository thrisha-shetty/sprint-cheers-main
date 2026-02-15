import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Users, Briefcase, Calendar, Trophy, 
  Trash2, Plus, Check, X, Clock, Map, Award, Star
} from "lucide-react";
import { 
  auth, 
  artManagerActions, 
  adminActions, 
  sprintStorage, 
  awardStorage, 
  nominationStorage,
  StoredUser, 
  ART, 
  Team, 
  StoredSprint, 
  StoredAward,
  StoredNomination
} from "@/lib/localStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data State
  const [pendingRequests, setPendingRequests] = useState<StoredUser[]>([]);
  const [arts, setArts] = useState<ART[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<StoredSprint[]>([]);
  const [awards, setAwards] = useState<StoredAward[]>([]);
  const [leadership, setLeadership] = useState<any[]>([]);

  // Form States
  const [artName, setArtName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [selectedArtId, setSelectedArtId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [sprintTitle, setSprintTitle] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [awardType, setAwardType] = useState("");
  const [awardDesc, setAwardDesc] = useState("");

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'art-manager') {
        navigate("/");
        return;
    }
    setCurrentUser(user);
    loadData();
  }, [navigate]);

  const loadData = () => {
    const p = artManagerActions.getPendingEmployees();
    const a = artManagerActions.getARTs();
    const t = artManagerActions.getTeams();
    const s = sprintStorage.getSprints();
    const aw = awardStorage.getAwards();
    const noms = nominationStorage.getNominations();
    
    setPendingRequests(p);
    setArts(a);
    setTeams(t);
    setSprints(s);
    setAwards(aw);
    calculateLeadership(noms, aw);
  };

  const calculateLeadership = (noms: StoredNomination[], allAwards: StoredAward[]) => {
    const leaders = allAwards.map(aw => {
        const awardNoms = noms.filter(n => n.awardType === aw.type);
        const counts: Record<string, number> = {};
        awardNoms.forEach(n => counts[n.nomineeId] = (counts[n.nomineeId] || 0) + 1);
        
        const topNomineeId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "");
        return { award: aw.type, leaderId: topNomineeId, count: counts[topNomineeId] || 0 };
    });
    setLeadership(leaders);
  };

  const handleApprove = (id: string) => {
    if(adminActions.approveUser(id)) {
        toast.success("Employee approved");
        loadData();
    }
  };

  const handleReject = (id: string) => {
    if(adminActions.rejectUser(id)) {
        toast.success("Request rejected");
        loadData();
    }
  };

  const handleCreateART = (e: React.FormEvent) => {
    e.preventDefault();
    artManagerActions.createART(artName, deptName, currentUser.id);
    toast.success("ART Created");
    setArtName(""); setDeptName("");
    loadData();
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedArtId) return toast.error("Select an ART");
    artManagerActions.createTeam(selectedArtId, teamName, teamDesc);
    toast.success("Team Created");
    setTeamName(""); setTeamDesc("");
    loadData();
  };

  const handleDeleteTeam = (id: string) => {
    artManagerActions.deleteTeam(id);
    toast.success("Team deleted");
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/home")} className="pl-0"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <h1 className="text-2xl font-bold text-slate-800">Train Manager Console</h1>
        </div>

        {/* 1. EMPLOYEE REQUESTS */}
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2 text-amber-800"><Clock className="w-5 h-5"/> Pending Access Requests ({pendingRequests.length})</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.length === 0 ? <p className="text-sm text-amber-600 italic">No pending requests</p> : 
                    pendingRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                            <div><p className="font-bold text-slate-900">{req.firstName} {req.lastName}</p><p className="text-xs text-slate-500">Employee Account</p></div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleReject(req.id)}><X className="w-4 h-4" /></Button>
                                <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)}><Check className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))
                }
            </CardContent>
        </Card>

        {/* 2. LEADERSHIP STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {leadership.map(l => (
                <Card key={l.award} className="bg-white border-slate-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Star className="w-5 h-5" /></div>
                        <div><p className="text-[10px] uppercase font-bold text-slate-400">{l.award} Leader</p><p className="font-bold text-sm">{l.leaderId || "No Data"}</p></div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SETUP ART */}
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Map className="w-5 h-5 text-indigo-600"/> Setup ART</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateART} className="space-y-3">
                            <Input placeholder="ART Name (e.g. Omega Train)" value={artName} onChange={e => setArtName(e.target.value)} required />
                            <Input placeholder="Department" value={deptName} onChange={e => setDeptName(e.target.value)} required />
                            <Button type="submit" className="w-full bg-indigo-600">Create ART</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* MANAGE TEAMS */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/> Manage Teams</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="text-sm font-bold mb-4">Create New Team</h4>
                            <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <select className="w-full p-2 border rounded text-sm" value={selectedArtId} onChange={e => setSelectedArtId(e.target.value)} required>
                                    <option value="">Select ART...</option>
                                    {arts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <Input placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                                <Input placeholder="Description" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} className="md:col-span-2" />
                                <Button type="submit" className="md:col-span-2 bg-indigo-600"><Plus className="w-4 h-4 mr-2"/> Add Team</Button>
                            </form>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Teams</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teams.map(t => (
                                    <div key={t.id} className="p-4 bg-white border rounded-xl flex justify-between items-start hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-slate-900">{t.name}</p>
                                            <p className="text-[10px] text-slate-500 mb-1">{arts.find(a => a.id === t.artId)?.name}</p>
                                            <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDeleteTeam(t.id)}><Trash2 className="w-4 h-4"/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SPRINTS & AWARDS */}
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-600"/> Create Sprint</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input placeholder="Sprint Title" value={sprintTitle} onChange={e => setSprintTitle(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="date" value={sprintStart} onChange={e => setSprintStart(e.target.value)} />
                            <Input type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} />
                        </div>
                        <Button className="w-full bg-emerald-600" onClick={() => {
                            sprintStorage.addSprint(sprintTitle, sprintStart, sprintEnd);
                            toast.success("Sprint Added");
                            setSprintTitle("");
                            loadData();
                        }}>Add Sprint</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-purple-600"/> Manage Awards</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Award Name" value={awardType} onChange={e => setAwardType(e.target.value)} />
                            <Button size="icon" onClick={() => {
                                awardStorage.addAward(awardType, "Custom Award");
                                setAwardType("");
                                loadData();
                            }}><Plus className="w-4 h-4"/></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {awards.map(aw => (
                                <Badge key={aw.id} variant="secondary" className="pl-3 pr-1 py-1 gap-2">
                                    {aw.type}
                                    <button onClick={() => { awardStorage.deleteAward(aw.id); loadData(); }} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
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