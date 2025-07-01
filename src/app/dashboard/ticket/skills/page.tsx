// src/app/dashboard/ticket/skills/page.tsx
"use client";

import React, { useState } from 'react';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { useGetTicketCategoriesQuery } from '@/services/endpoints/ticketCategoryApi';
import { useGetUserSkillsQuery, useCreateUserSkillMutation, useUpdateUserSkillMutation } from '@/services/endpoints/userSkillApi';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, StarOff, Edit, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const TicketSkillsPage = () => {
  const router = useRouter();
  const { user, status }:any = useUserAuthorised();
  
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('3');
  const [editingSkill, setEditingSkill]:any = useState(null);
  
  // Get departments
  const { data: departmentData = {data:[]}, isLoading: departmentLoading } = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 1 }
  });
  
  // Get users
  const { data: userData = {data:[]}, isLoading: userLoading } = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: departmentFilter ? { department: departmentFilter, isActive: true } : { isActive: true },
    sort: { firstName: 1 }
  });
  
  // Get categories
  const { data: categoryData = {data:[]}, isLoading: categoryLoading } = useGetTicketCategoriesQuery({});
  
  // Get skills for selected user
  const { data: skillsData = {data:[]}, isLoading: skillsLoading } = useGetUserSkillsQuery(
    { userId: selectedUser },
    { skip: !selectedUser }
  );
  
  const [createSkill, { isLoading: isCreating }] = useCreateUserSkillMutation();
  const [updateSkill, { isLoading: isUpdating }] = useUpdateUserSkillMutation();
  
  const loading = departmentLoading || userLoading || categoryLoading || skillsLoading || status === 'loading';
  
  // Check if user is admin
  const isAdmin = user?.role?.name?.toUpperCase() === 'ADMIN';
  
  const handleOpenDialog = (skill:any = null) => {
    if (skill) {
      setEditingSkill(skill);
      setSelectedCategory(skill.category._id);
      setSelectedRating(skill.rating.toString());
    } else {
      setEditingSkill(null);
      setSelectedCategory('');
      setSelectedRating('3');
    }
    setIsDialogOpen(true);
  };
  
  const handleSaveSkill = async () => {
    if (!selectedCategory || !selectedRating) return;
    
    try {
      if (editingSkill) {
        // Update existing skill
        await updateSkill({
          action: 'update',
          data: {
            _id: editingSkill._id,
            rating: parseInt(selectedRating),
            updatedBy: user?._id
          }
        }).unwrap();
        toast.success('Skill updated successfully');
      } else {
        // Create new skill
        await createSkill({
          action: 'create',
          data: {
            user: selectedUser,
            category: selectedCategory,
            rating: parseInt(selectedRating),
            isActive: true,
            addedBy: user?._id,
            updatedBy: user?._id
          }
        }).unwrap();
        toast.success('Skill added successfully');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save skill');
    }
  };
  
  // Get categories by department
  const getCategoriesByDepartment = (departmentId:any) => {
    return categoryData?.data?.filter((cat:any) => cat.department._id === departmentId) || [];
  };
  
  // Filter out categories that already have skills assigned
  const getAvailableCategories = () => {
    const assignedCategoryIds = skillsData?.data?.map((skill:any) => skill.category._id) || [];
    return categoryData?.data?.filter((cat:any) => !assignedCategoryIds.includes(cat._id)) || [];
  };
  
  // Get categories for user's department if skill is being added
  const availableCategories = !editingSkill
    ? getAvailableCategories()
    : categoryData?.data || [];
  
  // Render rating stars
  const renderRatingStars = (rating:any) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index}>
        {index < rating ? (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ));
  };
  
  return (
    <DashboardLoader loading={loading}>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => router.push('/dashboard/ticket')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">User Skills Management</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Skill Configuration</CardTitle>
            <CardDescription>
              Manage user skills for ticket categories to improve auto-assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select onValueChange={setDepartmentFilter} value={departmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all_departments">All Departments</SelectItem>
                    {departmentData?.data?.map((dept:any) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>User</Label>
                <Select onValueChange={setSelectedUser} value={selectedUser}>
                  <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="select_user">Select a user</SelectItem>
                    <SelectItem value="">Select a user</SelectItem>
                    {userData?.data?.map((user:any) => (
                      <SelectItem key={user._id} value={user._id}>
                        {`${user.firstName} ${user.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedUser && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">User Skills</h3>
                  {isAdmin && (
                    <Button 
                      onClick={() => handleOpenDialog()}
                      disabled={availableCategories.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  )}
                </div>
                
                {skillsData?.data?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillsData.data.map((skill:any) => (
                      <Card key={skill._id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{skill.category.name}</CardTitle>
                          <CardDescription>
                            {skill.category.department.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex">
                            {renderRatingStars(skill.rating)}
                          </div>
                        </CardContent>
                        {isAdmin && (
                          <CardFooter>
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(skill)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Rating
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No skills configured for this user.
                    {isAdmin && availableCategories.length > 0 && (
                      <div className="mt-2">
                        <Button variant="outline" onClick={() => handleOpenDialog()}>
                          Add Skills
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Skill Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
              <DialogDescription>
                {editingSkill 
                  ? 'Update the skill rating for this category' 
                  : 'Add a new skill for this user'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {!editingSkill && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat:any) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name} ({cat.department.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Skill Level (1-5)</Label>
                <Select onValueChange={setSelectedRating} value={selectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Elementary</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-center mt-2">
                {renderRatingStars(parseInt(selectedRating))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSkill}
                disabled={!selectedCategory && !editingSkill}
              >
                {editingSkill ? 'Update Skill' : 'Add Skill'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLoader>
  );
};

export default TicketSkillsPage;