import { NextRequest, NextResponse } from 'next/server';
import * as approvalFlowManager from '../../../server/managers/approvalFlowManager';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../configs/authOptions';
import { dbConnect } from '../../../lib/mongoose'; // Ensure this path is correct
import { ERROR, SUCCESS, UNAUTHORIZED_ACCESS, INVALID_REQUEST, RESOURCE_NOT_FOUND, INSUFFIENT_DATA } from '../../../shared/constants';

/**
 * Handles GET requests for approval flows.
 * Fetches a list of flows or a single flow by ID.
 * @param request - The NextRequest object.
 * @returns A NextResponse with the approval flow(s) or an error.
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect(); // Ensure DB connection
    const session = await getServerSession(authOptions);
    // TEMPORARY: Modified authorization for testing core approval flow
    if (!session || !session.user || !session.user._id) {
      return NextResponse.json({ status: ERROR, message: UNAUTHORIZED_ACCESS + ' (User ID check only)', data: null }, { status: 401 });
    }
    const userId = session.user._id.toString();
    // companyId is no longer passed to manager functions for these specific operations

    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('id');

    let result;
    if (flowId) {
      // Fetch a single approval flow by ID
      result = await approvalFlowManager.getApprovalFlowById(flowId!);
      if (result.status === SUCCESS && !result.data) {
        // If manager returns success but no data, it means not found
        return NextResponse.json({ status: ERROR, message: RESOURCE_NOT_FOUND, data: null }, { status: 404 });
      }
    } else {
      // Fetch a list of approval flows with query parameters
      const queryParams: any = {};
      searchParams.forEach((value, key) => {
        // Sanitize/validate query params as needed
        queryParams[key] = value;
      });
      // Add createdBy to queryParams if you want to filter by user, e.g., queryParams.createdBy = userId;
      // For now, getApprovalFlows will fetch based on its own internal logic or other query params.
      result = await approvalFlowManager.getApprovalFlows(queryParams);
    }

    if (result.status === SUCCESS) {
      return NextResponse.json(result, { status: 200 });
    }
    // Handle specific error messages from manager if needed, e.g., for NOT_FOUND
    const statusCode = result.message === RESOURCE_NOT_FOUND ? 404 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error: any) {
    console.error('[API /api/approval-flow GET] Error:', error);
    return NextResponse.json({ status: ERROR, message: error.message || 'Internal Server Error', data: null }, { status: 500 });
  }
}

/**
 * Handles POST requests for creating, updating, or deleting approval flows.
 * The operation is determined by the 'action' field in the request body.
 * @param request - The NextRequest object.
 * @returns A NextResponse with the result of the operation.
 */
export async function POST(request: NextRequest) {
  let body: any; // Declare body here for broader scope in catch block
  try {
    await dbConnect(); // Ensure DB connection
    const session = await getServerSession(authOptions);
    // TEMPORARY: Modified authorization for testing core approval flow
    if (!session || !session.user || !session.user._id) {
      return NextResponse.json({ status: ERROR, message: UNAUTHORIZED_ACCESS + ' (User ID check only)', data: null }, { status: 401 });
    }
    const userId = session.user._id.toString();
    // companyId is no longer passed to manager functions for update/delete

    body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({ status: ERROR, message: INSUFFIENT_DATA, data: null }, { status: 400 });
    }

    let result;

    switch (action.toLowerCase()) {
      case 'create':
        const { flowName, description, flowDefinition, departmentId } = data;
        if (!flowName || !flowDefinition) {
          return NextResponse.json({ status: ERROR, message: 'Flow name and definition are required for creation.', data: null }, { status: 400 });
        }
        result = await approvalFlowManager.createApprovalFlow(
          { flowName, description, flowDefinition, departmentId, createdBy: userId }
        );
        break;

      case 'update':
        try {
          const { _id: updateId, ...updatePayload } = data;
          if (!updateId) {
            console.error('Update error: Missing flow ID');
            return NextResponse.json({ status: ERROR, message: 'Flow ID (_id) is required for update.', data: null }, { status: 400 });
          }
          
          console.log('=== UPDATE REQUEST ===');
          console.log('Updating approval flow with ID:', updateId);
          console.log('Full update payload:', JSON.stringify(updatePayload, null, 2));
          
          // Extract the actual update data from the payload
          const updateData = { ...updatePayload.data } || {};
          
          // Log department ID specifically
          console.log('Department ID in update data:', updateData.departmentId);
          console.log('Department ID type:', typeof updateData.departmentId);
          
          // Ensure departmentId is properly handled
          if (updateData.departmentId === '') {
            // If empty string, set to null to unset the department
            updateData.departmentId = null;
          }
          
          // Log the flowDefinition structure if it exists
          if (updateData.flowDefinition) {
            console.log('Flow definition type:', typeof updateData.flowDefinition);
            if (typeof updateData.flowDefinition === 'string') {
              console.log('Flow definition is a string, parsing to object for logging');
              try {
                const parsedFlow = JSON.parse(updateData.flowDefinition);
                console.log('Parsed flow definition structure:', {
                  hasNodes: Array.isArray(parsedFlow.nodes),
                  nodesCount: parsedFlow.nodes?.length,
                  hasEdges: Array.isArray(parsedFlow.edges),
                  edgesCount: parsedFlow.edges?.length
                });
              } catch (e) {
                console.error('Error parsing flow definition:', e);
              }
            } else if (typeof updateData.flowDefinition === 'object') {
              console.log('Flow definition structure:', {
                hasNodes: Array.isArray(updateData.flowDefinition.nodes),
                nodesCount: updateData.flowDefinition.nodes?.length,
                hasEdges: Array.isArray(updateData.flowDefinition.edges),
                edgesCount: updateData.flowDefinition.edges?.length
              });
            }
          }
          
          // Call the manager to update the approval flow with the extracted data
          result = await approvalFlowManager.updateApprovalFlow(updateId, updateData);
          console.log('Update result from manager:', JSON.stringify(result, null, 2));
          
          // Handle the response from the manager
          if (result.status === 'SUCCESS' || result.status === 'Success') {
            // Always return the result as-is, since it already has the correct format
            return NextResponse.json({
              status: 'Success',
              message: result.message || 'Approval flow updated successfully',
              data: result.data || null
            }, { status: 200 });
          }
          
          // If we get here, there was an error
          console.error('Update failed with result:', result);
          return NextResponse.json({
            status: 'Error',
            message: result.message || 'Failed to update approval flow',
            data: result.data || null
          }, { status: 400 });
          
        } catch (error) {
          console.error('Error in update case:', error);
          return NextResponse.json({ 
            status: ERROR, 
            message: error instanceof Error ? error.message : 'Failed to update approval flow',
            error: error instanceof Error ? error.stack : String(error)
          }, { status: 500 });
        }
        break;

      case 'delete':
        const { _id: deleteId } = data;
        if (!deleteId) {
          return NextResponse.json({ status: ERROR, message: 'Flow ID (_id) is required for delete.', data: null }, { status: 400 });
        }
        result = await approvalFlowManager.deleteApprovalFlow(deleteId);
        break;

      default:
        return NextResponse.json({ status: ERROR, message: INVALID_REQUEST, data: null }, { status: 400 });
    }

    if (result.status === SUCCESS) {
      const statusCode = action.toLowerCase() === 'create' ? 201 : 200;
      return NextResponse.json(result, { status: statusCode });
    }
    
    const errorStatusCode = result.message === RESOURCE_NOT_FOUND ? 404 : 400;
    return NextResponse.json(result, { status: errorStatusCode });

  } catch (error: any) {
    console.error(`[API /api/approval-flow POST, Action: ${body?.action}] Error:`, error);
    // Check for JSON parsing errors specifically if body might be malformed
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ status: ERROR, message: 'Invalid JSON payload.', data: null }, { status: 400 });
    }
    return NextResponse.json({ status: ERROR, message: error.message || 'Internal Server Error', data: null }, { status: 500 });
  }
}
