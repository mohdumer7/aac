"use client";

import React, { useState } from 'react';
import { useGetTicketsQuery } from '@/services/endpoints/ticketApi';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { 
  Plus, LayoutDashboard, LayoutList, Filter, Search,
  ListFilter, X, ChevronDown, Loader2, Settings, RefreshCw,
  Table, Inbox, AlertTriangle, Check,
  FileDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CalendarDays,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TicketBoardComponent from '@/components/TicketComponent/TicketBoardComponent';
import TicketComponent from '@/components/TicketComponent/TicketComponent';
import TicketStatisticsComponent from '@/components/TicketComponent/TicketStatisticsComponent';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'react-toastify';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Checkbox } from '@radix-ui/react-checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { assign } from 'lodash';

const TicketDashboardPage = () => {
  const { user, status }:any = useUserAuthorised();
  const router = useRouter();
  
  const [view, setView] = useState('board');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
 
  console.log(user)
  const isAdmin = user?.role?.name === 'Admin'; // adjust this based on your actual role field
  
  const filter = !isAdmin
    ? {
      $or: [
        { creator: user._id },
        { assignee: user._id },
        { assignees: user._id }
      ]
    }
    : undefined;

  // Fetch tickets
  const { data: ticketsData = {data:[]}, isLoading: ticketsLoading, refetch } = useGetTicketsQuery({
    ...(filter && { filter }),
    sort: { createdAt: 'asc'}
  });
 
  // Fetch departments
  const { data: departmentData = {data:[]}, isLoading: departmentLoading } = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' }
  });
  
  const loading = ticketsLoading || departmentLoading || status === 'loading';
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Tickets refreshed");
  };
  
  // Filter tickets
  const filteredTickets = ticketsData?.data?.filter((ticket:any) => {
    // Department filter
    if (departmentFilter && departmentFilter !== 'all_departments' && ticket.department._id !== departmentFilter) return false;
    
    // Status filter
    if (statusFilter && statusFilter !== 'all_statuses' && ticket.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter && priorityFilter !== 'all_priorities' && ticket.priority !== priorityFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket._id.toString().toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const handleTicketClick = (ticketId:any) => {
    router.push(`/dashboard/ticket/${ticketId}`);
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (departmentFilter && departmentFilter !== 'all_departments') count++;
    if (statusFilter && statusFilter !== 'all_statuses') count++;
    if (priorityFilter && priorityFilter !== 'all_priorities') count++;
    return count;
  };

  // Animation variants
  const microButtonAnimation = {
    hover: { scale: 1.03, y: -1, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.97, y: 1, boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)" },
    transition: { type: "spring", stiffness: 500, damping: 25 }
  };

  // Staggered children animation for the dashboard content
  const dashboardStaggerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.07,
        delayChildren: 0.05
      }
    }
  };

  const dashboardItemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 400, damping: 30 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const filterVariants = {
    hidden: { opacity: 0, height: 0, y: -10 },
    visible: { 
      opacity: 1, 
      height: "auto", 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      } 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      y: -10, 
      transition: { 
        duration: 0.2, 
        ease: "easeInOut" 
      } 
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };
  
  return (
    <DashboardLoader loading={loading}>
      <motion.div 
        className="space-y-6 max-w-full"
        variants={dashboardStaggerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div 
          variants={dashboardItemVariants}
          className="rounded-xl  px-6 py-5  backdrop-blur-sm"

          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-foreground">
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >Tickets</motion.span>
                {filteredTickets && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.3 }}
                  >
                    <Badge className="ml-2 badge-status bg-primary/10 text-primary font-medium px-2.5 py-0.5 text-xs">
                      {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                    </Badge>
                  </motion.div>
                )}
              </h1>
              <motion.p 
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                Track and manage support requests efficiently
              </motion.p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end">
              <motion.div
                whileHover={microButtonAnimation.hover}
                whileTap={microButtonAnimation.tap}
                transition={microButtonAnimation.transition}
              >
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="focus-ring h-9 rounded-lg border-border/40 bg-white/50 dark:bg-card/50"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  )}
                  <span className="hidden sm:inline ml-1.5">Refresh</span>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={microButtonAnimation.hover}
                whileTap={microButtonAnimation.tap}
                transition={microButtonAnimation.transition}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="focus-ring h-9 rounded-lg border-border/40 bg-white/50 dark:bg-card/50"
                    >
                      <motion.div
                        whileHover={{ rotate: 45 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <Settings className="h-4 w-4" />
                      </motion.div>
                      <span className="hidden sm:inline ml-1.5">Options</span>
                      <motion.div
                        animate={{ y: [0, 2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      >
                        <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                      </motion.div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-lg rounded-lg border-border/40 bg-white dark:bg-card animate-in slide-in-from-top-5 zoom-in-95 duration-200">
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/ticket/categories')}
                      className="cursor-pointer hover:bg-muted focus:bg-muted rounded-md transition-all duration-200"
                    >
                      Categories
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/ticket/skills')}
                      className="cursor-pointer hover:bg-muted focus:bg-muted rounded-md transition-all duration-200"
                    >
                      User Skills
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem 
                      onClick={() => setShowFilters(!showFilters)}
                      className="cursor-pointer hover:bg-muted focus:bg-muted rounded-md transition-all duration-200"
                    >
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
              
              <motion.div
                whileHover={microButtonAnimation.hover}
                whileTap={microButtonAnimation.tap}
                transition={microButtonAnimation.transition}
              >
                <Button 
                  className="flex items-center gap-1.5 h-9 shadow-sm focus-ring rounded-lg"
                  onClick={() => router.push('/dashboard/ticket/create')}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                  <span>Create Ticket</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs & Search Section */}
        <Tabs 
          defaultValue="list" 
          className="space-y-4"
          onValueChange={(value) => setView(value)}
        >
          <motion.div 
            variants={dashboardItemVariants}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm border border-border/30">
              <TabsList className="mr-2 p-1 bg-muted/40 rounded-lg backdrop-blur-md">
                {['list', 'board', 'statistics'].map((tabValue, index) => (
                  <TabsTrigger 
                    key={tabValue}
                    value={tabValue} 
                    className={`flex items-center gap-1.5 focus-ring transition-all duration-300 rounded-md relative overflow-hidden 
                              data-[state=active]:bg-white/90 dark:data-[state=active]:bg-secondary/90 data-[state=active]:shadow-sm`}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="flex items-center gap-1.5"
                    >
                      {tabValue === 'board' && <LayoutDashboard className="h-4 w-4" />}
                      {tabValue === 'list' && <LayoutList className="h-4 w-4" />}
                      {tabValue === 'statistics' && <Table className="h-4 w-4" />}
                      <span className="capitalize">{tabValue === 'statistics' ? 'Stats' : tabValue}</span>
                    </motion.div>
                    {view === tabValue && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/5 rounded-md -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <motion.div
                whileHover={microButtonAnimation.hover}
                whileTap={microButtonAnimation.tap}
                transition={microButtonAnimation.transition}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1.5 transition-all duration-200 h-9 rounded-lg focus-ring "
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <motion.div
                    animate={showFilters ? { rotate: 180 } : { rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Filter className="h-4 w-4" />
                  </motion.div>
                  <span>Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Badge className="ml-1 badge-status bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">
                        {getActiveFiltersCount()}
                      </Badge>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </div>
            
            <motion.div 
              variants={dashboardItemVariants}
              className="relative max-w-xs sm:max-w-sm w-full group flex items-center bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-border/30"
            >
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300 z-10" />
              </motion.div>
              <Input
                placeholder="Search tickets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 rounded-xl border-0 h-9 focus:border-primary/40 transition-all duration-200 bg-transparent focus:ring-0 focus:ring-offset-0 w-full"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-primary transition-colors duration-200"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
          
          {/* Filters Section */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 } 
                }}
              >
                <Card className="shadow-sm border border-border/20 rounded-xl overflow-hidden bg-white/90 dark:bg-card/90 backdrop-blur-md">
                  <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                    <CardTitle className="text-base flex items-center text-foreground font-medium">
                      <motion.div
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ListFilter className="h-4 w-4 mr-2 text-primary" />
                      </motion.div>
                      Filter Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.07 }
                        }
                      }}
                    >
                      <motion.div 
                        className="space-y-1.5"
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        <label className="text-sm font-medium mb-1.5 block text-foreground">Department</label>
                        <Select onValueChange={setDepartmentFilter} value={departmentFilter}>
                          <SelectTrigger className="rounded-lg border-border/30 focus:border-primary/40 transition-all duration-200 bg-white/70 dark:bg-card/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent className="shadow-lg rounded-lg border-border/30 bg-white/95 dark:bg-card/95 backdrop-blur-lg">
                            <SelectItem value="all_departments" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">All Departments</SelectItem> 
                            {departmentData?.data?.map((dept:any) => (
                              <SelectItem key={dept._id} value={dept._id} className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                      
                      <motion.div 
                        className="space-y-1.5"
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        <label className="text-sm font-medium mb-1.5 block text-foreground">Status</label>
                        <Select onValueChange={setStatusFilter} value={statusFilter}>
                          <SelectTrigger className="rounded-lg border-border/30 focus:border-primary/40 transition-all duration-200 bg-white/70 dark:bg-card/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent className="shadow-lg rounded-lg border-border/30 bg-white/95 dark:bg-card/95 backdrop-blur-lg">
                            <SelectItem value="all_statuses" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">All Statuses</SelectItem>
                            <SelectItem value="NEW" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">New</SelectItem>
                            <SelectItem value="ASSIGNED" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">Assigned</SelectItem>
                            <SelectItem value="IN_PROGRESS" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">In Progress</SelectItem>
                            <SelectItem value="RESOLVED" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">Resolved</SelectItem>
                            <SelectItem value="CLOSED" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                      
                      <motion.div 
                        className="space-y-1.5"
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        <label className="text-sm font-medium mb-1.5 block text-foreground">Priority</label>
                        <Select onValueChange={setPriorityFilter} value={priorityFilter}>
                          <SelectTrigger className="rounded-lg border-border/30 focus:border-primary/40 transition-all duration-200 bg-white/70 dark:bg-card/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                          <SelectContent className="shadow-lg rounded-lg border-border/30 bg-white/95 dark:bg-card/95 backdrop-blur-lg">
                            <SelectItem value="all_priorities" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">All Priorities</SelectItem>
                            <SelectItem value="HIGH" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">High</SelectItem>
                            <SelectItem value="MEDIUM" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">Medium</SelectItem>
                            <SelectItem value="LOW" className="cursor-pointer focus:bg-muted hover:bg-muted/50 rounded-md">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </motion.div>
                    
                    <div className="flex justify-end mt-5">
                      <motion.div
                        whileHover={microButtonAnimation.hover}
                        whileTap={microButtonAnimation.tap}
                        transition={microButtonAnimation.transition}
                        className="mr-2"
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="focus-ring rounded-lg border-border/30 bg-white/70 dark:bg-card/70"
                          onClick={resetFilters}
                        >
                          Reset Filters
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={microButtonAnimation.hover}
                        whileTap={microButtonAnimation.tap}
                        transition={microButtonAnimation.transition}
                      >
                        <Button 
                          size="sm"
                          className="shadow-sm focus-ring rounded-lg"
                          onClick={() => setShowFilters(false)}
                        >
                          Apply
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Board View */}
          <TabsContent value="board" className="mt-0 pt-2">
            <motion.div
              key="board-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              variants={dashboardItemVariants}
            >
              <TicketBoardComponent 
                tickets={filteredTickets || []} 
                onTicketClick={handleTicketClick}
                userId={user?._id}
              />
            </motion.div>
          </TabsContent>
          
          {/* List View */}
          <TabsContent value="list" className="pt-2 p-4 mt-2">
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              variants={dashboardItemVariants}
            >
              <div className="space-y-4">
                {filteredTickets?.length > 0 ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredTickets.map((ticket:any) => (
                      <motion.div
                        key={ticket._id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="rounded-xl overflow-hidden"
                      >
                        <TicketComponent 
                          ticket={ticket} 
                          onClick={() => handleTicketClick(ticket._id)}
                        />
                      </motion.div>
                    ))}
                    
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-16 rounded-xl shadow-sm border border-border/30 bg-white/90 dark:bg-card/90 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <motion.div 
                      className="bg-muted/30 p-4 rounded-full mb-4 text-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.3 }}
                    >
                      <Search className="h-10 w-10" />
                    </motion.div>
                    <motion.h3 
                      className="text-xl font-medium mb-2 text-foreground"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      No tickets found
                    </motion.h3>
                    <motion.p 
                      className="text-muted-foreground mb-6 text-center max-w-md"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      {searchQuery 
                        ? `No tickets match your search "${searchQuery}"`
                        : "No tickets match your current filters"}
                    </motion.p>
                    <motion.div 
                      className="flex gap-3"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <motion.div
                        whileHover={microButtonAnimation.hover}
                        whileTap={microButtonAnimation.tap}
                        transition={microButtonAnimation.transition}
                      >
                        <Button 
                          variant="outline"
                          className="focus-ring rounded-lg border-border/30 bg-white/70 dark:bg-card/70"
                          onClick={resetFilters}
                        >
                          Reset Filters
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={microButtonAnimation.hover}
                        whileTap={microButtonAnimation.tap}
                        transition={microButtonAnimation.transition}
                      >
                        <Button 
                          onClick={() => router.push('/dashboard/ticket/create')}
                          className="shadow-sm focus-ring rounded-lg"
                        >
                          Create New Ticket
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </TabsContent>
          
          {/* Statistics View */}
          <TabsContent value="statistics" className="mt-0 pt-2">
            <motion.div
              key="statistics-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              variants={dashboardItemVariants}
            >
              <TicketStatisticsComponent 
                tickets={ticketsData?.data || []}
                departmentFilter={departmentFilter}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLoader>
  );
};

export default TicketDashboardPage;