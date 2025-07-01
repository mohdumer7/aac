"use client";

import React from 'react'
import MasterComponentAQM from '@/components/MasterComponentAQM/MasterComponentAQM'
import { ArrowUpDown, ChevronsUpDown, Plus, Download, Import, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { transformDataForExcel, transformQuoteData } from '@/lib/utils';
import QuotationDialog from '@/components/AQMModelComponent/AQMComponent';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { bulkImportQuotation } from '@/shared/functions';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { useGetApplicationQuery, useCreateApplicationMutation } from "@/services/endpoints/applicationApi";
import * as XLSX from "xlsx";

const page = () => {
    const proposalOffer: any[] = []
    const proposalDrawing: any[] = []
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [importing, setImporting] = useState(false);
    const [year, setYear] = useState(currentYear);
    const [option, setOption] = useState('A');

    const [noOfBldg, setNoOfBldg] = useState(0);

    const [contactData, setContactData] = useState([]);

    const [stateData, setStateData] = useState([]);
    const [approvalAuthData, setApprovalAuthData] = useState([]);
    const [supportTeamMemberData, setSupportTeamMemberData] = useState([]);

    const [revNo, setRevNo] = useState(0);

    const { user, status, authenticated }: any = useUserAuthorised();

    const { data: quotationData = [], isLoading: quotationLoading }: any = useGetApplicationQuery({
        db: MONGO_MODELS.QUOTATION_MASTER,
        filter: { isActive: true },
        sort: { year: 'desc', quoteNo: 'desc' },
    });

    const sortedQuotations = Array.isArray(quotationData?.data)
        ? [...quotationData?.data].sort((a, b) => {
            const aEmpty = a.quoteNo === null || a.quoteNo === undefined;
            const bEmpty = b.quoteNo === null || b.quoteNo === undefined;

            // Step 1: Put empty quoteNo values at the top
            if (aEmpty && !bEmpty) return -1;
            if (!aEmpty && bEmpty) return 1;

            // Step 2: Sort by year descending
            if (b.year !== a.year) return b.year - a.year;

            // Step 3: Sort by quoteNo descending (numeric)
            return (b.quoteNo ?? 0) - (a.quoteNo ?? 0);
        })
        : [];

    const { data: teamMemberData = [], isLoading: teamMemberLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.TEAM_MEMBERS_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const quotationDataNew = transformQuoteData(sortedQuotations, user, teamMemberData?.data);

    const { data: countryData = [], isLoading: countryLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.COUNTRY_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const countryNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { country: { _id: string; name: string } }) => {
        const { _id, name } = quotation?.country;

        if (_id && name) {
            // Use a Set to track seen _id values
            if (!acc.seen.has(_id)) {
                acc.seen.add(_id); // Add the _id to the Set
                acc.result.push({ id: _id, name }); // Add the country object to the result
            }
        }

        return acc;
    }, { seen: new Set(), result: [] }).result;

    const cityNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { state: { _id: string; name: string } }) => {
        if (quotation?.state) {
            const { _id, name } = quotation?.state;

            if (_id && name) {
                // Use a Set to track seen _id values
                if (!acc.seen.has(_id)) {
                    acc.seen.add(_id); // Add the _id to the Set
                    acc.result.push({ id: _id, name }); // Add the state object to the result
                }
            }
        }
        // Ensure we always return the accumulator
        return acc;
    }, { seen: new Set(), result: [] }).result;

    const approvalAuthorityNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { approvalAuthority: { _id: string; name: string } }) => {
        if (quotation?.approvalAuthority) {
            const { _id, name } = quotation?.approvalAuthority;

            if (_id && name) {
                // Use a Set to track seen _id values
                if (!acc.seen.has(_id)) {
                    acc.seen.add(_id); // Add the _id to the Set
                    acc.result.push({ id: _id, name }); // Add the state object to the result
                }
            }
        }
        // Ensure we always return the accumulator
        return acc;
    }, { seen: new Set(), result: [] }).result;

    const companyNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { company: { _id: string; name: string } }) => {
        if (quotation?.company) {
            const { _id, name } = quotation?.company;

            if (_id && name) {
                // Use a Set to track seen _id values
                if (!acc.seen.has(_id)) {
                    acc.seen.add(_id); // Add the _id to the Set
                    acc.result.push({ id: _id, name }); // Add the state object to the result
                }
            }
        }
        // Ensure we always return the accumulator
        return acc;
    }, { seen: new Set(), result: [] }).result;

    const customerTypeNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { customerType: { _id: string; name: string } }) => {
        if (quotation?.customerType) {
            const { _id, name } = quotation?.customerType;

            if (_id && name) {
                // Use a Set to track seen _id values
                if (!acc.seen.has(_id)) {
                    acc.seen.add(_id); // Add the _id to the Set
                    acc.result.push({ id: _id, name }); // Add the state object to the result
                }
            }
        }
        // Ensure we always return the accumulator
        return acc;
    }, { seen: new Set(), result: [] }).result;

    const regionNames = quotationDataNew?.reduce((acc: any[], quotation: { country: { region: { continent: { name: string } } } }) => {
        const continentName = quotation?.country?.region?.continent?.name;

        if (continentName && !acc.includes(continentName)) {
            acc.push(continentName); // Add continent name if it's not already included
        }
        return acc;
    }, []);

    const areaNames = quotationDataNew?.reduce((acc: any[], quotation: { country: { region: { name: string } } }) => {
        const regionName = quotation?.country?.region?.name;

        if (regionName && !acc.includes(regionName)) {
            acc.push(regionName); // Add continent name if it's not already included
        }
        return acc;
    }, []);

    const salesEngineerNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { salesEngineer: { _id: string; user: { displayName: string } } }) => {
        const { _id, user } = quotation?.salesEngineer;
        const displayName = user?.displayName?.toProperCase();
        // Check if the sales engineer's id is not already in the accumulator
        if (_id && user) {
            // Use a Set to track seen _id values
            if (!acc.seen.has(_id)) {
                acc.seen.add(_id); // Add the _id to the Set
                acc.result.push(displayName); // Add the country object to the result
            }
        }

        return acc;
    }, { seen: new Set(), result: [] }).result;

    const salesSupportEngineerNames = quotationDataNew?.reduce((acc: { seen: Set<string>; result: any[] }, quotation: { salesSupportEngineer: Array<{ _id: string; user: { displayName: string } }> }) => {
        // Ensure we're accessing the first element of the salesSupportEngineer array
        const { _id, user } = quotation?.salesSupportEngineer[0] || {};
        const displayName = user?.displayName?.toProperCase();

        // Check if _id and displayName are valid
        if (_id && displayName) {
            // Check if the _id is not already in the accumulator (via Set for uniqueness)
            if (!acc.seen.has(_id)) {
                acc.seen.add(_id); // Add _id to the Set
                acc.result.push(displayName); // Add the proper displayName to the result
            }
        }

        return acc;
    }, { seen: new Set(), result: [] }).result;


    const { data: quoteStatusData = [], isLoading: quoteStatusLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.QUOTE_STATUS_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });


    const quoteStatusNames = quoteStatusData?.data
        ?.filter((status: any) => status !== undefined) // Remove undefined entries
        ?.map((status: any) => ({ id: status._id, name: status.name })) || []; // Store id & name

    const quoteStatus = quoteStatusData?.data?.filter((option: any) => option?.name === 'A - Active')[0]?._id;

    const { data: teamData = [], isLoading: teamLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.TEAM_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: customerData = [], isLoading: customerLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.CUSTOMER_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: customerContactData = [], isLoading: customerContactLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.CUSTOMER_CONTACT_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: customerTypeData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.CUSTOMER_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: sectorData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.SECTOR_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const { data: industryData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.INDUSTRY_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: buildingData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.BUILDING_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const { data: fullstateData = [], isLoading: stateLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.STATE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: approvalAuthorityData = [], isLoading: approvalAuthorityLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.APPROVAL_AUTHORITY_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const { data: locationData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.LOCATION_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const { data: projectTypeData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.PROJECT_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });
    const { data: paintTypeData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.PAINT_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: currencyData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.CURRENCY_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: incotermData = [] }: any = useGetMasterQuery({
        db: MONGO_MODELS.INCOTERM_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const formattedLocationData = locationData?.data?.map((option: any) => ({
        label: option.name, // Display name
        value: option._id, // Unique ID as value
    }));

    const formattedAuthorityData = approvalAuthorityData?.data?.map((option: any) => ({
        name: option?.code, // Display name
        _id: option?._id, // Unique ID as value
        location: option?.location
    }));

    const teamId = teamMemberData?.data?.filter((data: { user: { _id: any; }; }) => data?.user?._id === user?._id)?.[0]?.team?._id;
    const teamRole = teamMemberData?.data?.filter((data: { user: { _id: any; }; }) => data?.user?._id === user?._id)?.[0]?.teamRole[0]?.name;
console.log(teamId, teamRole, user?._id, teamMemberData?.data);
    let salesEngData = teamMemberData?.data?.filter((data: { team: { _id: any; }; teamRole: { name: string }[]; }) => data?.team?._id === teamId && data?.teamRole[0]?.name !== "Support Engineer")?.map((option: { user: { displayName: string; }; _id: any; team: { _id: any; teamHead: any; }; }) => ({
        name: option?.user?.displayName?.toProperCase(), // Display name
        _id: option?._id, // Unique ID as value
        team: option?.team?._id,
        teamHead: option?.team?.teamHead[0]?.displayName.toProperCase(),
        email: option?.team?.teamHead[0]?.email
    }));

    if (teamRole === 'Engineer') {
        salesEngData = teamMemberData?.data?.filter((data: { user: { _id: any; }; teamRole: { name: string }[]; }) => data?.user?._id === user?._id && data?.teamRole[0]?.name !== "Support Engineer")?.map((option: { user: { displayName: string; }; _id: any; team: { _id: any; teamHead: any; }; }) => ({
            name: option?.user?.displayName?.toProperCase(), // Display name
            _id: option?._id, // Unique ID as value
            team: option?.team?._id,
            teamHead: option?.team?.teamHead[0]?.displayName.toProperCase(),
            email: option?.team?.teamHead[0]?.email
        }));
    }

    if (user?.role?.name === 'Admin') {
        salesEngData = teamMemberData?.data?.filter((data: { user: { _id: any; }; teamRole: { name: string }[]; }) => data?.teamRole[0]?.name !== "Support Engineer")?.map((option: { user: { displayName: string; }; _id: any; team: { _id: any; teamHead: any; }; }) => ({
            name: option?.user?.displayName?.toProperCase(), // Display name
            _id: option?._id, // Unique ID as value
            team: option?.team?._id,
            teamHead: option?.team?.teamHead[0]?.displayName.toProperCase(),
            email: option?.team?.teamHead[0]?.email
        }));
    }



    const yearData = [];

    if (currentMonth < 12) {
        for (let year = currentYear - 2; year <= currentYear; year++) {
            yearData.push({ _id: year, name: year.toString() });
        }
    }
    else {

        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            yearData.push({ _id: year, name: year.toString() });
        }
    }

    const optionData = Array.from({ length: 26 }, (_, i) => ({
        _id: String.fromCharCode(65 + i), // ASCII code for 'A' is 65
        name: String.fromCharCode(65 + i),
    }));

    const revNoData = Array.from({ length: 100 }, (_, i) => ({
        _id: i + 0,
        name: (i + 0).toString()
    }));

    const monthsData = [
        { _id: 1, name: "January" },
        { _id: 2, name: "February" },
        { _id: 3, name: "March" },
        { _id: 4, name: "April" },
        { _id: 5, name: "May" },
        { _id: 6, name: "June" },
        { _id: 7, name: "July" },
        { _id: 8, name: "August" },
        { _id: 9, name: "September" },
        { _id: 10, name: "October" },
        { _id: 11, name: "November" },
        { _id: 12, name: "December" }
    ];


    const bookingProbabilityData = [{ _id: 'Low', name: 'Low' }, { _id: 'Medium', name: 'Medium' }, { _id: 'High', name: 'High' }];

    const bldgNoData = Array.from({ length: 100 }, (_, i) => ({
        _id: i + 0,
        name: (i + 0).toString()
    }));

    const [createApplication]: any = useCreateApplicationMutation();

    const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

    const loading = approvalAuthorityLoading || quotationLoading || countryLoading || customerContactLoading || customerLoading || quoteStatusLoading || countryLoading || stateLoading || teamLoading || teamMemberLoading;


    const onchangeData = async ({ id, fieldName, name, parentId, position, email, phone, location }: { id: string; fieldName: string; name: string; parentId?: string; position?: string; email?: string; phone?: string; location?: string }) => {

        switch (fieldName) {
            case "company":
                const contactData1 = await customerContactData?.data?.filter((contact: { customer: { _id: any; }; }) => contact?.customer?._id === id);

                setContactData(contactData1);
                break;

            case "contact":

                const contactData2 = await customerContactData?.data?.filter((contact: { customer: { _id: any; }; }) => contact?.customer?._id === parentId);
                contactData2.push({ _id: id, name: name, position: position, email: email, phone: phone });

                setContactData(contactData2);

                break;

            case "country":

                const stateData1 = await fullstateData?.data?.filter((state: { country: { _id: any; }; }) => state?.country?._id === id)?.map((state: { name: any; _id: any; }) => ({
                    name: state?.name,
                    _id: state?._id
                }));

                setStateData(stateData1);
                break;

            case "state":
                switch (name) {
                    case 'approvalAuthority':

                        const approvalData = await approvalAuthorityData?.data?.filter((item: { location: any[]; }) => item.location.some((loc: { state: { _id: any; }; }) => loc?.state?._id === id)
                        )?.map((data: { code: any; _id: any; location: any; }) => ({
                            name: data?.code,
                            _id: data?._id,
                            location: data?.location
                        }));

                        setApprovalAuthData(approvalData);
                        break;

                    default:
                        const stateData2 = await fullstateData?.data?.filter((state: { country: { _id: any; }; }) => state?.country?._id === parentId)?.map((state: { name: any; _id: any; }) => ({
                            name: state?.name,
                            _id: state?._id,

                        }));
                        stateData2.push({ name: name, _id: id });
                        setStateData(stateData2);

                        break;

                };
                break;

            case "salesEngineer":
                const teamId1 = teamMemberData?.data?.filter((data: { _id: any; }) => data?._id === id)?.[0]?.team?._id;
                const formattedTeamMemberData = teamMemberData?.data?.filter((data: { team: { _id: any; }; }) => data?.team?._id === teamId1)?.map((option: { user: { displayName: string; }; _id: any; }) => ({
                    label: option?.user?.displayName?.toProperCase(), // Display name
                    value: option?._id, // Unique ID as value
                }));


                setSupportTeamMemberData(formattedTeamMemberData);
                break;

            case "approvalAuthority":

                const approvalData = await approvalAuthorityData?.data?.filter((item: { location: any[]; }) => item.location.some((loc: { state: { _id: any; }; }) => loc.state._id === parentId)
                )?.map((data: { code: any; _id: any; location: any; }) => ({
                    name: data?.code,
                    _id: data?._id,
                    location: data?.location
                }));
                approvalData.push({ name: name, _id: id, location: location });
                setApprovalAuthData(approvalData);

                break;


            default:
                break;
        }


    }

    const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string; subSection?: string; elementType?: any; addNew?: boolean; addHelp?: boolean; visibility?: boolean; title?: string; onAddMore?: () => void; }> = [
        { label: 'Country', name: "country", type: "select", data: countryData?.data, format: 'ObjectId', required: true, placeholder: 'Select Country', section: 'QuoteDetails', visibility: true },
        { label: 'Year', name: "year", type: "select", data: yearData, required: true, placeholder: 'Select Year', section: 'QuoteDetails', visibility: true },
        { label: 'Quote No', name: "quoteNo", type: "number", required: false, placeholder: 'Quote No', section: 'QuoteDetails', visibility: true },
        { label: 'Option', name: "option", type: "select", data: optionData, required: false, placeholder: 'Select Option', section: 'QuoteDetails', visibility: true },
        { label: 'Quote Status', name: "quoteStatus", type: "select", data: quoteStatusData?.data, format: 'ObjectId', required: true, placeholder: 'Select Quote Status', section: 'QuoteDetails', visibility: true },
        { label: 'Rev No', name: "revNo", type: "select", data: revNoData, required: true, placeholder: 'Select Rev No', section: 'QuoteDetails', visibility: true, readOnly: true },
        { label: 'Sales Engineer/Manager', name: "salesEngineer", type: "select", data: salesEngData, format: 'ObjectId', required: true, placeholder: 'Select Sales Engineer / Manager', section: 'QuoteDetails', visibility: true },
        { label: 'Sales Support Engineer', name: "salesSupportEngineer", type: "multiselect", data: supportTeamMemberData, required: true, placeholder: 'Select Sales Support Engineer', section: 'QuoteDetails', visibility: true },
        { label: 'Received Date From Customer', name: "rcvdDateFromCustomer", type: "date", format: 'Date', required: true, placeholder: 'Select Date', section: 'QuoteDetails', visibility: true },
        { label: 'Selling Team', name: "sellingTeam", type: "select", data: teamData?.data, format: 'ObjectId', required: true, placeholder: 'Select Selling Team', section: 'QuoteDetails', visibility: true },
        { label: 'Responsible Team', name: "responsibleTeam", type: "select", data: teamData?.data, format: 'ObjectId', required: true, placeholder: 'Responsible Team', section: 'QuoteDetails', visibility: true },
        { label: 'Quote Details Remark', name: "quoteDetailsRemark", type: "text", required: false, placeholder: 'Quote Details Remark', section: 'QuoteDetails', visibility: true, },
        { label: 'Reject Reason', name: "rejectReason", type: "text", required: false, placeholder: 'Reject Reason', section: 'QuoteDetails', visibility: true, },

        { label: 'Company Name', name: "company", type: "select", data: customerData?.data, format: 'ObjectId', required: false, placeholder: 'Select Company', section: 'CustomerDetails', visibility: true, addNew: true },
        { label: 'Contact Name', name: "contact", type: "select", data: contactData, format: 'ObjectId', required: false, placeholder: 'Select Contact', section: 'CustomerDetails', visibility: true, addNew: true },
        { label: 'Contact Email', name: "email", type: "text", required: false, placeholder: 'Contact Email', section: 'CustomerDetails', visibility: true, readOnly: true },
        { label: 'Contact Number', name: "phone", type: "number", required: false, placeholder: 'Contact Number', section: 'CustomerDetails', visibility: true, readOnly: true },
        { label: 'Position', name: "position", type: "text", required: false, placeholder: 'Contact Position', section: 'CustomerDetails', visibility: true, readOnly: true },
        { label: 'Customer Type', name: "customerType", type: "select", data: customerTypeData?.data, format: 'ObjectId', required: false, placeholder: 'Select Customer Type', section: 'CustomerDetails', visibility: true },
        { label: 'Customer Details Remark', name: "customerDetailsRemark", type: "text", required: false, placeholder: 'Customer Details Remark', section: 'CustomerDetails', visibility: true },

        { label: 'Project Name', name: "projectName", type: "text", required: false, placeholder: 'Project Name', section: 'ProjectDetails', visibility: true },
        { label: 'Sector', name: "sector", type: "select", data: sectorData?.data, format: 'ObjectId', required: false, placeholder: 'Select Sector', section: 'ProjectDetails', visibility: true },
        { label: 'Industry Type', name: "industryType", type: "select", data: industryData?.data, format: 'ObjectId', required: false, placeholder: 'Select Industry Type', section: 'ProjectDetails', visibility: true, elementType: { label: '', name: "otherIndustryType", type: "text", required: false, placeholder: 'Other Industry Type', section: 'ProjectDetails', visibility: true }, },

        { label: 'Building Type', name: "buildingType", type: "select", data: buildingData?.data, format: 'ObjectId', required: false, placeholder: 'Select Building Type', section: 'ProjectDetails', visibility: true, elementType: { label: '', name: "otherBuildingType", type: "text", required: false, placeholder: 'Other Building Type', section: 'ProjectDetails', visibility: true } },
        { label: 'Building Usage', name: "buildingUsage", type: "text", data: customerTypeData?.data, format: 'ObjectId', required: false, placeholder: 'Select Customer Type', section: 'ProjectDetails', visibility: true },
        { label: 'City', name: "state", type: "select", data: stateData, format: 'ObjectId', required: false, placeholder: 'Select City', section: 'ProjectDetails', visibility: true, addNew: true },
        { label: 'Approval Authority (GCC Only)', name: "approvalAuthority", type: "select", data: approvalAuthData.length > 0 ? approvalAuthData : formattedAuthorityData, format: 'ObjectId', required: false, placeholder: 'Select Approval Authority', section: 'ProjectDetails', visibility: true, addNew: true, addHelp: true, title: 'Approval Authorities' },
        { label: 'Plot Number (GCC Only)', name: "plotNumber", type: "text", required: false, placeholder: 'Plot Number', section: 'ProjectDetails', visibility: true },
        { label: 'End Client', name: "endClient", type: "text", required: false, placeholder: 'End Client', section: 'ProjectDetails', visibility: true },
        { label: 'Project Management Office', name: "projectManagementOffice", type: "text", required: false, placeholder: 'Project Management Office', section: 'ProjectDetails', visibility: true },
        { label: 'Consultant', name: "consultant", type: "text", required: false, placeholder: 'Consultant', section: 'ProjectDetails', visibility: true },
        { label: 'Main Contractor', name: "mainContractor", type: "text", required: false, placeholder: 'Main Contractor', section: 'ProjectDetails', visibility: true },
        { label: 'Erector', name: "erector", type: "text", required: false, placeholder: 'Erector', section: 'ProjectDetails', visibility: true },
        { label: 'Project Details Remark', name: "projectDetailsRemark", type: "text", required: false, placeholder: 'Project Details Remark', section: 'ProjectDetails', visibility: true },

        { label: 'Sent To Estimation', name: "sentToEstimation", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalOffer', visibility: true },
        { label: 'Received From Estimation', name: "receivedFromEstimation", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalOffer', visibility: true },
        { label: 'Cycle Time (Days)', name: "cycleTime", type: "number", required: false, placeholder: 'Cycle Time', section: 'CycleTimeDetails', subSection: 'ProposalOffer', visibility: true, readOnly: true },
        { label: 'Sent To Customer', name: "sentToCustomer", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalOffer', visibility: true },
        { label: 'Notes', name: "notes", type: "text", required: false, placeholder: 'Notes', section: 'CycleTimeDetails', subSection: 'ProposalOffer', visibility: true },

        { label: 'Sent To Estimation', name: "sentToEstimation", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalDrawing', visibility: true },
        { label: 'Received From Estimation', name: "receivedFromEstimation", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalDrawing', visibility: true },
        { label: 'Cycle Time (Days)', name: "cycleTime", type: "number", required: false, placeholder: 'Cycle Time', section: 'CycleTimeDetails', subSection: 'ProposalDrawing', visibility: true, readOnly: true },
        { label: 'Sent To Customer', name: "sentToCustomer", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'CycleTimeDetails', subSection: 'ProposalDrawing', visibility: true },
        { label: 'Notes', name: "notes", type: "text", required: false, placeholder: 'Notes', section: 'CycleTimeDetails', subSection: 'ProposalDrawing', visibility: true },

        { label: 'No Of Buildings', name: "noOfBuilding", type: "select", data: bldgNoData, required: false, placeholder: 'Select Building No', section: 'TechnicalDetails', visibility: true },
        { label: 'Project Type', name: "projectType", type: "select", data: projectTypeData?.data, format: 'ObjectId', required: false, placeholder: 'Project Type', section: 'TechnicalDetails', visibility: true },
        { label: 'Paint Type', name: "paintType", type: "select", data: paintTypeData?.data, format: 'ObjectId', required: false, placeholder: 'Paint Type', section: 'TechnicalDetails', visibility: true, elementType: { label: '', name: "otherPaintType", type: "text", required: false, placeholder: 'Other Paint Type', section: 'TechnicalDetails', visibility: true, }, },
        { label: 'Projected Area (Sq Mtr)', name: "projectedArea", type: "number", required: false, placeholder: 'Projected Area', section: 'TechnicalDetails', visibility: true },
        { label: 'Total Weight (Tons)', name: "totalWt", type: "number", required: false, placeholder: 'Total Weight', section: 'TechnicalDetails', visibility: true },
        { label: 'Mezzanine Area (Sq Mtr)', name: "Mezzanine Area", type: "number", required: false, placeholder: 'Erector', section: 'TechnicalDetails', visibility: true },
        { label: 'Mezzanine Weight (Tons)', name: "mezzanineWt", type: "number", required: false, placeholder: 'Mezzanine Weight', section: 'TechnicalDetails', visibility: true },
        { label: 'Technical Details Remark', name: "technicalDetailsRemark", type: "text", required: false, placeholder: 'Technical Details Remark', section: 'TechnicalDetails', visibility: true },

        { label: 'Currency', name: "currency", type: "select", data: currencyData?.data, format: 'ObjectId', required: false, placeholder: 'Select Currency', section: 'CommercialDetails', visibility: true },
        { label: 'Total Estimated Price', name: "totalEstPrice", type: "number", required: false, placeholder: 'Total Estimated Price', section: 'CommercialDetails', visibility: true },
        { label: 'Q22 Value (AED)', name: "q22Value", type: "number", required: false, placeholder: 'Q22 Value (AED)', section: 'CommercialDetails', visibility: true, },
        { label: 'Special BuyOut Price', name: "spBuyoutPrice", type: "number", required: false, placeholder: 'Special BuyOut Price', section: 'CommercialDetails', visibility: true },
        { label: 'Freight Price', name: "freightPrice", type: "number", required: false, placeholder: 'Freight Price', section: 'CommercialDetails', visibility: true },
        { label: 'Incoterm', name: "incoterm", type: "select", data: incotermData?.data, format: 'ObjectId', required: false, placeholder: 'Incoterm', section: 'CommercialDetails', visibility: true, elementType: { label: '', name: "incotermDescription", type: "text", required: false, section: 'TechnicalDetails', visibility: true, }, },
        { label: 'Booking Probability', name: "bookingProbability", type: "select", data: bookingProbabilityData, required: false, placeholder: 'Booking Probability', section: 'CommercialDetails', visibility: true },
        { label: 'Commercial Details Remark', name: "technicalDetailsRemark", type: "text", required: false, placeholder: 'Technical Details Remark', section: 'CommercialDetails', visibility: true },

        { label: 'Job No', name: "jobNo", type: "text", required: false, placeholder: 'Job No', section: 'JobDetails', visibility: true },
        { label: 'Job Date', name: "jobDate", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: 'JobDetails', visibility: true },
        { label: 'Shipping Forecast Month', name: "forecastMonth", type: "select", data: monthsData, required: false, placeholder: 'Shipping Forecast Month', section: 'JobDetails', visibility: true, elementType: { label: '', name: "incotermDescription", type: "text", required: false, section: 'TechnicalDetails', visibility: true, }, },
        { label: 'Payment Term', name: "paymentTerm", type: "text", required: false, placeholder: 'Payment Term', section: 'JobDetails', visibility: true },
        { label: 'Job Details Remark', name: "remarks", type: "text", required: false, placeholder: 'Job Details Remark', section: 'JobDetails', visibility: true },

    ];

    const statusField: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; section?: string[]; subSection?: string; elementType?: any[]; addNew?: boolean; addHelp?: boolean; visibility?: boolean; title?: string; onAddMore?: () => void; }> = [
        { label: 'New Status', name: "quoteStatus", type: "select", data: quoteStatusData?.data, format: 'ObjectId', required: true, placeholder: 'Select Status', visibility: true },
        { label: 'Select Forecast Month', name: "forecastMonth", type: "select", data: monthsData, required: false, placeholder: 'Select Month', section: ['HOT QUOTE'], visibility: false },
        { label: 'Job No', name: "jobNo", type: "text", required: false, placeholder: 'Job No', section: ['J - Job'], visibility: false },
        { label: 'Job Entry Date', name: "jobDate", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: ['J - Job'], visibility: false },
        { label: 'Shipping Forecast Month', name: "forecastMonth", type: "select", data: monthsData, required: false, placeholder: 'Select Month', section: ['J - Job'], visibility: false },
        { label: 'Payment Terms', name: "paymentTerm", type: "text", required: false, placeholder: 'Payment Term', section: ['J - Job'], visibility: false },
        { label: 'Intial Shipped Date', name: "initialShipDate", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: ['JOB SHIPPED'], visibility: false },
        { label: 'Final Shipped Date', name: "finalShipDate", type: "date", format: 'Date', required: false, placeholder: 'Select Date', section: ['JOB SHIPPED'], visibility: false },
        { label: 'Lost To', name: "lostTo", type: "text", required: false, placeholder: 'Lost To', section: ['L - Lost'], visibility: false },
        { label: 'Lost To Others', name: "lostToOthers", type: "text", required: false, placeholder: 'Lost To Others', section: ['L - Lost'], visibility: false },
        { label: 'Reason', name: "reason", type: "text", placeholder: 'Reason', section: ['C - Cancel', 'D - Declined', 'H - Hold', 'L - Lost'], visibility: false },
        { label: 'Remarks', name: "remarks", type: "text", required: false, placeholder: 'Remarks', section: ['J - Job', 'JOB SHIPPED', 'HOT QUOTE'], visibility: false },

    ]

    const [isStatusDialogOpen, setStatusDialogOpen] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState(""); // This will track the master type (department, role, etc.)
    const [initialData, setInitialData] = useState({});
    const [action, setAction] = useState('Add');

    // Open the dialog and set selected master type
    const openDialog = (masterType: React.SetStateAction<string>) => {
        setSelectedMaster(masterType);

        setDialogOpen(true);
    };

    const openStausDialog = (masterType: React.SetStateAction<string>) => {
        setSelectedMaster(masterType);

        setStatusDialogOpen(true);
    };

    // Close dialog
    const closeDialog = () => {
        setInitialData({});
        setContactData([]);
        setDialogOpen(false);
        setSelectedMaster("");
    };

    const closeStatusDialog = () => {
        setInitialData({});
        setContactData([]);
        setStatusDialogOpen(false);
        setSelectedMaster("");
    };

    // Save function to send data to an API or database
    const saveData = async ({ formData, action, master = 'QUOTATION_MASTER' }: { formData: any; action: string; master?: keyof typeof MONGO_MODELS }): Promise<any> => {

        const formattedData: {
            db: string;
            action: string;
            filter: { _id: any; };
            data: any;
        } = {
            db: MONGO_MODELS[master],
            action: action === 'Add' ? 'create' : 'update',
            filter: { "_id": formData?._id },
            data: formData,
        };

        const response: any = await createApplication(formattedData);

        if (response.data?.status === SUCCESS && action === 'Add') {

            toast.success('data added successfully');
        }
        else {
            if (response.data?.status === SUCCESS && action === 'Update') {

                toast.success('data updated successfully');
            }
        }

        if (response?.error?.data?.message?.message) {
            throw new Error("Something went wrong!");
            toast.error(`Error encountered: ${response?.error?.data?.message?.message}`);
        }

        return response;
    };


    const editQuotation = (rowData: any) => {
        setAction('Update');
        const transformedData = {
            ...rowData, // Keep the existing fields
            salesSupportEngineer: rowData?.salesSupportEngineer.map((eng: { _id: any; }) => eng._id), // Map `location` to just the `_id`s

        };

        const contactData1 = customerContactData?.data?.filter((contact: { customer: { _id: any; }; }) => contact?.customer?._id === rowData?.company?._id);

        setContactData(contactData1);
        const stateData1 = fullstateData?.data?.filter((state: { country: { _id: any; }; }) => state?.country?._id === rowData?.country?._id)?.map((state: { name: any; _id: any; }) => ({
            name: state?.name,
            _id: state?._id
        }));

        setStateData(stateData1);


        const formattedTeamMemberData = teamMemberData?.data?.filter((data: { team: { _id: any; }; }) => data?.team?._id === rowData?.sellingTeam?._id)?.map((option: { user: { displayName: string; }; _id: any; }) => ({
            label: option?.user?.displayName?.toProperCase(), // Display name
            value: option?._id, // Unique ID as value
        }));


        setSupportTeamMemberData(formattedTeamMemberData);
        console.log(transformedData);
        setInitialData(transformedData);
        openDialog("update quotation");
        // Your add logic for user page
    };

    const editQuoteStatus = (rowData: any) => {
        setAction('Update');
        const transformedData = {
            ...rowData, // Keep the existing fields
            salesSupportEngineer: rowData?.salesSupportEngineer.map((eng: { _id: any; }) => eng._id), // Map `location` to just the `_id`s

        };

        setInitialData(transformedData);
        !['draft', 'quoterequested'].includes(rowData?.status) && openStausDialog("quote status");
        // Your add logic for user page
    };

    const handleAdd = () => {
        setInitialData({ year, option, quoteStatus, revNo, noOfBldg });
        setAction('Add');
        openDialog("new quotation");

    }

    const handleImport = () => {
        bulkImportQuotation({
            roleData: [], continentData: [], regionData: [],
            countryData,
            quoteStatusData,
            teamMemberData,
            teamData,
            customerData,
            customerContactData,
            customerTypeData,
            sectorData,
            industryData,
            buildingData,
            stateData: fullstateData,
            approvalAuthorityData,
            projectTypeData,
            paintTypeData,
            currencyData,
            incotermData, quotationData, locationData, action: "Add", user, createUser: createApplication, db: MONGO_MODELS.QUOTATION_MASTER, masterName: "Quotation", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const EMPTY_EXPORT_ROW = {
        "Region": '',
        "Area": '',
        "Country": '',
        "Year": '',
        "Quote No": '',
        "Option": '',
        "SO": '',
        "RO": '',
        "Quote Rev": '',
        "Quote Status": '',
        "Date Received From Customer": '',
        "Sales Eng/Mng": '',
        "Sales Support 1": '',
        "Sales Support 2": '',
        "Sales Support 3": '',
        "Customer Name": '',
        "Contact Name": '',
        "Contact Email": '',
        "Contact Number": '',
        "Position": '',
        "Customer Type": '',
        "End Client": '',
        "Project Management": '',
        "Consultant": '',
        "Main Contractor": '',
        "Erector": '',
        "Project Name": '',
        "Sectors": '',
        "Industry Type": '',
        "Other Industry": '',
        "Building Type": '',
        "Other Building Type": '',
        "Building Usage": '',
        "City": '',
        "Approval Authority": '',
        "Plot No": '',
        "Date Sent To Estimation": '',
        "Date Received From Estimation": '',
        "Cycle Time (Days)": '',
        "Date Sent To Customer": '',
        "No Of Buildings": '',
        "Project Type": '',
        "Paint Type": '',
        "Other Paint Type": '',
        "Projected Area (Sq. Mtr)": '',
        "Total Weight (Tons)": '',
        "Mezzanine Area (Sq. Mtr)": '',
        "Mezzanine Weight (Tons)": '',
        "Currency": '',
        "Total Estimated Price": '',
        "Q22 Value (AED)": '',
        "Sp. BuyOut Price": '',
        "Freight Price": '',
        "Incoterm": '',
        "Incoterm Description": '',
        "Booking Probability": '',
        "Job No": '',
        "Job Date": '',
        "Forecast Month": '',
        "Payment Term": '',
        "Remarks": '',
        "Lost To": '',
        "Lost To Others": '',
        "Lost Date": '',
        "Reason": '',
        "Initial Ship Date": '',
        "Final Ship Date": '',
        "Status": '',
        "Handle By": '',
    };


    const handleExport = (type: string, quotationDataNew: any[]) => {
        let formattedData = [];

        if (!quotationDataNew || quotationDataNew.length === 0) {
            // Export 1 row with empty fields
            formattedData = [EMPTY_EXPORT_ROW];
        } else {
            // Transform actual data
            formattedData = transformDataForExcel(quotationDataNew);
        }

        if (type === 'excel') {
            exportToExcel(formattedData);
        }
    };

    const exportToExcel = (data: any[]) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'exported_data.xlsx');
    };


    const getQuotationColumns = (teamRole: string) => {
        const columns = [
            {
                id: "select",
                header: ({ table }: { table: any }) => (
                    <Checkbox

                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }: { row: any }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "year",
                header: ({ column }: { column: any }) => (
                    <button
                        className=" items-center space-x-2 hidden"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

                    >
                        <span>year</span>
                        <ArrowUpDown size={15} />
                    </button>
                ),
                cell: ({ row }: { row: any }) => <div className='hidden' onClick={() => editQuotation(row.original)}>{row.getValue("year") || "Add Quote No"}</div>,
                enableHiding: true,  // Allows hiding the column
                enableSorting: false, // You can disable sorting here if needed
            },
            {
                accessorKey: "quoteNo",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2 w-[100px]"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Quote No</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editQuotation(row.original)}>{row.getValue("quoteNo") && `${row.getValue("country")?.countryCode}-${row.getValue("year")?.toString().slice(-2)}-${row.getValue("quoteNo")?.toString().padStart(5, '0')}` || "Add Quote No"}</div>,
            },
            {
                accessorKey: "revNo",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2 w-[80px]"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Rev No</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div >{row.getValue("revNo")}</div>,
            },
            {
                accessorKey: "option",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Option</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div>{row.getValue("option")}</div>,
            },
            {
                accessorKey: "quoteStatus",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Quote Status</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div className="w-28 p-2 border rounded-md flex items-center justify-center text-center" onClick={() => editQuoteStatus(row.original)}>
                    {quoteStatusData?.data.find((data: { _id: any; }) => data._id === row.getValue("quoteStatus")?._id)?.name}</div>,
            },
            {
                accessorKey: "bookingProbability",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Probability</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div>{row.getValue("bookingProbability")}</div>,
            },
            {
                accessorKey: "region",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Region</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div>{countryData?.data.find((data: { _id: any; }) => data._id === row.getValue("country")?._id)?.region?.continent?.name}</div>,
            },
            {
                accessorKey: "country",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Country</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div>{countryData?.data.find((data: { _id: any; }) => data._id === row.getValue("country")?._id)?.name}</div>,
            },

        ];

        if (teamRole !== 'Engineer') {
            columns.push({
                accessorKey: "salesEngineer",
                header: ({ column }: { column: any }) => {
                    const isSorted = column.getIsSorted();

                    return (
                        <button
                            className="group  flex items-center space-x-2 w-[130px]"
                            onClick={() => column.toggleSorting(isSorted === "asc")}
                        >
                            <span>Sales Engineer</span>
                            <ChevronsUpDown
                                size={15}
                                className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            />
                        </button>
                    );
                },
                cell: ({ row }: { row: any }) => <div>{teamMemberData?.data.find((data: { _id: any; }) => data._id === row.getValue("salesEngineer")?._id)?.user?.displayName.toProperCase()}</div>,
            },)
        };
        columns.push({
            accessorKey: "company",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Company</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div>{customerData?.data.find((data: { _id: any; }) => data._id === row.getValue("company")?._id)?.name}</div>,
        },)
        columns.push({
            accessorKey: "projectName",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (

                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Project Name</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>


                );
            },
            cell: ({ row }: { row: any }) => <div>{row.getValue("projectName")}</div>,
        },)
        return columns;
    };

    const quotationColumns = getQuotationColumns(teamRole);

    const statusNames = [{ id: 'draft', name: 'Draft', color: 'bg-white' }, { id: 'quoterequested', name: 'QuoteRequested', color: 'bg-yellow-100' }, { id: 'incomplete', name: 'Incomplete', color: 'bg-blue-100' }, { id: 'submitted', name: 'Submitted', color: 'bg-orange-200' }, { id: 'rejected', name: 'Rejected', color: 'bg-red-200' }, { id: 'approved', name: 'Approved', color: 'bg-green-200' }];

    const bookingProbabilityNames = ['Low', 'Medium', 'High'];

    const quotationConfig = {
        searchFields: [
            { key: "name", label: 'name', type: "text" as const, placeholder: 'Search the quote..' },

        ],
        filterFields: [
            { key: "status", label: 'status', type: "select" as const, options: statusNames, placeholder: 'Select Status', filterBy: "id", name: 'Status By Color' },
            { key: "quoteStatus", label: 'quoteStatus', type: "select" as const, options: quoteStatusNames, placeholder: 'Select Quote Status', filterBy: "id", name: 'Quote Status' },
            { key: "region", label: 'region', type: "select" as const, options: regionNames, placeholder: 'Select Region', filterBy: "name", name: 'Region' },
            { key: "area", label: 'area', type: "select" as const, options: areaNames, placeholder: 'Select Area', filterBy: "name", name: 'Area' },
            { key: "country", label: 'country', type: "select" as const, options: countryNames, placeholder: 'Select Country', filterBy: "id", name: 'Country' },
            { key: "salesEngineerName", label: 'salesEngineerName', type: "select" as const, options: salesEngineerNames, placeholder: 'Select Sales Engineer', filterBy: "name", name: 'Sales Engineer' },
            { key: "salesSupportEngineerName", label: 'salesSupportEngineerName', type: "select" as const, options: salesSupportEngineerNames, placeholder: 'Select Sales Engineer', filterBy: "name", name: 'Sales Support Engineer' },
            { key: "state", label: 'state', type: "select" as const, options: cityNames, placeholder: 'Select City', filterBy: "id", name: 'City' },
            { key: "approvalAuthority", label: 'approvalAuthority', type: "select" as const, options: approvalAuthorityNames, placeholder: 'Select Approval Authority', filterBy: "id", name: 'Approval Authority' },
            { key: "company", label: 'company', type: "select" as const, options: companyNames, placeholder: 'Select Customer', filterBy: "id", name: 'Customer' },
            { key: "customerType", label: 'customerType', type: "select" as const, options: customerTypeNames, placeholder: 'Select Customer Type', filterBy: "id", name: 'Customer Type' },
            { key: "bookingProbability", label: 'bookingProbability', type: "select" as const, options: bookingProbabilityNames, placeholder: 'Select Booking Probability', filterBy: "name", name: 'Booking Probability' },

        ],
        dataTable: {
            columns: quotationColumns,
            data: quotationDataNew,
        },

        buttons: [

            { label: importing ? 'Importing...' : 'Import', action: handleImport, icon: Download, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                ]
            },

            { label: 'Add', action: handleAdd, icon: Plus, },
        ]
    };
    // const rowClassMap = {
    //     draft: "bg-white",
    //     quoterequested: "bg-yellow-100",
    //     incomplete: 'bg-blue-100',
    //     submitted: 'bg-orange-200',
    //     rejected: 'bg-red-200',
    //     approved: 'bg-green-200'

    // };

    const rowClassMap = (row: any) => {
        if (row?.isTotalRow) return "bg-yellow-100 font-bold";
        if (row?.status) return {
            draft: "bg-white",
            quoterequested: "bg-yellow-100",
            incomplete: 'bg-blue-100',
            submitted: 'bg-orange-200',
            rejected: 'bg-red-200',
            approved: 'bg-green-200'
        }[row.status] || "";
        return "";
    };

    return (
        <>
            <MasterComponentAQM config={quotationConfig} loadingState={loading} rowClassMap={rowClassMap} handleExport={handleExport} />
            <QuotationDialog
                isOpen={isDialogOpen}
                closeDialog={closeDialog}
                selectedMaster={selectedMaster}
                onSave={saveData}
                fields={fields}
                initialData={initialData}
                action={action}
                height=''
                width='full'
                customerData={customerData?.data}
                customerTypeData={customerTypeData?.data}
                statusData={statusData}
                onchangeData={onchangeData}
                countryData={countryData?.data}
                proposalOffer={proposalOffer}
                proposalDrawing={proposalDrawing}
                locationData={formattedLocationData}
                stateData={fullstateData?.data}

            />
            <DynamicDialog
                isOpen={isStatusDialogOpen}
                closeDialog={closeStatusDialog}
                selectedMaster={selectedMaster}
                onSave={saveData}
                fields={statusField}
                initialData={initialData}
                action={action}
                height={'auto'}
                quoteStatusData={quoteStatusData?.data}
                onchangeData={onchangeData}

            />
        </>

    )
}

export default page