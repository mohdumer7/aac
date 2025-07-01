"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  ListChecks,
  Activity,
  Users
} from 'lucide-react';

interface TicketStatisticsComponentProps {
  tickets: any[];
  departmentFilter?: string;
  userFilter?: string;
}

const TicketStatisticsComponent: React.FC<TicketStatisticsComponentProps> = ({
  tickets,
  departmentFilter,
  userFilter
}) => {
  // Filter tickets based on department and user filters
  const filteredTickets = tickets.filter(ticket => {
    if (departmentFilter && ticket.department._id !== departmentFilter) return false;
    if (userFilter && ticket.assignee?._id !== userFilter && ticket.creator._id !== userFilter) return false;
    return true;
  });
  
  // Get total tickets from a week ago for comparison
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  
  const ticketsLastWeek = tickets.filter(
    ticket => {
      const createdAt = new Date(ticket.createdAt);
      return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
    }
  ).length;
  
  const ticketsThisWeek = tickets.filter(
    ticket => {
      const createdAt = new Date(ticket.createdAt);
      return createdAt >= oneWeekAgo;
    }
  ).length;
  
  const weeklyChange = ticketsLastWeek === 0 
    ? 100 
    : Math.round((ticketsThisWeek - ticketsLastWeek) / ticketsLastWeek * 100);
  
  // Status distribution data
  const statusCounts = filteredTickets.reduce((acc, ticket) => {
    const status = ticket.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));
  
  // Priority distribution data
  const priorityCounts = filteredTickets.reduce((acc, ticket) => {
    const priority = ticket.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});
  
  const priorityData = Object.keys(priorityCounts).map(priority => ({
    name: priority,
    value: priorityCounts[priority]
  }));
  
  // Department distribution data
  const departmentCounts = filteredTickets.reduce((acc, ticket) => {
    const department = ticket.department.name;
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {});
  
  const departmentData = Object.keys(departmentCounts)
    .map(department => ({
      name: department,
      value: departmentCounts[department]
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
  
  // Recent activity data - tickets created in the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentTickets = filteredTickets.filter(ticket => new Date(ticket.createdAt) >= thirtyDaysAgo);
  
  const dailyTicketCounts:any = {};
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    dailyTicketCounts[dateStr] = 0;
  }
  
  recentTickets.forEach(ticket => {
    const dateStr = format(new Date(ticket.createdAt), 'yyyy-MM-dd');
    if (dailyTicketCounts[dateStr] !== undefined) {
      dailyTicketCounts[dateStr]++;
    }
  });
  
  const activityData = Object.keys(dailyTicketCounts)
    .sort()
    .map(date => ({
      date,
      count: dailyTicketCounts[date],
      displayDate: format(new Date(date), 'MMM dd')
    }));
  
  // Calculate today's values for activity metrics
  const today = new Date();
  const ticketsToday = filteredTickets.filter(ticket => {
    const createdAt = new Date(ticket.createdAt);
    return isSameDay(createdAt, today);
  }).length;
  
  const yesterday = subDays(today, 1);
  const ticketsYesterday = filteredTickets.filter(ticket => {
    const createdAt = new Date(ticket.createdAt);
    return isSameDay(createdAt, yesterday);
  }).length;
  
  const dailyChange = ticketsYesterday === 0 
    ? (ticketsToday > 0 ? 100 : 0)
    : Math.round((ticketsToday - ticketsYesterday) / ticketsYesterday * 100);
  
  // Status distribution by priority
  const statusByPriority = filteredTickets.reduce((acc, ticket) => {
    const status = ticket.status;
    const priority = ticket.priority;
    
    if (!acc[status]) {
      acc[status] = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    }
    
    acc[status][priority] = (acc[status][priority] || 0) + 1;
    return acc;
  }, {});
  
  const statusByPriorityData = Object.keys(statusByPriority).map(status => ({
    name: status,
    high: statusByPriority[status].HIGH || 0,
    medium: statusByPriority[status].MEDIUM || 0,
    low: statusByPriority[status].LOW || 0
  }));
  
  // Color configurations - Using our primary and design system colors
  const COLORS = ['#d55959', '#FF8042', '#00C49F', '#0088FE', '#8884D8']; // Primary color first
  const PRIORITY_COLORS:any = {
    'HIGH': '#d55959', // Primary color for high priority
    'MEDIUM': '#FFB547',
    'LOW': '#4ADE80',
    'high': '#d55959',
    'medium': '#FFB547',
    'low': '#4ADE80'
  };
  const STATUS_COLORS:any = {
    'NEW': '#3B82F6',
    'ASSIGNED': '#8B5CF6',
    'IN_PROGRESS': '#F59E0B',
    'RESOLVED': '#10B981',
    'CLOSED': '#6B7280'
  };
  
  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 px-3 py-2 shadow-lg border border-border/40 backdrop-blur-sm rounded-lg text-sm">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: entry.color }}></div>
              <p className="text-foreground/90">
                {entry.name}: {entry.value}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Custom legend for priority pie chart
  const PriorityLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: entry.color }}></div>
            <span className="text-sm text-foreground/70">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };
  
  return (
    <motion.div 
      className="space-y-8 p-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Summary Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={container}>
        {/* Total Tickets */}
        <motion.div variants={item}>
          <Card className="overflow-hidden h-full border-border/30 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex h-full">
                <div className="w-2 min-h-[162px] bg-primary"></div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Tickets</p>
                      <div className="text-3xl font-bold">{filteredTickets.length}</div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-4 text-xs">
                    <div className={`flex items-center gap-1 ${weeklyChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {weeklyChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>{Math.abs(weeklyChange)}%</span>
                    </div>
                    <span className="text-muted-foreground">vs last week</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Open Tickets */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-border/30 shadow-sm hover:border-blue-300/30 hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex h-full">
                <div className="w-2 bg-blue-500"></div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Open Tickets</p>
                      <div className="text-3xl font-bold">
                        {filteredTickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status)).length}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2 border-t border-border/20">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">New</span>
                      </div>
                      <span className="font-medium">{filteredTickets.filter(t => t.status === 'NEW').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1.5">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-muted-foreground">In Progress</span>
                      </div>
                      <span className="font-medium">{filteredTickets.filter(t => t.status === 'IN_PROGRESS').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* High Priority */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-border/30 shadow-sm hover:border-red-300/30 hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex h-full">
                <div className="w-2 bg-red-500"></div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">High Priority</p>
                      <div className="text-3xl font-bold">
                        {filteredTickets.filter(t => t.priority === 'HIGH').length}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-4 text-sm">
                    <div className="flex-1 text-center p-1 rounded bg-red-50/50 border border-red-100">
                      <div className="text-xs text-muted-foreground">Open</div>
                      <div className="font-medium text-red-600">
                        {filteredTickets.filter(t => t.priority === 'HIGH' && !['RESOLVED', 'CLOSED'].includes(t.status)).length}
                      </div>
                    </div>
                    <div className="flex-1 text-center p-1 rounded bg-green-50/50 border border-green-100">
                      <div className="text-xs text-muted-foreground">Resolved</div>
                      <div className="font-medium text-green-600">
                        {filteredTickets.filter(t => t.priority === 'HIGH' && ['RESOLVED', 'CLOSED'].includes(t.status)).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Completed */}
        <motion.div variants={item}>
          <Card className="overflow-hidden h-full border-border/30 shadow-sm hover:border-emerald-300/30 hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex min-h-[162px] h-full">
                <div className="w-2 bg-emerald-500"></div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground  mb-1">Completed</p>
                      <div className="text-3xl font-bold">
                        {filteredTickets.filter(t => t.status === 'CLOSED').length}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Completion rate</span>
                      <span className="font-medium">
                        {filteredTickets.length > 0 
                          ? Math.round((filteredTickets.filter(t => t.status === 'CLOSED').length / filteredTickets.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ 
                          width: `${filteredTickets.length > 0 
                            ? Math.round((filteredTickets.filter(t => t.status === 'CLOSED').length / filteredTickets.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Activity Trends */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-border/30 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary/80" />
                Activity Trends
              </CardTitle>
              <CardDescription>Ticket activity over the last 30 days</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground">Today</div>
                <div className="font-medium">{ticketsToday}</div>
              </div>
              <div className="h-8 w-px bg-border/50"></div>
              <div className="flex items-center gap-1 text-xs font-medium">
                <div className={`flex items-center gap-0.5 ${dailyChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {dailyChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(dailyChange)}%</span>
                </div>
                <span className="text-muted-foreground">vs yesterday</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d55959" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#d55959" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={{ stroke: '#eee' }}
                    axisLine={{ stroke: '#eee' }}
                    minTickGap={15}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={{ stroke: '#eee' }}
                    axisLine={{ stroke: '#eee' }}
                    width={30}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#d55959" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: '#d55959', strokeWidth: 2, fill: 'white' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-border/30 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-blue-500" />
                Status Distribution
              </CardTitle>
              <CardDescription>Current state of all tickets</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius={75}
                      outerRadius={95}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                      label={({ name, value, percent }) => percent > 0.05 ? `${name} (${value})` : ''}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          strokeWidth={1}
                          stroke="rgba(255,255,255,0.5)"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                {statusData.map((item, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center p-2 rounded-lg"
                    style={{ backgroundColor: `${STATUS_COLORS[item.name] || COLORS[index % COLORS.length]}15` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[item.name] || COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Priority Distribution */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-border/30 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                Priority Breakdown
              </CardTitle>
              <CardDescription>Distribution by priority level</CardDescription>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold">{filteredTickets.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius={90}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={5}
                      label={({ name, value, percent }) => percent > 0.05 ? `${name} (${value})` : ''}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          strokeWidth={1}
                          stroke="rgba(255,255,255,0.5)"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-8 mt-2">
                {priorityData.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PRIORITY_COLORS[item.name] || COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <div className="text-xs text-muted-foreground">{item.name}</div>
                      <div className="text-sm font-bold">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Status by Priority */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-border/30 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-violet-500" />
                Status by Priority
              </CardTitle>
              <CardDescription>Detailed breakdown of ticket status grouped by priority</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusByPriorityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    barSize={35}
                    barGap={5}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickLine={{ stroke: '#eee' }}
                      axisLine={{ stroke: '#eee' }}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickLine={{ stroke: '#eee' }}
                      axisLine={{ stroke: '#eee' }}
                      width={30}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="high" 
                      stackId="a" 
                      fill={PRIORITY_COLORS.HIGH} 
                      name="High" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="medium" 
                      stackId="a" 
                      fill={PRIORITY_COLORS.MEDIUM} 
                      name="Medium"
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="low" 
                      stackId="a" 
                      fill={PRIORITY_COLORS.LOW} 
                      name="Low"
                      radius={[4, 4, 0, 0]} 
                    />
                    <Legend 
                      formatter={(value) => <span className="text-sm text-foreground/80">{value}</span>}
                      iconSize={10}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Department Distribution */}
        {!departmentFilter && departmentData.length > 0 && (
          <motion.div variants={item}>
            <Card className="overflow-hidden border-border/30 shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Department Distribution
                </CardTitle>
                <CardDescription>Tickets by department (top {Math.min(5, departmentData.length)})</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData.slice(0, 5)} // Show only top 5 departments
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickLine={{ stroke: '#eee' }}
                        axisLine={{ stroke: '#eee' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickLine={{ stroke: '#eee' }}
                        axisLine={{ stroke: '#eee' }}
                        tickFormatter={(value) => value.length > 14 ? `${value.substring(0, 14)}...` : value}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        name="Tickets"
                        barSize={20}
                        radius={[0, 4, 4, 0]}
                      >
                        {departmentData.slice(0, 5).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={`hsl(${260 + index * 20}, 70%, 65%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {departmentData.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground mt-4">
                    + {departmentData.length - 5} more departments not shown
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TicketStatisticsComponent;