'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HRMSFormSection as HRMSFormSectionType } from '@/types/hrms';
import HRMSFormField from './HRMSFormField';

interface HRMSFormSectionProps {
  section: HRMSFormSectionType;
  disabled?: boolean;
  className?: string;
}

export default function HRMSFormSection({ 
  section, 
  disabled = false, 
  className 
}: HRMSFormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded ?? true);

  if (section.collapsible) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className={cn("transition-all duration-200", className)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      field.type === 'textarea' && "md:col-span-2"
                    )}
                  >
                    <HRMSFormField field={field} disabled={disabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{section.title}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {section.fields.map((field) => (
            <div
              key={field.name}
              className={cn(
                field.type === 'textarea' && "md:col-span-2"
              )}
            >
              <HRMSFormField field={field} disabled={disabled} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}