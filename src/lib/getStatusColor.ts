export function getStatusColor(status: string) {
  switch(status?.toUpperCase()) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'ASSIGNED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'CLOSED':
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
}

// Helper function to get color classes for different ticket priorities
export function getPriorityColor(priority: string) {
  switch(priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'LOW':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
}