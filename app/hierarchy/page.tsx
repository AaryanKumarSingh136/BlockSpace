'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ClubItem {
  _id: string;
  name: string;
  description?: string;
  status: string;
  admin_id?: { _id: string; name: string; email: string };
  department_count: number;
}

interface DeptItem {
  _id: string;
  name: string;
  description?: string;
  status: string;
  club_id: { _id: string; name: string } | string;
  admin_id?: { _id: string; name: string; email: string };
}

interface ApprovalItem {
  _id: string;
  type: 'club_creation' | 'department_creation' | 'role_promotion';
  requested_by?: { name: string; email: string; role: string };
  target_user_id?: { _id: string; name: string; email: string; role: string };
  proposed_role?: string;
  club_id?: { name: string };
  details?: { name?: string; description?: string; club_id?: string };
  status: string;
  created_at: string;
}

interface MemberItem {
  _id: string;
  name: string;
  email: string;
  role: 'member' | 'manager' | 'orgAdmin' | 'superAdmin';
  club_id?: { _id: string; name: string };
  dept_id?: { _id: string; name: string };
}

const ROLE_RANK: Record<string, number> = {
  member: 1,
  manager: 2,
  orgAdmin: 3,
  superAdmin: 4,
};

export default function HierarchyPage() {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms state
  const [clubForm, setClubForm] = useState({ name: '', description: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '', club_id: '' });
  const [showClubModal, setShowClubModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const fetchData = async () => {
    try {
      const [resClubs, resDepts, resApprovals, resMembers] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/departments'),
        fetch('/api/approval-requests'),
        fetch('/api/members'),
      ]);

      if (resClubs.ok) {
        const data = await resClubs.json();
        setClubs(data.clubs || []);
      }
      if (resDepts.ok) {
        const data = await resDepts.json();
        setDepartments(data.departments || []);
      }
      if (resApprovals.ok) {
        const data = await resApprovals.json();
        setApprovals(data.requests || []);
      }
      if (resMembers.ok) {
        const data = await resMembers.json();
        setMembers(data.members || []);
        if (data.currentUserRole) setCurrentUserRole(data.currentUserRole);
      }
    } catch (err) {
      console.error('Error fetching hierarchy data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubForm),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: data.message });
      setClubForm({ name: '', description: '' });
      setShowClubModal(false);
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setLoading(false);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptForm),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: data.message });
      setDeptForm({ name: '', description: '', club_id: '' });
      setShowDeptModal(false);
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setLoading(false);
  };

  const handleApprovalAction = async (id: string, action: 'approve' | 'reject') => {
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/approval-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: data.message });
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setLoading(false);
  };

  const handleRolePromotion = async (target_user_id: string, newRole: string) => {
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id, role: newRole }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: `Role updated to ${newRole}` });
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setLoading(false);
  };

  const currentRank = ROLE_RANK[currentUserRole] || 1;

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Organization Hierarchy</h1>
              <span className="bg-indigo-900/60 border border-indigo-700 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-semibold capitalize">
                Your Role: {currentUserRole}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              3-Level Architecture: Organization → Clubs → Departments with WhatsApp-style admin approvals
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowClubModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              + Create / Request Club
            </Button>
            <Button
              onClick={() => setShowDeptModal(true)}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 font-semibold"
              disabled={clubs.length === 0}
            >
              + Create / Request Dept
            </Button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-green-950/70 border-green-800 text-green-300'
                : 'bg-red-950/70 border-red-800 text-red-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Section 1: WhatsApp-Style Approval Requests Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              Pending Approvals Queue ({approvals.filter(a => a.status === 'pending').length})
            </h2>
            <span className="text-xs text-gray-400">
              Org Admins approve Clubs; Club Admins approve Departments; Admins promote members
            </span>
          </div>

          {approvals.filter(a => a.status === 'pending').length === 0 ? (
            <Card className="bg-gray-900/60 border-gray-800 text-gray-400 p-6 text-center">
              No pending approval requests right now.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvals
                .filter(a => a.status === 'pending')
                .map((req) => (
                  <Card key={req._id} className="bg-gray-900 border-yellow-900/50 text-white shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-950/80 px-2.5 py-0.5 rounded border border-yellow-800/60">
                          {req.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold mt-2">
                        {req.type === 'club_creation' && `Club Creation: "${req.details?.name}"`}
                        {req.type === 'department_creation' && `Dept Creation: "${req.details?.name}" in ${req.club_id?.name || 'Club'}`}
                        {req.type === 'role_promotion' && `Role Promotion: ${req.target_user_id?.name} → ${req.proposed_role}`}
                      </CardTitle>
                      {req.details?.description && (
                        <CardDescription className="text-gray-400 text-xs mt-1">
                          "{req.details.description}"
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="text-xs text-gray-400 bg-gray-950/60 p-2.5 rounded border border-gray-800">
                        Requested by: <span className="text-white font-medium">{req.requested_by?.name || 'Unknown'}</span> ({req.requested_by?.email})
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprovalAction(req._id, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs font-semibold h-9"
                          disabled={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApprovalAction(req._id, 'reject')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-xs font-semibold h-9"
                          disabled={loading}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Section 2: 3-Level Hierarchy Visualizer */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">3-Level Hierarchy Tree</h2>

          {clubs.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800 text-gray-400 p-8 text-center">
              No clubs created yet. Click "+ Create / Request Club" above to start building your structure!
            </Card>
          ) : (
            <div className="space-y-6">
              {clubs.map((club) => {
                const clubDepts = departments.filter(
                  (d) => typeof d.club_id === 'object' && d.club_id._id === club._id
                );

                return (
                  <Card key={club._id} className="bg-gray-900 border-gray-800 text-white overflow-hidden">
                    <CardHeader className="bg-gray-900/80 border-b border-gray-800 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                            Level 2 • Club
                          </span>
                          <h3 className="text-lg font-bold">{club.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
                            {club.department_count} Departments
                          </span>
                          {club.admin_id && (
                            <span className="text-xs bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-800">
                              Admin: {club.admin_id.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {club.description && (
                        <p className="text-sm text-gray-400 mt-1">{club.description}</p>
                      )}
                    </CardHeader>

                    {/* Level 3: Departments under this Club */}
                    <CardContent className="p-5 bg-gray-950/40">
                      <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">
                        Level 3 • Sub-Departments ({clubDepts.length})
                      </div>
                      {clubDepts.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No departments inside this club yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {clubDepts.map((dept) => (
                            <div
                              key={dept._id}
                              className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{dept.name}</span>
                                <span className="text-[10px] bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded capitalize">
                                  {dept.status}
                                </span>
                              </div>
                              {dept.description && (
                                <p className="text-xs text-gray-400 mb-2">{dept.description}</p>
                              )}
                              {dept.admin_id && (
                                <div className="text-[11px] text-indigo-400">
                                  Lead: {dept.admin_id.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Members & WhatsApp-Style Role Promotion */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Members Directory & Role Management</h2>
              <p className="text-xs text-gray-400">
                WhatsApp Admin Rule: Admins can directly promote members up to their own role level.
              </p>
            </div>
            <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-indigo-400 font-medium">
              Total Members: {members.length}
            </span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Club Scope</th>
                  <th className="px-6 py-3">Dept Scope</th>
                  <th className="px-6 py-3">Current Role</th>
                  <th className="px-6 py-3">Promote / Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {members.map((member) => {
                  const targetRank = ROLE_RANK[member.role] || 1;
                  const canPromote = currentRank > 1; // Admins and managers can promote

                  return (
                    <tr key={member._id} className="hover:bg-gray-800/40 transition">
                      <td className="px-6 py-4 font-medium text-white">
                        <div>{member.name}</div>
                        <div className="text-xs text-gray-400">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {member.club_id?.name ? (
                          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs px-2.5 py-1 rounded">
                            {member.club_id.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Org-Wide</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.dept_id?.name ? (
                          <span className="bg-purple-950 text-purple-300 border border-purple-800 text-xs px-2.5 py-1 rounded">
                            {member.dept_id.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">All Depts</span>
                        )}
                      </td>
                      <td className="px-6 py-4 capitalize font-semibold text-indigo-400">
                        {member.role}
                      </td>
                      <td className="px-6 py-4">
                        {canPromote ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRolePromotion(member._id, e.target.value)}
                            disabled={loading}
                            className="bg-gray-800 border border-gray-700 text-white rounded text-xs px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="member" disabled={currentRank < ROLE_RANK.member}>
                              Member
                            </option>
                            <option value="manager" disabled={currentRank < ROLE_RANK.manager}>
                              Manager (Dept Lead)
                            </option>
                            <option value="orgAdmin" disabled={currentRank < ROLE_RANK.orgAdmin}>
                              Org Admin (Club/Org Lead)
                            </option>
                            {currentRank >= ROLE_RANK.superAdmin && (
                              <option value="superAdmin">Super Admin</option>
                            )}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-500 italic">No permission</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Create Club */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Create / Request Club</h2>
            <p className="text-xs text-gray-400 mb-4">
              {currentRank >= ROLE_RANK.orgAdmin
                ? 'As an Org Admin, this club will be created immediately.'
                : 'As a Member/Manager, this request will be sent to Org Admins for approval.'}
            </p>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <Label>Club Name</Label>
                <Input
                  placeholder="e.g. Robotics Club"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the club"
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClubModal(false)}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Department */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Create / Request Department</h2>
            <p className="text-xs text-gray-400 mb-4">
              Departments (Level 3) must belong to a parent Club (Level 2).
            </p>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <Label>Parent Club</Label>
                <select
                  value={deptForm.club_id}
                  onChange={(e) => setDeptForm({ ...deptForm, club_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm mt-1"
                  required
                >
                  <option value="">Select a Parent Club...</option>
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Department Name</Label>
                <Input
                  placeholder="e.g. Embedded Systems Dept"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the department"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeptModal(false)}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
