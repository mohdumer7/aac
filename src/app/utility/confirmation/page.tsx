"use client";

import React, { Suspense, useEffect } from 'react';
import { useCreateMasterMutation } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

const ConfirmationPage = () => {
    const searchParams = useSearchParams();
    const [createMaster, { isLoading: isCreatingMaster }] = useCreateMasterMutation();

    const status = searchParams.get('status');
    const id = searchParams.get('_id');
    const name = searchParams.get('name') as keyof typeof MONGO_MODELS;

    useEffect(() => {
        if (status && id && name) {
            const saveData = async () => {
                const formattedData = {
                    db: MONGO_MODELS[name],
                    action: 'update',
                    filter: { "_id": id },
                    data: { isActive: status },
                };

                const response: any = await createMaster(formattedData);

                if (response?.error?.data?.message?.message) {
                    toast.error(`Error encountered: ${response?.error?.data?.message?.message}`);
                    return null;
                }

                return response;
            };

            saveData();
        }
    }, [status, id, name]);

    return (
        <div className="h-screen flex items-center justify-center text-3xl font-bold">
            {status === 'true' ? (
                <div className="text-green-600">Approved</div>
            ) : (
                <div className="text-red-600">Rejected</div>
            )}
        </div>
    );
};

const Page = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmationPage />
        </Suspense>
    );
};

export default Page;
