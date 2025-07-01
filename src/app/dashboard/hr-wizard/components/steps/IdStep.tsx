import React from 'react';
import { CreditCard, FileText, FileCheck, FileX, Calendar, MapPin, Upload, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { WizardStepProps } from '../types';

interface IdDocument {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  issuingCountry: string;
  issuingAuthority: string;
  file?: File | null;
  fileName?: string;
  fileUrl?: string;
  isVerified?: boolean;
}

export const IdStep: React.FC<WizardStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { control, watch, setValue, formState: { errors } } = formMethods;
  const idDocuments = watch('idDocuments') || [];
  const primaryIdType = watch('primaryIdType');

  // Add a new ID document
  const addIdDocument = () => {
    const newDoc: IdDocument = {
      id: `doc-${Date.now()}`,
      type: '',
      number: '',
      issueDate: '',
      expiryDate: '',
      issuingCountry: '',
      issuingAuthority: '',
      isVerified: false,
    };
    setValue('idDocuments', [...idDocuments, newDoc], { shouldDirty: true });
  };

  // Remove an ID document
  const removeIdDocument = (id: string) => {
    const updatedDocs = idDocuments.filter((doc: IdDocument) => doc.id !== id);
    setValue('idDocuments', updatedDocs, { shouldDirty: true });
  };

  // Update an ID document field
  const updateIdDocument = (id: string, field: keyof IdDocument, value: any) => {
    const updatedDocs = idDocuments.map((doc: IdDocument) => 
      doc.id === id ? { ...doc, [field]: value } : doc
    );
    setValue('idDocuments', updatedDocs, { shouldDirty: true });
  };

  // Handle file upload for a document
  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const updatedDocs = idDocuments.map((doc: IdDocument) => 
      doc.id === id 
        ? { ...doc, file, fileName: file.name, isVerified: false }
        : doc
    );
    
    setValue('idDocuments', updatedDocs, { shouldDirty: true });
  };

  // Remove file from a document
  const removeFile = (id: string) => {
    const updatedDocs = idDocuments.map((doc: IdDocument) => 
      doc.id === id 
        ? { ...doc, file: null, fileName: undefined, isVerified: false }
        : doc
    );
    
    setValue('idDocuments', updatedDocs, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Identification Documents</h3>
        <p className="text-sm text-muted-foreground">
          Provide government-issued identification documents for verification.
        </p>
      </div>

      {/* Primary ID Selection */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Primary Identification
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="primaryIdType"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="primaryIdType">Primary ID Type *</Label>
                <FormControl>
                  <select
                    id="primaryIdType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">Select ID type</option>
                    <option value="passport">Passport</option>
                    <option value="emirates_id">Emirates ID</option>
                    <option value="national_id">National ID</option>
                    <option value="driving_license">Driving License</option>
                    <option value="residence_visa">Residence Visa</option>
                    <option value="other">Other</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="primaryIdNumber"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="primaryIdNumber">ID Number *</Label>
                <FormControl>
                  <Input
                    id="primaryIdNumber"
                    placeholder="e.g., 784-1234-5678901-2"
                    {...field}
                    className={errors.primaryIdNumber ? "border-red-500" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Additional ID Documents */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Additional Identification Documents
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIdDocument}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Document
          </Button>
        </div>

        {idDocuments.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No additional ID documents added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {idDocuments.map((doc: IdDocument, index: number) => (
              <div key={doc.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h5 className="font-medium">Document #{index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeIdDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormItem>
                    <Label htmlFor={`doc-type-${doc.id}`}>Document Type *</Label>
                    <select
                      id={`doc-type-${doc.id}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={doc.type}
                      onChange={(e) => updateIdDocument(doc.id, 'type', e.target.value)}
                    >
                      <option value="">Select document type</option>
                      <option value="passport">Passport</option>
                      <option value="emirates_id">Emirates ID</option>
                      <option value="national_id">National ID</option>
                      <option value="driving_license">Driving License</option>
                      <option value="visa">Visa</option>
                      <option value="work_permit">Work Permit</option>
                      <option value="birth_certificate">Birth Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </FormItem>

                  <FormItem>
                    <Label htmlFor={`doc-number-${doc.id}`}>Document Number *</Label>
                    <Input
                      id={`doc-number-${doc.id}`}
                      placeholder="e.g., 12345678"
                      value={doc.number}
                      onChange={(e) => updateIdDocument(doc.id, 'number', e.target.value)}
                    />
                  </FormItem>

                  <FormItem>
                    <Label htmlFor={`doc-issue-date-${doc.id}`}>Issue Date</Label>
                    <div className="relative">
                      <Input
                        id={`doc-issue-date-${doc.id}`}
                        type="date"
                        value={doc.issueDate}
                        onChange={(e) => updateIdDocument(doc.id, 'issueDate', e.target.value)}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </FormItem>

                  <FormItem>
                    <Label htmlFor={`doc-expiry-date-${doc.id}`}>Expiry Date *</Label>
                    <div className="relative">
                      <Input
                        id={`doc-expiry-date-${doc.id}`}
                        type="date"
                        value={doc.expiryDate}
                        onChange={(e) => updateIdDocument(doc.id, 'expiryDate', e.target.value)}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </FormItem>

                  <FormItem>
                    <Label htmlFor={`doc-issuing-country-${doc.id}`}>Issuing Country *</Label>
                    <select
                      id={`doc-issuing-country-${doc.id}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={doc.issuingCountry}
                      onChange={(e) => updateIdDocument(doc.id, 'issuingCountry', e.target.value)}
                    >
                      <option value="">Select country</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="QA">Qatar</option>
                      <option value="KW">Kuwait</option>
                      <option value="OM">Oman</option>
                      <option value="BH">Bahrain</option>
                      <option value="IN">India</option>
                      <option value="PK">Pakistan</option>
                      <option value="PH">Philippines</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FormItem>

                  <FormItem>
                    <Label htmlFor={`doc-issuing-authority-${doc.id}`}>Issuing Authority</Label>
                    <Input
                      id={`doc-issuing-authority-${doc.id}`}
                      placeholder="e.g., Federal Authority for Identity and Citizenship"
                      value={doc.issuingAuthority}
                      onChange={(e) => updateIdDocument(doc.id, 'issuingAuthority', e.target.value)}
                    />
                  </FormItem>

                  <FormItem className="md:col-span-2">
                    <Label>Document Upload</Label>
                    {doc.fileName ? (
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium truncate max-w-xs">
                            {doc.fileName}
                          </span>
                          {doc.isVerified && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => removeFile(doc.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-muted-foreground/25 rounded-md">
                        <div className="space-y-1 text-center">
                          <div className="flex justify-center">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <div className="flex text-sm text-muted-foreground">
                            <label
                              htmlFor={`file-upload-${doc.id}`}
                              className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                            >
                              <span>Upload a file</span>
                              <input
                                id={`file-upload-${doc.id}`}
                                name={`file-upload-${doc.id}`}
                                type="file"
                                className="sr-only"
                                onChange={(e) => handleFileUpload(doc.id, e)}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, or PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Upload a clear scan or photo of the document
                    </FormDescription>
                  </FormItem>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdStep;
