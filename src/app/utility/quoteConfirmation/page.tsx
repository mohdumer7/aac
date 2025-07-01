"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsRight, X } from 'lucide-react';
import { useCreateApplicationMutation, useLazyGetApplicationQuery } from '@/services/endpoints/applicationApi';
import { useSendEmailMutation } from '@/services/endpoints/emailApi';
import { MONGO_MODELS } from '@/shared/constants';


const QuoteActionPage = () => {
    const [getApplication, { data: applicationData, isLoading, error }] = useLazyGetApplicationQuery();
    const searchParams = useSearchParams();
    const [sendEmail] = useSendEmailMutation();
    const [createApplication]: any = useCreateApplicationMutation();
    const [getQuoteData] = useLazyGetApplicationQuery();

    const status = searchParams.get('status');
    const id = searchParams.get('_id');
    const name = searchParams.get('name') as keyof typeof MONGO_MODELS;
    const year = searchParams.get('year');
    const option = searchParams.get('option');
    const [quoteNo, setQuoteNo] = useState('');
    const [reason, setReason] = useState('');

    const handleIssueQuoteNo = async () => {
        if (!/^\d{5}$/.test(quoteNo)) {
            toast.error('Quote No should be exactly 5 digits.');
            return;
        }

        try {
            const { data }: any = await getApplication({
                db: 'QUOTATION_MASTER',
                filter: { year: year, option: option, quoteNo: quoteNo, _id: { $ne: id } },
                sort: { name: 'asc' },
            });

            if (data?.data?.length > 0) {
                toast.error('Quotation already exists. Please check quotation no and option.');
                return;
            } else {
                console.log("No matching records found!");
            }

            const formattedData: any = {
                db: MONGO_MODELS[name],
                action: 'update',
                filter: { "_id": id },
                data: { quoteNo, status: 'incomplete' },
            };

            const response: any = await createApplication(formattedData);

            if (response?.error?.data?.message?.message) {
                toast.error(`Error encountered: ${response.error.data.message.message}`);
                throw new Error("Something went wrong!");
            }

            toast.success(`Quote No issued successfully.`);
        } catch (error) {
            console.error(error);
        }
    };

    const handleReject = async () => {
        if (!reason) {
            toast.error('Please enter a reason to reject.');
            return null;
        }

        try {
            const formattedData: any = {
                db: MONGO_MODELS[name],
                action: 'update',
                filter: { "_id": id },
                data: { status: 'draft' },
            };

            const response: any = await createApplication(formattedData);

            if (response?.error?.data?.message?.message) {
                toast.error(`Error encountered: ${response.error.data.message.message}`);
                throw new Error("Something went wrong!");
            }

            const { data }: any = await getQuoteData({
                db: 'QUOTATION_MASTER',
                filter: { _id: id },
                sort: { name: 'asc' },
            });

            const emailData: any = {
                recipient: data?.data?.[0]?.salesEngineer?.user?.email,
                subject: 'Quote Request Rejected',
                templateData: '',
                fileName: "aqmTemplates/quoteRequestRejected",
                senderName: 'Sales Director',
                approveUrl: '',
                rejectUrl: '',
                reason,
            };

            await sendEmail(emailData);
            toast.success('Quote request rejected successfully.');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center text-3xl font-bold">
            {status === 'true' ? (
                <div>
                    <Input
                        type="number"
                        onChange={(e) => setQuoteNo(e.target.value)}
                        value={quoteNo}
                        placeholder="Quote No"
                    />
                    <Button
                        effect="expandIcon"
                        icon={ChevronsRight}
                        iconPlacement="right"
                        onClick={handleIssueQuoteNo}
                        className="w-full bg-green-600 hover:bg-green-700 duration-300"
                    >
                        Issue Quote No
                    </Button>
                </div>
            ) : (
                <div className="text-red-600">
                    <Input
                        type="text"
                        onChange={(e) => setReason(e.target.value)}
                        value={reason}
                        placeholder="Reason"
                    />
                    <Button
                        effect="expandIcon"
                        icon={X}
                        iconPlacement="right"
                        onClick={handleReject}
                        className="w-full bg-red-600 hover:bg-red-700 duration-300"
                    >
                        Reject Quote Request
                    </Button>
                </div>
            )}
        </div>
    );
};

const Page = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <QuoteActionPage />
    </Suspense>
);

export default Page;
