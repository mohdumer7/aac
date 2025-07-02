import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
  quality?: number;
}

export interface FormTemplateData {
  formType: string;
  formData: any;
  submittedBy?: any;
  submissionDate?: Date;
  approvalHistory?: any[];
  organizationLogo?: string;
  organizationName?: string;
}

export class HRMSPDFGenerator {
  
  // Main method to generate PDF from form data
  static async generateFormPDF(
    templateData: FormTemplateData, 
    options: PDFGenerationOptions = {}
  ): Promise<{ success: boolean; pdfBlob?: Blob; pdfDataUrl?: string; error?: string }> {
    try {
      const {
        filename = `${templateData.formType}_${Date.now()}.pdf`,
        format = 'a4',
        orientation = 'portrait',
        margin = 20,
        scale = 2,
        quality = 0.95
      } = options;

      // Create HTML template
      const htmlContent = this.createFormTemplate(templateData);
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = 'white';
      container.style.padding = `${margin}px`;
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.4';
      
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale,
        quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      // Calculate dimensions
      const imgWidth = format === 'a4' ? 210 : 216; // A4 or Letter width in mm
      const pageHeight = format === 'a4' ? 297 : 279; // A4 or Letter height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Generate blob and data URL
      const pdfBlob = pdf.output('blob');
      const pdfDataUrl = pdf.output('datauristring');

      return {
        success: true,
        pdfBlob,
        pdfDataUrl
      };

    } catch (error: any) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate PDF'
      };
    }
  }

  // Download PDF file
  static downloadPDF(pdfBlob: Blob, filename: string) {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Create HTML template based on form type
  private static createFormTemplate(templateData: FormTemplateData): string {
    const { formType, formData, submittedBy, submissionDate, approvalHistory, organizationLogo, organizationName } = templateData;

    // Ensure we have actual form data
    if (!formData || Object.keys(formData).length === 0) {
      console.warn('No form data provided for PDF generation');
      return this.createEmptyFormTemplate(formType, organizationName, organizationLogo);
    }

    const baseTemplate = `
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; background: white; font-family: 'Arial', sans-serif;">
        ${this.createHeader(organizationName, organizationLogo)}
        ${this.getFormTypeTemplate(formType, formData)}
        ${this.createSubmissionInfo(submittedBy, submissionDate)}
        ${this.createApprovalSection(approvalHistory)}
        ${this.createFooter()}
      </div>
    `;

    return baseTemplate;
  }

  // Create header section
  private static createHeader(organizationName = 'Acero Building Systems', logoUrl?: string): string {
    return `
      <div style="text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: bold;">${organizationName}</h1>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Human Resources Management System</p>
      </div>
    `;
  }

  // Get specific form template based on form type
  private static getFormTypeTemplate(formType: string, formData: any): string {
    switch (formType) {
      case 'manpower_requisition':
        return this.createManpowerRequisitionTemplate(formData);
      case 'candidate_information':
        return this.createCandidateInformationTemplate(formData);
      case 'business_trip_request':
        return this.createBusinessTripRequestTemplate(formData);
      case 'new_employee_joining':
        return this.createNewEmployeeJoiningTemplate(formData);
      case 'assets_it_access':
        return this.createAssetsITAccessTemplate(formData);
      case 'employee_information':
        return this.createEmployeeInformationTemplate(formData);
      case 'accommodation_transport_consent':
        return this.createAccommodationTransportConsentTemplate(formData);
      case 'beneficiary_declaration':
        return this.createBeneficiaryDeclarationTemplate(formData);
      case 'non_disclosure_agreement':
        return this.createNonDisclosureAgreementTemplate(formData);
      default:
        return this.createGenericFormTemplate(formType, formData);
    }
  }

  // Create empty form template when no data is available
  private static createEmptyFormTemplate(formType: string, organizationName = 'Acero Building Systems', logoUrl?: string): string {
    const formTitle = formType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; background: white; font-family: 'Arial', sans-serif;">
        ${this.createHeader(organizationName, logoUrl)}
        <div style="margin-bottom: 30px; text-align: center; padding: 40px; border: 2px dashed #e5e7eb; border-radius: 10px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px;">${formTitle}</h2>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">No form data available to generate PDF</p>
          <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">Please ensure the form has been properly submitted with data.</p>
        </div>
        ${this.createFooter()}
      </div>
    `;
  }

  // Enhanced Manpower Requisition Template with actual data validation
  private static createManpowerRequisitionTemplate(data: any): string {
    // Validate that we have actual data
    if (!data || typeof data !== 'object') {
      return this.createEmptyFormTemplate('manpower_requisition');
    }

    // Extract form data - handle nested structure if needed
    const formData = data.formData || data;
    
    return `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          MANPOWER REQUISITION FORM (ABS/HR/N/F01)
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">MR Number:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.mrNumber || formData.requestId || 'Auto-generated'}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Date:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.requestDate ? new Date(formData.requestDate).toLocaleDateString() : new Date().toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Department:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${this.getDisplayValue(formData.department)}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Location:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${this.getDisplayValue(formData.location || formData.workLocation)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Position Title:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.positionTitle || formData.requestedPosition || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">No. of Positions:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.numberOfPositions || formData.noOfPositions || '1'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Employment Type:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.employmentType || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Urgency:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.urgency || formData.priority || 'Normal'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Reporting To:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${this.getDisplayValue(formData.reportingTo)}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Expected Join Date:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.expectedJoinDate ? new Date(formData.expectedJoinDate).toLocaleDateString() : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Requested By:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${this.getDisplayValue(formData.requestedBy)}</td>
            <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Vacancy Reason:</td>
            <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.vacancyReason || 'N/A'}</td>
          </tr>
        </table>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Job Description & Requirements</h3>
          <p style="margin-bottom: 10px;"><strong>Job Description:</strong></p>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb; margin-bottom: 15px; min-height: 60px;">
            ${formData.jobDescription || 'N/A'}
          </div>
          
          <p style="margin-bottom: 10px;"><strong>Required Qualifications:</strong></p>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb; margin-bottom: 15px; min-height: 60px;">
            ${formData.requiredQualifications || formData.qualifications || 'N/A'}
          </div>

          <p style="margin-bottom: 10px;"><strong>Preferred Qualifications:</strong></p>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb; min-height: 60px;">
            ${formData.preferredQualifications || formData.preferredSkills || 'N/A'}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Budget Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 50%;">Budget Allocated:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.budgetAllocated || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Salary Range:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${formData.salaryRange || formData.expectedSalary || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Justification</h3>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb; min-height: 60px;">
            ${formData.justification || formData.businessJustification || 'N/A'}
          </div>
        </div>
      </div>
    `;
  }

  // Candidate Information Template
  private static createCandidateInformationTemplate(data: any): string {
    return `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          CANDIDATE INFORMATION FORM (ABS/HR/C/F02)
        </h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Personal Information</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Full Name:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.fullName || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Date of Birth:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Nationality:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.nationality || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Gender:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.gender || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Marital Status:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.maritalStatus || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Religion:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.religion || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Contact Information</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Email:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.email || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Phone:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Address:</td>
              <td colspan="3" style="padding: 8px; border: 1px solid #d1d5db;">${data.currentAddress || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Position Applied For</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Position:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.positionApplied || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Department:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.department?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Expected Salary:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.expectedSalary || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Notice Period:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.noticePeriod || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Educational Background</h3>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb;">
            ${data.education || 'N/A'}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Work Experience</h3>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb;">
            ${data.workExperience || 'N/A'}
          </div>
        </div>
      </div>
    `;
  }

  // Business Trip Request Template
  private static createBusinessTripRequestTemplate(data: any): string {
    return `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          BUSINESS TRIP REQUEST FORM (ABS/HR/N/F12)
        </h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Trip Information</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Employee Name:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.employeeName || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">Employee ID:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.employeeId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Department:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.department?.name || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Designation:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.designation || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Destination:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.destination || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Trip Type:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.tripType || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Start Date:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">End Date:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Purpose & Objectives</h3>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb; margin-bottom: 15px;">
            <strong>Purpose of Trip:</strong><br>
            ${data.purpose || 'N/A'}
          </div>
          <div style="border: 1px solid #d1d5db; padding: 10px; background-color: #f9fafb;">
            <strong>Expected Outcomes:</strong><br>
            ${data.expectedOutcomes || 'N/A'}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Budget Estimate</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 50%;">Transportation:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.transportationCost || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Accommodation:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.accommodationCost || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Daily Allowance:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.dailyAllowance || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold;">Other Expenses:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${data.otherExpenses || 'N/A'}</td>
            </tr>
            <tr style="border-top: 2px solid #374151;">
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #1f2937; color: white; font-weight: bold;">Total Estimated Cost:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #1f2937; color: white; font-weight: bold;">${data.totalEstimatedCost || 'N/A'}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  // Generic template for other form types
  private static createGenericFormTemplate(formType: string, data: any): string {
    const formTitle = formType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          ${formTitle}
        </h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Form Data</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${Object.entries(data).map(([key, value]) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db; background-color: #f9fafb; font-weight: bold; width: 30%;">
                  ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">
                  ${this.formatFieldValue(value)}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    `;
  }

  // Create additional templates for other form types
  private static createNewEmployeeJoiningTemplate(data: any): string {
    return this.createGenericFormTemplate('new_employee_joining', data);
  }

  private static createAssetsITAccessTemplate(data: any): string {
    return this.createGenericFormTemplate('assets_it_access', data);
  }

  private static createEmployeeInformationTemplate(data: any): string {
    return this.createGenericFormTemplate('employee_information', data);
  }

  private static createAccommodationTransportConsentTemplate(data: any): string {
    return this.createGenericFormTemplate('accommodation_transport_consent', data);
  }

  private static createBeneficiaryDeclarationTemplate(data: any): string {
    return this.createGenericFormTemplate('beneficiary_declaration', data);
  }

  private static createNonDisclosureAgreementTemplate(data: any): string {
    return this.createGenericFormTemplate('non_disclosure_agreement', data);
  }

  // Create submission info section
  private static createSubmissionInfo(submittedBy?: any, submissionDate?: Date): string {
    if (!submittedBy && !submissionDate) return '';

    return `
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 5px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Submission Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${submittedBy ? `
            <tr>
              <td style="padding: 5px; font-weight: bold; width: 30%;">Submitted By:</td>
              <td style="padding: 5px;">${submittedBy.displayName || submittedBy.name || 'N/A'}</td>
            </tr>
          ` : ''}
          ${submissionDate ? `
            <tr>
              <td style="padding: 5px; font-weight: bold;">Submission Date:</td>
              <td style="padding: 5px;">${new Date(submissionDate).toLocaleString()}</td>
            </tr>
          ` : ''}
        </table>
      </div>
    `;
  }

  // Create approval section
  private static createApprovalSection(approvalHistory?: any[]): string {
    if (!approvalHistory || approvalHistory.length === 0) return '';

    return `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Approval History</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Step</th>
              <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Approver</th>
              <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Status</th>
              <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Date</th>
              <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Comments</th>
            </tr>
          </thead>
          <tbody>
            ${approvalHistory.map((approval, index) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${approval.stepName || `Step ${index + 1}`}</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${approval.approverName || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">
                  <span style="padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; 
                    ${approval.status === 'approved' ? 'background-color: #d1fae5; color: #065f46;' :
                      approval.status === 'rejected' ? 'background-color: #fee2e2; color: #991b1b;' :
                      'background-color: #fef3c7; color: #92400e;'}">
                    ${approval.status ? approval.status.toUpperCase() : 'PENDING'}
                  </span>
                </td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">
                  ${approval.actionDate ? new Date(approval.actionDate).toLocaleDateString() : 'N/A'}
                </td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${approval.comments || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Create footer section
  private static createFooter(): string {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">This document was generated automatically by the HRMS system on ${new Date().toLocaleString()}</p>
        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Acero Building Systems. All rights reserved.</p>
      </div>
    `;
  }

  // Helper method to format field values
  private static formatFieldValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.title) return value.title;
      if (Array.isArray(value)) return value.join(', ');
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Likely a date string
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    return String(value);
  }
}

export default HRMSPDFGenerator;