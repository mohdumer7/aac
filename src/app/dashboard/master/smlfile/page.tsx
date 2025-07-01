"use client";


import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import DashboardLoader from '@/components/ui/DashboardLoader'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { DataTable } from '@/components/TableComponent/TableComponent'
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import { organisationTransformData } from '@/lib/utils';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import { error } from 'console';
import { createMasterData } from '@/server/services/masterDataServices';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { bulkImport } from '@/shared/functions';
import { useUploadFilesMutation } from '@/services/endpoints/smlFileApi';

const page = () => {
  const { user, status, authenticated }:any = useUserAuthorised();
  const [uploadFiles] = useUploadFilesMutation();
  const [formData, setFormData] = useState({
    fileName: '',
    description: '',
    revNo: '',
    subGroupId: '',
    addedBy: 'admin@example.com', // Example
  });

  const [file, setFile] = useState<File | null>(null);

  const saveData = async ({ formData, action }: { formData: any; action: string }) => {
    const fileField = formData.files; // assume it's a File object or array
    const form = new FormData();
  
    form.append("db", MONGO_MODELS.SML_GROUP_MASTER);
    form.append("addedBy", user?._id || ""); // if available
    form.append("updatedBy", user?._id || "");
    
    if (fileField instanceof FileList || Array.isArray(fileField)) {
      Array.from(fileField).forEach((file, idx) => {
        form.append("files", file);
      });
    } else if (fileField instanceof File) {
      form.append("files", fileField);
    }
  
    // Use RTK Mutation here
    const response = await uploadFiles(form); // comes from useUploadFilesMutation
  
    return response;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
formData.append('db', "SML_FILE_MASTER");

formData.append('description', 'Some description');


    if (file) {
      formData.append('file', file);
    }

    const response = await uploadFiles(formData);

    const result = await response.json();
    console.log('Upload result:', result);
  };

  return (
    <input type="file" onChange={(e) => {
      const form = new FormData();
      form.append("db", "SML_GROUP_MASTER");
      if (e.target.files && e.target.files[0]) {
        form.append("files", e.target.files[0]);
      }
      uploadFiles(form);
    }} />
   
  );
};

export default page
