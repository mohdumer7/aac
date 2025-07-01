// src/app/dashboard/ticket/create/page.tsx
"use client";

import React from 'react';
import { useCreateTicketMutation } from '@/services/endpoints/ticketApi';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import DashboardLoader from '@/components/ui/DashboardLoader';
import TicketFormComponent from '@/components/TicketComponent/TicketFormComponent';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const CreateTicketPage = () => {
  const router = useRouter();
  const { user, status }: { user?: { _id?: string | null; name?: string | null; email?: string | null; image?: string | null }; status: 'authenticated' | 'loading' | 'unauthenticated' } = useUserAuthorised();
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  
  const handleSubmit = async (data: any) => {
    try {
      const response = await createTicket({
        action: 'create',
        data
      }).unwrap();
      
      toast.success('Ticket created successfully');
      router.push(`/dashboard/ticket/${response.data._id}`);
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };
  
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 }
  };
  
  return (
    <DashboardLoader loading={status === 'loading' || isCreating}>
      <motion.div 
        className="max-w-3xl mx-auto px-4 py-2"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className="mb-4"
          variants={itemVariants}
        >
          <Button 
            variant="ghost" 
            size="sm"
            className="rounded-md absolute left-0 ml-2 flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/dashboard/ticket')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to tickets
          </Button>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <TicketFormComponent 
            onSubmit={handleSubmit}
            userId={user?._id || ''}
            isEdit={false}
          />
        </motion.div>
      </motion.div>
    </DashboardLoader>
  );
};

export default CreateTicketPage;