// @ts-nocheck
"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useCreateApplicationMutation, useLazyGetApplicationQuery } from '@/services/endpoints/applicationApi';
import { useSendEmailMutation } from '@/services/endpoints/emailApi';
import { MONGO_MODELS } from '@/shared/constants';

const ConfirmationPage = () => {
    const searchParams = useSearchParams();
    const [sendEmail, { isLoading: isSendEMail }] = useSendEmailMutation();
    const [createApplication, { isLoading: isCreatingMaster }] = useCreateApplicationMutation();
    const [getQuoteData, { isLoading: isLoadingQuote }] = useLazyGetApplicationQuery();

    const status = searchParams.get('status');
    const id = searchParams.get('_id');
    const name = searchParams.get('name') as keyof typeof MONGO_MODELS;
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (status === 'true' && id && name) {
            const saveData = async () => {
                const formattedData = {
                    db: MONGO_MODELS[name],
                    action: 'update',
                    filter: { "_id": id },
                    data: { status: 'approved' },
                };

                try {
                    const response = await createApplication(formattedData);

                    if (response?.error?.data?.message?.message) {
                        toast.error(`Error encountered: ${response.error.data.message.message}`);
                        throw new Error("Something went wrong!");
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            saveData();
        }
    }, [status, id, name, createApplication]);

    const handleReject = async () => {
        if (!reason) {
            toast.error('Please enter a reason to reject.');
            return;
        }

        const formattedData = {
            db: MONGO_MODELS[name],
            action: 'update',
            filter: { "_id": id },
            data: { status: 'rejected', rejectReason: reason, rejectedDate: new Date().toISOString() },
        };

        try {
            const response = await createApplication(formattedData);

            if (response?.error?.data?.message?.message) {
                toast.error(`Error encountered: ${response.error.data.message.message}`);
                throw new Error("Something went wrong!");
            } else {
                const { data } = await getQuoteData({
                    db: 'QUOTATION_MASTER',
                    filter: { _id: id },
                    sort: { name: 'asc' },
                });

                const emailData = {
                    recipient: response?.data?.data?.salesEngineer?.user?.email,
                    subject: `Quote Rejected : ${response?.data?.data?.country?.countryCode}-${response?.data?.data?.year?.toString().slice(-2)}-${response?.data?.data?.quoteNo}`,
                    templateData: '',
                    fileName: "aqmTemplates/quoteApprovalRequestRejected",
                    senderName: 'Sales Director',
                    approveUrl: '',
                    rejectUrl: '',
                    reason: reason
                };

                await sendEmail(emailData);
                toast.success(`Quote approval request rejected successfully.`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center text-3xl font-bold">
            {status === 'true' ? (
                <div className="text-green-600">Approved</div>
            ) : (
                <div className="text-red-600">
                    <div>
                        <Input
                            type="text"
                            onChange={(e) => setReason(e.target.value)}
                            value={reason}
                            placeholder="Reason To Reject"
                        />
                        <Button
                            effect="expandIcon"
                            icon={X}
                            iconPlacement="right"
                            onClick={handleReject}
                            className="w-full bg-red-600 hover:bg-red-700 duration-300"
                        >
                            Reason To Reject
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Page = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <ConfirmationPage />
    </Suspense>
);

export default Page;
