import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { billingApi, companyApi } from '@/lib/api-client';
import {
  downloadInvoicePdf,
  downloadInvoiceCsv,
  downloadInvoiceJson,
  formatINR,
} from '@/lib/invoice-generator';
import { toast } from 'sonner';
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  FileText,
  Download,
  CheckCircle2,
  HardDrive,
  Users,
  FolderGit2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Building2,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  UserCheck,
  DollarSign,
  Briefcase,
  Layers,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  Code,
  X,
  Eye,
} from 'lucide-react';

export const BillingView = () => {
  const workspaceId = useWorkspaceId();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('EMPLOYEES'); // 'EMPLOYEES' | 'PLANS' | 'INVOICES'
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // 'MONTHLY' | 'ANNUAL'

  // Data State
  const [billing, setBilling] = useState(null);
  const [workspaceProfile, setWorkspaceProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  // Selected Invoice for Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Employee Filter & Search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');

  const fetchBilling = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [res, wsRes] = await Promise.all([
        billingApi.getBilling(workspaceId),
        companyApi.getProfile(workspaceId).catch(() => ({ data: {} })),
      ]);

      if (res?.data) {
        setBilling(res.data);
        if (res.data.subscription?.billing_cycle) {
          setBillingCycle(res.data.subscription.billing_cycle);
        }
      }
      if (wsRes?.data) {
        setWorkspaceProfile(wsRes.data);
      }
    } catch (e) {
      toast.error('Failed to load billing and seat license data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchBilling();
  }, [workspaceId]);

  const { subscription, usage, invoices, plans, seatLicenseTiers, employeeLicenses, costSummary } = billing || {};
  const currentPlanKey = subscription?.plan || 'BUSINESS';

  // Available departments list
  const departments = useMemo(() => {
    if (!employeeLicenses) return [];
    const depts = new Set(employeeLicenses.map((e) => e.department || 'Engineering'));
    return Array.from(depts);
  }, [employeeLicenses]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!employeeLicenses) return [];
    return employeeLicenses.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(employeeSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
      if (selectedTierFilter !== 'ALL' && emp.licenseTier !== selectedTierFilter) return false;

      return true;
    });
  }, [employeeLicenses, employeeSearch, selectedDept, selectedTierFilter]);

  const handleUpdateEmployeeLicense = async (memberId, newTier) => {
    try {
      setUpdatingMemberId(memberId);
      await billingApi.updateMemberLicense(workspaceId, memberId, { licenseTier: newTier });
      toast.success('Employee seat license updated');
      fetchBilling(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update seat license');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleUpgradePlan = async (planKey) => {
    try {
      setUpgrading(true);
      await billingApi.upgradePlan(workspaceId, { plan: planKey, billingCycle });
      toast.success(`Plan upgraded to ${plans[planKey]?.name || planKey}!`);
      fetchBilling(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setRefreshing(true);
      const res = await billingApi.generateInvoice(workspaceId);
      if (res?.data) {
        toast.success(`Invoice ${res.data.invoiceNumber} generated for ${formatINR(res.data.amount)}`);
        fetchBilling(true);
      }
    } catch (err) {
      toast.error('Failed to generate invoice');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCostReport = () => {
    if (!employeeLicenses || employeeLicenses.length === 0) return;

    const headers = ['Employee Name', 'Email', 'Department', 'Job Title', 'Role', 'License Tier', 'Monthly Cost (INR)', 'Annual Cost (INR)'];
    const rows = employeeLicenses.map((e) => [
      `"${e.name}"`,
      `"${e.email}"`,
      `"${e.department}"`,
      `"${e.jobTitle}"`,
      `"${e.role}"`,
      `"${e.licenseTierName}"`,
      e.monthlyCostInr,
      e.annualCostInr,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seat-license-cost-breakdown-${workspaceId}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Employee cost report exported as CSV');
  };

  const handleDownloadPdf = (inv) => {
    downloadInvoicePdf(inv, workspaceProfile, costSummary, employeeLicenses);
    toast.success(`Tax Invoice ${inv.invoice_number} opened for printing / PDF download`);
  };

  const handleDownloadCsv = (inv) => {
    downloadInvoiceCsv(inv, workspaceProfile);
    toast.success(`Invoice ${inv.invoice_number} downloaded as CSV`);
  };

  const handleDownloadJson = (inv) => {
    downloadInvoiceJson(inv, workspaceProfile);
    toast.success(`Invoice ${inv.invoice_number} downloaded as JSON`);
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="size-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-neutral-500">Loading Billing, Plans & Seat Licenses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            <Receipt className="size-3.5" />
            <span>SaaS Subscription & Seat Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 mt-1">
            Billing, Plans & Seat Licenses
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
            Manage organization SaaS subscription plans, employee-wise seat license chargebacks, and tax invoices in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span>Currency: INR (₹)</span>
          </div>

          <button
            onClick={() => fetchBilling(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition active:scale-95 disabled:opacity-50"
            title="Refresh billing data"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCostReport}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-black transition active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Export Cost CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cost & Quota Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Monthly Spend */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Monthly Seat Spend</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">
              {formatINR(costSummary?.totalAllocatedCostInr || 0)}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              + 18% GST: {formatINR(costSummary?.totalWithGstInr || 0)}
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <span className="text-lg font-black">₹</span>
          </div>
        </div>

        {/* Seat Licenses Allocated */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Seats Consumed</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-neutral-900">{costSummary?.totalSeatsCount || 1}</span>
              <span className="text-xs text-neutral-500">/ {usage?.users?.limit || 100} limit</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {costSummary?.paidSeatsCount || 0} paid • {costSummary?.freeSeatsCount || 0} free guest
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="size-5" />
          </div>
        </div>

        {/* Current Plan */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Current Plan</p>
            <p className="text-xl font-black text-neutral-900 mt-0.5">
              {plans?.[currentPlanKey]?.name || 'Business Standard'}
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
              {formatINR(plans?.[currentPlanKey]?.monthlyPriceInr || 7999)} / month
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Crown className="size-5" />
          </div>
        </div>

        {/* Cloud Storage */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Secure Storage</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">
              {usage?.storage?.currentGb || 12} GB
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              of {usage?.storage?.limitGb || 500} GB cloud quota
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <HardDrive className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'EMPLOYEES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="size-4" />
            <span>Employee Seat Licenses & Costs ({employeeLicenses?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('PLANS')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'PLANS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Zap className="size-4" />
            <span>Subscription Plans & Tiers</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'INVOICES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="size-4" />
            <span>Tax Invoices & Downloads ({invoices?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEES SEAT LICENSES & COST BREAKDOWN */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-6">
          {/* Department Breakdown Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(costSummary?.departmentBreakdown || []).map((dept) => (
              <div key={dept.department} className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 truncate">{dept.department}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                    {dept.count} users
                  </span>
                </div>
                <p className="text-lg font-black text-neutral-900 mt-1">{formatINR(dept.totalCostInr)}</p>
                <p className="text-[10px] text-neutral-400">Monthly departmental cost</p>
              </div>
            ))}
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search employee by name, email, or role..."
                className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-blue-500 focus:outline-none shadow-xs"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-blue-500 focus:outline-none shadow-xs"
              >
                <option value="ALL">All License Tiers</option>
                {Object.entries(seatLicenseTiers || {}).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name} ({formatINR(v.monthlyPriceInr)}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Wise License & Cost Table */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Employee Details</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Assigned Seat License</th>
                  <th className="py-3 px-4">Monthly Cost (INR)</th>
                  <th className="py-3 px-4">Annual Cost (INR)</th>
                  <th className="py-3 px-4 text-right">Reassign License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const isUpdating = updatingMemberId === emp.memberId;

                  return (
                    <tr key={emp.memberId} className="hover:bg-neutral-50/70 transition">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4 font-medium text-neutral-900">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {emp.name ? emp.name.substring(0, 2).toUpperCase() : 'EM'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-900">{emp.name}</span>
                              {emp.isOwner && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
                                  OWNER
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-800">{emp.department}</p>
                        <p className="text-[10px] text-neutral-400">{emp.jobTitle}</p>
                      </td>

                      {/* License Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                              emp.licenseTier === 'SERVICE_AGENT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : emp.licenseTier === 'PORTFOLIO_MANAGER'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : emp.licenseTier === 'FREE_VIEWER'
                                ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <Shield className="size-2.5" />
                            {emp.licenseTierName}
                          </span>
                        </div>
                      </td>

                      {/* Monthly Cost in Indian Rupees */}
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <span className="text-emerald-700 font-extrabold">
                          {formatINR(emp.monthlyCostInr)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal"> / mo</span>
                      </td>

                      {/* Annual Cost in Indian Rupees */}
                      <td className="py-3.5 px-4 font-semibold text-neutral-600">
                        <span>{formatINR(emp.annualCostInr)}</span>
                        <span className="text-[10px] text-neutral-400"> / yr</span>
                      </td>

                      {/* Change License Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <select
                          disabled={isUpdating}
                          value={emp.licenseTier}
                          onChange={(e) => handleUpdateEmployeeLicense(emp.memberId, e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 focus:border-blue-500 focus:outline-none shadow-2xs hover:border-neutral-400 transition"
                        >
                          {Object.entries(seatLicenseTiers || {}).map(([key, tier]) => (
                            <option key={key} value={key}>
                              {tier.name} — {formatINR(tier.monthlyPriceInr)}/mo
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chargeback & Tax Summary Box */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-emerald-600" />
                <h3 className="text-sm font-black text-neutral-900">Monthly Seat Chargeback & Tax Breakdown</h3>
              </div>
              <span className="text-xs text-neutral-400">GSTIN Compliant • SAC: 998315</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Active User Seats:</span>
                  <span className="font-bold text-neutral-900">{costSummary?.totalSeatsCount || 0}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Paid Software & Agent Seats:</span>
                  <span className="font-bold text-neutral-900">{costSummary?.paidSeatsCount || 0}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Free Stakeholder / Guest Seats:</span>
                  <span className="font-bold text-neutral-900">{costSummary?.freeSeatsCount || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Employee Seats Subtotal:</span>
                  <span className="font-bold text-neutral-900">{formatINR(costSummary?.totalAllocatedCostInr || 0)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>GST (18% Goods & Services Tax):</span>
                  <span className="font-bold text-neutral-900">{formatINR(costSummary?.gstAmountInr || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                  <span>Total Monthly Charge:</span>
                  <span className="text-emerald-700 text-sm font-black">{formatINR(costSummary?.totalWithGstInr || 0)}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                <div>
                  <p className="text-[11px] font-bold text-emerald-800">Generate Current Cycle Invoice</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Generate an official tax receipt for the current {costSummary?.totalSeatsCount || 0} active employees.
                  </p>
                </div>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={refreshing}
                  className="mt-2 w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                >
                  Generate Invoice in INR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS (PRICED IN INDIAN RUPEES) */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          {/* Billing Cycle Switcher */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'MONTHLY' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-900 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'ANNUAL' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'ANNUAL' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-extrabold text-emerald-800">
                Save 20%
              </span>
            </span>
          </div>

          {/* Plan Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(plans || {}).map(([key, p]) => {
              const isCurrent = currentPlanKey === key;
              const price = billingCycle === 'ANNUAL' ? p.annualPriceInr : p.monthlyPriceInr;
              const perMonthDisplay = billingCycle === 'ANNUAL' ? Math.round(p.annualPriceInr / 12) : p.monthlyPriceInr;

              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/20'
                      : 'border-neutral-200 bg-white shadow-xs hover:border-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-neutral-900">{p.name}</h4>
                      {isCurrent && (
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          ACTIVE PLAN
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-neutral-900">{formatINR(perMonthDisplay)}</span>
                      <span className="text-xs text-neutral-500">/ month</span>
                    </div>
                    {billingCycle === 'ANNUAL' && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        Billed annually at {formatINR(price)} (₹20% savings)
                      </p>
                    )}

                    <div className="mt-5 space-y-2.5 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
                      {(p.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="size-3.5 text-blue-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-xl bg-neutral-100 py-2.5 text-xs font-bold text-neutral-500 cursor-default"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradePlan(key)}
                        disabled={upgrading}
                        className="w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-black transition disabled:opacity-50 active:scale-95"
                      >
                        {upgrading ? 'Processing...' : `Switch to ${p.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & TAX RECEIPTS (EXPORT / DOWNLOAD) */}
      {activeTab === 'INVOICES' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">Tax Invoices (Indian Rupees ₹)</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Official GST-compliant tax invoices, download PDF receipts, and export CSV/JSON statements for corporate accounting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateInvoice}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
              >
                <span>+ Create Invoice</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-left text-xs text-neutral-600 border-collapse">
              <thead className="border-b border-neutral-200 bg-neutral-50/80 font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Invoice Number</th>
                  <th className="px-4 py-3.5">Invoice Date</th>
                  <th className="px-4 py-3.5">Total Amount (INR)</th>
                  <th className="px-4 py-3.5">GST Breakdown</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Download & Export Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(invoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-blue-600" />
                        <span>{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3.5 font-bold text-neutral-900">
                      <span className="text-emerald-700 font-extrabold">{formatINR(inv.amount)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 text-[11px]">
                      CGST (9%) + SGST (9%)
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Preview Modal Button */}
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition shadow-2xs"
                          title="Preview invoice"
                        >
                          <Eye className="size-3" />
                          <span>View</span>
                        </button>

                        {/* Print / Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition border border-blue-100"
                          title="Print or Save PDF"
                        >
                          <Printer className="size-3" />
                          <span>PDF</span>
                        </button>

                        {/* Download CSV */}
                        <button
                          onClick={() => handleDownloadCsv(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-100"
                          title="Export CSV"
                        >
                          <FileSpreadsheet className="size-3" />
                          <span>CSV</span>
                        </button>

                        {/* Download JSON */}
                        <button
                          onClick={() => handleDownloadJson(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-600 hover:bg-neutral-200 transition"
                          title="Download JSON"
                        >
                          <Code className="size-3" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Tax Invoice {previewInvoice.invoice_number}</h3>
                  <p className="text-[11px] text-neutral-500">Official GST Invoice • {formatINR(previewInvoice.amount)}</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewInvoice(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Invoice Details Card */}
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50/50 space-y-3 text-xs">
              <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                <div>
                  <span className="font-bold text-neutral-900">Jira Clone Technologies India Pvt Ltd</span>
                  <p className="text-[10px] text-neutral-400">GSTIN: 29AABCU9603R1ZM • SAC: 998315</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-neutral-900">Billed To: {workspaceProfile.name || 'Workspace'}</span>
                  <p className="text-[10px] text-neutral-400">{workspaceProfile.email || 'Admin'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-bold text-neutral-900">
                    {formatINR(Math.round(previewInvoice.amount / 1.18))}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Central GST (CGST @ 9%):</span>
                  <span className="font-bold text-neutral-900">
                    {formatINR(Math.round((previewInvoice.amount - Math.round(previewInvoice.amount / 1.18)) / 2))}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>State GST (SGST @ 9%):</span>
                  <span className="font-bold text-neutral-900">
                    {formatINR(Math.round((previewInvoice.amount - Math.round(previewInvoice.amount / 1.18)) / 2))}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-200 text-sm">
                  <span>Total Paid (INR):</span>
                  <span className="text-emerald-700 font-black">{formatINR(previewInvoice.amount)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => handleDownloadJson(previewInvoice)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                <Code className="size-3.5" />
                <span>JSON</span>
              </button>

              <button
                onClick={() => handleDownloadCsv(previewInvoice)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                <FileSpreadsheet className="size-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => handleDownloadPdf(previewInvoice)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Printer className="size-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
