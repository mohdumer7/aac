'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  ReactFlowInstance,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  PlusIcon, 
  SaveIcon, 
  PlayIcon,
  UserIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  TrashIcon,
  EditIcon,
  WorkflowIcon,
  ZoomInIcon,
  ZoomOutIcon,
  LayoutIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Custom Node Types
const StartNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-200">
    <div className="flex">
      <div className="rounded-full w-12 h-12 flex justify-center items-center bg-green-500">
        <PlayIcon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-2">
        <div className="text-lg font-bold text-green-700">Start</div>
        <div className="text-gray-500">Form Submission</div>
      </div>
    </div>
  </div>
);

const EndNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-red-50 border-2 border-red-200">
    <div className="flex">
      <div className="rounded-full w-12 h-12 flex justify-center items-center bg-red-500">
        <SettingsIcon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-2">
        <div className="text-lg font-bold text-red-700">End</div>
        <div className="text-gray-500">Final Decision</div>
      </div>
    </div>
  </div>
);

const ApprovalNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getApproverIcon = (type: string) => {
    switch (type) {
      case 'specific_user': return <UserIcon className="w-4 h-4" />;
      case 'role_based': return <UsersIcon className="w-4 h-4" />;
      case 'department_head': return <BuildingIcon className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-md bg-white border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } min-w-[200px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getApproverIcon(data.approverType)}
          <div>
            <div className="text-sm font-bold text-gray-900">{data.label}</div>
            <div className="text-xs text-gray-500">
              {data.approverType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </div>
          </div>
        </div>
        <Badge variant={data.isRequired ? "default" : "secondary"} className="text-xs">
          {data.isRequired ? "Required" : "Optional"}
        </Badge>
      </div>
      
      {data.approvers && data.approvers.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {data.approvers.length} approver{data.approvers.length !== 1 ? 's' : ''} assigned
        </div>
      )}

      {data.timeoutDays && (
        <div className="mt-1 text-xs text-orange-600">
          Timeout: {data.timeoutDays} days
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  approval: ApprovalNode,
};

// Layout nodes using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

interface ApprovalFlowDesignerProps {
  initialFlowData?: {
    nodes: Node[];
    edges: Edge[];
    viewport?: { x: number; y: number; zoom: number };
  };
  availableApprovers: any[];
  availableRoles: any[];
  onSave: (flowData: { nodes: Node[]; edges: Edge[]; viewport: any }) => void;
  onTest?: (flowData: { nodes: Node[]; edges: Edge[] }) => void;
}

const FlowDesigner = ({ 
  initialFlowData, 
  availableApprovers, 
  availableRoles, 
  onSave, 
  onTest 
}: ApprovalFlowDesignerProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Initialize with start and end nodes if no initial data
  const initialNodes: Node[] = initialFlowData?.nodes || [
    {
      id: 'start',
      type: 'start',
      position: { x: 250, y: 25 },
      data: { label: 'Start' },
      deletable: false,
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 250, y: 300 },
      data: { label: 'End' },
      deletable: false,
    },
  ];

  const initialEdges: Edge[] = initialFlowData?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [stepCounter, setStepCounter] = useState(1);
  
  // Step configuration dialog
  const [stepDialog, setStepDialog] = useState<{
    open: boolean;
    node: Node | null;
    isNew: boolean;
  }>({ open: false, node: null, isNew: false });
  
  const [stepConfig, setStepConfig] = useState({
    stepName: '',
    stepDescription: '',
    approverType: 'specific_user',
    specificUsers: [],
    requiredRoles: [],
    isRequired: true,
    allowParallelApproval: false,
    timeoutDays: 7,
    notifyOnSubmission: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
  });

  const reactFlow = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `step-${stepCounter}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'approval',
        position,
        data: {
          label: `Approval Step ${stepCounter}`,
          stepOrder: stepCounter,
          approverType: 'specific_user',
          approvers: [],
          isRequired: true,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setStepCounter(stepCounter + 1);
      
      // Open configuration dialog for new node
      setStepDialog({ open: true, node: newNode, isNew: true });
    },
    [reactFlowInstance, stepCounter, setNodes]
  );

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'approval') {
        // Populate dialog with current node data
        setStepConfig({
          stepName: node.data.label || '',
          stepDescription: node.data.description || '',
          approverType: node.data.approverType || 'specific_user',
          specificUsers: node.data.approvers || [],
          requiredRoles: node.data.requiredRoles || [],
          isRequired: node.data.isRequired !== false,
          allowParallelApproval: node.data.allowParallelApproval || false,
          timeoutDays: node.data.timeoutDays || 7,
          notifyOnSubmission: node.data.notifyOnSubmission !== false,
          notifyOnApproval: node.data.notifyOnApproval !== false,
          notifyOnRejection: node.data.notifyOnRejection !== false,
        });
        setStepDialog({ open: true, node, isNew: false });
      }
    },
    []
  );

  const handleStepSave = () => {
    if (!stepDialog.node) return;

    const updatedNode = {
      ...stepDialog.node,
      data: {
        ...stepDialog.node.data,
        label: stepConfig.stepName,
        description: stepConfig.stepDescription,
        approverType: stepConfig.approverType,
        approvers: stepConfig.specificUsers,
        requiredRoles: stepConfig.requiredRoles,
        isRequired: stepConfig.isRequired,
        allowParallelApproval: stepConfig.allowParallelApproval,
        timeoutDays: stepConfig.timeoutDays,
        notifyOnSubmission: stepConfig.notifyOnSubmission,
        notifyOnApproval: stepConfig.notifyOnApproval,
        notifyOnRejection: stepConfig.notifyOnRejection,
      },
    };

    setNodes((nds) =>
      nds.map((node) =>
        node.id === stepDialog.node!.id ? updatedNode : node
      )
    );

    setStepDialog({ open: false, node: null, isNew: false });
    toast.success('Step configuration saved');
  };

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  const handleSave = () => {
    const flowData = {
      nodes,
      edges,
      viewport: reactFlow.getViewport(),
    };
    onSave(flowData);
  };

  const handleTest = () => {
    if (onTest) {
      onTest({ nodes, edges });
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  return (
    <div className="h-[600px] w-full border rounded-lg">
      <div ref={reactFlowWrapper} className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
          
          {/* Toolbar Panel */}
          <Panel position="top-left" className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoLayout}
            >
              <LayoutIcon className="w-4 h-4 mr-2" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Design
            </Button>
            {onTest && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Test Flow
              </Button>
            )}
          </Panel>

          {/* Add Step Panel */}
          <Panel position="top-right">
            <Card className="w-64">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add Approval Step</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center cursor-move hover:border-gray-400 transition-colors"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', 'approval');
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <WorkflowIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag to add approval step
                  </p>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Step Configuration Dialog */}
      <Dialog 
        open={stepDialog.open} 
        onOpenChange={(open) => setStepDialog({ open, node: null, isNew: false })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stepDialog.isNew ? 'Configure New Step' : 'Edit Step Configuration'}
            </DialogTitle>
            <DialogDescription>
              Define the approval step settings and assign approvers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Step Name</Label>
                <Input
                  value={stepConfig.stepName}
                  onChange={(e) => setStepConfig({ ...stepConfig, stepName: e.target.value })}
                  placeholder="Enter step name"
                />
              </div>

              <div className="space-y-2">
                <Label>Approver Type</Label>
                <Select
                  value={stepConfig.approverType}
                  onValueChange={(value) => setStepConfig({ ...stepConfig, approverType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="specific_user">Specific Users</SelectItem>
                    <SelectItem value="role_based">Role Based</SelectItem>
                    <SelectItem value="department_head">Department Head</SelectItem>
                    <SelectItem value="reporting_manager">Reporting Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={stepConfig.stepDescription}
                onChange={(e) => setStepConfig({ ...stepConfig, stepDescription: e.target.value })}
                placeholder="Describe what this step involves"
                rows={2}
              />
            </div>

            {stepConfig.approverType === 'specific_user' && (
              <div className="space-y-2">
                <Label>Select Approvers</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availableApprovers.map((approver: any) => (
                    <div key={approver._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`approver-${approver._id}`}
                        checked={stepConfig.specificUsers.includes(approver._id)}
                        onCheckedChange={(checked) => {
                          const currentUsers = stepConfig.specificUsers;
                          const updatedUsers = checked
                            ? [...currentUsers, approver._id]
                            : currentUsers.filter((id: string) => id !== approver._id);
                          setStepConfig({ ...stepConfig, specificUsers: updatedUsers });
                        }}
                      />
                      <Label htmlFor={`approver-${approver._id}`} className="text-sm cursor-pointer">
                        {approver.displayName || `${approver.firstName} ${approver.lastName}`}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepConfig.approverType === 'role_based' && (
              <div className="space-y-2">
                <Label>Select Roles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableRoles.map((role: any) => (
                    <div key={role._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role._id}`}
                        checked={stepConfig.requiredRoles.includes(role._id)}
                        onCheckedChange={(checked) => {
                          const currentRoles = stepConfig.requiredRoles;
                          const updatedRoles = checked
                            ? [...currentRoles, role._id]
                            : currentRoles.filter((id: string) => id !== role._id);
                          setStepConfig({ ...stepConfig, requiredRoles: updatedRoles });
                        }}
                      />
                      <Label htmlFor={`role-${role._id}`} className="text-sm cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeout (Days)</Label>
                <Input
                  type="number"
                  value={stepConfig.timeoutDays}
                  onChange={(e) => setStepConfig({ ...stepConfig, timeoutDays: parseInt(e.target.value) || 7 })}
                  min="1"
                  max="30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Step Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={stepConfig.isRequired}
                    onCheckedChange={(checked) => setStepConfig({ ...stepConfig, isRequired: checked as boolean })}
                  />
                  <Label htmlFor="required" className="text-sm">Required step</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parallel"
                    checked={stepConfig.allowParallelApproval}
                    onCheckedChange={(checked) => setStepConfig({ ...stepConfig, allowParallelApproval: checked as boolean })}
                  />
                  <Label htmlFor="parallel" className="text-sm">Allow parallel approval</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify-submission"
                    checked={stepConfig.notifyOnSubmission}
                    onCheckedChange={(checked) => setStepConfig({ ...stepConfig, notifyOnSubmission: checked as boolean })}
                  />
                  <Label htmlFor="notify-submission" className="text-sm">Notify on submission</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify-approval"
                    checked={stepConfig.notifyOnApproval}
                    onCheckedChange={(checked) => setStepConfig({ ...stepConfig, notifyOnApproval: checked as boolean })}
                  />
                  <Label htmlFor="notify-approval" className="text-sm">Notify on approval</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStepDialog({ open: false, node: null, isNew: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleStepSave}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ApprovalFlowDesigner = (props: ApprovalFlowDesignerProps) => {
  return (
    <ReactFlowProvider>
      <FlowDesigner {...props} />
    </ReactFlowProvider>
  );
};

export default ApprovalFlowDesigner;