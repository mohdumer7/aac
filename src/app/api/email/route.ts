import { NextRequest, NextResponse } from 'next/server';
import { emailManager } from '@/server/managers/emailManager/emailManager';
import { emailData } from '@/types/master/emailData';

export async function POST(req: NextRequest) {
    try {
        const { recipient, subject, templateData, fileName, senderName, approveUrl, rejectUrl, reason }: 
        { recipient: string; subject: string; templateData: emailData; fileName: string; senderName: string; approveUrl: string; rejectUrl: string; reason: string } 
        = await req.json();

        const result = await emailManager.sendEmail(recipient, subject, templateData, fileName, senderName, approveUrl, rejectUrl, reason);
        
        return NextResponse.json({ status: "SUCCESS", message: "email sent", data: result, statusCode: 200 });
    } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json({ status: "Error", message: error.message || "Something went wrong", data: {}, statusCode: 500 });
    }
}
