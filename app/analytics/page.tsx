'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  Layers,
  Users,
  Building,
  Download,
  TrendingUp,
  Clock,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    totalBookings: 0,
    totalEvents: 0,
    totalMembers: 0,
    activeResources: 0,
  });

  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [topResources, setTopResources] = useState<any[]>([]);
  const [clubActivity, setClubActivity] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    } else if (session?.user && !['orgAdmin', 'superAdmin'].includes(session.user.role || '')) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user && ['orgAdmin', 'superAdmin'].includes(session.user.role || '')) {
      fetchAnalytics();
    }
  }, [session, daysFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [bookingsRes, resourcesRes, clubsRes, peakRes, attendanceRes] = await Promise.all([
        fetch(`/api/analytics/bookings?days=${daysFilter}`),
        fetch(`/api/analytics/resources`),
        fetch(`/api/analytics/clubs`),
        fetch(`/api/analytics/peak-hours`),
        fetch(`/api/analytics/attendance`),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookingTrends(bookingsData.data || []);
        if (bookingsData.summary) {
          setSummary(bookingsData.summary);
        }
      }

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setTopResources(resourcesData.data || []);
      }

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        setClubActivity(clubsData.data || []);
      }

      if (peakRes.ok) {
        const peakData = await peakRes.json();
        setPeakHours(peakData.data || []);
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendanceTrends(attendanceData.data || []);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csv = 'Category,Metric,Value\n';

    csv += `Summary,Total Bookings,${summary.totalBookings}\n`;
    csv += `Summary,Total Events,${summary.totalEvents}\n`;
    csv += `Summary,Total Members,${summary.totalMembers}\n`;
    csv += `Summary,Active Resources,${summary.activeResources}\n\n`;

    csv += 'Date,Bookings Count\n';
    bookingTrends.forEach((row) => {
      csv += `${row.date},${row.count}\n`;
    });
    csv += '\n';

    csv += 'Resource Name,Booking Count\n';
    topResources.forEach((row) => {
      csv += `"${row.name.replace(/"/g, '""')}",${row.count}\n`;
    });
    csv += '\n';

    csv += 'Club Name,Activity Count\n';
    clubActivity.forEach((row) => {
      csv += `"${row.name.replace(/"/g, '""')}",${row.count}\n`;
    });
    csv += '\n';

    csv += 'Hour,Booking Count\n';
    peakHours.forEach((row) => {
      csv += `${row.hour},${row.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `blockspace_analytics_${daysFilter}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading' || (session && !['orgAdmin', 'superAdmin'].includes(session.user?.role || ''))) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">
          Loading analytics & checking authorization...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time multi-tenant data, booking trends, peak usage hours & resource metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Time Filter Dropdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 flex items-center text-sm">
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '3 Months', days: 90 },
              ].map((btn) => (
                <button
                  key={btn.days}
                  onClick={() => setDaysFilter(btn.days)}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    daysFilter === btn.days
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={exportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition shadow-md"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{summary.totalBookings}</p>
            <span className="text-xs text-indigo-400 font-medium mt-1 inline-block">
              Across all resources
            </span>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Events
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{summary.totalEvents}</p>
            <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
              Scheduled & completed
            </span>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Members
              </span>
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{summary.totalMembers}</p>
            <span className="text-xs text-purple-400 font-medium mt-1 inline-block">
              Active org users
            </span>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Active Resources
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{summary.activeResources}</p>
            <span className="text-xs text-amber-400 font-medium mt-1 inline-block">
              Ready for booking
            </span>
          </div>
        </div>

        {/* Loading State for Charts */}
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
            Fetching organization analytics pipelines...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart: Bookings Over Time */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 backdrop-blur-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Bookings Over Time (Last {daysFilter} Days)
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Daily breakdown of resource reservations
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Bookings"
                      stroke="#6366F1"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#6366F1' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Top 5 Resources */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-400" />
                    Top 5 Most Booked Resources
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Most frequently reserved spaces and equipment
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                {topResources.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No resource bookings recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topResources} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" name="Bookings" fill="#10B981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart: Peak Hours */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Peak Booking Hours (24h)
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Hours with highest booking concentrations
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" name="Bookings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Activity by Club */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-purple-400" />
                    Activity by Club
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Event and booking breakdown across active clubs
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                {clubActivity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No club activity recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clubActivity}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {clubActivity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart: Event Attendance Capacity */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Event Attendance vs Capacity
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Recent events registration performance
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                {attendanceTrends.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No event data available yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="title" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="attendees" name="Attendees" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" name="Capacity" fill="#374151" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
