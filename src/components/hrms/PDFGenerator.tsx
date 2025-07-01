'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DownloadIcon, 
  FileTextIcon, 
  Loader2Icon,
  SettingsIcon,
  InfoIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import HRMSPDFGenerator, { PDFGenerationOptions, FormTemplateData } from '@/lib/hrms-pdf-generator';
import { useGenerateFormPDFMutation } from '@/services/endpoints/hrmsApi';

interface PDFGeneratorProps {
  formType: string;
  formId: string;
  formData?: any;
  triggerButton?: React.ReactNode;
  onGenerated?: (pdfBlob: Blob, filename: string) => void;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  formType,
  formId,
  formData,
  triggerButton,
  onGenerated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFGenerationOptions>({
    format: 'a4',
    orientation: 'portrait',
    margin: 20,
    scale: 2,
    quality: 0.95
  });
  
  const [includeApprovalHistory, setIncludeApprovalHistory] = useState(true);
  const [organizationName, setOrganizationName] = useState('Acero Building Systems');
  const [customFilename, setCustomFilename] = useState('');

  const [generatePDFData] = useGenerateFormPDFMutation();

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);

      // First, get the form data from API
      const result = await generatePDFData({
        formType,
        id: formId,
        options: {
          includeApprovalHistory,
          organizationName
        }
      }).unwrap();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get form data');
      }

      const { pdfData, filename: defaultFilename } = result.data;
      
      // Generate filename
      const filename = customFilename.trim() 
        ? `${customFilename.trim()}.pdf`
        : defaultFilename;

      // Use client-side PDF generation
      const pdfResult = await HRMSPDFGenerator.generateFormPDF(
        pdfData as FormTemplateData,
        {
          ...pdfOptions,
          filename
        }
      );

      if (pdfResult.success && pdfResult.pdfBlob) {
        // Download the PDF
        HRMSPDFGenerator.downloadPDF(pdfResult.pdfBlob, filename);
        
        // Call callback if provided
        if (onGenerated) {
          onGenerated(pdfResult.pdfBlob, filename);
        }

        toast.success('PDF generated and downloaded successfully!');
        setIsOpen(false);
      } else {
        throw new Error(pdfResult.error || 'Failed to generate PDF');
      }

    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(error.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFormTypeDisplayName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(true)}>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <FileTextIcon className="h-4 w-4" />
            Generate PDF
          </Button>
        )}
      </div>

      {/* PDF Generation Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Generate PDF Document
            </DialogTitle>
            <DialogDescription>
              Create a PDF document for: {getFormTypeDisplayName(formType)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Information Alert */}
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                The PDF will include all form data, submission information, and can optionally include approval history.
              </AlertDescription>
            </Alert>

            {/* Basic Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Options</CardTitle>
                <CardDescription>Configure basic document settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Filename (optional)</Label>
                    <Input
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      placeholder="Enter custom filename (without .pdf)"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeApproval"
                    checked={includeApprovalHistory}
                    onCheckedChange={(checked) => setIncludeApprovalHistory(checked as boolean)}
                  />
                  <Label htmlFor="includeApproval">
                    Include approval history and comments
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  PDF Settings
                </CardTitle>
                <CardDescription>Advanced PDF generation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Page Format</Label>
                    <Select
                      value={pdfOptions.format}
                      onValueChange={(value: 'a4' | 'letter') => 
                        setPdfOptions({ ...pdfOptions, format: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select
                      value={pdfOptions.orientation}
                      onValueChange={(value: 'portrait' | 'landscape') => 
                        setPdfOptions({ ...pdfOptions, orientation: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={pdfOptions.quality?.toString()}
                      onValueChange={(value) => 
                        setPdfOptions({ ...pdfOptions, quality: parseFloat(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.7">Standard (70%)</SelectItem>
                        <SelectItem value="0.85">Good (85%)</SelectItem>
                        <SelectItem value="0.95">High (95%)</SelectItem>
                        <SelectItem value="1.0">Maximum (100%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Margin (px)</Label>
                    <Input
                      type="number"
                      value={pdfOptions.margin}
                      onChange={(e) => 
                        setPdfOptions({ ...pdfOptions, margin: parseInt(e.target.value) || 20 })
                      }
                      min="0"
                      max="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Scale Factor</Label>
                    <Select
                      value={pdfOptions.scale?.toString()}
                      onValueChange={(value) => 
                        setPdfOptions({ ...pdfOptions, scale: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x (Faster)</SelectItem>
                        <SelectItem value="2">2x (Recommended)</SelectItem>
                        <SelectItem value="3">3x (High Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DownloadIcon className="h-4 w-4" />
                  Generate & Download
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFGenerator;