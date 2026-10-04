import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi, tasksApi, invitationsApi, usersAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Kanban,
  Zap,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Check,
  FolderGit2,
  Layers,
  ShieldAlert,
} from 'lucide-react';

const WORK_TYPES = [
  { id: 'Software Development', label: 'Software Development', icon: '💻', desc: 'Build software, track bugs, run sprints' },
  { id: 'IT Support', label: 'IT Support & Operations', icon: '🛠️', desc: 'Manage service requests and incidents' },
  { id: 'Business Operations', label: 'Business Operations', icon: '📈', desc: 'Cross-functional process workflows' },
  { id: 'Marketing', label: 'Marketing & Design', icon: '🎨', desc: 'Campaigns, creative assets, deliverables' },
  { id: 'Project Management', label: 'Project Management', icon: '📊', desc: 'Milestones, dependencies, roadmaps' },
];

export const OnboardingWizard = () => {
  const navigate = useNavigate();

  // Wizard Steps:
  // 0: Decision (Create Company vs Join)
  // 1: Company Name & URL Slug
  // 2: Company Profile (Industry, Size, Country, Timezone)
  // 3: Personal Profile (Job Title, Department)
  // 4: Work Type
  // 5: Methodology (Scrum vs Kanban)
  // 6: First Project Creation
  // 7: Invite Team
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form State
  const [company, setCompany] = useState({
    name: 'Acme Technologies',
    domainSlug: 'acme-technologies',
    industry: 'Software Development',
    companySize: '51-200',
    website: 'https://acme.com',
    country: 'India',
    timezone: 'Asia/Kolkata',
    language: 'en-US',
  });

  const [personalProfile, setPersonalProfile] = useState({
    displayName: 'John Smith',
    jobTitle: 'Engineering Manager',
    department: 'Engineering',
    phone: '',
  });

  const [workType, setWorkType] = useState('Software Development');
  const [methodology, setMethodology] = useState('Scrum');

  const [project, setProject] = useState({
    name: 'E-Commerce Platform',
    key: 'ECOM',
    leadName: 'John Smith',
  });

  const [invites, setInvites] = useState([
    { email: 'alice@company.com', role: 'MEMBER' },
    { email: 'bob@company.com', role: 'MEMBER' },
  ]);
  const [newInviteEmail, setNewInviteEmail] = useState('');

  const [createdWorkspaceId, setCreatedWorkspaceId] = useState(null);

  const calculateProgress = () => {
    return Math.round((step / 7) * 100);
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!company.name.trim()) {
        toast.error('Company Name is required');
        return;
      }
      // Create Company in backend
      try {
        setLoading(true);
        const res = await companyApi.createCompany({
          name: company.name.trim(),
          domainSlug: company.domainSlug.trim(),
          industry: company.industry,
          companySize: company.companySize,
          country: company.country,
        });
        if (res?.data?.id) {
          setCreatedWorkspaceId(res.data.id);
        }
        setStep(2);
      } catch (err) {
        toast.error(err.message || 'Failed to initialize company workspace');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 2 && createdWorkspaceId) {
      // Update full company profile
      try {
        setLoading(true);
        await companyApi.updateProfile(createdWorkspaceId, company);
        setStep(3);
      } catch (err) {
        toast.error(err.message || 'Failed to update company profile');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 6 && createdWorkspaceId) {
      // Create Project and Starter tickets
      try {
        setLoading(true);
        // Create initial project via tasks / projects API
        const projectRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: project.name.trim(),
            key: project.key.trim().toUpperCase(),
            workspaceId: createdWorkspaceId,
            category: workType,
          }),
        }).then((r) => r.json());

        const newProjectId = projectRes?.data?.$id || projectRes?.data?.id;

        // Auto-create 3 starter Jira issues
        if (newProjectId) {
          await tasksApi.createTask({
            workspaceId: createdWorkspaceId,
            projectId: newProjectId,
            name: 'OAuth2 Authentication & SSO Setup',
            description: 'Configure corporate SSO and identity providers.',
            issueType: 'Story',
            priority: 'HIGH',
            status: 'TODO',
            storyPoints: 5,
          });

          await tasksApi.createTask({
            workspaceId: createdWorkspaceId,
            projectId: newProjectId,
            name: 'Database Schema & RBAC Permissions Matrix',
            description: 'Deploy 8-tier role hierarchy and project security schemes.',
            issueType: 'Task',
            priority: 'HIGHEST',
            status: 'IN_PROGRESS',
            storyPoints: 8,
          });

          await tasksApi.createTask({
            workspaceId: createdWorkspaceId,
            projectId: newProjectId,
            name: 'Real-time Event Stream & Webhook Dispatcher',
            description: 'Implement live event broadcaster for team updates.',
            issueType: 'Task',
            priority: 'MEDIUM',
            status: 'DONE',
            storyPoints: 3,
          });
        }

        setStep(7);
      } catch (err) {
        toast.error(err.message || 'Failed to create project');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 7 && createdWorkspaceId) {
      // Send invitations and complete onboarding
      try {
        setLoading(true);
        for (const inv of invites) {
          if (inv.email.trim()) {
            await invitationsApi.createInvitation(createdWorkspaceId, {
              email: inv.email.trim(),
              organizationRole: inv.role,
            });
          }
        }
        toast.success('🎉 Setup complete! Launching your klanservicehub workspace...');
        navigate(`/workspaces/${createdWorkspaceId}`);
      } catch (err) {
        toast.error(err.message || 'Failed to complete setup');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(step + 1);
  };

  const handleAddInvite = (e) => {
    e.preventDefault();
    if (!newInviteEmail.trim() || !newInviteEmail.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    setInvites([...invites, { email: newInviteEmail.trim(), role: 'MEMBER' }]);
    setNewInviteEmail('');
  };

  return (
    <div className="min-h-screen bg-[#091E42] text-white flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      {/* Top klanservicehub Header */}
      <div className="w-full max-w-2xl flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-blue-500 text-white font-black text-base flex items-center justify-center shadow-md">
            K
          </div>
          <span className="font-bold text-lg text-white">klanservicehub Setup</span>
        </div>

        {step > 0 && (
          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-300">
            <span>Setup Progress</span>
            <div className="w-28 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <span className="text-blue-400 font-bold">{calculateProgress()}%</span>
          </div>
        )}
      </div>

      {/* Main Wizard Card */}
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-md space-y-6 text-neutral-200">
        {/* Step 0: Decision Screen */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-400">
              <Sparkles className="size-3.5" />
              <span>Getting Started</span>
            </div>

            <h2 className="text-3xl font-black text-white">How do you want to get started?</h2>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Choose whether you are setting up a new organization workspace as the Company Owner, or joining an existing organization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl border-2 border-blue-500/60 bg-blue-500/10 p-6 space-y-3 hover:bg-blue-500/20 transition group"
              >
                <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                  Create a company workspace
                </h3>
                <p className="text-xs text-neutral-400">
                  You will become the 👑 Company Owner with full administrative governance, billing, and team controls.
                </p>
              </button>

              <button
                onClick={() => {
                  toast.info('Please click the invitation link received in your email, or enter token.');
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 hover:bg-white/10 transition group"
              >
                <div className="size-10 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold">
                  <Users className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                  I received an invitation
                </h3>
                <p className="text-xs text-neutral-400">
                  Join your company's existing klanservicehub organization using the secure invitation link sent by your administrator.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Company Name & Workspace URL */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">What's your company name?</h2>
              <p className="text-xs text-neutral-400 mt-1">
                This will be your organization identity and dedicated cloud workspace address.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={company.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    setCompany({ ...company, name, domainSlug: slug });
                  }}
                  placeholder="e.g. Acme Technologies"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Dedicated Workspace URL</label>
                <div className="flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs text-neutral-400 font-mono">
                  <input
                    type="text"
                    value={company.domainSlug}
                    onChange={(e) => setCompany({ ...company, domainSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="bg-transparent text-blue-400 font-bold focus:outline-none w-48 text-sm"
                  />
                  <span>.klanservicehub.io</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 2 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">Setup your company profile</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Help us tailor your workspace settings and localization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Industry</label>
                <select
                  value={company.industry}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  className="w-full rounded-xl border border-white/20 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare">Healthcare & Biotech</option>
                  <option value="E-Commerce">E-Commerce & Retail</option>
                  <option value="Education">Education</option>
                  <option value="Consulting">Consulting & Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Company Size</label>
                <select
                  value={company.companySize}
                  onChange={(e) => setCompany({ ...company, companySize: e.target.value })}
                  className="w-full rounded-xl border border-white/20 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="1-10">1–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-1000">201–1000 employees</option>
                  <option value="1000+">1000+ employees (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Country</label>
                <input
                  type="text"
                  value={company.country}
                  onChange={(e) => setCompany({ ...company, country: e.target.value })}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Primary Timezone</label>
                <select
                  value={company.timezone}
                  onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                  className="w-full rounded-xl border border-white/20 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST -5:00)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                  <option value="UTC">UTC Universal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Owner Profile */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 3 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">Complete your owner profile</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Your role within the organization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={personalProfile.jobTitle}
                  onChange={(e) => setPersonalProfile({ ...personalProfile, jobTitle: e.target.value })}
                  placeholder="e.g. CTO / VP Engineering"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Department</label>
                <input
                  type="text"
                  value={personalProfile.department}
                  onChange={(e) => setPersonalProfile({ ...personalProfile, department: e.target.value })}
                  placeholder="e.g. Product Engineering"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Work Type */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 4 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">What kind of work does your team manage?</h2>
              <p className="text-xs text-neutral-400 mt-1">
                This configures recommended templates and workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WORK_TYPES.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => setWorkType(wt.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    workType === wt.id
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{wt.icon}</span>
                  <h4 className="font-bold text-sm mt-2">{wt.label}</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">{wt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Methodology */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 5 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">How does your team work?</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Select your primary agile execution style.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setMethodology('Scrum')}
                className={`rounded-2xl border p-5 text-left transition ${
                  methodology === 'Scrum'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Zap className="size-4" />
                </div>
                <h4 className="font-bold text-sm mt-3">Scrum</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Sprint cadences, story points estimation, and backlogs.</p>
              </button>

              <button
                onClick={() => setMethodology('Kanban')}
                className={`rounded-2xl border p-5 text-left transition ${
                  methodology === 'Kanban'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <div className="size-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  <Kanban className="size-4" />
                </div>
                <h4 className="font-bold text-sm mt-3">Kanban</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Continuous delivery flow with WIP column limits.</p>
              </button>

              <button
                onClick={() => setMethodology('Task Tracking')}
                className={`rounded-2xl border p-5 text-left transition ${
                  methodology === 'Task Tracking'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="size-4" />
                </div>
                <h4 className="font-bold text-sm mt-3">Simple Tasks</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Basic to-do lists and team work assignments.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 6: First Project Creation */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 6 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">Create your first project</h2>
              <p className="text-xs text-neutral-400 mt-1">
                You will be assigned as 👑 COMPANY_OWNER and 🛡️ PROJECT_ADMIN for this project.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  required
                  value={project.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const key = name.split(' ').map((w) => w[0]).join('').substring(0, 4).toUpperCase() || 'PROJ';
                    setProject({ ...project, name, key });
                  }}
                  placeholder="e.g. E-Commerce Platform"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Project Key * (Prefix for issue tickets: ECOM-1, ECOM-2)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={project.key}
                  onChange={(e) => setProject({ ...project, key: e.target.value.toUpperCase() })}
                  className="w-32 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-mono font-bold text-blue-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Invite Team */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 7 of 7</span>
              <h2 className="text-2xl font-black text-white mt-1">Invite your teammates</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Send secure email invitations with pre-configured project access.
              </p>
            </div>

            <form onSubmit={handleAddInvite} className="flex gap-2">
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-500"
              >
                Add
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invites.map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 border border-white/5 text-xs">
                  <span className="font-semibold text-white">{inv.email}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                      {inv.role}
                    </span>
                    <button
                      onClick={() => setInvites(invites.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        {step > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              <span>{step === 7 ? 'Complete Setup & Launch' : 'Continue'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
