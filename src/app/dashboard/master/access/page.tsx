"use client";

import MasterComponent from "@/components/MasterComponent/MasterComponent";
import DynamicDialog from "@/components/ModalComponent/ModelComponent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/ComboBoxWrapper";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useUserAuthorised from "@/hooks/useUserAuthorised";

import {
  useCreateMasterMutation,
  useGetMasterQuery,
} from "@/services/endpoints/masterApi";
import { useGetUsersQuery, useUserOperationsMutation } from "@/services/endpoints/usersApi";
import { SUCCESS } from "@/shared/constants";

import { ArrowUpDown, ChevronLeftIcon, Plus, SearchIcon, Trash2Icon, UserIcon, X, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Custom multi-select component that stays open
const MultiSelectAccess = ({ 
  options, 
  onSelect, 
  placeholder,
  buttonText
}:any) => {
  const [open, setOpen] = useState(false);
  const [checkedItems, setCheckedItems]:any = useState({});
  
  const handleSelect = (item:any) => {
    // Toggle selection without closing dropdown
    setCheckedItems((prev:any) => ({
      ...prev,
      [item._id]: !prev[item._id]
    }));
  };
  
  const handleAddSelected = () => {
    // Get all selected items
    const selectedIds = Object.entries(checkedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (selectedIds.length === 0) {
      toast.info("No access selected");
      return;
    }
    
    // Call the provided callback with selected IDs
    onSelect(selectedIds);
    
    // Clear selections and close dropdown
    setCheckedItems({});
    setOpen(false);
  };
  
  return (
    <div className="w-full space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-zinc-50"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command className="w-full">
            <CommandInput placeholder="Search access..." />
            <div className="flex justify-end pr-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleAddSelected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {buttonText || "Add Selected"}
              </Button>
            </div>
            <CommandList className="max-h-52 overflow-auto">
              <CommandEmpty>No access found</CommandEmpty>
              <CommandGroup>
                {options.map((item:any) => (
                  <CommandItem
                    key={item._id}
                    value={item.name}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>{item.name}</div>
                    <Checkbox 
                      checked={checkedItems[item._id] || false}
                      onCheckedChange={() => handleSelect(item)}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const Access = () => {
  // API Queries and Mutations
  const { 
    data: accessData = [], 
    isLoading: accessDataLoading,
    refetch: refetchAccess
  } = useGetMasterQuery({ 
    db: "ACCESS_MASTER",
   
    sort: { name: 'asc' }, 
  });
console.log("accessData", accessData)
  const [updateUser, { isLoading: updateUserAccessLoading }] = useUserOperationsMutation();
  
  const { 
    data: userData = [], 
    isLoading: userDataLoading, 
    refetch: refetchUsers 
  } = useGetUsersQuery();
  
  const [createMaster, { isLoading: isCreatingMaster }] = useCreateMasterMutation();
  
  // Authentication
  const { user, authenticated } = useUserAuthorised();
  
  // Router
  const router = useRouter();

  // Dialog State for Access Tab
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState("");
  const [initialData, setInitialData] = useState({});
  const [action, setAction] = useState("Add");

  // User Access Tab State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userAccessList, setUserAccessList] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  
  // Main State
  const [distinctAccessOptions, setDistinctAccessOptions] = useState([]);
  const [processedUserData, setProcessedUserData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Access Management Functions
  // Add selected access state
  const [selectedAccessItems, setSelectedAccessItems] = useState([]);

  const getAvailableAccess = useMemo(() => {
    return distinctAccessOptions.filter(
      (option:any) => !userAccessList.some((userAccess:any) => userAccess?._id === option?._id)
    );
  }, [distinctAccessOptions, userAccessList]);

  // Modified to allow tracking multiple selections without immediately adding
  const handleAccessSelect = (accessId:any) => {
    if (!accessId) return;
    
    const accessToSelect = distinctAccessOptions.find((option:any) => option?._id === accessId);
    if (!accessToSelect) return;
    
    setSelectedAccessItems(prev => {
      // If already selected, do nothing
      if (prev.some((item:any) => item?._id === accessId)) {
        return prev;
      }
      return [...prev, accessToSelect];
    });
  };

  // Add all selected access items at once
  const handleAddSelectedAccess = () => {
    if (selectedAccessItems.length === 0) {
      toast.info("No access selected");
      return;
    }

    const newAccessItems = selectedAccessItems.map((access:any) => ({
      ...access,
      hasAccess: true,
      permissions: {
        view: true,
        create: true,
        update: true,
        delete: true,
        import: true,
        export: true,
      }
    }));

    setUserAccessList(prev => [...newAccessItems, ...prev]);
    setSelectedAccessItems([]);
    setIsDirty(true);
    toast.success(`Added ${newAccessItems.length} access permissions`);
  };

  // Remove from selected items
  const handleRemoveSelected = (accessId) => {
    setSelectedAccessItems(prev => 
      prev.filter(access => access._id !== accessId)
    );
  };

  // Process Data
  useEffect(() => {
    // Don't run effects if data hasn't changed or is still loading
    if (accessDataLoading || userDataLoading || !authenticated) {
      setLoading(true);
      return;
    }

    // Process Access Data to create distinct options
    if (accessData?.data) {
      const processedAccess = accessData.data.map((access) => ({
            _id: access._id,
            name: access.name,
            category: access.category,
      }));
      
      setDistinctAccessOptions(processedAccess);
    }

    // Process User Data with their access information
    if (userData?.data) {
      // Full user list for adding new user access
      const fullUserList = userData.data.map(user => ({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }));
      
      // Only update if data has changed
      setAllUsers(fullUserList);
      setFilteredUsers(fullUserList);
      
      const processedUsers = userData.data.map((user) => {
        const accessMap = user.access?.map((access) => ({
              name: access?.accessId?.name,
              _id: access?.accessId?._id,
              permissions: access?.permissions,
              hasAccess: access?.hasAccess,
        })) ?? [];
        
        return {
          firstName: user?.firstName,
          lastName: user?.lastName,
          _id: user?._id,
          email: user?.email,
          access: accessMap,
        };
      });
      
      setProcessedUserData(processedUsers);
    }

    // Update loading state
    setLoading(isCreatingMaster || updateUserAccessLoading);
    
  }, [
    accessData, 
    userData, 
    accessDataLoading, 
    userDataLoading, 
    authenticated, 
    isCreatingMaster, 
    updateUserAccessLoading
  ]);

  // Dialog Functions for Access Tab
  const openDialog = (masterType) => {
    setSelectedMaster(masterType);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedMaster("");
  };

  const handleAdd = () => {
    setInitialData({});
    setAction("Add");
    openDialog("Access");
  };

  const editAccess = (rowData) => {
    setAction("Update");
    setInitialData(rowData);
    openDialog("Access");
  };

  // User Access Side Panel Functions
  const openUserSidebar = (user) => {
    if (!user || !user._id) return;
    
    // Find the user with full access data
    const userWithAccess = processedUserData.find(u => u._id === user._id);
    if (!userWithAccess) {
      toast.error("User data not found");
      return;
    }
    
    setSelectedUser(userWithAccess);
    setUserAccessList(userWithAccess.access || []);
    setIsDirty(false);
  };

  const closeUserSidebar = () => {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    setSelectedUser(null);
    setUserAccessList([]);
    setIsDirty(false);
  };

  const handleUserSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setUserSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers);
      return;
    }
    
    const filtered = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    );
    setFilteredUsers(filtered);
  };

  // Save Functions
  const saveAccessData = async ({ formData, action }) => {
    const formattedData = {
      db: "ACCESS_MASTER",
      action: action === "Add" ? "create" : "update",
      filter: { _id: formData._id },
      data: formData,
    };
    
    try {
      const response = await createMaster(formattedData);
      if (response?.data?.status === SUCCESS) {
        toast.success(`Access ${action === "Add" ? "created" : "updated"} successfully`);
        refetchAccess();
      } else {
        toast.error(`Failed to ${action.toLowerCase()} access`);
      }
    return response;
    } catch (error) {
      const errorMessage = error.message || "An error occurred";
      toast.error(`Error: ${errorMessage}`);
      return { error };
    }
  };

  // Access Tab Configuration
  const accessColumn = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // {
    //   accessorKey: "_id",
    //   header: ({ column }: { column: any }) => {
    //           const isSorted = column.getIsSorted();
      
    //           return (
    //             <button
    //               className="group  flex items-center space-x-2 w-[100px]"
    //               onClick={() => column.toggleSorting(isSorted === "asc")}
    //             >
    //               <span>Access Id</span>
    //               <ChevronsUpDown
    //                 size={15}
    //                 className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
    //                   }`}
    //               />
    //             </button>
    //           );
    //         },
    //   cell: ({ row }) => <div>{row.getValue("_id")}</div>,
    // },
    {
      accessorKey: "name",
      header: ({ column }: { column: any }) => {
              const isSorted = column.getIsSorted();
      
              return (
                <button
                  className="group  flex items-center space-x-2 w-[100px]"
                  onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                  <span>Name</span>
                  <ChevronsUpDown
                    size={15}
                    className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  />
                </button>
              );
            },
      cell: ({ row }) => (
        <div 
          onClick={() => editAccess(row.original)} 
          className="text-blue-500 cursor-pointer hover:underline"
        >
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }: { column: any }) => {
              const isSorted = column.getIsSorted();
      
              return (
                <button
                  className="group  flex items-center space-x-2 w-[100px]"
                  onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                  <span>Category</span>
                  <ChevronsUpDown
                    size={15}
                    className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  />
                </button>
              );
            },
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },
    {
      accessorKey: "url",
      header: ({ column }: { column: any }) => {
              const isSorted = column.getIsSorted();
      
              return (
                <button
                  className="group  flex items-center space-x-2 w-[100px]"
                  onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                  <span>URL</span>
                  <ChevronsUpDown
                    size={15}
                    className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  />
                </button>
              );
            },
      cell: ({ row }) => <div>{row.getValue("url")}</div>,
    },
    {
      accessorKey: "isActive",
      header: ({ column }: { column: any }) => {
              const isSorted = column.getIsSorted();
      
              return (
                <button
                  className="group  flex items-center space-x-2 w-[100px]"
                  onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                  <span>Active</span>
                  <ChevronsUpDown
                    size={15}
                    className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  />
                </button>
              );
            },
      cell: ({ row }) => <div>{row.getValue("isActive")?.toString()}</div>,
    },
    {
      accessorKey: "parent",
      header: ({ column }: { column: any }) => {
              const isSorted = column.getIsSorted();
      
              return (
                <button
                  className="group  flex items-center space-x-2 w-[100px]"
                  onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                  <span>Parent</span>
                  <ChevronsUpDown
                    size={15}
                    className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  />
                </button>
              );
            },
      cell: ({ row }) => <div>{row.getValue("parent")?.name}</div>,
    },
  ];

  const accessConfig = {
    searchFields: [
      {
        key: "name",
        label: "name",
        type: "text",
        placeholder: "Search by access name",
      },
    ],
    dataTable: {
      columns: accessColumn,
      data: accessData?.data || [],
    },
    buttons: [
      {
        label: "Add",
        action: handleAdd,
        icon: Plus,
        className: "bg-sky-600 hover:bg-sky-700 duration-300",
      },
    ],
  };

  // User Access Tab Configuration
  const userAccessColumn = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "_id",
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>User Id</span>
          <ArrowUpDown size={15} />
        </button>
      ),
      cell: ({ row }) => <div>{row.getValue("_id")}</div>,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>First Name</span>
          <ArrowUpDown size={15} />
        </button>
      ),
      cell: ({ row }) => (
        <div
          className="text-blue-500 cursor-pointer hover:underline"
          onClick={() => openUserSidebar(row.original)}
        >
          {row.getValue("firstName")}
        </div>
      ),
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Last Name</span>
          <ArrowUpDown size={15} />
        </button>
      ),
      cell: ({ row }) => <div>{row.getValue("lastName")}</div>,
    },
    {
      accessorKey: "access",
      header: ({ column }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Accesses</span>
          <ArrowUpDown size={15} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex gap-2 flex-wrap">
          {row.getValue("access")?.map((data, index) => (
            <div key={index} className="bg-slate-700 rounded-md p-1 px-2 text-white text-xs">
                {data.name}
              </div>
          ))}
        </div>
      ),
    },
  ];

  const userAccessConfig = {
    searchFields: [
      {
        key: "firstName",
        label: "firstName",
        type: "text",
        placeholder: "Search by user name",
      },
    ],
    dataTable: {
      columns: userAccessColumn,
      data: processedUserData || [],
    },
  };

  // Status data for dropdowns
  const statusData = [
    { _id: true, name: "True" },
    { _id: false, name: "False" },
  ];

  // Form fields for Access dialog
  const accessFields = [
    { label: "Name", name: "name", type: "text" },
    { label: "Category", name: "category", type: "text" },
    { label: "Status", name: "isActive", type: "select", data: statusData },
    {
      label: "Is this a Menu item?",
      name: "isMenuItem",
      type: "select",
      data: statusData,
    },
    { label: "url", name: "url", type: "text" },
    {
      label: "Parent",
      name: "parent",
      type: "select",
      data: distinctAccessOptions,
      format: "ObjectId",
    },
    { label: "Order", name: "order", type: "number" },
    { label: "Icon", name: "icon", type: "text" },
  ];

  // User Access Management Functions
  const handleAccessAdd = (accessId) => {
    if (!accessId) return;
    
    const accessToAdd = distinctAccessOptions.find(option => option._id === accessId);
    if (!accessToAdd) return;
    
    setUserAccessList(prev => [
            {
        ...accessToAdd,
              hasAccess: true,
              permissions: {
                view: true,
                create: true,
                update: true,
                delete: true,
                import: true,
                export: true,
              },
            },
            ...prev,
    ]);
    setIsDirty(true);
  };

  // Add all available access permissions at once
  const handleAddAllAccess = () => {
    const availableAccess = getAvailableAccess;
    if (!availableAccess || availableAccess.length === 0) {
      toast.info("No more access to add");
      return;
    }

    const newAccessItems = availableAccess.map(access => ({
      ...access,
      hasAccess: true,
      permissions: {
        view: true,
        create: true,
        update: true,
        delete: true,
        import: true,
        export: true,
      }
    }));

    setUserAccessList(prev => [...newAccessItems, ...prev]);
    setIsDirty(true);
    toast.success(`Added ${newAccessItems.length} access permissions`);
  };

  // Add multiple access selections
  const handleMultiSelectAccess = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return;
    
    const newAccessItems = selectedIds
      .map(id => distinctAccessOptions.find(option => option._id === id))
      .filter(Boolean)
      .map(access => ({
        ...access,
        hasAccess: true,
          permissions: {
          view: true,
          create: true,
          update: true,
          delete: true,
          import: true,
          export: true,
        }
      }));
    
    if (newAccessItems.length === 0) return;
    
    setUserAccessList(prev => [...newAccessItems, ...prev]);
    setIsDirty(true);
    toast.success(`Added ${newAccessItems.length} access permissions`);
    };

  const handlePermissionToggle = (accessId, permissionKey) => {
    setUserAccessList(prev => 
      prev.map(access => 
        access._id === accessId 
          ? {
              ...access,
              permissions: {
                ...access.permissions,
                [permissionKey]: !access.permissions[permissionKey],
              },
            }
          : access
      )
    );
    setIsDirty(true);
  };

  const handleRemoveAccess = (accessId) => {
    setUserAccessList(prev => prev.filter(access => access._id !== accessId));
    setIsDirty(true);
    };

  const saveUserAccess = async () => {
    if (!selectedUser || !selectedUser._id) {
      toast.error("User ID is missing!");
      return;
    }

    setLoading(true);
    
    const formattedAccess = userAccessList.map(access => ({
      accessId: access._id,
      hasAccess: access.hasAccess,
      permissions: access.permissions,
    }));

    try {
      const response = await updateUser({
        action: "updateAccess",
        data: {
          id: selectedUser._id,
          arrayProperty: "access",
          data: formattedAccess,
          replaceAll: true,
        },
      });
      
      if (response?.data?.status === SUCCESS) {
        toast.success("User access updated successfully");
        setIsDirty(false);
        refetchUsers();
        
        // Update the local data to reflect changes
        setProcessedUserData(prev => 
          prev.map(user => 
            user._id === selectedUser._id 
              ? { ...user, access: userAccessList }
              : user
          )
        );
      } else {
        toast.error("Failed to update user access");
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Render User Access Manager
  const renderUserAccessManager = () => {
    if (!selectedUser) return null;

    return (
      <div className="h-full flex flex-col border rounded-md shadow-sm">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-100">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-lg">
              {selectedUser?.firstName} {selectedUser?.lastName}
            </h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={closeUserSidebar}
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Access Permissions</h3>
              <div className="text-sm text-gray-500">
                {userAccessList.length} permissions assigned
              </div>
            </div>
            
            {/* Enhanced add access controls with true multi-select */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Add Access Permissions</h4>
              
              <div className="flex flex-col gap-2 mb-2">
                <MultiSelectAccess
                  options={getAvailableAccess}
                  onSelect={handleMultiSelectAccess}
                  placeholder="Select multiple access permissions..."
                  buttonText="Add Selected Access"
          />
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAllAccess}
                  disabled={getAvailableAccess.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add All Access ({getAvailableAccess.length})
                </Button>
        </div>
            </div>
            
            {/* List of current access */}
            <div className="space-y-3 mt-4">
              {userAccessList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                  No access assigned to this user.
                  <br />
                  Use the dropdown above to add access.
                </div>
              ) : (
                userAccessList.map((access, index) => (
            <div
              key={index}
                    className="bg-white rounded-md border p-3 shadow-sm"
            >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{access.name}</div>
              <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAccess(access._id)}
                        className="h-7 px-2"
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {Object.entries(access?.permissions || {}).map(([key, value]) => (
                  <div
                          key={`${key}_${access._id}`}
                          className="flex flex-col gap-1 items-center rounded-md p-2 bg-slate-50"
                  >
                    <Label
                            className="font-medium text-sm text-slate-700 mb-1"
                            htmlFor={`${key}_${access._id}`}
                    >
                      {key}
                    </Label>
                    <Switch
                            id={`${key}_${access._id}`}
                      checked={Boolean(value)}
                            onCheckedChange={() => handlePermissionToggle(access._id, key)}
                    />
                  </div>
                ))}
              </div>
            </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with update button */}
        <div className="p-4 border-t flex justify-end bg-slate-50">
          <Button 
            onClick={saveUserAccess} 
            disabled={loading || !isDirty}
            className="bg-blue-600 hover:bg-blue-700 duration-300"
          >
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  };

  // Render User List Sidebar
  const renderUserListSidebar = () => {
    return (
      <div className="border rounded-md p-4 h-full flex flex-col">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={handleUserSearch}
            className="w-full px-3 py-2 border rounded-md pr-10"
          />
          <SearchIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex-1 overflow-auto">
          <h3 className="font-medium mb-2 text-sm text-gray-500">
            {filteredUsers.length} Users
          </h3>
          
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div 
                key={user._id}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  selectedUser?._id === user._id 
                    ? 'bg-blue-100 border-blue-300 border' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={() => openUserSidebar(user)}
              >
                <div className="font-medium">{user.name}</div>
                {user.email && (
                  <div className="text-sm text-gray-500">{user.email}</div>
                )}
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No users found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full px-4 py-1">
      <Tabs defaultValue="Access" className="h-full ">
        <TabsList width="full" className="bg-slate-300 text-slate-800">
          <TabsTrigger value="Access" width="full" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            Access Management
          </TabsTrigger>
          <TabsTrigger value="User" width="full" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            User Access
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="Access" className="h-5/6">
          <div className=" overflow-auto h-full">
            <MasterComponent
              config={accessConfig}
              loadingState={loading}
              rowClassMap={undefined}
              summary={false}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="User" className="h-5/6">
          <div className=" overflow-auto h-full flex">
            {/* Left side: User list */}
            <div className="w-1/4 pr-4">
              {renderUserListSidebar()}
            </div>
            
            {/* Right side: User access management */}
            <div className="w-3/4">
              {selectedUser ? (
                renderUserAccessManager()
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8 bg-gray-50 rounded-lg max-w-md">
                    <UserIcon className="h-16 w-16 mx-auto text-gray-200 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">Select a User</h3>
                    <p className="text-gray-600">
                      Select a user from the list on the left to view and manage their access permissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Access Tab Dialog */}
      {selectedMaster === "Access" && (
            <DynamicDialog
              isOpen={isDialogOpen}
              closeDialog={closeDialog}
              selectedMaster={selectedMaster}
          onSave={saveAccessData}
          fields={accessFields}
              initialData={initialData}
              action={action}
            />
      )}
    </div>
  );
};

export default Access;
