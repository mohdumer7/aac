'use client'

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mongoose, { set } from "mongoose";
import { Combobox } from "../ui/ComboBoxWrapper";
import { DatePicker } from "../ui/date-picker";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import { Save, Check, X } from 'lucide-react';

import {
  Trash2Icon, SendHorizontal
} from "lucide-react";
import MultipleSelector, { Option } from "../ui/multiple-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONGO_MODELS, SUCCESS } from "@/shared/constants";
import { useCreateApplicationMutation, useLazyGetApplicationQuery } from "@/services/endpoints/applicationApi";
import { toast } from "react-toastify";
import { useSendEmailMutation } from "@/services/endpoints/emailApi";
import moment from "moment";

interface QuotationDialogProps {
  isOpen: boolean;
  closeDialog: () => void;
  selectedMaster: string;
  onSave: (data: any) => Promise<void>;
  fields: Array<any>;
  initialData: any;
  action: string;
  height: string;
  width: string;
  customerData: Array<any>;
  customerTypeData: Array<any>;
  statusData: Array<any>;
  onchangeData: (data: any) => void;
  countryData: Array<any>;
  proposalOffer: Array<any>;
  proposalDrawing: Array<any>;
  locationData: Array<any>;
  stateData: Array<any>;
}

const QuotationDialog: React.FC<QuotationDialogProps> = ({
  isOpen,
  closeDialog,
  selectedMaster,
  onSave,
  fields,
  initialData,
  action,
  height,
  width,
  customerData,
  customerTypeData,
  statusData,
  onchangeData,
  countryData,
  proposalOffer,
  proposalDrawing,
  locationData,
  stateData,
}) => {
  const { user }: any = useUserAuthorised();

  const [createMaster, { isLoading: isCreatingMaster }] = useCreateApplicationMutation();
  const [getApplication, { data: applicationData, isLoading, error }] = useLazyGetApplicationQuery();

  const [sendEmail, { isLoading: isSendEMail }]: any = useSendEmailMutation();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [proposalRevData, setProposalRevData] = useState<any[]>([]);
  const [drawingRevData, setDrawingRevData]: any = useState<Record<string, any>>([]);
  const [proposalDataIds, setProposalDataIds] = useState<Record<string, any>>({});
  const [offerRevisions, setOfferRevisions]: any = useState<Record<string, any>>([]);
  const [drawingRevisions, setDrawingRevisions]: any = useState<Record<string, any>>([]);

  const [sellingTeamData, setSellingTeamData] = useState<Record<string, any>>({});

  const [formDataSecondary, setFormDataSecondary] = useState<Record<string, any>>({});
  const [isSecondaryDialogOpen, setIsSecondaryDialogOpen] = useState(false);
  const [isQuoteNoExistDialogOpen, setIsQuoteNoExistDialogOpen] = useState(false);
  const [isQuoteNoExist, setIsQuoteNoExist] = useState(false);
  const [secondaryDialogType, setSecondaryDialogType] = useState("");

  const [secondaryFields, setSecondaryFields]: any = useState([]);

  const [approvalAuthorityData, setApprovalAuthorityData] = useState([]);

  const [formDataNew, setFormDataNew] = useState<Record<string, any>>({});
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newDialogType, setNewDialogType] = useState("");

  const [newFields, setNewFields]: any = useState([]);

  const [region, setRegion] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [paintType, setPaintType] = useState('');
  const [incotermDescription, setIncotermDescription] = useState('');

  const [isHelp, setIsHelp] = useState(false);
  const [isProposalOffer, setIsProposalOffer] = useState(true);
  const [isChecked, setIsChecked] = useState(false);


  // Dynamically generate fields based on selectedMaster

  const customerfields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; addNew?: boolean; visibility?: boolean; onAddMore?: () => void; }> = [
    { label: 'Customer Name', name: "name", type: "text", required: true, placeholder: 'Customer Name', section: 'Form2' },
    { label: 'Website', name: "website", type: "text", placeholder: 'Website', section: 'Form2' },
    { label: 'Email', name: "email", type: "email", placeholder: 'Email', section: 'Form2' },
    { label: 'Phone', name: "phone", type: "number", placeholder: 'Phone', section: 'Form2' },
    { label: 'Address', name: "address", type: "text", placeholder: 'Address', section: 'Form2' },
    { label: 'Customer Type', name: "customerType", type: "select", data: customerTypeData, placeholder: 'Select Customer Type', section: 'Form2' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status', section: 'Form2' },
  ]

  const customerContactfields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; addNew?: boolean; visibility?: boolean; onAddMore?: () => void; }> = [
    { label: 'Contact Name', name: "name", type: "text", required: true, placeholder: 'Customer Name', section: 'Form2' },
    { label: 'Email', name: "email", type: "email", placeholder: 'Email', section: 'Form2' },
    { label: 'Phone', name: "phone", type: "number", placeholder: 'Phone', section: 'Form2' },
    { label: 'Position', name: "position", type: "text", placeholder: 'Position', section: 'Form2' },
    { label: 'Customer', name: "customer", type: "select", data: customerData, placeholder: 'Select Customer', section: 'Form2' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status', section: 'Form2' },
  ]

  const cityfields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; addNew?: boolean; visibility?: boolean; onAddMore?: () => void; }> = [
    { label: 'State / City', name: "name", type: "text", required: true, placeholder: 'State / City', section: 'Form2' },
    { label: 'Country', name: "country", type: "select", required: true, placeholder: 'Select Country', format: 'ObjectId', data: countryData, section: 'Form2' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status', section: 'Form2' },

  ]

  const approvalAuthorityFields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; addNew?: boolean; visibility?: boolean; onAddMore?: () => void; }> = [
    { label: 'Authority Code', name: "code", type: "text", required: true, placeholder: 'Authority Code', section: 'Form2' },
    { label: 'Approval Authority', name: "name", type: "text", required: true, placeholder: 'Approval Authority', section: 'Form2' },
    { label: 'Location', name: "location", type: "multiselect", required: true, placeholder: 'Select Location', data: locationData, addNew: true, section: 'Form2' },

  ]

  const locationFields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; addNew?: boolean; visibility?: boolean; onAddMore?: () => void; }> = [
    { label: 'Location', name: "name", type: "text", required: true, placeholder: 'Location', section: 'Form3' },
    { label: 'Address', name: "address", type: "text", placeholder: 'Address', section: 'Form3' },
    { label: 'Pin Code', name: "pincode", type: "text", placeholder: 'Pin Code', section: 'Form3' },
    { label: 'State / City', name: "state", type: "select", required: true, placeholder: 'Select State / City', format: 'ObjectId', data: stateData, section: 'Form3' },

  ]

  useEffect(() => {
    let formattedData = Object.keys(initialData).reduce((acc: Record<string, any>, key: string) => {
      if (typeof initialData[key] === "object" && initialData[key]?._id) {
        // If the field is an object with an _id, store the _id
        acc[key] = initialData[key]._id;
      } else {
        acc[key] = initialData[key];
      }
      return acc;
    }, {});
    setRegion(initialData?.country?.region?.name);
    setSellingTeamData(initialData?.sellingTeam)
    const proposalRevisions = {
      proposals: formattedData?.proposals?.map((data: { _id: any; }) => data._id), // Map `location` to just the `_id`s
      offerrevisions: formattedData?.proposals?.[0]?.revisions.map((data: { _id: any; }) => data._id),
      drawingrevisions: formattedData?.proposals?.[1]?.revisions.map((data: { _id: any; }) => data._id),
      offerRevisionsdata: formattedData?.proposals?.[0]?.revisions,
      drawingRevisionsdata: formattedData?.proposals?.[1]?.revisions,

    };


    if (initialData?.contact) {
      formattedData = { ...formattedData, email: initialData?.contact?.email, phone: initialData?.contact?.phone, position: initialData?.contact?.position }
    }
    setFormData(formattedData);
    if (initialData?.proposals) {
      setProposalRevData(
        proposalRevisions?.offerRevisionsdata?.map((item: { sentToEstimation: string | number | Date; receivedFromEstimation: string | number | Date; sentToCustomer: string | number | Date; createdAt: string | number | Date; updatedAt: string | number | Date; }) => ({
          ...item,
          sentToEstimation: item.sentToEstimation ? new Date(item.sentToEstimation) : null,
          receivedFromEstimation: item.receivedFromEstimation ? new Date(item.receivedFromEstimation) : null,
          sentToCustomer: item.sentToCustomer ? new Date(item.sentToCustomer) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : null
        })) || []
      );

      setDrawingRevData(
        proposalRevisions?.drawingRevisionsdata?.map((item: { sentToEstimation: string | number | Date; receivedFromEstimation: string | number | Date; sentToCustomer: string | number | Date; createdAt: string | number | Date; updatedAt: string | number | Date; }) => ({
          ...item,
          sentToEstimation: item.sentToEstimation ? new Date(item.sentToEstimation) : null,
          receivedFromEstimation: item.receivedFromEstimation ? new Date(item.receivedFromEstimation) : null,
          sentToCustomer: item.sentToCustomer ? new Date(item.sentToCustomer) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : null
        })) || []
      );

      setOfferRevisions(proposalRevisions?.offerrevisions);
      setDrawingRevisions(proposalRevisions?.drawingrevisions);
      setProposalDataIds(proposalRevisions?.proposals);
      if (action === 'Update') {
        formattedData = { ...formattedData, revNo: proposalRevisions?.offerRevisionsdata?.at(-1)?.revNo };
        setFormData(formattedData);
      }


    }
    else {
      setProposalRevData((prev) => {
        if (initialData?.revNo === null || initialData?.revNo === undefined) {
          return []
        }

        if (!Array.isArray(prev)) {
          return [{ revNo: initialData?.revNo }]
        } else {
          return [...prev, { revNo: initialData?.revNo }]
        }
      });
      setDrawingRevData((prev: any) => {
        if (initialData?.revNo === null || initialData?.revNo === undefined) {
          return []
        }

        if (!Array.isArray(prev)) {
          return [{ revNo: initialData?.revNo }]
        } else {
          return [...prev, { revNo: initialData?.revNo }]
        }
      })
    }

  }, [initialData]);


  function updateCycleTimeForArray(dataArray: any[]) {
    return dataArray.map(item => {
      const { sentToEstimation, receivedFromEstimation } = item;

      // Ensure both dates are valid
      if (!sentToEstimation) {
        console.log("Error: sentToEstimation or receivedFromEstimation should be there", item);
        alert("Error: sentToEstimation should not be empty.");
        return item;
      }

      // Check if receivedFromEstimation is less than sentToCustomer
      if (receivedFromEstimation < sentToEstimation) {

        alert("Error: receivedFromEstimation cannot be less than sentToCustomer.");
        const updatedFormData = {
          ...item,
          ['receivedFromEstimation']: sentToEstimation,
          ['cycleTime']: 0
        };

        return updatedFormData; // Skip calculation if the condition is violated
      }

      const rcvdDate: Date = new Date(receivedFromEstimation);
      const sentDate: Date = new Date(sentToEstimation);
      if (rcvdDate.getTime() === 0 || sentDate.getTime() === 0) {
        console.log("Error: One or both date values are invalid.");
        item.cycleTime = 0; // Ensure it's a string if required
      } else {
        // Calculate cycle time in days
        const cycleTime = (rcvdDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24);
        item.cycleTime = Math.trunc(cycleTime).toString();
      }

      return item; // Return the updated item
    });
  }

  const handleChange = (e: { target: { value: any } } | any[] | string | null | React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement> | null, fieldName: string, format: string, type: string, data: any[], field: { data: any[]; section: string; subSection?: string; } | undefined, revNo: any, customFunction = (dateValue: any) => { }) => {

    let value: any | string | null = "";
    fieldName === 'country' && setRegion(field?.data?.filter((item) => item._id === e)[0]?.region?.name);

    fieldName === 'industryType' && Array.isArray(data) && setIndustryType(data?.filter((item) => item._id === e)[0]?.name);

    fieldName === 'buildingType' && Array.isArray(data) && setBuildingType(data?.filter((item) => item._id === e)[0]?.name);

    fieldName === 'paintType' && Array.isArray(data) && setPaintType(data?.filter((item) => item._id === e)[0]?.name);

    fieldName === 'incoterm' && Array.isArray(data) && setIncotermDescription(data?.filter((item) => item._id === e)[0]?.description);

    (fieldName === "company" || fieldName === 'country' || fieldName === 'state' || fieldName === 'salesEngineer') && onchangeData({ id: e, fieldName, name: 'approvalAuthority' });

    if (type === "multiselect") {
      value = Array.isArray(e) ? e.map((item) => item.value) : ''; // Store only `_id`s as a comma-separated string
    } else if (type === "select") {
      value = typeof e === 'string' || typeof e === 'number' ? e : ""; // Ensure single select values are stored correctly
    } else {
      if (typeof e === 'string' || typeof e === 'number') {
        value = e;

      } else if (Array.isArray(e)) {
        value = e.map((item) => item.value).join(",");
      } else {
        value = (e as { target: { value: any } }).target.value ?? "";
      }

      if (fieldName === "quoteNo") {
        if (value !== undefined && value.length > 5) {
          value = value.slice(0, 5); // Truncate to the first 5 characters
        }
      }
    }

    if (field?.section !== 'CycleTimeDetails') {

      setFormData((prev) => {
        console.log(value);
        let formattedValue = value;
        if (format === "ObjectId") {
          formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : ""; // Validate ObjectId format
        } else if (format === "Date") {
          formattedValue = value ? new Date(value).toISOString() : ""; // Convert to ISO string or empty string
        }
        const updatedFormData = {
          ...prev,
          [fieldName]: formattedValue,
        };


        if (fieldName === "company") {
          updatedFormData['customerType'] = data.filter((item) => item?._id === e)[0]?.customerType?._id;

        }
        if (fieldName === "contact") {

          updatedFormData['position'] = data.filter((item) => item?._id === e)[0]?.position;
          updatedFormData['phone'] = data.filter((item) => item?._id === e)[0]?.phone;
          updatedFormData['email'] = data.filter((item) => item?._id === e)[0]?.email;

        }
        if (fieldName === "salesEngineer") {

          updatedFormData['sellingTeam'] = data.filter((item) => item?._id === e)[0]?.team;
          setSellingTeamData(data?.filter((item) => item?._id === e)[0]);

        }

        // Need to generalise later for other master components
        if (fieldName === "firstName" || fieldName === "lastName") {
          updatedFormData.fullName = `${updatedFormData.firstName || ""} ${updatedFormData.lastName || ""
            }`.trim();
        }
        customFunction(updatedFormData[fieldName as keyof typeof updatedFormData])

        return updatedFormData;
      });
    }


    ((field?.section === 'CycleTimeDetails' && field?.subSection === 'ProposalOffer') || fieldName === 'revNo') && setProposalRevData((prev) => {
      let formattedValue = value;
      if (format === "ObjectId") {
        formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : ""; // Validate ObjectId format
      } else if (format === "Date") {
        formattedValue = value ? new Date(value).toISOString() : ""; // Convert to ISO string or empty string
      }

      const updatedFormData = prev.map(item => {
        if (item.revNo === revNo || fieldName === 'revNo') { // Only update the specific revNo
          return { ...item, [fieldName]: formattedValue };
        }
        return item;
      });

      const updatedData = updateCycleTimeForArray(updatedFormData.sort((a, b) => a.revNo - b.revNo));

      customFunction(updatedData?.[revNo]?.[fieldName])

      return updatedData.sort((a, b) => a.revNo - b.revNo);
    })


    {
      ((field?.section === 'CycleTimeDetails' && field?.subSection === 'ProposalDrawing') || fieldName === 'revNo') && setDrawingRevData((prev: { revNo: any; }[]) => {
        let formattedValue = value;
        if (format === "ObjectId") {
          formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : ""; // Validate ObjectId format
        } else if (format === "Date") {
          formattedValue = value ? new Date(value).toISOString() : ""; // Convert to ISO string or empty string
        }

        const updatedFormData = prev.map(item => {
          if (item.revNo === revNo || fieldName === 'revNo') { // Only update the specific revNo
            return { ...item, [fieldName]: formattedValue };
          }
          return item;
        });

        const updatedData = updateCycleTimeForArray(updatedFormData.sort((a, b) => a.revNo - b.revNo));

        customFunction(updatedData?.[revNo]?.[fieldName])


        return updatedData.sort((a, b) => a.revNo - b.revNo);
      })
    };

    {
      (field?.section === 'Form2') && setFormDataSecondary((prev) => {
        let formattedValue = value;
        if (format === "ObjectId") {
          formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : ""; // Validate ObjectId format
        } else if (format === "Date") {
          formattedValue = value ? new Date(value).toISOString() : ""; // Convert to ISO string or empty string
        }
        const updatedFormData = {
          ...prev,
          [fieldName]: formattedValue,
        };

        // Update `fullName` if `firstName` or `lastName` changes
        // Need to generalise later for other master components
        if (fieldName === "firstName" || fieldName === "lastName") {
          updatedFormData.fullName = `${updatedFormData.firstName || ""} ${updatedFormData.lastName || ""
            }`.trim();
        }

        return updatedFormData;
      });
    }

    {
      (field?.section === 'Form3') && setFormDataNew((prev) => {
        let formattedValue = value;
        if (format === "ObjectId") {
          formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : ""; // Validate ObjectId format
        } else if (format === "Date") {
          formattedValue = value ? new Date(value).toISOString() : ""; // Convert to ISO string or empty string
        }

        const updatedFormData = {
          ...prev,
          [fieldName]: formattedValue,
        };

        // Update `fullName` if `firstName` or `lastName` changes
        // Need to generalise later for other master components
        if (fieldName === "firstName" || fieldName === "lastName") {
          updatedFormData.fullName = `${updatedFormData.firstName || ""} ${updatedFormData.lastName || ""
            }`.trim();
        }

        return updatedFormData;
      });
    }


  };


  // handle close
  const handleClose = async () => {
    try {

      const formattedData = Object.keys(initialData).reduce((acc: Record<string, any>, key: string) => {
        if (typeof initialData[key] === "object" && initialData[key]?._id) {
          // If the field is an object with an _id, store the _id
          acc[key] = initialData[key]._id;
        } else {
          acc[key] = initialData[key];
        }
        return acc;
      }, {});

      setFormData(formattedData);
      // Save the data to the database (e.g., via an API call)
      closeDialog();
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };


  const saveDataQuotation = async ({ formData, action, master }: { formData: Record<string, any>, action: string, master: keyof typeof MONGO_MODELS }) => {

    const formattedData: any = {
      db: MONGO_MODELS[master],
      action: action === 'Add' ? 'create' : (formData._id ? 'update' : 'create'),
      filter: { "_id": formData._id },
      data: formData,
    };

    const response: any = await createMaster(formattedData);

    if (response?.error?.data?.message) {
      toast.error(`Error encountered: ${response?.error?.data?.message?.errorResponse?.errmsg}`);
      return new Error("Something went wrong!")
    }

    if (formattedData?.action === 'create') return response;

  };

  const addRevisionsToProposal = async (data: any[], master: string) => {
    const response = await Promise.allSettled(data.flatMap(pType => {
      // Ensure `pType.data` is an array and iterate over it
      return Array.isArray(pType.data) ? pType.data.map((obj: any) => {
        const updatedData = {
          ...obj,
          addedBy: user?._id,
          updatedBy: user?._id
        };
        return saveDataQuotation({ formData: updatedData, action, master: master as keyof typeof MONGO_MODELS });
      }) : [];
    }));

    return response;
  };

  const handleSubmitQuotation1 = async (status: string) => {

    if (status === 'quoterequested') {

      setIsQuoteNoExistDialogOpen(true);

    }
    else {

      handleSubmitQuotation(status, false);
    }
  }

  // Handle form submission
  const handleSubmitQuotation = async (status: string, quoteExists: boolean) => {
    try {
      if (!(formData?.country && formData?.salesEngineer && formData?.salesSupportEngineer?.length > 0 && formData?.rcvdDateFromCustomer && formData?.sellingTeam && formData?.responsibleTeam)) {

        toast.error(`Please fill the required fields.`);
        return;
      }


      let emailData = {}
      const master = 'QUOTATION_MASTER';
      if (action === 'Add') {

        const updatedProposalRevData = proposalRevData.map((item: { changes: any; }, index: number) =>
          index === proposalRevData.length - 1 // Check if it's the last index
            ? { ...item, changes: { ...item.changes, ...formData, status } } // Merge existing changes with new ones
            : item
        );

        const revisionTypes = [{
          data: proposalRevData
        },
        {
          data: drawingRevData
        }
        ]
        const responseIds: any = await addRevisionsToProposal(revisionTypes, 'PROPOSAL_REVISION_MASTER');

        const proposalData = [{
          data: [{ revisions: [...offerRevisions, responseIds[0]?.value?.data?.data?._id], type: "ProposalOffer" }]
        },
        {
          data: [{ revisions: [...drawingRevisions, responseIds[1]?.value?.data?.data?._id], type: "ProposalDrawing" }]
        }
        ]

        const proposalIds: any = await addRevisionsToProposal(proposalData, 'PROPOSAL_MASTER');

        const proposals = proposalIds.map((item: { value: { data: { data: { _id: any; }; }; }; }) => item.value?.data?.data?._id).filter((id: any) => id);

        const quotationData = {
          data: {
            ...formData, proposals: proposals, status: status, handleBy: formData?.salesEngineer, addedBy: user?._id,
            updatedBy: user?._id
          }
        };

        const response: any = await onSave({ formData: quotationData?.data, action, master: master });

        if (status === 'quoterequested') {

          const quoteData = {
            'Quote Details': '', 'Country': response?.data?.data?.country?.name, 'Year': response?.data?.data?.year,
            'Option': response?.data?.data?.option, 'Quote Status': response?.data?.data?.quoteStatus?.name, 'Rev No': response?.data?.data?.revNo,
            'Sales Engineer / Manager': response?.data?.data?.salesEngineer?.user?.displayName?.toProperCase(), 'Sales Support Engineer 1': response?.data?.data?.salesSupportEngineer[0]?.user?.displayName?.toProperCase(), 'Sales Support Engineer 2': response?.data?.data?.customerType?.salesSupportEngineer?.[1] && response?.data?.data?.customerType?.salesSupportEngineer[1]?.user?.displayName?.toProperCase(),
            'Sales Support Engineer 3': response?.data?.data?.customerType?.salesSupportEngineer?.[2] && response?.data?.data?.salesSupportEngineer[2]?.user?.displayName?.toProperCase(), 'Received Date From Customer': moment(response?.data?.data?.rcvdDateFromCustomer).format("DD-MMM-YYYY hh:mm A"), 'Selling Team': response?.data?.data?.sellingTeam?.name,
            'ResponsibleTeam': response?.data?.data?.responsibleTeam?.name,
            'Customer Details': '', 'Company Name': response?.data?.data?.company?.name,
            'Contact name': response?.data?.data?.contact?.name, 'Contact Email': response?.data?.data?.contact?.email, 'Contact Number': response?.data?.data?.contact?.phone,
            'Position': response?.data?.data?.contact?.position, 'Customer Type': response?.data?.data?.customerType?.name,
            'Project Details': '',
            'Project Name': response?.data?.data?.projectName, 'Sector': response?.data?.data?.sector?.name, 'Industry Type': response?.data?.data?.industryType?.name,
            'Other Industry Type': response?.data?.data?.otherIndustryType, 'Building Type': response?.data?.data?.buildingType?.name, 'Other Building Type': response?.data?.data?.otherBuildingType,
            'Building Usage': response?.data?.data?.buildingUsage, 'City': response?.data?.data?.state?.name, 'Approval Authority': response?.data?.data?.approvalAuthority?.code,
            'Plot Number': response?.data?.data?.plotNumber, 'End Client': response?.data?.data?.endClient, 'Project Management Office': response?.data?.data?.projectManagementOffice,
            'Consultant': response?.data?.data?.consultant, 'Main Contractor': response?.data?.data?.mainContractor, 'Erector': response?.data?.data?.erector,
          };

          emailData = { recipient: sellingTeamData?.email, subject: 'Quote No Request', templateData: quoteData, fileName: "aqmTemplates/quoteNoRequest", senderName: user?.displayName?.toProperCase(), approveUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteConfirmation?status=true&_id=${response?.data?.data?._id}&name=${master}&year=${response?.data?.data?.year}&option=${response?.data?.data?.option}`, rejectUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteConfirmation?status=false&_id=${response?.data?.data?._id}&name=${master}` };

          !quoteExists && await sendEmail(emailData);
        };

      }
      else {

        if (formData['quoteNo'] && !/^\d{5}$/.test(formData['quoteNo'])) {
          toast.error('Quote No should be of 5 digits.')
          return;
        }

        if ((formData['quoteNo'] === null || formData['quoteNo'] === '') && status === 'incomplete') {
          toast.error('Please enter quote no to proceed.')
          return;
        }

        if (formData['quoteNo']) {
          const { data }: any = await getApplication({
            db: 'QUOTATION_MASTER',
            filter: { year: formData['year'], option: formData['option'], quoteNo: formData['quoteNo'], _id: { $ne: initialData['_id'] } },
            sort: { name: 'asc' },
          });

          if (data?.data?.length > 0) {
            toast.error('Quotation already exists. Please check quotation no and option.');
            return;
          } else {
            console.log("No matching records found!");
          }
        }

        // Update the last index
        // Add switch staements
        if (status === 'delete') {
          const confirmDelete = window.confirm("Are you sure you want to delete this item?");
          if (confirmDelete) {
            const updatedProposalRevData = proposalRevData.map((item: { changes: any; }, index: number) =>
              index === proposalRevData.length - 1 // Check if it's the last index
                ? { ...item, changes: { ...item.changes, ...formData, isActive: false } } // Merge existing changes with new ones
                : item
            );

            const revisionTypesProposal = [{
              data: updatedProposalRevData
            }
            ]

            const revisionTypesDrawing = [
              {
                data: drawingRevData
              }
            ]
            const responseIdsProposal: any = await addRevisionsToProposal(revisionTypesProposal, 'PROPOSAL_REVISION_MASTER')

            const responseIdsDrawing: any = await addRevisionsToProposal(revisionTypesDrawing, 'PROPOSAL_REVISION_MASTER')

            const proposalData = [{
              data: [{
                _id: proposalDataIds[0], revisions: [
                  ...offerRevisions,
                  responseIdsProposal[0]?.value?.data?.data?._id || undefined, // Ensures valid ID or nothing
                ].filter(Boolean), type: "ProposalOffer"
              }]
            },
            {
              data: [{
                _id: proposalDataIds[1], revisions: [
                  ...drawingRevisions,
                  responseIdsDrawing[0]?.value?.data?.data?._id || undefined,
                ].filter(Boolean), type: "ProposalDrawing"
              }]
            }
            ]

            const proposalIds = await addRevisionsToProposal(proposalData, 'PROPOSAL_MASTER');

            delete formData?.proposals;
            const quotationData = {
              data: {
                ...formData, isActive: false,
                updatedBy: user?._id
              }
            }
            const response: any = await onSave({ formData: quotationData?.data, action, master: master });

            const quoteData = {
              'Quote Details': '', 'Country': response?.data?.data?.country?.name, 'Year': response?.data?.data?.year,
              'Option': response?.data?.data?.option, 'Quote Status': response?.data?.data?.quoteStatus?.name, 'Rev No': response?.data?.data?.revNo,
              'Sales Engineer / Manager': response?.data?.data?.salesEngineer?.user?.displayName?.toProperCase(), 'Sales Support Engineer 1': response?.data?.data?.salesSupportEngineer[0]?.user?.displayName?.toProperCase(), 'Sales Support Engineer 2': response?.data?.data?.customerType?.salesSupportEngineer?.[1] && response?.data?.data?.customerType?.salesSupportEngineer[1]?.user?.displayName?.toProperCase(),
              'Sales Support Engineer 3': response?.data?.data?.customerType?.salesSupportEngineer?.[2] && response?.data?.data?.salesSupportEngineer[2]?.user?.displayName?.toProperCase(), 'Received Date From Customer': moment(response?.data?.data?.rcvdDateFromCustomer).format("DD-MMM-YYYY hh:mm A"), 'Selling Team': response?.data?.data?.sellingTeam?.name,
              'ResponsibleTeam': response?.data?.data?.responsibleTeam?.name,
              'Customer Details': '', 'Company Name': response?.data?.data?.company?.name,
              'Contact name': response?.data?.data?.contact?.name, 'Contact Email': response?.data?.data?.contact?.email, 'Contact Number': response?.data?.data?.contact?.phone,
              'Position': response?.data?.data?.contact?.position, 'Customer Type': response?.data?.data?.customerType?.name,
              'Project Details': '',
              'Project Name': response?.data?.data?.projectName, 'Sector': response?.data?.data?.sector?.name, 'Industry Type': response?.data?.data?.industryType?.name,
              'Other Industry Type': response?.data?.data?.otherIndustryType, 'Building Type': response?.data?.data?.buildingType?.name, 'Other Building Type': response?.data?.data?.otherBuildingType,
              'Building Usage': response?.data?.data?.buildingUsage, 'City': response?.data?.data?.state?.name, 'Approval Authority': response?.data?.data?.approvalAuthority?.code,
              'Plot Number': response?.data?.data?.plotNumber, 'End Client': response?.data?.data?.endClient, 'Project Management Office': response?.data?.data?.projectManagementOffice,
              'Consultant': response?.data?.data?.consultant, 'Main Contractor': response?.data?.data?.mainContractor, 'Erector': response?.data?.data?.erector,
              'Cycle Time Details': '',
              'Rev No (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.revNo, 'Sent To Estimation (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToEstimation ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToEstimation).format("DD-MMM-YYYY hh:mm A") : '', 'Received From Estimation (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.receivedFromEstimation ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.receivedFromEstimation).format("DD-MMM-YYYY hh:mm A") : '',
              'Cycle Time (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.cycleTime, 'Sent To Customer (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToCustomer ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToCustomer).format("DD-MMM-YYYY hh:mm A") : '',
              'Rev No (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.revNo, 'Sent To Estimation (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToEstimation ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToEstimation).format("DD-MMM-YYYY hh:mm A") : '', 'Received From Estimation (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.receivedFromEstimation ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.receivedFromEstimation).format("DD-MMM-YYYY hh:mm A") : '',
              'Cycle Time (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.cycleTime, 'Sent To Customer (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToCustomer ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToCustomer).format("DD-MMM-YYYY hh:mm A") : '',
              'Technical Details': '',
              'No Of Buildings': response?.data?.data?.noOfBuilding, 'Project Type': response?.data?.data?.projectType?.name, 'Paint Type': response?.data?.data?.paintType?.name,
              'Other Paint Type': response?.data?.data?.otherPaintType, 'Projected Area (Sqr Mtr)': response?.data?.data?.projectedArea, 'Total Weight (Tons)': response?.data?.data?.totalWt,
              'Mezzanine Area (Sq Mtr)': response?.data?.data?.mezzanineArea, 'Mezzanine Weight (Tons)': response?.data?.data?.mezzanineWt,
              'Commercial Details': '',
              'Currency': response?.data?.data?.currency?.name, 'Total Estimated Price': response?.data?.data?.totalEstPrice, 'Q22 Value (AED)': response?.data?.data?.q22Value,
              'Special BuyOut Price': response?.data?.data?.spBuyoutPrice, 'Freight Price': response?.data?.data?.freightPrice, 'Incoterm': response?.data?.data?.incoterm?.name,
              'Incoterm Description': response?.data?.data?.incotermDescription, 'Booking Probability': response?.data?.data?.bookingProbability,

            };

            emailData = { recipient: sellingTeamData?.teamHead[0]?.email, subject: `Quote Deleted`, templateData: quoteData, fileName: "aqmTemplates/quoteDeleted", senderName: user?.displayName?.toProperCase(), approveUrl: ``, rejectUrl: `` };
            await sendEmail(emailData);

            setFormData({});
            setOfferRevisions([]);
            setDrawingRevisions([]);
            setProposalDataIds({});

            closeDialog();

            return;
          };
          return;

        };

        if (status === 'approved' || status === 'rejected') {
          if (formData['rejectReason'] === null || formData['rejectReason'] === '') {
            toast.error('Please enter reason to reject.')
            return;
          }
          if (status === 'rejected') {
            const rejectedData = {
              _id: initialData['_id'],
              status: status,
              rejectReason: formData['rejectReason'],
              rejectedDate: new Date()
            };

            const response: any = await onSave({ formData: rejectedData, action, master });
            const emailData = { recipient: response?.data?.data?.salesEngineer?.user?.email, subject: `Quote Rejected : ${response?.data?.data?.country?.countryCode}-${response?.data?.data?.year?.toString().slice(-2)}-${response?.data?.data?.quoteNo}`, templateData: '', fileName: "aqmTemplates/quoteApprovalRequestRejected", senderName: 'Sales Director', approveUrl: '', rejectUrl: '', reason: formData['rejectReason'] };
            await sendEmail(emailData);
            toast.success(`Quote approval request rejected successfully.`);
          }
          else {

            const approvedData = {
              _id: formData['_id'],
              status: status
            };

            const response: any = await onSave({ formData: approvedData, action, master });

            const emailData = { recipient: response?.data?.data?.salesEngineer?.user?.email, subject: `Quote Approved : ${response?.data?.data?.country?.countryCode}-${response?.data?.data?.year?.toString().slice(-2)}-${response?.data?.data?.quoteNo}`, templateData: '', fileName: "aqmTemplates/quoteApprovalApproved", senderName: 'Sales Director', approveUrl: '', rejectUrl: '' };
            await sendEmail(emailData);
            toast.success(`Quote approval request approved successfully.`);
          }


          setFormData({});
          setOfferRevisions([]);
          setDrawingRevisions([]);
          setProposalDataIds({});

          closeDialog();

          return;
        };

        const updatedProposalRevData = proposalRevData.map((item: { changes: any; }, index: number) =>
          index === proposalRevData.length - 1 // Check if it's the last index
            ? { ...item, changes: { ...item.changes, ...formData, status } } // Merge existing changes with new ones
            : item
        );

        const revisionTypesProposal = [{
          data: updatedProposalRevData
        }
        ]

        const revisionTypesDrawing = [
          {
            data: drawingRevData
          }
        ]
        const responseIdsProposal: any = await addRevisionsToProposal(revisionTypesProposal, 'PROPOSAL_REVISION_MASTER')

        const responseIdsDrawing: any = await addRevisionsToProposal(revisionTypesDrawing, 'PROPOSAL_REVISION_MASTER')

        const proposalData = [{
          data: [{
            _id: proposalDataIds[0], revisions: [
              ...offerRevisions,
              responseIdsProposal[0]?.value?.data?.data?._id || undefined, // Ensures valid ID or nothing
            ].filter(Boolean), type: "ProposalOffer"
          }]
        },
        {
          data: [{
            _id: proposalDataIds[1], revisions: [
              ...drawingRevisions,
              responseIdsDrawing[0]?.value?.data?.data?._id || undefined,
            ].filter(Boolean), type: "ProposalDrawing"
          }]
        }
        ]

        const proposalIds = await addRevisionsToProposal(proposalData, 'PROPOSAL_MASTER');

        delete formData?.proposals;
        const quotationData = {
          data: {
            ...formData, status: status,
            updatedBy: user?._id
          }
        }
        const response: any = await onSave({ formData: quotationData?.data, action, master: master });
        if (status === 'quoterequested') {
          const quoteData = {
            'Quote Details': '', 'Country': response?.data?.data?.country?.name, 'Year': response?.data?.data?.year,
            'Option': response?.data?.data?.option, 'Quote Status': response?.data?.data?.quoteStatus?.name, 'Rev No': response?.data?.data?.revNo,
            'Sales Engineer / Manager': response?.data?.data?.salesEngineer?.user?.displayName?.toProperCase(), 'Sales Support Engineer 1': response?.data?.data?.salesSupportEngineer[0]?.user?.displayName?.toProperCase(), 'Sales Support Engineer 2': response?.data?.data?.customerType?.salesSupportEngineer?.[1] && response?.data?.data?.customerType?.salesSupportEngineer[1]?.user?.displayName?.toProperCase(),
            'Sales Support Engineer 3': response?.data?.data?.customerType?.salesSupportEngineer?.[2] && response?.data?.data?.salesSupportEngineer[2]?.user?.displayName?.toProperCase(), 'Received Date From Customer': moment(response?.data?.data?.rcvdDateFromCustomer).format("DD-MMM-YYYY hh:mm A"), 'Selling Team': response?.data?.data?.sellingTeam?.name,
            'ResponsibleTeam': response?.data?.data?.responsibleTeam?.name,
            'Customer Details': '', 'Company Name': response?.data?.data?.company?.name,
            'Contact name': response?.data?.data?.contact?.name, 'Contact Email': response?.data?.data?.contact?.email, 'Contact Number': response?.data?.data?.contact?.phone,
            'Position': response?.data?.data?.contact?.position, 'Customer Type': response?.data?.data?.customerType?.name,
            'Project Details': '',
            'Project Name': response?.data?.data?.projectName, 'Sector': response?.data?.data?.sector?.name, 'Industry Type': response?.data?.data?.industryType?.name,
            'Other Industry Type': response?.data?.data?.otherIndustryType, 'Building Type': response?.data?.data?.buildingType?.name, 'Other Building Type': response?.data?.data?.otherBuildingType,
            'Building Usage': response?.data?.data?.buildingUsage, 'City': response?.data?.data?.state?.name, 'Approval Authority': response?.data?.data?.approvalAuthority?.code,
            'Plot Number': response?.data?.data?.plotNumber, 'End Client': response?.data?.data?.endClient, 'Project Management Office': response?.data?.data?.projectManagementOffice,
            'Consultant': response?.data?.data?.consultant, 'Main Contractor': response?.data?.data?.mainContractor, 'Erector': response?.data?.data?.erector,
          };

          emailData = { recipient: sellingTeamData?.teamHead[0]?.email, subject: 'Quote No Request', templateData: quoteData, fileName: "aqmTemplates/quoteNoRequest", senderName: user?.displayName?.toProperCase(), approveUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteConfirmation?status=true&_id=${response?.data?.data?._id}&name=${master}&year=${response?.data?.data?.year}&option=${response?.data?.data?.option}`, rejectUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteConfirmation?status=false&_id=${response?.data?.data?._id}&name=${master}` };

          !quoteExists && await sendEmail(emailData);

        }
        if (status === 'submitted') {
          const quoteData = {
            'Quote Details': '', 'Country': response?.data?.data?.country?.name, 'Year': response?.data?.data?.year,
            'Option': response?.data?.data?.option, 'Quote Status': response?.data?.data?.quoteStatus?.name, 'Rev No': response?.data?.data?.revNo,
            'Sales Engineer / Manager': response?.data?.data?.salesEngineer?.user?.displayName?.toProperCase(), 'Sales Support Engineer 1': response?.data?.data?.salesSupportEngineer[0]?.user?.displayName?.toProperCase(), 'Sales Support Engineer 2': response?.data?.data?.customerType?.salesSupportEngineer?.[1] && response?.data?.data?.customerType?.salesSupportEngineer[1]?.user?.displayName?.toProperCase(),
            'Sales Support Engineer 3': response?.data?.data?.customerType?.salesSupportEngineer?.[2] && response?.data?.data?.salesSupportEngineer[2]?.user?.displayName?.toProperCase(), 'Received Date From Customer': moment(response?.data?.data?.rcvdDateFromCustomer).format("DD-MMM-YYYY hh:mm A"), 'Selling Team': response?.data?.data?.sellingTeam?.name,
            'ResponsibleTeam': response?.data?.data?.responsibleTeam?.name,
            'Customer Details': '', 'Company Name': response?.data?.data?.company?.name,
            'Contact name': response?.data?.data?.contact?.name, 'Contact Email': response?.data?.data?.contact?.email, 'Contact Number': response?.data?.data?.contact?.phone,
            'Position': response?.data?.data?.contact?.position, 'Customer Type': response?.data?.data?.customerType?.name,
            'Project Details': '',
            'Project Name': response?.data?.data?.projectName, 'Sector': response?.data?.data?.sector?.name, 'Industry Type': response?.data?.data?.industryType?.name,
            'Other Industry Type': response?.data?.data?.otherIndustryType, 'Building Type': response?.data?.data?.buildingType?.name, 'Other Building Type': response?.data?.data?.otherBuildingType,
            'Building Usage': response?.data?.data?.buildingUsage, 'City': response?.data?.data?.state?.name, 'Approval Authority': response?.data?.data?.approvalAuthority?.code,
            'Plot Number': response?.data?.data?.plotNumber, 'End Client': response?.data?.data?.endClient, 'Project Management Office': response?.data?.data?.projectManagementOffice,
            'Consultant': response?.data?.data?.consultant, 'Main Contractor': response?.data?.data?.mainContractor, 'Erector': response?.data?.data?.erector,
            'Cycle Time Details': '',
            'Rev No (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.revNo, 'Sent To Estimation (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToEstimation ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToEstimation).format("DD-MMM-YYYY hh:mm A") : '', 'Received From Estimation (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.receivedFromEstimation ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.receivedFromEstimation).format("DD-MMM-YYYY hh:mm A") : '',
            'Cycle Time (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.cycleTime, 'Sent To Customer (Proposal Offer)': response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToCustomer ? moment(response?.data?.data?.proposals[0]?.revisions?.at(-1)?.sentToCustomer).format("DD-MMM-YYYY hh:mm A") : '',
            'Rev No (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.revNo, 'Sent To Estimation (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToEstimation ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToEstimation).format("DD-MMM-YYYY hh:mm A") : '', 'Received From Estimation (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.receivedFromEstimation ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.receivedFromEstimation).format("DD-MMM-YYYY hh:mm A") : '',
            'Cycle Time (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.cycleTime, 'Sent To Customer (Proposal Drawing)': response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToCustomer ? moment(response?.data?.data?.proposals[1]?.revisions?.at(-1)?.sentToCustomer).format("DD-MMM-YYYY hh:mm A") : '',
            'Technical Details': '',
            'No Of Buildings': response?.data?.data?.noOfBuilding, 'Project Type': response?.data?.data?.projectType?.name, 'Paint Type': response?.data?.data?.paintType?.name,
            'Other Paint Type': response?.data?.data?.otherPaintType, 'Projected Area (Sqr Mtr)': response?.data?.data?.projectedArea, 'Total Weight (Tons)': response?.data?.data?.totalWt,
            'Mezzanine Area (Sq Mtr)': response?.data?.data?.mezzanineArea, 'Mezzanine Weight (Tons)': response?.data?.data?.mezzanineWt,
            'Commercial Details': '',
            'Currency': response?.data?.data?.currency?.name, 'Total Estimated Price': response?.data?.data?.totalEstPrice, 'Q22 Value (AED)': response?.data?.data?.q22Value,
            'Special BuyOut Price': response?.data?.data?.spBuyoutPrice, 'Freight Price': response?.data?.data?.freightPrice, 'Incoterm': response?.data?.data?.incoterm?.name,
            'Incoterm Description': response?.data?.data?.incotermDescription, 'Booking Probability': response?.data?.data?.bookingProbability,

          };

          emailData = { recipient: sellingTeamData?.teamHead[0]?.email, subject: `Quote Submitted For Approval : ${response?.data?.data?.country?.countryCode}-${response?.data?.data?.year?.toString().slice(-2)}-${response?.data?.data?.quoteNo}`, templateData: quoteData, fileName: "aqmTemplates/quoteApprovalRequest", senderName: user?.displayName?.toProperCase(), approveUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteApproval?status=true&_id=${response?.data?.data?._id}&name=${master}`, rejectUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/quoteApproval?status=false&_id=${response?.data?.data?._id}&name=${master}` };
          await sendEmail(emailData);
        }

      };
      setFormData({});
      setOfferRevisions([]);
      setDrawingRevisions([]);
      setProposalDataIds({});

      closeDialog();
      setIsQuoteNoExistDialogOpen(false);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (Form: string, data: Record<string, any>) => {
    try {

      const updatedData = {
        ...data, // Spread the existing properties of the object
        addedBy: user?._id,
        updatedBy: user?._id
      };

      let master: keyof typeof MONGO_MODELS = "CUSTOMER_MASTER"; // Default value
      if (Form === 'Form2') {
        switch (secondaryDialogType) {
          case "Company Name":
            master = "CUSTOMER_MASTER";
            break;

          case "Contact Name":
            master = "CUSTOMER_CONTACT_MASTER";
            break;

          case "City":
            master = "STATE_MASTER";
            break;
          case "Approval Authority (GCC Only)":
            master = "APPROVAL_AUTHORITY_MASTER";
            break;

          default:
            break;
        }
      }
      else {
        switch (newDialogType) {
          case "Location":
            master = "LOCATION_MASTER";
            break;

        }
      }
      let emailData = {};
      const response: any = await onSave({ formData: updatedData, action: 'create', master });
      switch (master) {
        case "CUSTOMER_MASTER":
          const companyData = {
            'Company Name': response?.data?.data?.name, 'Website': response?.data?.data?.website, 'Email': response?.data?.data?.email,
            'Phone': response?.data?.data?.phone, 'Address': response?.data?.data?.address, 'Customer Type': response?.data?.data?.customerType?.name
          };
          await onchangeData({ id: response?.data?.data?.customer?._id, fieldName: 'company', name: response?.data?.data?.name })
          handleChange(response?.data?.data?._id, "company", "ObjectId", "select", [], undefined, undefined);
          emailData = { recipient: sellingTeamData?.email, subject: 'New Customer Added', templateData: companyData, fileName: "aqmTemplates/newCustomerTemplate", senderName: user?.displayName?.toProperCase(), approveUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/confirmation?status=true&_id=${response?.data?.data?._id}&name=${master}`, rejectUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/confirmation?status=false&_id=${response?.data?.data?._id}&name=${master}` };

          await sendEmail(emailData);

          break;

        case "CUSTOMER_CONTACT_MASTER":

          await onchangeData({ id: response?.data?.data?._id, fieldName: 'contact', name: response?.data?.data?.name, parentId: response?.data?.data?.customer?._id, position: response?.data?.data?.position, email: response?.data?.data?.email, phone: response?.data?.data?.phone })
          handleChange(response?.data?.data?._id, "contact", "ObjectId", "select", [response?.data?.data], undefined, undefined);

          break;

        case "STATE_MASTER":
          await onchangeData({ id: response?.data?.data?._id, fieldName: 'state', name: response?.data?.data?.name, parentId: response?.data?.data?.country?._id })
          handleChange(response?.data?.data?._id, "state", "ObjectId", "select", [], undefined, undefined);
          break;

        case "APPROVAL_AUTHORITY_MASTER":
          const authorityData = {
            'Authority Code': response?.data?.data?.code, 'Authority Name': response?.data?.data?.name, 'Emirate': response?.data?.data?.location[0]?.state?.name
          };
          await onchangeData({ id: response?.data?.data?._id, fieldName: 'approvalAuthority', name: response?.data?.data?.code, parentId: response?.data?.data?.location?.state?._id, location: response?.data?.data?.location })
          handleChange(response?.data?.data?._id, "state", "ObjectId", "select", [], undefined, undefined);

          emailData = { recipient: sellingTeamData?.email, subject: 'New Approval Authority Added', templateData: authorityData, fileName: "aqmTemplates/newApprovalAuthority", senderName: user?.displayName?.toProperCase(), approveUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/confirmation?status=true&_id=${response?.data?.data?._id}&name=${master}`, rejectUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/utility/confirmation?status=false&_id=${response?.data?.data?._id}&name=${master}` };
          const response1 = await sendEmail(emailData);
          break;

        default:
          break;
      }
      toast.success('Data added successfully.');
      Form === 'Form2' ? setIsSecondaryDialogOpen(false) : setIsNewDialogOpen(false);;
      // closeDialog();
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  interface FieldObject {
    addNew: string;
    label: string;
    name: string;
    type: string;
    section: string;
    subSection?: string;
    data: { value: any; label: string }[];
    placeholder?: string;
    format: string;
    required?: boolean;
    readOnly?: boolean;
    CustomComponent?: React.FC<{ accessData: any }>;
  }

  interface RevType {
    [key: string]: any;
    revNo?: string | number;
  }

  const renderField = (
    field: FieldObject | FieldObject[] | undefined,
    placeholder: string | undefined,
    subSection: string | undefined,
    rev: RevType | undefined
  ) => {
    if (field && "type" in field) {
      switch (field.type) {
        case "multiselect":
          return (
            <MultipleSelector
              value={(field.section === "Form2" ? formDataSecondary[field.name] : formData[field.name])?.map((id: any) => ({
                value: id,
                label: field.data?.find((option) => option.value === id)?.label || "Unknown",
              })) || []}
              onChange={(selected) => handleChange(selected, field.name, "", "multiselect", field?.data, { ...field, subSection: field.subSection || '' }, rev?.revNo)}
              options={field.data || []}
              placeholder={field.placeholder || "Select options..."}
            />
          );

        case "textarea":
          return (
            <textarea
              rows={3}
              onChange={(e) => handleChange(e, field.name, field?.format, field.type, field.data, field, undefined)}
              value={formData[field.name] || ""}
              placeholder={field.placeholder || ""}
            />
          );

        case "select":
          if (action === "Update" && field.name === "revNo") {
            return (
              <Input
                type="text"
                onChange={(e) => handleChange(e, field.name, field.format, "text", field.data, field, rev?.revNo)}
                value={
                  field.section !== "CycleTimeDetails"
                    ? field.section === "Form2"
                      ? formDataSecondary[field.name]
                      : formData[field.name]
                    : rev?.[field.name] || ""
                }
                readOnly={field.readOnly}
                placeholder={field.placeholder || placeholder || ""}
                required={field.required || false}
                className="w-full"
              />
            );
          } else {
            return <Combobox field={field} formData={field.section === "Form2" ? formDataSecondary : formData} handleChange={handleChange} placeholder={field.placeholder || ""} />;
          }

        case "date":

          return (
            <DatePicker
              currentDate={field.section !== "CycleTimeDetails" ? formData[field.name] : rev?.[field.name] ? new Date(rev[field.name]) : undefined}
              handleChange={(selectedDate: { toISOString: () => any; }, setDate: (() => void) | undefined) => {
                handleChange({ target: { value: selectedDate?.toISOString() || "" } },
                  field.name,
                  field.format,
                  field.type,
                  field.data,
                  field,
                  rev?.revNo,
                  setDate);
                return true;
              }}
              placeholder={field.placeholder || ""}
            />
          );

        case "custom":
          return field.CustomComponent ? <field.CustomComponent accessData={formData[field.name]} /> : null;

        default:
          return (
            <Input
              type={field.type}
              onChange={(e) => handleChange(e, field.name, field.format, field.type, field.data, field, rev?.revNo)}
              value={
                field.section !== "CycleTimeDetails"
                  ? field.section === "Form2"
                    ? formDataSecondary[field.name]
                    : formData[field.name]
                  : rev?.[field.name] || ""
              }
              readOnly={field.readOnly}
              placeholder={field.placeholder || placeholder || ""}
              required={field.required || false}
              className="w-full"
            />
          );
      }
    }
  };

  const openSecondaryDialog = (type: React.SetStateAction<string>, data: React.SetStateAction<never[]>, field: { data: any[]; section: string; subSection?: string; } | undefined) => {

    setApprovalAuthorityData(data)
    setFormDataSecondary({});
    switch (type) {
      case "Company Name":
        setSecondaryFields(customerfields);
        break;

      case "Contact Name":
        setSecondaryFields(customerContactfields);
        handleChange(formData["company"], "customer", "ObjectId", "select", [], field, undefined);
        break;

      case "City":
        setSecondaryFields(cityfields);
        handleChange(formData["country"], "country", "ObjectId", "select", [], field, undefined);
        break;

      case "Approval Authority (GCC Only)":
        setSecondaryFields(approvalAuthorityFields);

        break;
      default:

        break;
    }

    setSecondaryDialogType(type);
    setIsSecondaryDialogOpen(true);

  };

  const openNewDialog = (type: React.SetStateAction<string>) => {

    setFormDataNew({});

    setNewFields(locationFields);
    setNewDialogType(type);
    setIsNewDialogOpen(true);

  };

  const handleAddRev = () => {

    const newObjectOffer = {
      revNo: proposalRevData[0]?.revNo + 1,
      sentToEstimation: null,
      receivedFromEstimation: null,
      sentToCustomer: null,
      cycleTime: 0,
      notes: ""
    };

    const newObjectDrawing = {
      revNo: drawingRevData[0]?.revNo + 1,
      sentToEstimation: null,
      receivedFromEstimation: null,
      sentToCustomer: null,
      cycleTime: 0,
      notes: ""
    };
    if (!proposalRevData[0]?.sentToCustomer) {
      toast.error('Please fill all the details and save the current revision first.');
      return;
    }
    // Add new object to existing array
    isProposalOffer && proposalRevData[0]?.sentToCustomer && (proposalRevData.length === initialData?.proposals?.[0]?.revisions.length) && setFormData(formData => ({ ...formData, revNo: proposalRevData[0]?.revNo + 1 }));

    isProposalOffer ? (proposalRevData.length === initialData?.proposals?.[0]?.revisions.length) && proposalRevData[0]?.sentToCustomer && setProposalRevData(prevData => [...prevData, newObjectOffer]) : (drawingRevData.length === initialData?.proposals?.[1]?.revisions.length) && drawingRevData[0]?.sentToCustomer && setDrawingRevData((prevData: any) => [...prevData, newObjectDrawing]);
  };

  const handleCheckboxChange = () => {

    if (proposalRevData.length === initialData?.proposals?.[0]?.revisions.length + 1) {
      setIsChecked((prev) => !prev); // Toggle checkbox state

      if (!isChecked) {
        // If checked, add proposalRevData[0] (without _id) to drawingRevData
        const { _id, ...dataWithoutId } = proposalRevData[0] || {};
        setDrawingRevData([...drawingRevData, dataWithoutId]);
      } else {
        // If unchecked, retain only the previous drawingRevData (remove newly added data)
        setDrawingRevData((prevData: any[]) =>
          prevData.filter((item: { _id: any; }) => !proposalRevData.some((p: { _id: any; }) => p._id === item._id))
        );
      }
    }

  };

  return (
    <>

      <Dialog open={isOpen} onOpenChange={closeDialog} >
        <DialogContent
          className={`bg-white max-w-full pointer-events-auto mx-2 h-screen max-h-[95vh] ${width === 'full' ? 'w-[97%] h-[95%]' : 'sm:max-w-md lg:max-w-3xl'}`}
        >
          <DialogTitle className="pl-1 hidden">{formData?.quoteNo ? `${action} ${selectedMaster?.toProperCase()} ${initialData?.country?.countryCode}-${initialData?.year?.toString().slice(-2)}-${formData?.quoteNo}` : `${action} ${selectedMaster?.toProperCase()}`}</DialogTitle>

          <div className="h-full flex flex-col min-h-0">
            {/* Title/Header Section */}
            <div className="flex items-center justify-between py-3 ">
              <div className="flex  items-center gap-3 font-semibold text-base">
                <div>
                  {formData?.quoteNo ? `${selectedMaster?.toProperCase()}   (${initialData?.country?.countryCode}-${initialData?.year?.toString().slice(-2)}-${formData?.quoteNo})` : selectedMaster?.toProperCase()}
                </div>
                <div className="flex gap-2">
                  {action === 'Update' && initialData?.status === 'submitted' && initialData?.salesEngineer?.team?.teamHead[0]?._id === user?._id && <Button
                    effect="expandIcon"
                    icon={Check}
                    iconPlacement="right"
                    onClick={() => handleSubmitQuotation('approved', false)}
                    className={`w-28 bg-green-600 hover:bg-green-700 duration-300`}
                  >
                    Approve
                  </Button>}

                  {action === 'Update' && initialData?.status === 'submitted' && initialData?.salesEngineer?.team?.teamHead[0]?._id === user?._id && <Button
                    effect="expandIcon"
                    icon={X}
                    iconPlacement="right"
                    onClick={() => handleSubmitQuotation('rejected', false)}
                    className={`w-28 bg-red-600 hover:bg-red-700 duration-300`}
                  >
                    Reject
                  </Button>}
                </div>
              </div>
              <div className="flex gap-2">

                {<Button
                  effect="expandIcon"
                  icon={initialData?.quoteNo && SendHorizontal}
                  iconPlacement="right"
                  className={`w-28 bg-blue-600 hover:bg-blue-700 ${initialData?.quoteNo && ' bg-green-600 hover:bg-green-700'} duration-300`}
                  onClick={() => handleSubmitQuotation1(initialData?.quoteNo ? 'submitted' : 'quoterequested')}
                >
                  {initialData?.quoteNo ? 'Submit' : 'Get Quote No'}
                </Button>}

                {<Button
                  effect="expandIcon"
                  icon={Save}
                  iconPlacement="right"
                  onClick={() => handleSubmitQuotation((initialData?.status !== 'draft' && initialData?.status) ? 'incomplete' : 'draft', false)}
                  className={`w-28  bg-green-600 hover:bg-green-700 ${initialData?.quoteNo && ' bg-blue-600 hover:bg-blue-700'} duration-300`}
                >
                  {(initialData?.status !== 'draft' && initialData?.status) ? 'Update' : 'Save'}
                </Button>}

                {action === 'Update' && <Button
                  effect="expandIcon"
                  icon={initialData?._id ? Trash2Icon : Save}
                  iconPlacement="right"
                  onClick={() => handleSubmitQuotation(initialData?._id ? 'delete' : 'draft', false)}
                  className={`w-28 bg-green-600 hover:bg-green-700 duration-300 ${initialData?._id ? 'bg-red-700 hover:bg-red-800' : ''}`}
                >
                  {initialData?._id ? 'Delete' : 'Save'}
                </Button>}




              </div>
            </div>

            {/* Tabs Section */}
            {/* Tabs Section */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
              <Tabs defaultValue="QuoteDetails" className="h-full flex flex-col min-h-0">
                <TabsList width={"full"} className="bg-slate-300 text-slate-800" >
                  <TabsTrigger value="QuoteDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Quote Details</TabsTrigger>
                  <TabsTrigger value="CustomerDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Customer Details</TabsTrigger>
                  <TabsTrigger value="ProjectDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Project Details</TabsTrigger>
                  {action !== 'Add' && (<TabsTrigger value="CycleTimeDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Cycle Time Details</TabsTrigger>)}
                  {action !== 'Add' && (<TabsTrigger value="TechnicalDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Technical Details</TabsTrigger>)}
                  {action !== 'Add' && (<TabsTrigger value="CommercialDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Commercial Details</TabsTrigger>)}
                  {action !== 'Add' && initialData?.quoteStatus?.name === 'J - Job' && (
                    <TabsTrigger value="JobDetails" width={"full"} className="data-[state=active]:bg-red-700 data-[state=active]:text-white">Job Details</TabsTrigger>
                  )}
                </TabsList>

                {/* Tabs Content */}
                <div className="flex-1 overflow-hidden">
                  {[
                    "QuoteDetails", "CustomerDetails", "ProjectDetails",
                    "CycleTimeDetails", "TechnicalDetails", "CommercialDetails", "JobDetails"
                  ].map(section => (
                    <TabsContent key={section} value={section} className="flex-1 overflow-y-auto">
                      <div className=" bg-white flex-1 h-[calc(100vh-190px)] overflow-y-auto p-2 rounded-md py-3 ">
                        {section !== "CycleTimeDetails" && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {fields.filter(field => field.section === section).map((field, index) => (
                            <div key={index} className={`flex flex-col gap-1 mb-2 ${field.type === "custom" ? "col-span-2" : ""} ${field.visibility ? '' : 'hidden'} ${(field.name === "approvalAuthority" || field.name === "plotNumber") && region !== "GCC" ? "hidden" : ""} ${(field.name === "quoteNo") && (initialData?.status === undefined || initialData?.status === 'draft') ? 'hidden' : ''} ${(field.name === "rejectReason") && (initialData?.status === undefined || (initialData?.status !== 'submitted' && initialData?.status !== 'rejected')) ? 'hidden' : ''}`}>
                              <div className="flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                  {field.label && <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>}
                                  {field.addNew && <Label className="cursor-pointer text-blue-600  " onClick={() => openSecondaryDialog(field.label, field?.data, field)}>Add New</Label>}

                                </div>
                                {field.addHelp && <Label className="cursor-pointer text-red-600  " onClick={() => { openSecondaryDialog(field?.title, field?.data, undefined); setIsHelp(true) }}>Help</Label>}
                              </div>

                              <div className=" flex gap-2 w-full">
                                <div className={`flex 
                                       ${field?.elementType &&
                                    ((field.name === 'industryType' && industryType === 'Others') ||
                                      (field.name === 'buildingType' && buildingType === 'Others') || (field.name === 'paintType' && paintType === 'Others') || (field.name === 'incoterm' && incotermDescription))
                                    ? 'w-1/3' : 'w-full'} duration-300`}>
                                  {renderField(field, undefined, undefined, undefined)}
                                </div>
                                {field?.elementType && <div className={`flex  ${field?.elementType &&
                                  ((field.name === 'industryType' && industryType === 'Others') ||
                                    (field.name === 'buildingType' && buildingType === 'Others') || (field.name === 'paintType' && paintType === 'Others') || (field.name === 'incoterm' && incotermDescription))
                                  ? 'w-2/3' : 'hidden'} duration-300`}>
                                  {renderField(field?.elementType, incotermDescription, undefined, undefined)}
                                </div>}

                              </div>

                            </div>
                          ))}
                        </div>)}

                        {/* Nested Tabs for CycleTimeDetails */}
                        {section === "CycleTimeDetails" && (
                          <div className=" flex flex-col h-full">
                            <Tabs defaultValue="ProposalOffer" className="h-full flex flex-col">
                              {/* Fixed Tabs */}
                              <div className="flex justify-between items-center gap-2">


                                <div className="flex items-center gap-2 w-5/6">
                                  <TabsList className="">
                                    <TabsTrigger onClick={() => setIsProposalOffer(true)} value="ProposalOffer" width={"full"}>Proposal Offer</TabsTrigger>
                                    <TabsTrigger onClick={() => setIsProposalOffer(false)} value="ProposalDrawing" width={"full"}>Proposal Drawing</TabsTrigger>
                                  </TabsList>

                                  <div className='pl-10 flex gap-2'>
                                    <label className='pt-[1px]'>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={handleCheckboxChange}
                                      />

                                    </label>



                                    <label className='' htmlFor="">Same details for proposal drawing</label>
                                  </div>
                                </div>
                                <div>
                                  {initialData?.proposals && <Button
                                    effect="expandIcon"
                                    className={`w-28 duration-300`}
                                    onClick={handleAddRev}
                                  >
                                    Add Rev No
                                  </Button>}
                                </div>
                              </div>


                              {/* Scrollable Content */}
                              <div className="flex-1 overflow-y-auto p-2 bg-gray-100 rounded-md my-2 ">
                                {/* Proposal Offer Section */}
                                <TabsContent value="ProposalOffer">
                                  <div className="h-full overflow-y-auto px-2">
                                    {action !== 'Add' ? (
                                      proposalRevData.sort((a, b) => b.revNo - a.revNo).map((rev, revIndex) => (
                                        <div key={revIndex} className="mb-4 p-3 bg-white rounded-md shadow-md">
                                          <h3 className="text-base font-semibold mb-2">Proposal Offer - RevNo: R{rev.revNo}</h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {fields.filter(field => field.subSection === "ProposalOffer").map((field, index) => (
                                              <div key={index} className="flex flex-col gap-1 mb-2">
                                                <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>
                                                {renderField(field, '', 'ProposalOffer', rev)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3 bg-white rounded-md shadow-md">
                                        <h3 className="text-base font-semibold mb-2">Rev No : R{formData.revNo}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {fields.filter(field => field.subSection === "ProposalOffer").map((field, index) => (
                                            <div key={index} className="flex flex-col gap-1 mb-2">
                                              <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>
                                              {renderField(field, '', 'ProposalOffer', undefined)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>

                                {/* Proposal Drawing Section */}
                                <TabsContent value="ProposalDrawing">
                                  <div className="h-full overflow-y-auto px-2">
                                    {action !== 'Add' ? (
                                      drawingRevData.sort((a: { revNo: number; }, b: { revNo: number; }) => (b.revNo as number) - (a.revNo as number)).map((rev: any, revIndex: React.Key | null | undefined) => (
                                        <div key={revIndex} className="mb-4 p-3 bg-white rounded-md shadow-md">
                                          <h3 className="text-base font-semibold mb-2">Proposal Drawing - RevNo: R{rev.revNo}</h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {fields.filter(field => field.subSection === "ProposalDrawing").map((field, index) => (
                                              <div key={index} className="flex flex-col gap-1 mb-2">
                                                <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>
                                                {renderField(field, '', 'ProposalDrawing', rev)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3 bg-white rounded-md shadow-md">
                                        <h3 className="text-base font-semibold mb-2">Rev No : R{formData.revNo}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {fields.filter(field => field.subSection === "ProposalDrawing").map((field, index) => (
                                            <div key={index} className="flex flex-col gap-1 mb-2">
                                              <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>
                                              {renderField(field, '', 'ProposalDrawing', undefined)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </div>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>


          </div>
        </DialogContent>
      </Dialog>


      {/* Secondary Dialog */}
      <Dialog open={isSecondaryDialogOpen} onOpenChange={() => { setIsSecondaryDialogOpen(false); setIsHelp(false) }}>
        <DialogContent className={`max-w-full max-h-[90%] pointer-events-auto mx-2 h-[60%] sm:max-w-md lg:max-w-3xl ${isHelp && 'w-1/4 h-[65%]'}`}>
          <DialogTitle className={`${isHelp && 'hidden'}`}>{`Add ${secondaryDialogType}`}</DialogTitle>
          <div className="bg-white h-auto overflow-y-auto p-2 rounded-md ">
            <div className=" space-y-4   pr-2 pl-1 my-1 overflow-y-auto">

              {isHelp && <div >
                <div className="w-full font-semibold text-lg items-center justify-center flex pb-3">
                  {secondaryDialogType}
                </div>

                <div className="w-full flex justify-between font-semibold">
                  <div className="w-1/2">Name</div>
                  <div className="w-1/2">
                    Location
                  </div>
                </div>
                {approvalAuthorityData?.map((item: any) => (
                  <div key={item._id} className="text-sm w-full flex justify-between">
                    <div className="w-1/2 py-2">{item?.name}</div>
                    <div className="w-1/2 py-2">
                      {item?.location.map((loc: { _id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => (
                        <div key={loc?._id}>{loc?.name}</div>
                      ))}
                    </div>
                  </div>
                ))}

              </div>}
              {/* Use a responsive grid layout for form fields */}
              {!isHelp && <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 `}>

                {/* 1 column on small screens, 2 on large */}
                {secondaryFields.map((field: FieldObject, index: number) => (
                  <div key={index} className={`flex flex-col gap-1 mb-2 ${field.type === "custom" ? "col-span-2" : ""}`}>
                    <div className="flex gap-2 items-center">
                      {field.label && <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>}
                      {field.addNew && <Label className="cursor-pointer text-blue-600 " onClick={() => openNewDialog(field?.label)}>Add New</Label>}
                    </div>

                    {renderField(field, undefined, undefined, undefined)}

                  </div>
                ))}
              </div>}
            </div>
          </div>

          {!isHelp && <DialogFooter>
            <Button variant="secondary" onClick={() => { setIsSecondaryDialogOpen(false) }}>
              Cancel
            </Button>
            {<Button onClick={() => { handleSubmit('Form2', formDataSecondary) }}>Save</Button>}

          </DialogFooter>}
        </DialogContent>
      </Dialog>

      {/* QuoteExists Dialog */}
      <Dialog open={isQuoteNoExistDialogOpen} onOpenChange={() => { setIsQuoteNoExistDialogOpen(false) }}>
        <DialogContent className={`max-w-full max-h-[30%] pointer-events-auto mx-2 h-[20%] sm:max-w-md lg:max-w-2xl bg-white`}>
          <DialogTitle className="pt-4" >{`Do you already have the Quote No?`}</DialogTitle>
          <div className="bg-white h-auto overflow-y-auto rounded-md ">

          </div>

          <DialogFooter>
            <Button className="w-16" onClick={() => { handleSubmitQuotation('quoterequested', false) }}>
              No
            </Button>
            {<Button className="w-16 bg-green-700 hover:bg-green-600" onClick={() => { handleSubmitQuotation('quoterequested', true) }}>Yes</Button>}

          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* new Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={() => setIsNewDialogOpen(false)}>
        <DialogContent className={`max-w-full max-h-[90%] pointer-events-auto mx-2 h-[60%] sm:max-w-md lg:max-w-3xl`}>
          <DialogTitle>{`Add ${newDialogType}`}</DialogTitle>
          <div className="bg-white h-full overflow-y-auto p-2 rounded-md ">
            <div className=" space-y-4   pr-2 pl-1 my-1 overflow-y-auto">
              {/* Use a responsive grid layout for form fields */}
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 `}>

                {/* 1 column on small screens, 2 on large */}
                {newFields.map((field: FieldObject, index: number) => (
                  <div key={index} className={`flex flex-col gap-1 mb-2 ${field.type === "custom" ? "col-span-2" : ""}`}>
                    <div className="flex gap-2 items-center">
                      {field.label && <Label>{field.label} {field.required && <span className="text-red-600">*</span>}</Label>}
                      {field.addNew && <Label className="cursor-pointer text-blue-600  border-blue-500" >Add New</Label>}
                    </div>
                    {renderField(field, undefined, undefined, undefined)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => { setIsNewDialogOpen(false) }}>
              Cancel
            </Button>
            {action === "Add" && <Button onClick={() => { handleSubmit('Form3', formDataNew) }}>Save</Button>}

          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>

  );
};

export default QuotationDialog;
