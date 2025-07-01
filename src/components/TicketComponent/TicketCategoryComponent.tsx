// src/components/TicketComponent/TicketCategoryComponent.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTicketCategoryMutation, useUpdateTicketCategoryMutation } from '@/services/endpoints/ticketCategoryApi';
import { toast } from 'react-toastify';
import { MoreHorizontal, Plus, Edit, Search, Bookmark, Filter, X } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TicketCategoryComponentProps {
  departments: any[];
  categories: any[];
  userId: string;
  isAdmin: boolean;
}

const TicketCategoryComponent: React.FC<TicketCategoryComponentProps> = ({
  departments,
  categories,
  userId,
  isAdmin
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const [createCategory, { isLoading: isCreating }] = useCreateTicketCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateTicketCategoryMutation();
  
  const handleOpenDialog = (category:any = null) => {
    if (category) {
      setSelectedCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setDepartmentId(category.department._id);
    } else {
      setSelectedCategory(null);
      setName('');
      setDescription('');
      setDepartmentId(selectedDepartment || '');
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
  };
  
  const handleSubmit = async () => {
    if (!name.trim() || !departmentId) return;
    
    try {
      if (selectedCategory) {
        // Update existing category
        await updateCategory({
          action: 'update',
          data: {
            _id: selectedCategory._id,
            name,
            description,
            department: departmentId,
            updatedBy: userId
          }
        }).unwrap();
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await createCategory({
          action: 'create',
          data: {
            name,
            description,
            department: departmentId,
            isActive: true,
            addedBy: userId,
            updatedBy: userId
          }
        }).unwrap();
        toast.success('Category created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error(selectedCategory ? 'Failed to update category' : 'Failed to create category');
    }
  };
  
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Filter by selected department if any
      const departmentMatch = !selectedDepartment || selectedDepartment === 'all' || category.department._id === selectedDepartment;
      
      // Filter by search term if any
      const searchMatch = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return departmentMatch && searchMatch;
    });
  }, [categories, selectedDepartment, searchTerm]);
  
  const categoryCount = filteredCategories.length;
  const departmentOptions = [
    { _id: 'all', name: 'All Departments' },
    ...departments
  ];
  
  return (
    <div className="space-y-6 w-full p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10 border-border/50 focus:border-primary focus:ring-1 focus:ring-primary w-full bg-background/50"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[180px] border-border/50 bg-background/50">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map(dept => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => handleOpenDialog()} 
              className="bg-primary hover:bg-primary/90 text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Filter className="h-4 w-4 mr-2" />
            <span>
              {selectedDepartment ? (
                <span>
                  Showing <span className="font-medium">{categoryCount}</span> categories in{' '}
                  <span className="font-medium">
                    {departments.find(d => d._id === selectedDepartment)?.name}
                  </span>
                </span>
              ) : (
                <span>
                  Showing <span className="font-medium">{categoryCount}</span> categories across all departments
                </span>
              )}
            </span>
          </div>
          
          {(selectedDepartment !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedDepartment('all');
                setSearchTerm('');
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
      
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map(category => (
            <Card 
              key={category._id} 
              className="group bg-card border-border/40 hover:shadow-md transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="mt-1 px-2 py-0 text-xs bg-accent/30 text-muted-foreground border-0"
                    >
                      {category?.department?.name}
                    </Badge>
                  </div>
                  
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => handleOpenDialog(category)}
                          className="cursor-pointer flex items-center"
                        >
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {category?.description || 'No description provided'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/5">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md text-center">
            {searchTerm ? (
              <>
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">No matching categories found</h3>
                <p className="text-muted-foreground text-sm">
                  We couldn't find any categories matching your search criteria. Try adjusting your filters or creating a new category.
                </p>
              </>
            ) : selectedDepartment ? (
              <>
                <Bookmark className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">No categories in this department</h3>
                <p className="text-muted-foreground text-sm">
                  This department doesn't have any categories yet. 
                  {isAdmin && " You can create a new category by clicking the button below."}
                </p>
              </>
            ) : (
              <>
                <Bookmark className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">No categories available</h3>
                <p className="text-muted-foreground text-sm">
                  There are no ticket categories defined yet.
                  {isAdmin && " Get started by creating your first category."}
                </p>
              </>
            )}
            
            {isAdmin && (
              <Button 
                onClick={() => handleOpenDialog()} 
                className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Category
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">
              {selectedCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCategory 
                ? 'Update the category details below' 
                : 'Create a new ticket category for your department'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">Department</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={!!selectedCategory}
              >
                <SelectTrigger className="focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a description for this category"
                rows={3}
                className="focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!name.trim() || !departmentId || isCreating || isUpdating}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isCreating || isUpdating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {selectedCategory ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                selectedCategory ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketCategoryComponent;