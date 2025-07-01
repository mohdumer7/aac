"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateApprovalFlowPayload, UpdateApprovalFlowPayload } from '@/services/endpoints/approvalFlowApi';
import { IApprovalFlow, IFlowDefinition, IFlowNode, IFlowEdge, IFlowNodeData } from '@/models/approvals/ApprovalFlow.model';

// Type for approval flow with a required _id
interface ApprovalFlowWithId extends IApprovalFlow {
  _id: string;
}
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { useGetUsersForFlowQuery, UserForFlow } from '@/services/endpoints/usersApi';

// Define props for the custom node component
interface CustomNodeProps {
  id: string;
  data: any;
  selected?: boolean;
  onDelete: (id: string) => void;
}

// Custom node component with delete button and connection handles
const CustomNode = React.memo<CustomNodeProps>(({ id, data, selected, onDelete }) => (
  <div 
    className="relative group"
    style={{ 
      minWidth: '120px',
      position: 'relative',
      zIndex: 1,
    }}
  >
    <div className="px-3 py-2 text-sm font-medium text-gray-800 truncate">
      {data.label}
    </div>
    <button
      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(id);
      }}
      title="Remove from flow"
    >
      ×
    </button>
  </div>
));

import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Connection,
  addEdge,
  ReactFlowInstance,
  NodeTypes,
  EdgeTypes,
  Position,
  MarkerType,
  getSmoothStepPath,
  useReactFlow,
  Panel,
  useStoreApi,
  useNodesInitialized,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';

import { department } from '@/types/master/department.types';

// Type for the form's department representation
type FormDepartment = Omit<department, '_id'> & {
  _id: string;
};

interface ApprovalFlowFormProps {
  onSubmit: (data: CreateApprovalFlowPayload | Omit<UpdateApprovalFlowPayload, '_id'>) => void;
  initialData: ApprovalFlowWithId | null;
  onCancel: () => void;
  isLoading?: boolean;
  departments: FormDepartment[];
  isLoadingDepartments?: boolean;
}

