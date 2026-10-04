import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  User,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  Layers,
  Briefcase,
  Sparkles,
  LayoutGrid,
  List,
  Percent,
  Award,
  Zap,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X,
  Plus,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileSpreadsheet,
  FileJson,
  Printer,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart } from './charts/pie-chart';
import { EmployeeBarChart } from './charts/employee-bar-chart';

export const EmployeeWiseReport = ({
  membersData = [],
  teamsData = [],
  loading = false,
  filters = {},
  onFilterChange,
  onRefresh,
  onDrillDown,
  onCreateTask,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(filters?.assigneeId || 'ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'Overloaded' | 'Normal' | 'Underutilized'
  const [selectedDateRange, setSelectedDateRange] = useState(filters?.dateRange || '30d');
  const [startDate, setStartDate] = useState(filters?.startDate || '');
  const [endDate, setEndDate] = useState(filters?.endDate || '');

  // Sort & Views
  const [sortBy, setSortBy] = useState('totalAssigned'); // 'totalAssigned' | 'completionRate' | 'inProgress' | 'overdue' | 'storyPoints' | 'utilizationRate' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' | 'matrix'
  const [graphMetric, setGraphMetric] = useState('tasks'); // 'tasks' | 'points' | 'capacity' | 'completion'
  const [graphType, setGraphType] = useState('horizontal'); // 'horizontal' | 'vertical' | 'line' | 'matrix'
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [graphLimit, setGraphLimit] = useState(10);
  const [showChartsPanel, setShowChartsPanel] = useState(true);
  const [selectedEmployeeModal, setSelectedEmployeeModal] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [modalExportMenuOpen, setModalExportMenuOpen] = useState(false);

  // Ref for chart card element
  const chartsCardRef = useRef(null);

  // Date range presets
  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 14 Days', value: '14d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];

  // Handle Date Range Change
  const handleDateRangeChange = (value) => {
    setSelectedDateRange(value);
    if (onFilterChange) {
      onFilterChange('dateRange', value);
    }
  };

  const handleCustomDateApply = () => {
    if (onFilterChange) {
      onFilterChange('dateRange', 'custom');
      onFilterChange('startDate', startDate);
      onFilterChange('endDate', endDate);
    }
    toast.success('Custom date range applied');
  };

  // Handle Employee Dropdown Selection
  const handleEmployeeSelection = (empId) => {
    setSelectedEmployeeId(empId);
    if (onFilterChange && empId !== 'ALL') {
      onFilterChange('assigneeId', empId);
    } else if (onFilterChange && empId === 'ALL') {
      onFilterChange('assigneeId', '');
    }
  };

  // Extract unique departments
  const departments = useMemo(() => {
    const deps = new Set();
    membersData.forEach((m) => {
      if (m.department) deps.add(m.department);
    });
    return Array.from(deps);
  }, [membersData]);

  // Extract unique teams
  const teamOptions = useMemo(() => {
    const tMap = new Map();
    membersData.forEach((m) => {
      (m.teams || []).forEach((t) => {
        tMap.set(t.id, t.name);
      });
    });
    return Array.from(tMap.entries()).map(([id, name]) => ({ id, name }));
  }, [membersData]);

  // Current focused single employee object
  const currentFocusedEmployee = useMemo(() => {
    if (selectedEmployeeId === 'ALL') return null;
    return membersData.find(
      (m) => m.memberId === selectedEmployeeId || m.userId === selectedEmployeeId
    );
  }, [membersData, selectedEmployeeId]);

  // Filter and sort members
  const processedMembers = useMemo(() => {
    let list = membersData.filter((m) => {
      // 1. Employee-wise Selection Filter
      const matchEmp =
        selectedEmployeeId === 'ALL' ||
        m.memberId === selectedEmployeeId ||
        m.userId === selectedEmployeeId;

      // 2. Search Term Filter
      const matchSearch =
        !searchTerm ||
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.teams || []).some((t) => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      // 3. Department Filter
      const matchDept =
        selectedDepartment === 'ALL' || m.department === selectedDepartment;

      // 4. Team Filter
      const matchTeam =
        selectedTeam === 'ALL' ||
        (m.teams || []).some((t) => t.id === selectedTeam || t.name === selectedTeam);

      // 5. Status / Workload Health Filter
      const matchStatus =
        selectedStatus === 'ALL' || m.workloadStatus === selectedStatus;

      return matchEmp && matchSearch && matchDept && matchTeam && matchStatus;
    });

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [
    membersData,
    selectedEmployeeId,
    searchTerm,
    selectedDepartment,
    selectedTeam,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  // Aggregated analytics metrics for visual charts and KPIs
  const summaryStats = useMemo(() => {
    if (!membersData.length) return null;

    const baseData = selectedEmployeeId !== 'ALL' ? processedMembers : membersData;

    const totalMembers = baseData.length;
    const totalAssigned = baseData.reduce((acc, m) => acc + (m.totalAssigned || 0), 0);
    const totalCompleted = baseData.reduce((acc, m) => acc + (m.completed || 0), 0);
    const totalInProgress = baseData.reduce((acc, m) => acc + (m.inProgress || 0), 0);
    const totalOpen = baseData.reduce((acc, m) => acc + (m.open || 0), 0);
    const totalOverdue = baseData.reduce((acc, m) => acc + (m.overdue || 0), 0);
    const totalBlocked = baseData.reduce((acc, m) => acc + (m.blocked || 0), 0);
    const totalStoryPoints = baseData.reduce((acc, m) => acc + (m.storyPoints || 0), 0);

    const avgCompletion =
      totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    const overloadedCount = baseData.filter((m) => m.workloadStatus === 'Overloaded').length;
    const optimalCount = baseData.filter((m) => m.workloadStatus === 'Normal').length;
    const underutilizedCount = baseData.filter((m) => m.workloadStatus === 'Underutilized').length;

    const topPerformer = [...baseData].sort(
      (a, b) => (b.completed || 0) - (a.completed || 0)
    )[0];

    const highestWorkload = [...baseData].sort(
      (a, b) => (b.totalAssigned || 0) - (a.totalAssigned || 0)
    )[0];

    // Data for Pie Charts
    const taskExecutionPieData = [
      { label: 'Completed', value: totalCompleted, color: '#10B981' },
      { label: 'In Progress', value: totalInProgress, color: '#3B82F6' },
      { label: 'Open / Backlog', value: totalOpen, color: '#94A3B8' },
      { label: 'Overdue Work', value: totalOverdue, color: '#E11D48' },
    ].filter((d) => d.value > 0);

    const statusPieData = [
      { label: 'Optimal', value: optimalCount, color: '#10B981' },
      { label: 'Overloaded', value: overloadedCount, color: '#E11D48' },
      { label: 'Underutilized', value: underutilizedCount, color: '#F59E0B' },
    ].filter((d) => d.value > 0);

    // Department Distribution
    const deptCount = {};
    baseData.forEach((m) => {
      const d = m.department || 'Engineering';
      deptCount[d] = (deptCount[d] || 0) + (m.totalAssigned || 0);
    });

    const deptColors = ['#6366F1', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#14B8A6'];
    const departmentChartData = Object.entries(deptCount).map(([label, value], idx) => ({
      label,
      value,
      color: deptColors[idx % deptColors.length],
    }));

    return {
      totalMembers,
      totalAssigned,
      totalCompleted,
      totalInProgress,
      totalOpen,
      totalOverdue,
      totalBlocked,
      totalStoryPoints,
      avgCompletion,
      overloadedCount,
      optimalCount,
      underutilizedCount,
      topPerformer,
      highestWorkload,
      taskExecutionPieData,
      statusPieData,
      departmentChartData,
    };
  }, [membersData, selectedEmployeeId, processedMembers]);

  // Export Visual Analytics Card as CSV
  const handleExportChartsCSV = () => {
    if (!summaryStats) return;
    const rows = [
      ['Metric Category', 'Segment / Dimension', 'Value Count', 'Percentage Share'],
      ['Task Execution', 'Completed', summaryStats.totalCompleted, `${summaryStats.avgCompletion}%`],
      ['Task Execution', 'In Progress', summaryStats.totalInProgress, ''],
      ['Task Execution', 'Open Backlog', summaryStats.totalOpen, ''],
      ['Task Execution', 'Overdue', summaryStats.totalOverdue, ''],
      ['Employee Health', 'Optimal Capacity', summaryStats.optimalCount, ''],
      ['Employee Health', 'Overloaded', summaryStats.overloadedCount, ''],
      ['Employee Health', 'Underutilized', summaryStats.underutilizedCount, ''],
      ['Velocity Points', 'Total Story Points', summaryStats.totalStoryPoints, ''],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visual_analytics_distribution_${selectedDateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
    toast.success('Visual analytics summary CSV exported successfully!');
  };

  // Export Visual Analytics as JSON
  const handleExportChartsJSON = () => {
    if (!summaryStats) return;
    const exportData = {
      reportType: 'Employee Visual Analytics & Distribution Graphs',
      generatedAt: new Date().toISOString(),
      dateRange: selectedDateRange,
      focusedEmployee: selectedEmployeeId,
      summaryKPIs: {
        totalMembers: summaryStats.totalMembers,
        totalAssigned: summaryStats.totalAssigned,
        totalCompleted: summaryStats.totalCompleted,
        totalInProgress: summaryStats.totalInProgress,
        totalOpen: summaryStats.totalOpen,
        totalOverdue: summaryStats.totalOverdue,
        avgCompletionRate: `${summaryStats.avgCompletion}%`,
        totalStoryPoints: summaryStats.totalStoryPoints,
      },
      taskExecutionBreakdown: summaryStats.taskExecutionPieData,
      workloadHealthDistribution: summaryStats.statusPieData,
      departmentWorkShare: summaryStats.departmentChartData,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `visual_analytics_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
    toast.success('Analytics JSON exported successfully!');
  };

  // Export Single Employee Profile CSV
  const handleExportEmployeeProfileCSV = (emp) => {
    if (!emp) return;
    const rows = [
      ['Employee Performance Profile & Workload Audit'],
      ['Name', emp.name || ''],
      ['Email', emp.email || ''],
      ['Job Title', emp.jobTitle || 'Team Member'],
      ['Department', emp.department || 'Engineering'],
      ['Assigned Teams', (emp.teams || []).map((t) => t.name).join('; ') || 'General'],
      ['Workload Health Status', emp.workloadStatus || 'Normal'],
      [''],
      ['Performance Metric', 'Value'],
      ['Total Assigned Work Items', emp.totalAssigned || 0],
      ['Open / Backlog Items', emp.open || 0],
      ['In Progress Items', emp.inProgress || 0],
      ['Completed Items', emp.completed || 0],
      ['Overdue Items', emp.overdue || 0],
      ['Story Points Delivered', emp.storyPoints || 0],
      ['Completion Rate', `${emp.completionRate || 0}%`],
      ['Capacity Utilization Rate', `${emp.utilizationRate || 0}%`],
      ['Weekly Capacity Hours', `${emp.capacityHours || 40}h`],
      ['Estimated Active Workload Hours', `${Math.round(((emp.storyPoints || emp.open + emp.inProgress) * 8.0))}h`],
      ['Generated At', new Date().toISOString()],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `employee_profile_${(emp.name || 'employee').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setModalExportMenuOpen(false);
    toast.success(`Profile summary exported for ${emp.name}!`);
  };

  // Export Single Employee Profile JSON
  const handleExportEmployeeProfileJSON = (emp) => {
    if (!emp) return;
    const exportData = {
      reportType: 'Individual Employee Performance & Telemetry Audit',
      generatedAt: new Date().toISOString(),
      employee: {
        id: emp.memberId || emp.userId,
        name: emp.name,
        email: emp.email,
        jobTitle: emp.jobTitle || 'Team Member',
        department: emp.department || 'Engineering',
        teams: emp.teams || [],
        workloadStatus: emp.workloadStatus || 'Normal',
      },
      workloadMetrics: {
        totalAssigned: emp.totalAssigned || 0,
        open: emp.open || 0,
        inProgress: emp.inProgress || 0,
        completed: emp.completed || 0,
        overdue: emp.overdue || 0,
        storyPoints: emp.storyPoints || 0,
        completionRate: `${emp.completionRate || 0}%`,
        capacityHours: emp.capacityHours || 40,
        utilizationRate: `${emp.utilizationRate || 0}%`,
        estimatedWorkloadHours: Math.round(((emp.storyPoints || emp.open + emp.inProgress) * 8.0)),
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute(
      'download',
      `employee_profile_${(emp.name || 'employee').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setModalExportMenuOpen(false);
    toast.success(`Profile JSON exported for ${emp.name}!`);
  };

  // Helper to generate self-contained SVG Donut Charts for PDF printouts
  const generatePrintSvgDonut = (slices = [], size = 120, innerRadius = 36) => {
    const valid = slices.filter((s) => Number(s.value) > 0);
    const total = valid.reduce((sum, s) => sum + Number(s.value), 0);
    const center = size / 2;
    const radius = size / 2 - 8;

    if (!valid.length || total === 0) {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="12" />
          <text x="${center}" y="${center + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">No Data</text>
        </svg>
      `;
    }

    if (valid.length === 1) {
      const strokeWidth = radius - innerRadius;
      const midRadius = innerRadius + strokeWidth / 2;
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${center}" cy="${center}" r="${midRadius}" fill="none" stroke="${valid[0].color || '#3b82f6'}" stroke-width="${strokeWidth}" />
          <text x="${center}" y="${center - 2}" text-anchor="middle" font-size="15" font-weight="800" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${total}</text>
          <text x="${center}" y="${center + 10}" text-anchor="middle" font-size="8" font-weight="700" fill="#64748b" text-transform="uppercase" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Total</text>
        </svg>
      `;
    }

    let cumulativeAngle = 0;
    const paths = valid
      .map((slice) => {
        const val = Number(slice.value) || 0;
        const sliceAngle = (val / total) * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + sliceAngle;
        cumulativeAngle += sliceAngle;

        const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);

        const ix1 = center + innerRadius * Math.cos(endAngle - Math.PI / 2);
        const iy1 = center + innerRadius * Math.sin(endAngle - Math.PI / 2);
        const ix2 = center + innerRadius * Math.cos(startAngle - Math.PI / 2);
        const iy2 = center + innerRadius * Math.sin(startAngle - Math.PI / 2);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix1.toFixed(2)} ${iy1.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z`;
        return `<path d="${d}" fill="${slice.color || '#3b82f6'}" stroke="#ffffff" stroke-width="2" />`;
      })
      .join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${paths}
        <text x="${center}" y="${center - 2}" text-anchor="middle" font-size="15" font-weight="800" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${total}</text>
        <text x="${center}" y="${center + 10}" text-anchor="middle" font-size="8" font-weight="700" fill="#64748b" text-transform="uppercase" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Total</text>
      </svg>
    `;
  };

  // Dedicated Isolated Print / PDF for Single Employee Profile with Graphs & Charts
  const handlePrintEmployeeProfile = (emp) => {
    if (!emp) return;
    setModalExportMenuOpen(false);

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);

    const badgeClass =
      emp.workloadStatus === 'Overloaded'
        ? 'badge-overloaded'
        : emp.workloadStatus === 'Underutilized'
        ? 'badge-underutilized'
        : 'badge-optimal';

    const teamsHtml =
      (emp.teams || []).length > 0
        ? emp.teams.map((t) => `<span class="tag">${t.name}</span>`).join('')
        : '<span class="tag">General Assignment</span>';

    const totalTasks = emp.totalAssigned || 0;
    const completedTasks = emp.completed || 0;
    const inProgressTasks = emp.inProgress || 0;
    const openTasks = emp.open || 0;
    const overdueTasks = emp.overdue || 0;

    const donutData = [
      { label: 'Completed', value: completedTasks, color: '#10B981' },
      { label: 'In Progress', value: inProgressTasks, color: '#3B82F6' },
      { label: 'Open Backlog', value: openTasks, color: '#94A3B8' },
      { label: 'Overdue Work', value: overdueTasks, color: '#E11D48' },
    ];

    const svgDonutChartHtml = generatePrintSvgDonut(donutData, 110, 34);
    const utilRate = emp.utilizationRate || 0;
    const gaugeColor = utilRate > 110 ? '#e11d48' : utilRate < 40 ? '#f59e0b' : '#10b981';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${emp.name || 'Employee'} - Performance & Workload Report</title>
          <style>
            @page {
              size: auto;
              margin: 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
            }
            body {
              background: #ffffff;
              padding: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 12px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 12px;
            }
            .title-section h1 {
              font-size: 17px;
              font-weight: 800;
              color: #0f172a;
            }
            .title-section p {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .badge {
              display: inline-block;
              padding: 3px 9px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
            }
            .badge-optimal { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
            .badge-overloaded { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
            .badge-underutilized { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

            .profile-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .profile-info h2 {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
            }
            .profile-info p {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .profile-tags {
              margin-top: 4px;
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            }
            .tag {
              background: #e0f2fe;
              color: #0369a1;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
            }

            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px;
              text-align: center;
            }
            .kpi-label {
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 700;
              color: #64748b;
            }
            .kpi-value {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .text-green { color: #16a34a; }
            .text-blue { color: #2563eb; }
            .text-purple { color: #7c3aed; }

            .charts-panel {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 12px;
            }
            .charts-row {
              display: flex;
              align-items: center;
              justify-content: space-around;
              gap: 16px;
            }

            .section-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 700;
              color: #334155;
              margin-bottom: 6px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              margin-bottom: 12px;
            }
            .data-table th {
              background: #f1f5f9;
              text-align: left;
              padding: 5px 8px;
              font-size: 9px;
              text-transform: uppercase;
              font-weight: 700;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
            .data-table td {
              padding: 5px 8px;
              border: 1px solid #e2e8f0;
              color: #1e293b;
            }
            .data-table tr:nth-child(even) {
              background: #f8fafc;
            }

            .footer {
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-section">
              <h1>Individual Employee Performance & Telemetry</h1>
              <p>Jira Clone Organization Analytics • Date Range: ${selectedDateRange.toUpperCase()} • Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span class="badge ${badgeClass}">
                ${emp.workloadStatus || 'Optimal'} Workload
              </span>
            </div>
          </div>

          <div class="profile-card">
            <div class="profile-info">
              <h2>${emp.name || 'Employee Profile'}</h2>
              <p>${emp.email || 'No email'} • ${emp.jobTitle || 'Team Member'}</p>
              <div class="profile-tags">
                <span class="tag" style="background:#f1f5f9; color:#334155; font-weight:bold;">${emp.department || 'Engineering'}</span>
                ${teamsHtml}
              </div>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Weekly Capacity Target</p>
              <p style="font-size: 15px; font-weight: 800; color: #0f172a;">${emp.capacityHours || 40}h / week</p>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-label">Total Assigned</div>
              <div class="kpi-value">${totalTasks}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Completion Rate</div>
              <div class="kpi-value text-green">${emp.completionRate || 0}%</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Active Work Items</div>
              <div class="kpi-value text-blue">${openTasks + inProgressTasks}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Story Points</div>
              <div class="kpi-value text-purple">${emp.storyPoints || 0}</div>
            </div>
          </div>

          <!-- Visual Analytics & Charts Section in PDF -->
          <div class="charts-panel">
            <div class="section-title" style="margin-bottom: 8px;">Visual Work Distribution & Capacity Analytics</div>
            <div class="charts-row">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                ${svgDonutChartHtml}
                <span style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Work Item Breakdown</span>
              </div>

              <div style="flex: 1; max-width: 240px; display: flex; flex-direction: column; gap: 6px;">
                ${donutData.map(d => {
                  const pct = totalTasks > 0 ? Math.round((d.value / totalTasks) * 100) : 0;
                  return `
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <div style="display: flex; justify-content: space-between; font-size: 9px;">
                        <span style="font-weight: 600; color: #334155;">${d.label}</span>
                        <span style="font-weight: 700; color: #0f172a;">${d.value} (${pct}%)</span>
                      </div>
                      <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; border: 1px solid #e2e8f0;">
                        <div style="width: ${Math.min(pct, 100)}%; height: 100%; background: ${d.color}; border-radius: 3px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="width: 170px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b;">Capacity Load Gauge</span>
                <span style="font-size: 14px; font-weight: 800; color: ${gaugeColor};">${utilRate}%</span>
                <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                  <div style="width: ${Math.min(utilRate, 100)}%; height: 100%; background: ${gaugeColor}; border-radius: 3px;"></div>
                </div>
                <span style="font-size: 8px; color: #64748b; margin-top: 2px;">
                  Allocated: ${Math.round(((emp.storyPoints || openTasks + inProgressTasks) * 8.0))}h / ${emp.capacityHours || 40}h weekly
                </span>
              </div>
            </div>
          </div>

          <div class="section-title">Work Item Distribution Breakdown</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Work Category</th>
                <th>Count</th>
                <th>Estimated Hours</th>
                <th>Distribution Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>To Do / Open Backlog</strong></td>
                <td>${openTasks}</td>
                <td>${openTasks * 8}h</td>
                <td>${totalTasks ? Math.round((openTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><strong>In Progress / Active</strong></td>
                <td>${inProgressTasks}</td>
                <td>${inProgressTasks * 8}h</td>
                <td>${totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><strong>Completed Items</strong></td>
                <td>${completedTasks}</td>
                <td>${completedTasks * 8}h</td>
                <td>${totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><strong>Overdue Work</strong></td>
                <td>${overdueTasks}</td>
                <td>${overdueTasks * 8}h</td>
                <td>${totalTasks ? Math.round((overdueTasks / totalTasks) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Capacity & Velocity Telemetry</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Telemetry Dimension</th>
                <th>Measurement</th>
                <th>Diagnostic Evaluation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Capacity Utilization Rate</td>
                <td><strong>${utilRate}%</strong></td>
                <td>${utilRate > 110 ? 'High Risk - Exceeding standard workload bandwidth' : utilRate < 40 ? 'Underutilized - Extra bandwidth available' : 'Optimal - Healthy balanced workload'}</td>
              </tr>
              <tr>
                <td>Weekly Capacity Target</td>
                <td><strong>${emp.capacityHours || 40} Hours</strong></td>
                <td>Standard weekly baseline assignment</td>
              </tr>
              <tr>
                <td>Estimated Work Load</td>
                <td><strong>${Math.round(((emp.storyPoints || openTasks + inProgressTasks) * 8.0))} Hours</strong></td>
                <td>Calculated from story point volume & active tasks</td>
              </tr>
              <tr>
                <td>Story Points Delivered</td>
                <td><strong>${emp.storyPoints || 0} Points</strong></td>
                <td>Velocity measurement in active period</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <span>Jira Clone • Employee Telemetry & Capacity Report</span>
            <span>Confidential Internal Document</span>
          </div>
        </body>
      </html>
    `;

    const doc = printIframe.contentDocument || printIframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
      } catch (e) {
        console.error('Print failed', e);
      } finally {
        setTimeout(() => {
          if (printIframe.parentNode) {
            printIframe.parentNode.removeChild(printIframe);
          }
        }, 1000);
      }
    }, 250);
  };

  // Dedicated Isolated Print / PDF for Visual Analytics & Distribution Summary with Graphs & Charts
  const handlePrintChartsSummary = () => {
    if (!summaryStats) return;
    setExportMenuOpen(false);

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);

    const taskDonutSvg = generatePrintSvgDonut(summaryStats.taskExecutionPieData, 100, 32);
    const statusDonutSvg = generatePrintSvgDonut(summaryStats.statusPieData, 100, 32);
    const deptDonutSvg = generatePrintSvgDonut(summaryStats.departmentChartData, 100, 0); // Full pie

    const topEmployees = processedMembers.slice(0, 8);
    const topEmployeesRows = topEmployees.map((m, idx) => `
      <tr>
        <td style="font-weight: bold;">#${idx + 1} ${m.name}</td>
        <td>${m.department || 'Engineering'}</td>
        <td>${m.totalAssigned || 0}</td>
        <td>${m.completed || 0}</td>
        <td><strong style="color: #16a34a;">${m.completionRate || 0}%</strong></td>
        <td>${m.storyPoints || 0} pts</td>
        <td><strong style="color: ${m.utilizationRate > 110 ? '#e11d48' : '#2563eb'};">${m.utilizationRate || 0}%</strong></td>
        <td>${m.workloadStatus || 'Normal'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Visual Analytics & Workload Distribution Report</title>
          <style>
            @page {
              size: auto;
              margin: 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
            }
            body {
              background: #ffffff;
              padding: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 12px;
            }
            .title-section h1 {
              font-size: 17px;
              font-weight: 800;
              color: #0f172a;
            }
            .title-section p {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .badge {
              display: inline-block;
              padding: 3px 9px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              background: #f3e8ff;
              color: #7e22ce;
              border: 1px solid #e9d5ff;
            }

            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 6px;
              margin-bottom: 12px;
            }
            .kpi-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px;
              text-align: center;
            }
            .kpi-label {
              font-size: 7.5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 700;
              color: #64748b;
            }
            .kpi-value {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }

            .charts-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 12px;
            }
            .chart-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }
            .chart-title {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #334155;
              text-align: center;
            }
            .legend-list {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 3px;
              font-size: 9px;
              margin-top: 4px;
            }
            .legend-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .ranking-bar-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 12px;
            }

            .section-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 700;
              color: #334155;
              margin-bottom: 6px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
              margin-bottom: 12px;
            }
            .data-table th {
              background: #f1f5f9;
              text-align: left;
              padding: 5px 6px;
              font-size: 8.5px;
              text-transform: uppercase;
              font-weight: 700;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
            .data-table td {
              padding: 5px 6px;
              border: 1px solid #e2e8f0;
              color: #1e293b;
            }
            .data-table tr:nth-child(even) {
              background: #f8fafc;
            }

            .footer {
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-section">
              <h1>Visual Analytics & Workload Distribution Summary</h1>
              <p>Jira Clone Organization Analytics • Date Range: ${selectedDateRange.toUpperCase()} • Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span class="badge">
                ${summaryStats.totalMembers} Collaborators Evaluated
              </span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-label">Active Staff</div>
              <div class="kpi-value">${summaryStats.totalMembers}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Total Assigned</div>
              <div class="kpi-value">${summaryStats.totalAssigned}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Completed</div>
              <div class="kpi-value" style="color: #16a34a;">${summaryStats.totalCompleted}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Completion %</div>
              <div class="kpi-value" style="color: #16a34a;">${summaryStats.avgCompletion}%</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Overloaded Staff</div>
              <div class="kpi-value" style="color: #e11d48;">${summaryStats.overloadedCount}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Story Points</div>
              <div class="kpi-value" style="color: #7c3aed;">${summaryStats.totalStoryPoints}</div>
            </div>
          </div>

          <!-- 3 Visual Vector Graphs Embedded in PDF -->
          <div class="charts-container">
            <!-- Chart 1 -->
            <div class="chart-card">
              <span class="chart-title">Task Execution Breakdown</span>
              ${taskDonutSvg}
              <div class="legend-list">
                ${summaryStats.taskExecutionPieData.map(d => `
                  <div class="legend-item">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span style="display:inline-block; width:6px; height:6px; border-radius:2px; background:${d.color};"></span>
                      ${d.label}
                    </span>
                    <strong>${d.value}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Chart 2 -->
            <div class="chart-card">
              <span class="chart-title">Employee Capacity Health</span>
              ${statusDonutSvg}
              <div class="legend-list">
                ${summaryStats.statusPieData.map(d => `
                  <div class="legend-item">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span style="display:inline-block; width:6px; height:6px; border-radius:2px; background:${d.color};"></span>
                      ${d.label}
                    </span>
                    <strong>${d.value}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Chart 3 -->
            <div class="chart-card">
              <span class="chart-title">Department Work Share</span>
              ${deptDonutSvg}
              <div class="legend-list">
                ${summaryStats.departmentChartData.map(d => `
                  <div class="legend-item">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span style="display:inline-block; width:6px; height:6px; border-radius:2px; background:${d.color};"></span>
                      ${d.label}
                    </span>
                    <strong>${d.value}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Visual Output Bar Graph for Top Performers -->
          <div class="ranking-bar-card">
            <div class="section-title" style="margin-bottom: 8px;">Top Performers Output & Velocity Output Bar Graph</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${topEmployees.slice(0, 5).map(emp => `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 9px;">
                  <span style="width: 90px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.name}</span>
                  <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <div style="width: ${Math.min(emp.completionRate || 0, 100)}%; height: 100%; background: #10B981; border-radius: 4px;"></div>
                  </div>
                  <span style="width: 110px; text-align: right; font-weight: 600; color: #475569;">
                    ${emp.completed || 0}/${emp.totalAssigned || 0} tasks (${emp.completionRate || 0}%) • ${emp.storyPoints || 0}pts
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section-title">Granular Employee Performance & Velocity Rankings</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Total Assigned</th>
                <th>Completed</th>
                <th>Completion Rate</th>
                <th>Velocity</th>
                <th>Capacity Load</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${topEmployeesRows}
            </tbody>
          </table>

          <div class="footer">
            <span>Jira Clone • Visual Analytics & Performance Report</span>
            <span>Confidential Internal Document</span>
          </div>
        </body>
      </html>
    `;

    const doc = printIframe.contentDocument || printIframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
      } catch (e) {
        console.error('Print failed', e);
      } finally {
        setTimeout(() => {
          if (printIframe.parentNode) {
            printIframe.parentNode.removeChild(printIframe);
          }
        }, 1000);
      }
    }, 250);
  };

  // Export Table CSV
  const handleExportTableCSV = () => {
    const headers = [
      'Employee Name',
      'Email',
      'Department',
      'Job Title',
      'Total Assigned',
      'Open',
      'In Progress',
      'Completed',
      'Overdue',
      'Story Points',
      'Capacity Hours',
      'Utilization Rate',
      'Completion Rate',
      'Workload Status',
    ];

    const rows = processedMembers.map((m) => [
      `"${m.name}"`,
      `"${m.email}"`,
      `"${m.department || ''}"`,
      `"${m.jobTitle || ''}"`,
      m.totalAssigned || 0,
      m.open || 0,
      m.inProgress || 0,
      m.completed || 0,
      m.overdue || 0,
      m.storyPoints || 0,
      m.capacityHours || 40,
      `${m.utilizationRate || 0}%`,
      `${m.completionRate || 0}%`,
      `"${m.workloadStatus || 'Normal'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_wise_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Employee roster table exported successfully!');
  };

  // Workload Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Overloaded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
            <span className="size-1.5 rounded-full bg-rose-600" />
            Overloaded
          </span>
        );
      case 'Underutilized':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <span className="size-1.5 rounded-full bg-amber-600" />
            Underutilized
          </span>
        );
      case 'Normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Optimal
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl bg-neutral-100 border border-neutral-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-100 border border-neutral-200" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-neutral-100 border border-neutral-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Print Styles to ensure clean PDF export without open dropdowns */}
      <style>{`
        @media print {
          .no-print,
          button,
          select,
          input,
          [role="menu"] {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .printable-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* 1. Global Date-Wise & Employee Selection Filter Control Strip */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Left: Date Presets Pills */}
          <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl text-xs font-semibold select-none overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1.5 px-2 text-neutral-500 shrink-0">
              <Calendar className="size-3.5 text-neutral-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                Period:
              </span>
            </div>
            {datePresets.map((preset) => {
              const isActive = selectedDateRange === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => handleDateRangeChange(preset.value)}
                  className={`rounded-lg px-2.5 py-1.5 transition text-[11px] font-medium whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Right: All Employees vs Specific Employee Selection Scope */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope Mode: All Employees vs Specific Employee */}
            <div className="flex items-center bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/80 text-xs font-semibold">
              <button
                onClick={() => handleEmployeeSelection('ALL')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  selectedEmployeeId === 'ALL'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Users className="size-3.5" />
                <span>All Employees ({membersData.length})</span>
              </button>
              <button
                onClick={() => {
                  if (selectedEmployeeId === 'ALL' && membersData.length > 0) {
                    handleEmployeeSelection(membersData[0].memberId || membersData[0].userId);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  selectedEmployeeId !== 'ALL'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <User className="size-3.5" />
                <span>Specific Employee</span>
              </button>
            </div>

            {/* Specific Employee Focus Dropdown Selector */}
            {selectedEmployeeId !== 'ALL' && (
              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelection(e.target.value)}
                  className="h-9 rounded-xl border border-blue-200 bg-blue-50/70 px-3 text-xs text-blue-950 font-bold focus:border-blue-500 focus:bg-white focus:outline-hidden shadow-2xs max-w-[220px] truncate"
                >
                  <option value="ALL">Switch to All Employees</option>
                  {membersData.map((m) => (
                    <option key={m.memberId || m.userId} value={m.memberId || m.userId}>
                      {m.name} • {m.department || 'Engineering'} ({m.totalAssigned || 0} tasks)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleEmployeeSelection('ALL')}
                  title="Clear specific selection and view all staff"
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition shadow-2xs"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Reset All Filters Button */}
            {(selectedEmployeeId !== 'ALL' || selectedDateRange !== '30d' || searchTerm || selectedDepartment !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedEmployeeId('ALL');
                  setSelectedDateRange('30d');
                  setSearchTerm('');
                  setSelectedDepartment('ALL');
                  setSelectedTeam('ALL');
                  setSelectedStatus('ALL');
                  if (onFilterChange) {
                    onFilterChange('assigneeId', '');
                    onFilterChange('dateRange', '30d');
                  }
                }}
                className="h-9 flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 rounded-xl hover:bg-rose-50 transition border border-rose-200 bg-rose-50/40 shadow-2xs"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Pickers if 'custom' is active */}
        {selectedDateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium text-[11px]">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium text-[11px]">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <button
              onClick={handleCustomDateApply}
              className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
            >
              Apply Dates
            </button>
          </div>
        )}

        {/* Specific Employee Focus Active Callout Banner */}
        {currentFocusedEmployee && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/90 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-2 ring-blue-100">
                {currentFocusedEmployee.avatarUrl ? (
                  <img src={currentFocusedEmployee.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                ) : (
                  (currentFocusedEmployee.name || 'U').slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="truncate">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-blue-950 text-sm truncate">
                    Focus Mode: {currentFocusedEmployee.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {currentFocusedEmployee.jobTitle || 'Collaborator'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-neutral-700 text-[10px] font-semibold">
                    {currentFocusedEmployee.department || 'Engineering'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 truncate mt-0.5 font-medium">
                  Showing individual telemetry: {currentFocusedEmployee.totalAssigned || 0} assigned tasks, {currentFocusedEmployee.completed || 0} completed, {currentFocusedEmployee.inProgress || 0} active, {currentFocusedEmployee.utilizationRate || 0}% capacity load.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedEmployeeModal(currentFocusedEmployee)}
                className="h-8.5 px-3 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold shadow-2xs transition"
              >
                Inspect Profile
              </button>
              <button
                onClick={() => handleEmployeeSelection('ALL')}
                className="h-8.5 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-2xs transition flex items-center gap-1.5"
              >
                <Users className="size-3.5" />
                <span>View All Staff</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Employee Executive Summary KPI Strip (Uniform Sizing & Aligned Baselines) */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Employees */}
          <div className="h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {selectedEmployeeId !== 'ALL' ? 'Selected Staff' : 'Active Staff'}
              </span>
              <div className="size-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-neutral-900">{summaryStats.totalMembers}</span>
                <span className="text-[10px] font-semibold text-neutral-500">Collaborators</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400 truncate">
                {selectedEmployeeId !== 'ALL' ? 'Individual focus' : 'Assigned across teams'}
              </p>
            </div>
          </div>

          {/* Card 2: Avg Completion Rate */}
          <div className="h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Avg Completion
              </span>
              <div className="size-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-600">{summaryStats.avgCompletion}%</span>
                <span className="text-[10px] font-semibold text-neutral-500">{summaryStats.totalCompleted} done</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400 truncate">Out of {summaryStats.totalAssigned} items</p>
            </div>
          </div>

          {/* Card 3: Top Performer */}
          <div
            onClick={() =>
              summaryStats.topPerformer &&
              onDrillDown &&
              onDrillDown({
                assigneeId: summaryStats.topPerformer.memberId,
                title: `${summaryStats.topPerformer.name}'s Completed Work`,
              })
            }
            className={`h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between ${
              summaryStats.topPerformer ? 'cursor-pointer hover:border-amber-300 hover:shadow-sm transition' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Top Performer
              </span>
              <div className="size-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between truncate">
                <span className="text-sm font-bold text-neutral-900 truncate">
                  {summaryStats.topPerformer?.name || 'N/A'}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-amber-700 font-medium truncate">
                {summaryStats.topPerformer ? `${summaryStats.topPerformer.completed} tasks delivered` : 'No completions yet'}
              </p>
            </div>
          </div>

          {/* Card 4: Peak Workload */}
          <div
            onClick={() =>
              summaryStats.highestWorkload &&
              onDrillDown &&
              onDrillDown({
                assigneeId: summaryStats.highestWorkload.memberId,
                title: `${summaryStats.highestWorkload.name}'s Active Workload`,
              })
            }
            className={`h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between ${
              summaryStats.highestWorkload ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Peak Workload
              </span>
              <div className="size-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Zap className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between truncate">
                <span className="text-sm font-bold text-neutral-900 truncate">
                  {summaryStats.highestWorkload?.name || 'N/A'}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-blue-700 font-medium truncate">
                {summaryStats.highestWorkload
                  ? `${summaryStats.highestWorkload.open + summaryStats.highestWorkload.inProgress} active tasks`
                  : 'Balanced'}
              </p>
            </div>
          </div>

          {/* Card 5: Overloaded Staff */}
          <div className="h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Overloaded
              </span>
              <div className="size-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-bold ${summaryStats.overloadedCount > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
                  {summaryStats.overloadedCount}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500">Staff members</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400 truncate">
                {summaryStats.overloadedCount > 0 ? 'Capacity rebalance recommended' : 'Healthy allocation'}
              </p>
            </div>
          </div>

          {/* Card 6: Total Story Points Delivered */}
          <div className="h-[116px] rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                Velocity Points
              </span>
              <div className="size-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="size-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-purple-700">{summaryStats.totalStoryPoints}</span>
                <span className="text-[10px] font-semibold text-neutral-500">Points</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400 truncate">Total estimated output</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Visual Analytics & Distribution Graphs Card */}
      {summaryStats && (
        <div
          ref={chartsCardRef}
          id="visual-analytics-graphs-card"
          className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-6"
        >
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <PieChartIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Visual Analytics & Distribution Graphs
                  </h3>
                  <span className="rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold">
                    {selectedDateRange.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Interactive pie charts, capacity distribution, and velocity rankings across employees.
                </p>
              </div>
            </div>

            {/* Action Buttons: Export Card + Toggle */}
            <div className="flex items-center gap-2 relative">
              {/* Card-Specific Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="h-9 flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
                >
                  <Download className="size-3.5 text-purple-600" />
                  <span>Export Graphs</span>
                  <ChevronDown className={`size-3 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {exportMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white border border-neutral-200 shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <button
                      onClick={handleExportChartsCSV}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium"
                    >
                      <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="block font-bold">Export Summary (CSV)</span>
                        <span className="text-[10px] text-neutral-400">All pie chart & graph datasets</span>
                      </div>
                    </button>

                    <button
                      onClick={handleExportChartsJSON}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium"
                    >
                      <FileJson className="size-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="block font-bold">Export Summary (JSON)</span>
                        <span className="text-[10px] text-neutral-400">Formatted JSON telemetry</span>
                      </div>
                    </button>

                    <button
                      onClick={handlePrintChartsSummary}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium no-print"
                    >
                      <Printer className="size-4 text-purple-600 shrink-0" />
                      <div>
                        <span className="block font-bold">Print / Save as PDF</span>
                        <span className="text-[10px] text-neutral-400">Isolated clean summary report</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle Collapse */}
              <button
                onClick={() => setShowChartsPanel(!showChartsPanel)}
                className="h-9 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition shadow-2xs"
              >
                {showChartsPanel ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className="size-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show</span>
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {showChartsPanel && (
            <div className="space-y-6">
              {/* Pie Charts Row: 3 Responsive Visual Pie / Donut Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/80">
                {/* Pie Chart 1: Task Execution Distribution */}
                <div className="h-full flex flex-col items-center justify-between p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-3">
                  <PieChart
                    data={summaryStats.taskExecutionPieData}
                    size={170}
                    innerRadius={52}
                    title="Task Execution Breakdown"
                    onSliceClick={(slice) => {
                      toast.info(`Filtered by ${slice.label}: ${slice.value} tasks`);
                    }}
                  />
                  <span className="text-[11px] font-semibold text-neutral-500 pt-2 border-t border-neutral-100 w-full text-center">
                    Total: {summaryStats.totalAssigned} Work Items
                  </span>
                </div>

                {/* Pie Chart 2: Workload Health & Balance */}
                <div className="h-full flex flex-col items-center justify-between p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-3">
                  <PieChart
                    data={summaryStats.statusPieData}
                    size={170}
                    innerRadius={52}
                    title="Employee Capacity Health"
                    onSliceClick={(slice) => {
                      if (slice.label === 'Optimal') setSelectedStatus('Normal');
                      else if (slice.label === 'Overloaded') setSelectedStatus('Overloaded');
                      else if (slice.label === 'Underutilized') setSelectedStatus('Underutilized');
                      toast.info(`Active filter set to: ${slice.label}`);
                    }}
                  />
                  <span className="text-[11px] font-semibold text-neutral-500 pt-2 border-t border-neutral-100 w-full text-center">
                    Total: {summaryStats.totalMembers} Collaborators
                  </span>
                </div>

                {/* Pie Chart 3: Department Workload Allocation */}
                <div className="h-full flex flex-col items-center justify-between p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-3">
                  <PieChart
                    data={summaryStats.departmentChartData}
                    size={170}
                    innerRadius={0} // Full Pie Chart
                    title="Department Work Share"
                    onSliceClick={(slice) => {
                      setSelectedDepartment(slice.label);
                      toast.info(`Filtered department: ${slice.label}`);
                    }}
                  />
                  <span className="text-[11px] font-semibold text-neutral-500 pt-2 border-t border-neutral-100 w-full text-center">
                    {departments.length || 1} Departments Active
                  </span>
                </div>
              </div>

              {/* Employee Velocity & Capacity Bar Graph */}
              <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-4">
                <EmployeeBarChart
                  data={processedMembers}
                  metric={graphMetric}
                  graphType={graphType}
                  showBenchmark={showBenchmark}
                  maxItems={graphLimit}
                  onMetricChange={(m) => setGraphMetric(m)}
                  onGraphTypeChange={(g) => setGraphType(g)}
                  onEmployeeClick={(emp) => setSelectedEmployeeModal(emp)}
                  showControls={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Main Employee Data Table / Cards / Matrix */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-5">
        {/* Card Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <UserCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Granular Employee Records & Roster
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Detailed inspection of individual task assignments, throughput rates, active bandwidth, and capacity allocations.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/80">
              <button
                onClick={() => setViewMode('table')}
                title="Detailed Table View"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white shadow-2xs text-neutral-900 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <List className="size-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Employee Cards View"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'cards'
                    ? 'bg-white shadow-2xs text-neutral-900 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                title="Capacity Matrix View"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'matrix'
                    ? 'bg-white shadow-2xs text-neutral-900 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BarChart3 className="size-3.5" />
                <span>Capacity</span>
              </button>
            </div>

            {/* Export Table CSV */}
            <button
              onClick={handleExportTableCSV}
              className="h-9 flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
            >
              <Download className="size-3.5 text-emerald-600" />
              <span>Export Roster CSV</span>
            </button>

            {/* Create Task Shortcut */}
            {onCreateTask && (
              <button
                onClick={onCreateTask}
                className="h-9 flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
              >
                <Plus className="size-3.5" />
                <span>Assign Work</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Controls Bar (Uniform h-9 alignment) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, title, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-8 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-hidden shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 font-medium focus:border-blue-500 focus:outline-hidden shadow-2xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Workload Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 font-medium focus:border-blue-500 focus:outline-hidden shadow-2xs"
            >
              <option value="ALL">All Workload Statuses</option>
              <option value="Overloaded">Overloaded ({'>'}110% Capacity)</option>
              <option value="Normal">Optimal Bandwidth</option>
              <option value="Underutilized">Underutilized ({'<'}40% Capacity)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 font-medium focus:border-blue-500 focus:outline-hidden shadow-2xs"
            >
              <option value="totalAssigned-desc">Sort: Highest Workload</option>
              <option value="completionRate-desc">Sort: Highest Completion Rate</option>
              <option value="inProgress-desc">Sort: Most In Progress</option>
              <option value="overdue-desc">Sort: Most Overdue Tasks</option>
              <option value="storyPoints-desc">Sort: Most Story Points</option>
              <option value="utilizationRate-desc">Sort: Highest Capacity %</option>
              <option value="name-asc">Sort: Employee Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 5. Display Modes */}

        {/* MODE A: Detailed Table View (Sticky Header & Crisp Alignments) */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto custom-scrollbar border border-neutral-200/80 rounded-2xl">
            <table className="w-full text-left text-xs text-neutral-600 border-collapse">
              <thead className="border-b border-neutral-200 bg-neutral-50/90 font-bold uppercase tracking-wider text-neutral-500 text-[10px] select-none sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="px-4 py-3.5 text-left">Employee</th>
                  <th className="px-3.5 py-3.5 text-left">Department & Teams</th>
                  <th className="px-3 py-3.5 text-center">Total Work</th>
                  <th className="px-3 py-3.5 text-center">Open</th>
                  <th className="px-3 py-3.5 text-center">In Progress</th>
                  <th className="px-3 py-3.5 text-center">Done</th>
                  <th className="px-3 py-3.5 text-center">Overdue</th>
                  <th className="px-3 py-3.5 text-center">Points</th>
                  <th className="px-3.5 py-3.5 text-center">Capacity Load</th>
                  <th className="px-3.5 py-3.5 text-center">Completion</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {processedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-8 text-neutral-300" />
                        <span className="font-semibold text-neutral-700">No employee records match the filters</span>
                        <p className="text-xs text-neutral-400 max-w-sm">
                          Try adjusting your search criteria or resetting filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedMembers.map((m) => (
                    <tr
                      key={m.memberId || m.userId}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                      onClick={() => setSelectedEmployeeModal(m)}
                    >
                      {/* Employee Info */}
                      <td className="px-4 py-3.5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="size-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                              ) : (
                                (m.name || 'U').slice(0, 1).toUpperCase()
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${
                                m.workloadStatus === 'Overloaded'
                                  ? 'bg-rose-500'
                                  : m.workloadStatus === 'Underutilized'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <div className="truncate max-w-[160px]">
                            <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate text-xs">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 truncate block">
                              {m.jobTitle || m.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Teams */}
                      <td className="px-3.5 py-3.5 text-left">
                        <div className="space-y-1">
                          <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                            {m.department || 'Engineering'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {(m.teams || []).length === 0 ? (
                              <span className="text-neutral-400 text-[10px]">General</span>
                            ) : (
                              m.teams.map((t) => (
                                <span
                                  key={t.id}
                                  className="rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-medium text-blue-700 truncate"
                                >
                                  {t.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Assigned */}
                      <td className="px-3 py-3.5 text-center font-bold text-neutral-900 text-sm">
                        {m.totalAssigned}
                      </td>

                      {/* Open */}
                      <td className="px-3 py-3.5 text-center font-semibold text-neutral-600">
                        {m.open}
                      </td>

                      {/* In Progress */}
                      <td className="px-3 py-3.5 text-center font-semibold text-blue-600">
                        {m.inProgress}
                      </td>

                      {/* Done */}
                      <td className="px-3 py-3.5 text-center font-bold text-emerald-600">
                        {m.completed}
                      </td>

                      {/* Overdue */}
                      <td className="px-3 py-3.5 text-center">
                        {m.overdue > 0 ? (
                          <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold">
                            {m.overdue}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-medium">0</span>
                        )}
                      </td>

                      {/* Story Points */}
                      <td className="px-3 py-3.5 text-center font-semibold text-purple-700">
                        {m.storyPoints || 0} pts
                      </td>

                      {/* Capacity & Utilization Rate */}
                      <td className="px-3.5 py-3.5 text-center">
                        <div className="space-y-1 max-w-[120px] mx-auto">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-neutral-500 font-medium">
                              {Math.round(((m.storyPoints || m.open + m.inProgress) * 8.0))}h / {m.capacityHours || 40}h
                            </span>
                            <span
                              className={`font-bold ${
                                m.utilizationRate > 110
                                  ? 'text-rose-600'
                                  : m.utilizationRate < 40
                                  ? 'text-amber-600'
                                  : 'text-neutral-800'
                              }`}
                            >
                              {m.utilizationRate}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                m.utilizationRate > 110
                                  ? 'bg-rose-500'
                                  : m.utilizationRate < 40
                                  ? 'bg-amber-400'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(m.utilizationRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Completion Rate Bar */}
                      <td className="px-3.5 py-3.5 text-center">
                        <div className="flex items-center gap-2 justify-center max-w-[110px] mx-auto">
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${m.completionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-neutral-800 text-[11px] min-w-[28px]">
                            {m.completionRate}%
                          </span>
                        </div>
                      </td>

                      {/* Workload Status */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getStatusBadge(m.workloadStatus)}
                          <ChevronRight className="size-3.5 text-neutral-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE B: Employee Cards Grid View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {processedMembers.map((m) => (
              <div
                key={m.memberId || m.userId}
                onClick={() => setSelectedEmployeeModal(m)}
                className="h-full rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="size-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          (m.name || 'U').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-white ${
                          m.workloadStatus === 'Overloaded'
                            ? 'bg-rose-500'
                            : m.workloadStatus === 'Underutilized'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-neutral-900 group-hover:text-blue-600 transition truncate">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">{m.jobTitle || m.email}</p>
                      <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold text-neutral-600 mt-1">
                        {m.department || 'Engineering'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(m.workloadStatus)}</div>
                </div>

                {/* Card Stats Grid */}
                <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-xl bg-neutral-50/90 border border-neutral-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Total</span>
                    <span className="text-xs font-bold text-neutral-900">{m.totalAssigned}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Active</span>
                    <span className="text-xs font-bold text-blue-600">{m.inProgress}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Done</span>
                    <span className="text-xs font-bold text-emerald-600">{m.completed}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Overdue</span>
                    <span className={`text-xs font-bold ${m.overdue > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>
                      {m.overdue}
                    </span>
                  </div>
                </div>

                {/* Progress Meters */}
                <div className="space-y-2.5 pt-1">
                  {/* Completion Rate */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-medium">Completion Rate</span>
                      <span className="font-bold text-emerald-600">{m.completionRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${m.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Utilization Load */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-medium">Capacity Utilization</span>
                      <span
                        className={`font-bold ${
                          m.utilizationRate > 110 ? 'text-rose-600' : 'text-neutral-700'
                        }`}
                      >
                        {m.utilizationRate}% ({m.capacityHours || 40}h capacity)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.utilizationRate > 110
                            ? 'bg-rose-500'
                            : m.utilizationRate < 40
                            ? 'bg-amber-400'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(m.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium truncate max-w-[180px]">
                    {(m.teams || []).map((t) => t.name).join(', ') || 'General Member'}
                  </span>
                  <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
                    Inspect <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODE C: Capacity & Workload Heatmap Matrix View */}
        {viewMode === 'matrix' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Capacity Matrix:</strong> Compares active work volume against assigned weekly capacity hours to spot burn-out risks early.
                </span>
              </div>
              <span className="font-semibold text-neutral-500 shrink-0">
                {processedMembers.length} Employees Analyzed
              </span>
            </div>

            <div className="space-y-3">
              {processedMembers.map((m) => (
                <div
                  key={m.memberId || m.userId}
                  onClick={() => setSelectedEmployeeModal(m)}
                  className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs hover:border-neutral-300 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Employee Info */}
                  <div className="flex items-center gap-3 w-60 shrink-0">
                    <div className="size-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                      {(m.name || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate text-xs">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {m.jobTitle} • {m.department}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Workload Distribution Bar */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-neutral-800">
                          {m.totalAssigned} Work Items
                        </span>
                        <span className="text-emerald-600 font-semibold">{m.completed} Done</span>
                        <span className="text-blue-600 font-semibold">{m.inProgress} In Progress</span>
                        <span className="text-neutral-500 font-semibold">{m.open} Open</span>
                        {m.overdue > 0 && (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded">
                            {m.overdue} Overdue
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-neutral-700">{m.utilizationRate}% Capacity</span>
                    </div>

                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        title={`Completed: ${m.completed}`}
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            m.totalAssigned > 0 ? (m.completed / m.totalAssigned) * 100 : 0
                          }%`,
                        }}
                      />
                      <div
                        title={`In Progress: ${m.inProgress}`}
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            m.totalAssigned > 0 ? (m.inProgress / m.totalAssigned) * 100 : 0
                          }%`,
                        }}
                      />
                      <div
                        title={`Open: ${m.open}`}
                        className="bg-neutral-300 h-full transition-all duration-300"
                        style={{
                          width: `${
                            m.totalAssigned > 0 ? (m.open / m.totalAssigned) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Balance Badge */}
                  <div className="w-36 shrink-0 text-right flex items-center justify-end gap-2">
                    {getStatusBadge(m.workloadStatus)}
                    <ChevronRight className="size-4 text-neutral-300 group-hover:text-blue-600 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Interactive Employee Details Drawer / Modal */}
      {selectedEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-200 shadow-xs">
                  {selectedEmployeeModal.avatarUrl ? (
                    <img
                      src={selectedEmployeeModal.avatarUrl}
                      alt=""
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    (selectedEmployeeModal.name || 'U').slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{selectedEmployeeModal.name}</h3>
                  <p className="text-xs text-neutral-500">{selectedEmployeeModal.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                      {selectedEmployeeModal.jobTitle || 'Team Member'}
                    </span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {selectedEmployeeModal.department || 'Engineering'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Export Menu & Close Button */}
              <div className="flex items-center gap-2 relative">
                {/* Modal Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setModalExportMenuOpen(!modalExportMenuOpen)}
                    className="h-8.5 flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-2.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
                  >
                    <Download className="size-3.5 text-blue-600" />
                    <span>Export</span>
                    <ChevronDown className={`size-3 transition-transform ${modalExportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {modalExportMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white border border-neutral-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                      <button
                        onClick={() => handleExportEmployeeProfileCSV(selectedEmployeeModal)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium"
                      >
                        <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="block font-bold">Export Profile (CSV)</span>
                          <span className="text-[10px] text-neutral-400">Personal performance metrics</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleExportEmployeeProfileJSON(selectedEmployeeModal)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium"
                      >
                        <FileJson className="size-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="block font-bold">Export Profile (JSON)</span>
                          <span className="text-[10px] text-neutral-400">Structured telemetry payload</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handlePrintEmployeeProfile(selectedEmployeeModal)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left transition font-medium no-print"
                      >
                        <Printer className="size-4 text-purple-600 shrink-0" />
                        <div>
                          <span className="block font-bold">Print / PDF Card</span>
                          <span className="text-[10px] text-neutral-400">Clean 1-page individual report</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedEmployeeModal(null);
                    setModalExportMenuOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Work</span>
                <span className="text-lg font-bold text-neutral-900">{selectedEmployeeModal.totalAssigned}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Completion</span>
                <span className="text-lg font-bold text-emerald-600">{selectedEmployeeModal.completionRate}%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Velocity Points</span>
                <span className="text-lg font-bold text-purple-700">{selectedEmployeeModal.storyPoints || 0}</span>
              </div>
            </div>

            {/* Individual Visual Analytics & Distribution Graphs */}
            <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="size-3.5 text-purple-600" />
                  Visual Analytics & Work Distribution
                </h4>
                <span className="text-[10px] font-bold text-neutral-400">
                  {selectedEmployeeModal.totalAssigned} Total Items
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 p-3 bg-white rounded-xl border border-neutral-200/60">
                <PieChart
                  data={[
                    { label: 'Completed', value: selectedEmployeeModal.completed || 0, color: '#10B981' },
                    { label: 'In Progress', value: selectedEmployeeModal.inProgress || 0, color: '#3B82F6' },
                    { label: 'Open', value: selectedEmployeeModal.open || 0, color: '#94A3B8' },
                    { label: 'Overdue', value: selectedEmployeeModal.overdue || 0, color: '#E11D48' },
                  ]}
                  size={120}
                  innerRadius={36}
                  showLegend={true}
                />

                {/* Capacity Gauge */}
                <div className="space-y-2 text-left w-full sm:w-44">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-medium">Capacity Bandwidth</span>
                      <span className={`font-bold ${selectedEmployeeModal.utilizationRate > 110 ? 'text-rose-600' : 'text-neutral-800'}`}>
                        {selectedEmployeeModal.utilizationRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedEmployeeModal.utilizationRate > 110
                            ? 'bg-rose-500'
                            : selectedEmployeeModal.utilizationRate < 40
                            ? 'bg-amber-400'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(selectedEmployeeModal.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400">
                    Allocated: {Math.round(((selectedEmployeeModal.storyPoints || selectedEmployeeModal.open + selectedEmployeeModal.inProgress) * 8.0))}h / {selectedEmployeeModal.capacityHours || 40}h weekly
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Work Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Work Item Distribution
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50">
                  <span className="text-neutral-500 font-medium">To Do / Backlog</span>
                  <span className="font-bold text-neutral-800">{selectedEmployeeModal.open}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-blue-50/30">
                  <span className="text-blue-700 font-medium">In Progress</span>
                  <span className="font-bold text-blue-700">{selectedEmployeeModal.inProgress}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-emerald-50/30">
                  <span className="text-emerald-700 font-medium">Completed</span>
                  <span className="font-bold text-emerald-700">{selectedEmployeeModal.completed}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-rose-50/30">
                  <span className="text-rose-700 font-medium">Overdue</span>
                  <span className="font-bold text-rose-700">{selectedEmployeeModal.overdue}</span>
                </div>
              </div>
            </div>

            {/* Teams Assignment */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Assigned Teams
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedEmployeeModal.teams || []).length === 0 ? (
                  <span className="text-neutral-400 text-xs">No specific teams assigned.</span>
                ) : (
                  selectedEmployeeModal.teams.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 border border-neutral-200"
                    >
                      {t.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportEmployeeProfileCSV(selectedEmployeeModal)}
                  className="h-9 flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition"
                >
                  <Download className="size-3.5 text-emerald-600" />
                  <span>Download Profile CSV</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEmployeeModal(null);
                    setModalExportMenuOpen(false);
                  }}
                  className="h-9 rounded-xl border border-neutral-300 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const emp = selectedEmployeeModal;
                    setSelectedEmployeeModal(null);
                    setModalExportMenuOpen(false);
                    if (onDrillDown) {
                      onDrillDown({
                        assigneeId: emp.memberId,
                        title: `${emp.name}'s Assigned Work Items`,
                      });
                    }
                  }}
                  className="h-9 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                >
                  <ExternalLink className="size-3.5" />
                  <span>View All Assigned Items</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWiseReport;
