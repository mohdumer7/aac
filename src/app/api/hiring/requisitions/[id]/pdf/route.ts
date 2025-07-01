import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ManpowerRequisition from "@/models/hiring/ManpowerRequisition.model";
import { connectToDB } from "@/lib/mongoose";
import PDFDocument from "pdfkit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const requisitionId = params.id;

    // Connect to database
    await connectToDB();

    // Fetch requisition with populated references
    const requisition = await ManpowerRequisition.findById(requisitionId)
      .populate("requestedBy", "firstName lastName displayName email")
      .populate("department", "name")
      .populate("departmentHeadApproval.approvedBy", "firstName lastName displayName")
      .populate("hrAdminReview.approvedBy", "firstName lastName displayName")
      .populate("financeApproval.approvedBy", "firstName lastName displayName")
      .populate("hrHeadApproval.approvedBy", "firstName lastName displayName")
      .populate("cfoApproval.approvedBy", "firstName lastName displayName")
      .populate("ceoApproval.approvedBy", "firstName lastName displayName");

    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      );
    }

    // Create a PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    // Collect PDF data chunks
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    // Generate PDF content
    generatePDF(doc, requisition);

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    return new Promise<NextResponse>((resolve) => {
      doc.on("end", () => {
        // Combine chunks into a single buffer
        const pdfBuffer = Buffer.concat(chunks);

        // Create response with PDF data
        const response = new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Requisition_${requisitionId}.pdf"`,
          },
        });

        resolve(response);
      });
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