const ApprovalFlowForm: React.FC<ApprovalFlowFormProps> = ({ 
  onSubmit, 
  initialData, 
  onCancel, 
  isLoading = false,
  departments,
  isLoadingDepartments = false
}) => {
  // Form state
  const [flowName, setFlowName] = useState(initialData?.flowName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // React Flow state with proper typing
  type ReactFlowNode = Node<IFlowNodeData>;
  type ReactFlowEdge = Edge<IFlowEdge>;
  
  const [nodes, setNodes, onNodesChange] = useNodesState<IFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<IFlowEdge>([]);
  
  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    // Also remove connected edges
    setEdges((eds) => 
      eds.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
    );
  }, [setNodes, setEdges]);

  // Define node types with custom node component
  const nodeTypes = useMemo(() => ({
    default: (props: NodeProps) => {
      return (
        <div style={{ position: 'relative' }}>
          <CustomNode 
            id={props.id} 
            data={props.data} 
            selected={props.selected} 
            onDelete={handleNodeDelete} 
          />
          {/* Connection handles for React Flow */}
          <Handle 
            type="source" 
            position={Position.Right} 
            id="source"
            style={{
              width: 10,
              height: 10,
              backgroundColor: '#3b82f6',
              border: '2px solid #fff',
              right: -5,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="target"
            style={{
              width: 10,
              height: 10,
              backgroundColor: '#3b82f6',
              border: '2px solid #fff',
              left: -5,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          />
        </div>
      );
    },
  }), [handleNodeDelete]);

  // Default edge options
  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#3b82f6',
      strokeWidth: 2,
      zIndex: 1,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#3b82f6',
      width: 16,
      height: 16,
    },
  }), []);
  
  // Connection line style
  const connectionLineStyle = useMemo(() => ({
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDasharray: '5 5',
  }), []);
  
  // Custom edge type with better arrow styling
  const edgeTypes = useMemo<EdgeTypes>(() => ({
    default: (props) => {
      const {
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition = Position.Right,
        targetPosition = Position.Left,
        markerEnd,
        style = {},
      } = props;

      const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
      });

      // Create a unique ID for the marker to avoid conflicts
      const markerId = `arrow-${props.id}`;
      
      return (
        <>
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 20 20"
              refX="19"
              refY="10"
              markerWidth="12"
              markerHeight="12"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#3b82f6"
                className="arrowhead"
              />
            </marker>
          </defs>
          <path
            id={props.id}
            style={{
              ...style,
              stroke: '#3b82f6',
              strokeWidth: 2,
              fill: 'none',
            }}
            className="react-flow__edge-path"
            d={edgePath}
            markerEnd={`url(#${markerId})`}
          />
        </>
      );
    },
  }), []);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  
  const { data: session, status: sessionStatus } = useSession();
  const { data: usersForFlow, isLoading: isLoadingUsers, error: usersError } = useGetUsersForFlowQuery();
  
  // Debug departments data
  useEffect(() => {
    console.log('Departments data:', departments);
  }, [departments]);

  // Get the current user's department ID if available
  const userDepartmentId = useMemo(() => session?.user?.departmentId, [session?.user?.departmentId]);
  
  // Reset form when initialData changes (e.g., when opening/closing modal)
  useEffect(() => {
    if (!initialData) {
      // Reset form for new flow
      setFlowName('');
      setDescription('');
      setDepartmentId('');
      setSelectedDepartment('');
      setNodes([]);
      setEdges([]);
      setJsonError('');
    } else {
      // Set form values from initialData
      setFlowName(initialData.flowName || '');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  // Handle department selection change
  const handleDepartmentChange = useCallback((value: string) => {
    console.log('Department changed to:', value);
    console.log('Available departments:', departments);
    
    // Ensure we're comparing string values
    const selectedDept = departments.find((d: FormDepartment) => {
      const deptId = d._id ? String(d._id) : '';
      return deptId === value;
    });
    
    console.log('Selected department:', selectedDept);
    
    if (selectedDept) {
      const deptId = selectedDept._id ? String(selectedDept._id) : '';
      console.log('Setting department ID to:', deptId);
      setDepartmentId(deptId);
      setSelectedDepartment(deptId);
      
      if (jsonError) {
        setJsonError(null);
      }
    } else {
      console.warn('Selected department not found in departments list');
      setDepartmentId('');
      setSelectedDepartment('');
    }
  }, [departments, jsonError]);

  useEffect(() => {
    console.log('--- Department Initialization Effect ---');
    console.log('initialData:', initialData);
    console.log('userDepartmentId:', userDepartmentId);
    console.log('departments:', departments);
    
    if (!initialData) {
      console.log('No initialData, skipping department initialization');
      // If no initial data, try to set user's department if available
      if (userDepartmentId) {
        const userDept = departments.find(d => 
          d._id && String(d._id) === String(userDepartmentId)
        );
        if (userDept) {
          const deptId = userDept._id ? String(userDept._id) : '';
          console.log('Setting user department as default:', deptId);
          setDepartmentId(deptId);
          setSelectedDepartment(deptId);
        }
      }
      return;
    }
    
    let deptId = '';
    
    // Extract department ID from initialData
    if (initialData.departmentId) {
      console.log('initialData.departmentId:', initialData.departmentId);
      
      if (initialData.departmentId && typeof initialData.departmentId === 'object' && initialData.departmentId !== null) {
        // Handle case where departmentId is an object with _id property
        console.log('departmentId is an object, extracting _id');
        deptId = initialData.departmentId._id ? String(initialData.departmentId._id) : '';
      } else if (typeof initialData.departmentId === 'string') {
        // Handle case where departmentId is already a string
        console.log('departmentId is already a string');
        deptId = initialData.departmentId;
      }
    } else if (userDepartmentId) {
      // Fallback to user's department if no department is set
      console.log('Using userDepartmentId as fallback');
      deptId = String(userDepartmentId);
    }
    
    console.log('Extracted department ID from initialData:', deptId);
    
    if (deptId) {
      console.log('Looking for department with ID in departments list...');
      
      if (departments.length > 0) {
        // Log all department IDs for debugging
        console.log('Available departments count:', departments.length);
        
        // Verify the department exists in the departments list
        const dept = departments.find((d: FormDepartment) => {
          const departmentId = d._id ? String(d._id) : '';
          return departmentId === deptId;
        });
        
        console.log('Found department in departments list:', dept);
        
        if (dept) {
          const finalDeptId = dept._id ? String(dept._id) : '';
          console.log('Setting department ID to:', finalDeptId);
          // Use setTimeout to ensure the state updates after the component is mounted
          setTimeout(() => {
            setDepartmentId(finalDeptId);
            setSelectedDepartment(finalDeptId);
          }, 0);
        } else {
          console.warn(`Department with ID ${deptId} not found in departments list`);
          setDepartmentId('');
          setSelectedDepartment('');
        }
      } else {
        // If departments are still loading, set the ID directly
        console.log('Departments not loaded yet, setting department ID directly');
        setDepartmentId(deptId);
        setSelectedDepartment(deptId);
      }
    } else {
      console.log('No department ID found in initialData or user department');
      setDepartmentId('');
      setSelectedDepartment('');
    }
    
    // Initialize React Flow nodes and edges from flow definition if it exists
    if (initialData.flowDefinition) {
      try {
        console.log('Initial flow definition:', initialData.flowDefinition);
        
        // Handle both string and object types for flowDefinition
        let flowDef: IFlowDefinition;
        
        if (typeof initialData.flowDefinition === 'string') {
          flowDef = JSON.parse(initialData.flowDefinition) as IFlowDefinition;
        } else {
          flowDef = initialData.flowDefinition as IFlowDefinition;
        }
          
        console.log('Parsed flow definition:', flowDef);
        
        // Set nodes and edges from flow definition
        if (flowDef.nodes) {
          console.log('Setting initial nodes:', flowDef.nodes);
          const reactFlowNodes: ReactFlowNode[] = flowDef.nodes.map(node => ({
            ...node,
            data: node.data || { userId: new mongoose.Types.ObjectId(), label: 'New Node' },
            position: node.position || { x: 0, y: 0 }
          }));
          setNodes(reactFlowNodes);
        }
        
        if (flowDef.edges) {
          console.log('Setting initial edges:', flowDef.edges);
          setEdges(flowDef.edges);
        }
      } catch (error) {
        console.error('Error parsing flow definition:', error);
        setJsonError('Invalid flow definition format');
      }
    } else {
      console.log('No flow definition in initial data');
      setNodes([]);
      setEdges([]);
    }
  }, [initialData, departments, userDepartmentId, setNodes, setEdges, setDepartmentId, setSelectedDepartment]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Submitting form with departmentId:', departmentId);

    if (sessionStatus !== 'authenticated') {
      alert('Session is not authenticated. Please re-login.');
      return;
    }

    const flowDefinition = { nodes, edges };
    
    // Create the submission data
    const submissionData: any = {
      flowName,
      description,
      flowDefinition,
      createdBy: session?.user?._id?.toString() ?? '',
    };

    // Only include departmentId if it has a value
    if (departmentId) {
      submissionData.departmentId = departmentId;
    } else {
      // Explicitly set to null to unset the department
      submissionData.departmentId = null;
    }

    console.log('Submitting approval flow data:', submissionData);
    
    onSubmit(submissionData);
  };
  
  // Handle connecting nodes in the flow
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connecting nodes:', params);
      
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        style: { 
          stroke: '#4b5563', 
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4b5563',
          width: 15,
          height: 15,
        },
      };
      
      console.log('New edge created:', newEdge);
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        console.log('Updated edges:', updatedEdges);
        return updatedEdges;
      });
    }, 
    [setEdges]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      // Get the IDs of the nodes being deleted
      const nodeIds = deletedNodes.map(node => node.id);
      
      // Remove edges that are connected to the deleted nodes
      setEdges((edges) => 
        edges.filter(
          (edge) => 
            !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
        )
      );
    },
    [setEdges]
  );

  // Handle drag over event for the flow
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop event for adding new nodes
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (!reactFlowInstance || !reactFlowWrapperRef.current) return;
    
    const reactFlowBounds = reactFlowWrapperRef.current.getBoundingClientRect();
    const userDataString = event.dataTransfer.getData('application/reactflow-user');
    
    if (!userDataString) return;
    
    try {
      const user: UserForFlow = JSON.parse(userDataString);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode: Node = {
        id: `userNode_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        type: 'default',
        position,
        data: { 
          label: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
          userId: user._id,
          type: 'user' 
        },
      };
      
      setNodes((nds) => nds.concat(newNode));
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [reactFlowInstance, setNodes]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-4 pb-0 space-y-4">
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departmentId">Department <span className="text-red-500">*</span></Label>
              <div>
                <div className="text-sm text-gray-500 mb-1">Current departmentId: {departmentId}</div>
                <Select 
                  value={selectedDepartment || ''}
                  onValueChange={handleDepartmentChange}
                  disabled={isLoadingDepartments || isLoadingUsers || sessionStatus === 'loading'}
                >
                  <SelectTrigger id="departmentId" className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDepartments ? (
                      <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                    ) : departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>No departments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flow Name Input */}
            <div>
              <Label htmlFor="flowName">Flow Name <span className="text-red-500">*</span></Label>
              <Input
                id="flowName"
                className="mt-1"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g., Purchase Requisition Approval"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description Input */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the flow's purpose"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: User List and React Flow Diagram */}
        {/* This div's children (User List & Diagram) will define its height. */}
        {/* On small screens (flex-col), their fixed heights will sum up. */}
        {/* On medium screens (flex-row), they'll share width and adapt height. */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* User List Panel */}
          <div className="md:w-1/3 lg:w-1/4 p-4 border rounded-md bg-white dark:bg-gray-800 shadow flex flex-col h-[240px] md:h-auto md:max-h-full">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Available Users</h3>
            <Input
              type="text"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="mb-3"
            />
            {/* Internal scroll for user list items */}
            <div className="flex-grow overflow-y-auto space-y-2">
              {isLoadingUsers && <p className="text-center text-gray-500">Loading users...</p>}
              {usersError && <p className="text-center text-red-500">Error loading users: {usersError.toString()}</p>}
              {!usersError && usersForFlow && 
                usersForFlow.filter(user => 
                  (user.fullName?.toLowerCase() || `${user.firstName} ${user.lastName}`.toLowerCase()).includes(userSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                ).length === 0 && (
                <p className="text-center text-gray-500 p-4">{userSearchTerm ? 'No users match search.' : 'No users.'}</p>
              )}
              {!isLoadingUsers && usersForFlow && usersForFlow
                .filter(user => 
                  (user.fullName?.toLowerCase() || `${user.firstName} ${user.lastName}`.toLowerCase()).includes(userSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
                .map((user) => (
                <div 
                  key={user._id} 
                  className="p-2.5 border rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-grab shadow-sm"
                  draggable="true"
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow-user', JSON.stringify(user));
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              ))}
            </div>
          </div>

          {/* React Flow Canvas Panel */}
          <div className="md:w-2/3 lg:w-3/4 flex flex-col border rounded-md bg-white dark:bg-gray-800 shadow">
            <div className="p-4 border-b dark:border-gray-700">
              <Label htmlFor="flowDefinition" className="text-lg font-semibold">Approval Flow Diagram</Label>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Drag users from the list, drop them on the canvas, and connect them to define the flow.</p>
            </div>
            <div ref={reactFlowWrapperRef} className="flex-grow h-[280px] md:h-auto p-2">
              <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onNodesDelete={onNodesDelete}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  nodesDraggable={true}
                  nodesConnectable={true}
                  elementsSelectable={true}
                  deleteKeyCode={['Backspace', 'Delete']}
                  fitView
                  defaultEdgeOptions={defaultEdgeOptions}
                  connectionLineStyle={connectionLineStyle}
                  nodeOrigin={[0.5, 0.5]}
                  panOnScroll
                  zoomOnScroll
                  zoomOnPinch
                  zoomOnDoubleClick={false}
                  panOnDrag={[1, 2]} // Left mouse button only
                  snapToGrid={true}
                  snapGrid={[10, 10]}
                  attributionPosition="bottom-left"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#f8fafc',
                    minHeight: '500px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}
                  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                  onDragOver={(event) => { 
                    event.preventDefault(); 
                    if (event.dataTransfer) {
                      event.dataTransfer.dropEffect = 'move'; 
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!reactFlowInstance || !reactFlowWrapperRef.current) return;
                    
                    const userDataString = event.dataTransfer.getData('application/reactflow-user');
                    if (!userDataString) return;
                    
                    try {
                      const user: UserForFlow = JSON.parse(userDataString);
                      const position = reactFlowInstance.screenToFlowPosition({
                        x: event.clientX,
                        y: event.clientY,
                      });
                      
                      const newNode: Node = {
                        id: `userNode_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        type: 'default',
                        position,
                        data: { 
                          label: user.fullName || `${user.firstName} ${user.lastName}`, 
                          userId: user._id, 
                          type: 'user' 
                        },
                        sourcePosition: Position.Right,
                        targetPosition: Position.Left,
                      };
                      
                      setNodes((nds) => nds.concat(newNode));
                    } catch (error) {
                      console.error('Error processing dropped user:', error);
                    }
                  }}
                >
                  <Background gap={16} size={1} color="#e2e8f0" />
                  <Controls />
                  <MiniMap nodeStrokeWidth={3} zoomable pannable />
                </ReactFlow>
              </div>
            </div>
            {jsonError && <p className="p-2 text-xs text-red-500 text-center">{jsonError}</p>} 
          </div>
        </div>
      </div>

      {/* Form Actions: sticky to the bottom of DialogContent's scrollable area */}
      <div className="sticky bottom-0 z-10 flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (initialData ? 'Saving Changes...' : 'Creating Flow...') : (initialData ? 'Save Changes' : 'Create Flow')}
        </Button>
      </div>
    </form>
  );
};

export default ApprovalFlowForm;
