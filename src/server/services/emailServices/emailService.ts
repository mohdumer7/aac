import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { ERROR, SUCCESS } from '@/shared/constants';

// Type for email options
interface EmailOptions {
    recipient: string;
    subject: string;
    templateData: any;
    fileName:string;
    senderName:string;
    reason:string
}

// Create reusable transporter for sending emails


const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587, // Use 465 for SSL
    secure: false, // Set to true if using port 465 for SSL
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables for sensitive data
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Optional, use if you encounter issues with self-signed certificates
    },
});

// Send email function
export const sendEmail = async (
    recipient: string,
    subject: string,
    templateData: any,
    fileName:string,
    senderName:string,
    approveUrl:string,
    rejectUrl:string,
    reason:string,
): Promise<any> => {
    try {
        if(!fileName){
           return {status:ERROR,message: "File Name must be sent!",data:{},statusCode:500}
        }
        const filePath = `src/server/shared/emailTemplates/${fileName}.ejs`
        const templatePath = path.join(process.cwd(),filePath );
        const template = fs.readFileSync(templatePath, 'utf-8');
        const htmlContent =  ejs.render(template, { subject, templateData, senderName,approveUrl,rejectUrl, reason });

        // Set up email options
        const mailOptions = {
            from: process.env.EMAIL_USER, // Email address
            to: recipient,
            subject: subject,
            html: htmlContent, // Rendered HTML content
        };

        const info:any = await transporter.sendMail(mailOptions);
        if(info.status === ERROR){
            return info
        }
        return {status:SUCCESS,message: "Email sent!",data:info,statusCode:200}
    } catch (error: any) {
        return {status:ERROR,message: "something went wrong",data:error.message,statusCode:500}
    }
};
// D:\\AceroApplications\\src\\server\\shared\\emailTemplates\\newCustomerTemplate.ejs