// Helper function to generate PDF content
function generatePDF(doc: PDFKit.PDFDocument, requisition: any) {
  // Add company logo
  // doc.image("public/images/logo.png", 50, 50, { width: 150 });
  
  // Add title
  doc.fontSize(18).text("MANPOWER REQUISITION FORM", { align: "center" });
  doc.moveDown();
  
  // Section: Request Information
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("Request Information", { align: "center" })
    .moveDown(0.5);
  
  // Create a table-like structure
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidth = 250;
  const rowHeight = 25;
  
  // Draw table borders
  doc.rect(tableLeft, tableTop, colWidth, rowHeight).stroke();
  doc.rect(tableLeft + colWidth, tableTop, colWidth, rowHeight).stroke();
  doc.rect(tableLeft, tableTop + rowHeight, colWidth, rowHeight).stroke();
  doc.rect(tableLeft + colWidth, tableTop + rowHeight, colWidth, rowHeight).stroke();
  
  // Add row headers
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Requested by (Name)", tableLeft + 5, tableTop + 7)
    .text("Date", tableLeft + colWidth + 5, tableTop + 7)
    .text("Department", tableLeft + 5, tableTop + rowHeight + 7)
    .text("Requested Position", tableLeft + colWidth + 5, tableTop + rowHeight + 7);
  
  // Add row values
  const requesterName = requisition.requestedBy ? 
    (requisition.requestedBy.displayName || `${requisition.requestedBy.firstName} ${requisition.requestedBy.lastName}`) : 
    "N/A";
  
  const requestDate = requisition.requestDate ? 
    new Date(requisition.requestDate).toLocaleDateString() : 
    "N/A";
  
  const department = requisition.department ? requisition.department.name : "N/A";
  
  doc
    .fontSize(10)
    .text(requesterName, tableLeft + 120, tableTop + 7, { align: "right" })
    .text(requestDate, tableLeft + colWidth + 120, tableTop + 7, { align: "right" })
    .text(department, tableLeft + 120, tableTop + rowHeight + 7, { align: "right" })
    .text(requisition.requestedPosition || "N/A", tableLeft + colWidth + 120, tableTop + rowHeight + 7, { align: "right" });
  
  doc.moveDown(2);
  
  // Section: Position Information
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("Position Information", { align: "center" })
    .moveDown(0.5);
  
  // Vacancy Reason
  const vacancyReasonY = doc.y;
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Vacancy Reason:", tableLeft, vacancyReasonY);
  
  const checkboxSize = 12;
  const checkboxSpacing = 5;
  
  // Draw checkboxes for vacancy reason
  doc
    .rect(tableLeft + 100, vacancyReasonY, checkboxSize, checkboxSize)
    .stroke();
  doc
    .rect(tableLeft + 250, vacancyReasonY, checkboxSize, checkboxSize)
    .stroke();
  
  // Fill checkbox based on selection
  if (requisition.vacancyReason === "New Position") {
    doc
      .rect(tableLeft + 100, vacancyReasonY, checkboxSize, checkboxSize)
      .fill();
  } else if (requisition.vacancyReason === "Replacement") {
    doc
      .rect(tableLeft + 250, vacancyReasonY, checkboxSize, checkboxSize)
      .fill();
  }
  
  doc
    .text("New Position", tableLeft + 100 + checkboxSize + checkboxSpacing, vacancyReasonY)
    .text("Replacement", tableLeft + 250 + checkboxSize + checkboxSpacing, vacancyReasonY);
  
  doc.moveDown();
  
  // New Position Budgeting
  const budgetingY = doc.y;
  doc
    .text("New Position:", tableLeft, budgetingY);
  
  // Draw checkboxes for budgeted
  doc
    .rect(tableLeft + 100, budgetingY, checkboxSize, checkboxSize)
    .stroke();
  doc
    .rect(tableLeft + 250, budgetingY, checkboxSize, checkboxSize)
    .stroke();
  
  // Fill checkbox based on selection
  if (requisition.isNewPositionBudgeted) {
    doc
      .rect(tableLeft + 100, budgetingY, checkboxSize, checkboxSize)
      .fill();
  }
  
  if (requisition.nonBudgeted) {
    doc
      .rect(tableLeft + 250, budgetingY, checkboxSize, checkboxSize)
      .fill();
  }
  
  doc
    .text("Budgeted", tableLeft + 100 + checkboxSize + checkboxSpacing, budgetingY)
    .text("Non-Budgeted", tableLeft + 250 + checkboxSize + checkboxSpacing, budgetingY);
  
  doc.moveDown();
  
  // Vacant Positions Count
  doc
    .text(`No of Vacant Positions: ${requisition.vacantPositionsCount || 1}`, tableLeft + 350, budgetingY);
  
  doc.moveDown();
  
  // Previous Employee Details
  if (requisition.vacancyReason === "Replacement") {
    doc
      .fontSize(10)
      .text("Previous Employee Details:", tableLeft, doc.y)
      .moveDown(0.5);
    
    const prevEmployeeTable = {
      top: doc.y,
      rowHeight: 25,
      cols: [
        { title: "EMP Name", value: requisition.previousEmployeeName || "N/A" },
        { title: "EMP No", value: requisition.previousEmployeeId || "N/A" },
        { title: "Designation", value: requisition.previousEmployeeDesignation || "N/A" }
      ]
    };
    
    // Draw first row
    doc
      .rect(tableLeft, prevEmployeeTable.top, colWidth, prevEmployeeTable.rowHeight)
      .stroke()
      .rect(tableLeft + colWidth, prevEmployeeTable.top, colWidth, prevEmployeeTable.rowHeight)
      .stroke();
    
    // Add titles and values
    doc
      .text(prevEmployeeTable.cols[0].title, tableLeft + 5, prevEmployeeTable.top + 7)
      .text(prevEmployeeTable.cols[0].value, tableLeft + 80, prevEmployeeTable.top + 7)
      .text(prevEmployeeTable.cols[1].title, tableLeft + colWidth + 5, prevEmployeeTable.top + 7)
      .text(prevEmployeeTable.cols[1].value, tableLeft + colWidth + 80, prevEmployeeTable.top + 7);
    
    // Draw second row
    const secondRowY = prevEmployeeTable.top + prevEmployeeTable.rowHeight;
    doc
      .rect(tableLeft, secondRowY, colWidth, prevEmployeeTable.rowHeight)
      .stroke()
      .rect(tableLeft + colWidth, secondRowY, colWidth, prevEmployeeTable.rowHeight)
      .stroke();
    
    // Add titles and values for second row
    doc
      .text("Department", tableLeft + 5, secondRowY + 7)
      .text(requisition.previousEmployeeDepartment || "N/A", tableLeft + 80, secondRowY + 7)
      .text("DOE", tableLeft + colWidth + 5, secondRowY + 7)
      .text(
        requisition.previousEmployeeDOE 
          ? new Date(requisition.previousEmployeeDOE).toLocaleDateString() 
          : "N/A", 
        tableLeft + colWidth + 80, 
        secondRowY + 7
      );
    
    // Draw third row
    const thirdRowY = secondRowY + prevEmployeeTable.rowHeight;
    doc
      .rect(tableLeft, thirdRowY, colWidth, prevEmployeeTable.rowHeight)
      .stroke()
      .rect(tableLeft + colWidth, thirdRowY, colWidth, prevEmployeeTable.rowHeight)
      .stroke();
    
    // Add titles and values for third row
    doc
      .text(prevEmployeeTable.cols[2].title, tableLeft + 5, thirdRowY + 7)
      .text(prevEmployeeTable.cols[2].value, tableLeft + 80, thirdRowY + 7)
      .text("Salary", tableLeft + colWidth + 5, thirdRowY + 7)
      .text(
        requisition.previousEmployeeSalary 
          ? requisition.previousEmployeeSalary.toString() 
          : "N/A", 
        tableLeft + colWidth + 80, 
        thirdRowY + 7
      );
    
    doc.moveDown(2);
  }
  
  // Candidate Information
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("Candidate Information", { align: "center" })
    .moveDown(0.5);
  
  const candidateTable = {
    top: doc.y,
    rowHeight: 25
  };
  
  // Draw first row
  doc
    .rect(tableLeft, candidateTable.top, colWidth, candidateTable.rowHeight)
    .stroke()
    .rect(tableLeft + colWidth, candidateTable.top, colWidth, candidateTable.rowHeight)
    .stroke();
  
  // Add titles and values
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Selected Candidate Name", tableLeft + 5, candidateTable.top + 7)
    .text(requisition.selectedCandidateName || "N/A", tableLeft + 150, candidateTable.top + 7)
    .text("Expected Date of Joining", tableLeft + colWidth + 5, candidateTable.top + 7)
    .text(
      requisition.expectedJoiningDate 
        ? new Date(requisition.expectedJoiningDate).toLocaleDateString() 
        : "N/A", 
      tableLeft + colWidth + 150, 
      candidateTable.top + 7
    );
  
  // Draw second row
  const candidateSecondRow = candidateTable.top + candidateTable.rowHeight;
  doc
    .rect(tableLeft, candidateSecondRow, colWidth, candidateTable.rowHeight)
    .stroke()
    .rect(tableLeft + colWidth, candidateSecondRow, colWidth, candidateTable.rowHeight)
    .stroke();
  
  // Add titles and values
  doc
    .text("Designation", tableLeft + 5, candidateSecondRow + 7)
    .text(requisition.designation || "N/A", tableLeft + 150, candidateSecondRow + 7)
    .text("Proposed Salary", tableLeft + colWidth + 5, candidateSecondRow + 7)
    .text(
      requisition.proposedSalary 
        ? requisition.proposedSalary.toString() 
        : "N/A", 
      tableLeft + colWidth + 150, 
      candidateSecondRow + 7
    );
  
  // Draw third row for benefits
  const candidateThirdRow = candidateSecondRow + candidateTable.rowHeight;
  doc
    .rect(tableLeft, candidateThirdRow, colWidth * 2, candidateTable.rowHeight)
    .stroke();
  
  doc
    .text("Benefits", tableLeft + 5, candidateThirdRow + 7)
    .text(requisition.benefits || "N/A", tableLeft + 150, candidateThirdRow + 7);
  
  doc.moveDown(2);
  
  // Department Head Approval
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("Department Head Approval", { align: "center" })
    .moveDown(0.5);
  
  // Candidate Type
  const candidateTypeY = doc.y;
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Internal Candidate", tableLeft, candidateTypeY);
  
  // Draw checkboxes for candidate type
  doc
    .rect(tableLeft + 100, candidateTypeY, checkboxSize, checkboxSize)
    .stroke();
  
  doc
    .rect(tableLeft + 200, candidateTypeY, checkboxSize, checkboxSize)
    .stroke();
  
  doc
    .rect(tableLeft + 350, candidateTypeY, checkboxSize, checkboxSize)
    .stroke();
  
  // Fill checkbox based on selection
  if (requisition.candidateType === "Internal") {
    doc
      .rect(tableLeft + 100, candidateTypeY, checkboxSize, checkboxSize)
      .fill();
  } else if (requisition.candidateType === "External") {
    doc
      .rect(tableLeft + 200, candidateTypeY, checkboxSize, checkboxSize)
      .fill();
  } else if (requisition.candidateType === "Foreign Recruitment") {
    doc
      .rect(tableLeft + 350, candidateTypeY, checkboxSize, checkboxSize)
      .fill();
  }
  
  doc
    .text("Internal Candidate", tableLeft + 100 + checkboxSize + checkboxSpacing, candidateTypeY)
    .text("External Candidate", tableLeft + 200 + checkboxSize + checkboxSpacing, candidateTypeY)
    .text("Foreign Recruitment", tableLeft + 350 + checkboxSize + checkboxSpacing, candidateTypeY);
  
  doc.moveDown(1);
  
  // Remarks
  doc
    .text("Remarks:", tableLeft, doc.y)
    .moveDown(0.5);
  
  doc
    .rect(tableLeft, doc.y, colWidth * 2, 40)
    .stroke();
  
  doc
    .text(requisition.remarks || "N/A", tableLeft + 5, doc.y + 5);
  
  doc.moveDown(3);
  
  // Signature
  const signatureY = doc.y;
  doc
    .text("Department Head Sign:", tableLeft, signatureY)
    .text("Date:", tableLeft + 300, signatureY);
  
  doc
    .moveTo(tableLeft + 120, signatureY + 15)
    .lineTo(tableLeft + 250, signatureY + 15)
    .stroke();
  
  doc
    .moveTo(tableLeft + 330, signatureY + 15)
    .lineTo(tableLeft + 450, signatureY + 15)
    .stroke();
  
  doc.moveDown(2);
  
  // HR/ADMIN Review
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("HR/ADMIN Review", { align: "center" })
    .moveDown(0.5);
  
  // Draw table
  const hrTableTop = doc.y;
  doc
    .rect(tableLeft, hrTableTop, 100, rowHeight)
    .stroke()
    .rect(tableLeft + 100, hrTableTop, 150, rowHeight)
    .stroke()
    .rect(tableLeft + 250, hrTableTop, 100, rowHeight)
    .stroke()
    .rect(tableLeft + 350, hrTableTop, 150, rowHeight)
    .stroke();
  
  // Headers
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Position", tableLeft + 5, hrTableTop + 7)
    .text("Budgeted (Y/N)", tableLeft + 100 + 5, hrTableTop + 7)
    .text("Actual Head Count", tableLeft + 250 + 5, hrTableTop + 7)
    .text("Variance", tableLeft + 350 + 5, hrTableTop + 7);
  
  // Values
  const hrReview = requisition.hrAdminReview || {};
  doc
    .rect(tableLeft, hrTableTop + rowHeight, 100, rowHeight)
    .stroke()
    .rect(tableLeft + 100, hrTableTop + rowHeight, 150, rowHeight)
    .stroke()
    .rect(tableLeft + 250, hrTableTop + rowHeight, 100, rowHeight)
    .stroke()
    .rect(tableLeft + 350, hrTableTop + rowHeight, 150, rowHeight)
    .stroke();
  
  doc
    .text(hrReview.position || "", tableLeft + 5, hrTableTop + rowHeight + 7)
    .text(hrReview.budgeted ? "Y" : "N", tableLeft + 100 + 5, hrTableTop + rowHeight + 7)
    .text(hrReview.actualHeadCount?.toString() || "", tableLeft + 250 + 5, hrTableTop + rowHeight + 7)
    .text(hrReview.variance?.toString() || "", tableLeft + 350 + 5, hrTableTop + rowHeight + 7);
  
  doc.moveDown(3);
  
  // HR signature
  const hrSignatureY = doc.y;
  doc
    .text("HR/ADMIN Sign:", tableLeft, hrSignatureY)
    .text("Date:", tableLeft + 300, hrSignatureY);
  
  doc
    .moveTo(tableLeft + 100, hrSignatureY + 15)
    .lineTo(tableLeft + 250, hrSignatureY + 15)
    .stroke();
  
  doc
    .moveTo(tableLeft + 330, hrSignatureY + 15)
    .lineTo(tableLeft + 450, hrSignatureY + 15)
    .stroke();
  
  doc.moveDown(2);
  
  // Approvals
  doc
    .fontSize(12)
    .fillColor("#0066cc")
    .text("APPROVALS", { align: "center" })
    .moveDown(0.5);
  
  // Draw approvals table
  const approvalsTableTop = doc.y;
  doc
    .rect(tableLeft, approvalsTableTop, 125, rowHeight)
    .stroke()
    .rect(tableLeft + 125, approvalsTableTop, 125, rowHeight)
    .stroke()
    .rect(tableLeft + 250, approvalsTableTop, 125, rowHeight)
    .stroke()
    .rect(tableLeft + 375, approvalsTableTop, 125, rowHeight)
    .stroke();
  
  // Headers
  doc
    .fontSize(10)
    .fillColor("#000")
    .text("Finance Department", tableLeft + 5, approvalsTableTop + 7)
    .text("HEAD OF HR/ADMIN", tableLeft + 125 + 5, approvalsTableTop + 7)
    .text("COO/CFO", tableLeft + 250 + 5, approvalsTableTop + 7)
    .text("C.E.O", tableLeft + 375 + 5, approvalsTableTop + 7);
  
  // Subheader
  doc
    .fontSize(8)
    .text("Manpower Budget confirmation", tableLeft + 5, approvalsTableTop + 20);
  
  // Draw signature boxes
  doc
    .rect(tableLeft, approvalsTableTop + rowHeight, 125, 100)
    .stroke()
    .rect(tableLeft + 125, approvalsTableTop + rowHeight, 125, 100)
    .stroke()
    .rect(tableLeft + 250, approvalsTableTop + rowHeight, 125, 100)
    .stroke()
    .rect(tableLeft + 375, approvalsTableTop + rowHeight, 125, 100)
    .stroke();
  
  // Add approval status if available
  doc.fontSize(10);
  
  // Finance approval status
  if (requisition.financeApproval?.approved) {
    doc
      .text("APPROVED", tableLeft + 30, approvalsTableTop + rowHeight + 40, { align: "center" })
      .text(
        requisition.financeApproval.approvalDate 
          ? new Date(requisition.financeApproval.approvalDate).toLocaleDateString() 
          : "", 
        tableLeft + 30, 
        approvalsTableTop + rowHeight + 60, 
        { align: "center" }
      );
  }
  
  // HR Head approval status
  if (requisition.hrHeadApproval?.approved) {
    doc
      .text("APPROVED", tableLeft + 125 + 30, approvalsTableTop + rowHeight + 40, { align: "center" })
      .text(
        requisition.hrHeadApproval.approvalDate 
          ? new Date(requisition.hrHeadApproval.approvalDate).toLocaleDateString() 
          : "", 
        tableLeft + 125 + 30, 
        approvalsTableTop + rowHeight + 60, 
        { align: "center" }
      );
  }
  
  // CFO approval status
  if (requisition.cfoApproval?.approved) {
    doc
      .text("APPROVED", tableLeft + 250 + 30, approvalsTableTop + rowHeight + 40, { align: "center" })
      .text(
        requisition.cfoApproval.approvalDate 
          ? new Date(requisition.cfoApproval.approvalDate).toLocaleDateString() 
          : "", 
        tableLeft + 250 + 30, 
        approvalsTableTop + rowHeight + 60, 
        { align: "center" }
      );
  }
  
  // CEO approval status
  if (requisition.ceoApproval?.approved) {
    doc
      .text("APPROVED", tableLeft + 375 + 30, approvalsTableTop + rowHeight + 40, { align: "center" })
      .text(
        requisition.ceoApproval.approvalDate 
          ? new Date(requisition.ceoApproval.approvalDate).toLocaleDateString() 
          : "", 
        tableLeft + 375 + 30, 
        approvalsTableTop + rowHeight + 60, 
        { align: "center" }
      );
  }
  
  // Add footer with document reference
  doc
    .fontSize(8)
    .text(`ABS-HR/N: F01 C (25/04/2023) V.1`, tableLeft, 750);
} 