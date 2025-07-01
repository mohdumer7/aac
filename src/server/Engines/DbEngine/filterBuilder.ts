
interface Condition {
  field: string;
  operator: string;
  value: any;
  or?: boolean;
  and?: boolean;
}
const operatorMap: { [key: string]: string } = {
  is: '$eq',
  equals: '$eq',
  '==': '$eq',
  '!=': '$ne',
  '>': '$gt',
  '>=': '$gte',
  '<': '$lt',
  '<=': '$lte',
  in: '$in',
  notIn: '$nin',
  matches: '$regex'
};

export function buildFilter(conditions: Condition[]): any {
  if (!conditions || conditions.length === 0) return {};

  let logicalOperator = '$and';
  const currentGroup: any[] = [];
  
  for (const cond of conditions) {
    if (cond.or) {
      logicalOperator = '$or';
      continue;
    }
    if (cond.and) {
      // Default is $and, so do nothing
      continue;
    }
    if (cond.field && cond.operator && cond.value !== undefined) {
      const op = operatorMap[cond.operator] || '$eq';
      currentGroup.push({ [cond.field]: { [op]: cond.value } });
    }
  }

  if (currentGroup.length === 1 && logicalOperator === '$and') {
    return currentGroup[0];
  }

  return { [logicalOperator]: currentGroup };
}
