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
  LayoutIcon,
  GitBranchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Enhanced Node Types for Approval Flow
const StartNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white border-2 border-green-700">
    <div className="flex items-center">
      <div className="rounded-full w-10 h-10 flex justify-center items-center bg-white bg-opacity-20">
        <PlayIcon className="w-5 h-5" />
      </div>
      <div className="ml-3">
        <div className="text-sm font-bold">START</div>
        <div className="text-xs opacity-90">Form Submitted</div>
      </div>
    </div>
  </div>
);

const EndNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-700">
    <div className="flex items-center">
      <div className="rounded-full w-10 h-10 flex justify-center items-center bg-white bg-opacity-20">
        <CheckCircleIcon className="w-5 h-5" />
      </div>
      <div className="ml-3">
        <div className="text-sm font-bold">END</div>
        <div className="text-xs opacity-90">Final Decision</div>
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

  const getApprovalTypeColor = (type: string) => {
    switch (type) {
      case 'specific_user': return 'from-blue-500 to-blue-600 border-blue-700';
      case 'role_based': return 'from-purple-500 to-purple-600 border-purple-700';
      case 'department_head': return 'from-orange-500 to-orange-600 border-orange-700';
      default: return 'from-gray-500 to-gray-600 border-gray-700';
    }
  };

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r ${getApprovalTypeColor(data.approverType)} text-white border-2 ${
      selected ? 'ring-2 ring-white ring-opacity-50' : ''
    } min-w-[200px] max-w-[250px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full w-8 h-8 flex justify-center items-center bg-white bg-opacity-20">
            {getApproverIcon(data.approverType)}
          </div>
          <div>
            <div className="text-sm font-bold truncate">{data.label || 'Approval Step'}</div>
            <div className="text-xs opacity-90 capitalize">
              {data.approverType?.replace('_', ' ') || 'User Approval'}
            </div>
          </div>
        </div>
        <div className="ml-2">
          <Badge variant={data.isRequired ? "default" : "secondary"} className="text-xs bg-white bg-opacity-20 text-white border-white border-opacity-30">
            {data.isRequired ? "Required" : "Optional"}
          </Badge>
        </div>
      </div>
      
      {data.approvers && data.approvers.length > 0 && (
        <div className="mt-2 text-xs opacity-90">
          {data.approvers.length} approver{data.approvers.length !== 1 ? 's' : ''} assigned
        </div>
      )}

      {data.timeoutDays && (
        <div className="mt-1 text-xs opacity-90 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {data.timeoutDays} days timeout
        </div>
      )}

      {data.conditions && data.conditions.length > 0 && (
        <div className="mt-1 text-xs opacity-90 flex items-center gap-1">
          <GitBranchIcon className="w-3 h-3" />
          Conditional
        </div>
      )}
    </div>
  );
};

const DecisionNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-2 border-yellow-700 ${
    selected ? 'ring-2 ring-white ring-opacity-50' : ''
  } min-w-[180px]`}>
    <div className="flex items-center justify-center">
      <div className="rounded-full w-8 h-8 flex justify-center items-center bg-white bg-opacity-20 mr-2">
        <GitBranchIcon className="w-4 h-4" />
      </div>
      <div className="text-center">
        <div className="text-sm font-bold">{data.label || 'Decision'}</div>
        <div className="text-xs opacity-90">Conditional Branch</div>
      </div>
    </div>
    {data.condition && (
      <div className="mt-2 text-xs opacity-90 text-center">
        {data.condition}
      </div>
    )}
  </div>
);

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  approval: ApprovalNode,
  decision: DecisionNode,
};

// Layout nodes using dagre with better spacing
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    const width = node.type === 'approval' ? 250 : node.type === 'decision' ? 180 : 150;
    const height = 80;
    dagreGraph.setNode(node.id, { width, height });
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
        x: nodeWithPosition.x - (nodeWithPosition.width / 2),
        y: nodeWithPosition.y - (nodeWithPosition.height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

interface NodeBasedApprovalFlowDesignerProps {
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
}: NodeBasedApprovalFlowDesignerProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Initialize with start and end nodes if no initial data
  const initialNodes: Node[] = initialFlowData?.nodes || [
    {
      id: 'start-node',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: 'Start' },
      deletable: false,
    },
    {
      id: 'end-node',
      type: 'end',
      position: { x: 250, y: 400 },
      data: { label: 'End' },
      deletable: false,
    },
  ];

  const initialEdges: Edge[] = initialFlowData?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeCounter, setNodeCounter] = useState(1);
  
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
    conditions: [] as any[],
  });

  const reactFlow = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed' as const, color: '#6366f1' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
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

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `${nodeType}-${nodeCounter}`;
      let newNode: Node;

      switch (nodeType) {
        case 'approval':
          newNode = {
            id: newNodeId,
            type: 'approval',
            position,
            data: {
              label: `Approval Step ${nodeCounter}`,
              stepOrder: nodeCounter,
              approverType: 'specific_user',
              approvers: [],
              isRequired: true,
            },
          };
          break;
        case 'decision':
          newNode = {
            id: newNodeId,
            type: 'decision',
            position,
            data: {
              label: `Decision ${nodeCounter}`,
              condition: 'If condition is met',
            },
          };
          break;
        default:
          return;
      }

      setNodes((nds) => nds.concat(newNode));
      setNodeCounter(nodeCounter + 1);
      
      // Open configuration dialog for new approval nodes
      if (nodeType === 'approval') {
        setStepDialog({ open: true, node: newNode, isNew: true });
      }
    },
    [reactFlowInstance, nodeCounter, setNodes]
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
          conditions: node.data.conditions || [],
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
        conditions: stepConfig.conditions,
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

  const deleteSelectedNodes = () => {
    const selectedNodes = nodes.filter(node => node.selected && node.deletable !== false);
    const selectedNodeIds = selectedNodes.map(node => node.id);
    
    setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
    setEdges((eds) => eds.filter((edge) => 
      !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
    ));
  };

  return (
    <div className="h-[700px] w-full border rounded-lg relative">
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
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'start': return '#10b981';
                case 'end': return '#ef4444';
                case 'approval': return '#6366f1';
                case 'decision': return '#f59e0b';
                default: return '#6b7280';
              }
            }}
          />
          <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
          
          {/* Toolbar Panel */}
          <Panel position="top-left" className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoLayout}
              className="bg-white shadow-md"
            >
              <LayoutIcon className="w-4 h-4 mr-2" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              className="bg-white shadow-md"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Flow
            </Button>
            {onTest && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                className="bg-white shadow-md"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Test Flow
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={deleteSelectedNodes}
              className="bg-white shadow-md text-red-600 hover:text-red-700"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </Panel>

          {/* Node Palette Panel */}
          <Panel position="top-right">
            <Card className="w-64 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <WorkflowIcon className="w-4 h-4" />
                  Flow Components
                </CardTitle>
                <CardDescription className="text-xs">
                  Drag components to build your approval flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Approval Node */}
                <div
                  className="p-3 border-2 border-dashed border-blue-300 rounded-md text-center cursor-move hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', 'approval');
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <UserIcon className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs font-medium text-blue-700">Approval Step</p>
                  <p className="text-xs text-blue-600">User/Role approval</p>
                </div>

                {/* Decision Node */}
                <div
                  className="p-3 border-2 border-dashed border-yellow-300 rounded-md text-center cursor-move hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', 'decision');
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <GitBranchIcon className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xs font-medium text-yellow-700">Decision Point</p>
                  <p className="text-xs text-yellow-600">Conditional branch</p>
                </div>

                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">How to use:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Drag components onto canvas</li>
                    <li>• Connect nodes by dragging</li>
                    <li>• Double-click to configure</li>
                    <li>• Use Auto Layout to organize</li>
                  </ul>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              {stepDialog.isNew ? 'Configure New Approval Step' : 'Edit Approval Step'}
            </DialogTitle>
            <DialogDescription>
              Define the approval step settings and assign approvers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Step Name</Label>
                <Input
                  value={stepConfig.stepName}
                  onChange={(e) => setStepConfig({ ...stepConfig, stepName: e.target.value })}
                  placeholder="e.g., Manager Approval"
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
                placeholder="Describe what this approval step involves"
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

const NodeBasedApprovalFlowDesigner = (props: NodeBasedApprovalFlowDesignerProps) => {
  return (
    <ReactFlowProvider>
      <FlowDesigner {...props} />
    </ReactFlowProvider>
  );
};

export default NodeBasedApprovalFlowDesigner;