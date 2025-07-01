

import mongoose from 'mongoose';
import { MenuItemicons } from '../iconMaps';
import { MenuItem } from '../types';
import * as XLSX from "xlsx";
import { toast } from 'react-toastify';
import { SUCCESS, ERROR } from '@/shared/constants';
import moment from 'moment';
import { Department, Organisation } from '@/models';
import { exportToExcel } from '@/utils/copyToClipboard';
import { skip } from 'node:test';
import { Package } from 'lucide-react';
import Provider from '@/components/provider/Provider';

export const createMongooseObjectId = (id: any) => {
    if (mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id.toString()) {
        return id;
    }
    return new mongoose.Types.ObjectId(id);
}

export const createSidebarMenuData = (data: any) => {
    if (!data) {
        return {
            user: {},
            navMain: [],
        };
    }

    const user = {
        name: data.displayName,
        email: data.email,
        avatar: data.imageUrl || "",
    };

    const { access } = data || [];

    // Filter access items with `isMenuItem` true
    const menuItems = access
        .filter((item: any) => item.accessId.isMenuItem && item.accessId.isActive)
        .map((item: any) => ({
            id: item.accessId._id.toString(),
            name: item.accessId.name,
            url: item.accessId.url,
            category: item.accessId.category,
            parentId: item.accessId.parentId ? item.accessId.parentId.toString() : null,
            hasAccess: item.hasAccess,
        }));

    // Helper to build nested structure
    const buildMenuTree = (items: any[], parentId: string | null = null): MenuItem[] => {
        return items
            .filter(item => item.parentId === parentId && item.hasAccess) // Stop if hasAccess is false
            .map(item => ({
                title: item.name,
                url: item.url,
                icon: MenuItemicons[item.category],
                items: buildMenuTree(items, item.id), // Recursively add children
            }));
    };

    const navMain = buildMenuTree(menuItems);

    return {
        user,
        navMain,
    };
};

export const isObjectEmpty = (obj: any) => {
    return Object.keys(obj).length === 0;
};


interface BulkImportParams {
    roleData: any;
    continentData: any;
    regionData: any;
    countryData: any;
    locationData: any;
    categoryData: any;
    vendorData: any;
    productData: any;
    warehouseData: any;
    customerTypeData: any;
    customerData: any;
    userData: any;
    teamData: any;
    action: string;
    user: any;
    createUser: (data: any) => Promise<any>;
    db: string;
    masterName: string;
    designationData: any;
    departmentData: any;
    employeeTypeData: any;
    organisationData: any;
    onStart: () => void;
    onFinish: () => void;
}

export const bulkImport = async ({ roleData, continentData, regionData, countryData, locationData, categoryData, vendorData, productData, warehouseData, customerTypeData, customerData, userData, teamData, designationData, departmentData, employeeTypeData, organisationData, action, user, createUser, db, masterName, onStart, onFinish }: BulkImportParams) => {

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.onchange = async (event) => {
        onStart?.();
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (!file) {
            onFinish?.();
            return;
        };

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (!sheetData || sheetData.length === 0) {
                toast.error("The uploaded Excel sheet is empty.");
                return;
            }

            const masterRequiredFields: Record<string, string[]> = {
                User: ['Employee ID', 'First Name', 'Full Name', 'Department', 'Designation', 'Employee Type', 'Organisation', 'Reporting Location', 'Role'],
                Asset: ['Vendor Name', 'Invoice No', 'Purchase Date', 'Warehouse', 'Model'], // example
                Vendor: ['Name'], // example
                Category: ['name', 'description', 'specsRequired'], // example
                Department: ['Department Id', 'Department'],
                Designation: ['Designation', 'Department'],
                Customer: ['Name', 'Customer Type'],
                CustomerContact: ['Name', 'Customer Name'],
                IndustryType: ['Industry Type'],
                BuildingType: ['Building Type'],
                State: ['City', 'Country'],
                ProjectType: ['Project Type'],
                Location: ['Location', 'City'],
                Region: ['Region', 'Continent'],
                Product: ['Name', 'Category'],
                ProductType: ['Product Type'],
                Team: ['Team Name', 'Team Head', 'Department'],
                TeamRole: ['Name'],
                TeamMember: ['Name', 'Team Role', 'Reporting To', 'Team'],
                CustomerType: ['Customer Type'],
                Sector: ['Sector'],
                PaintType: ['Paint Type'],
                Incoterm: ['Name', 'Description'],
                QuoteStatus: ['Quote Status'],
                Currency: ['Currency'],
                Continent: ['Continent'],
                Country: ['Country Code', 'Country', 'Region'],
                VisaType: ['Visa Type'],
                SmlGroup: ['Group Name'],
                SmlSubGroup: ['Sub Group Name', 'Group Name'],
                PackageMaster: ['Package Name', 'Description', 'Amount'],
                AccountMaster: ['Account Number', 'Company', 'Provider'],
                PrinterUsage: ['Account Id', 'Printer', 'Date'],
                JobAccount: ['Account Id', 'Employee'],
                PrinterMaster: ['Printer Name'],

                // Add other masters as needed
            };

            const requiredFields = masterRequiredFields[masterName] || [];

            const rowsWithMissingData = sheetData
                .map((row: any, index: number) => {
                    const missingFields = requiredFields.filter(field => {
                        const value = row[field];

                        return value === undefined || value === null || String(value).trim() === "";
                    });

                    return missingFields.length > 0 ? { index: index + 2, missingFields } : null; // +2 for Excel-like indexing
                })
                .filter(Boolean); // Remove nulls


            if (rowsWithMissingData.length > 0) {
                const rowNumbers = rowsWithMissingData.map((_, i) => i + 2).join(', '); // +2 to match Excel rows (header + 1-based index)
                const errorMessage = rowsWithMissingData
                    .map(({ index, missingFields }: any) => `Row ${index}: ${missingFields.join(", ")}`)
                    .join(" | ");

                toast.error(`Missing required fields - ${errorMessage}`);
                return;
            }

            // Transform the sheet data based on the entity
            const formData = mapExcelToEntity(sheetData, masterName as keyof typeof entityFieldMappings);
            const successful: any[] = [];
            const skipped: any[] = [];

            const referenceData = {
                roleData: roleData?.data || [],
                continentData: continentData?.data || [],
                regionData: regionData?.data || [],
                countryData: countryData?.data || [],
                locationData: locationData?.data || [],
                categoryData: categoryData?.data || [],
                vendorData: vendorData?.data || [],
                productData: productData?.data || [],
                warehouseData: warehouseData?.data || [],
                customerTypeData: customerTypeData?.data || [],
                customerData: customerData?.data || [],
                userData: userData?.data || [],
                designationData: designationData?.data || [],
                departmentData: departmentData?.data || [],
                employeeTypeData: employeeTypeData?.data || [],
                teamData: teamData?.data || [],
                organisationData: organisationData?.data || [],
            };

            const finalData = mapFieldsToIds(formData, masterName, referenceData);
            console.log(finalData, 'final data')
            let enrichedData = finalData.map((item: any) => ({
                ...item,
                addedBy: user?._id,
                updatedBy: user?._id,
            }));
            if (masterName === 'Asset') {
                const grouped: any = {};
                let allInsertedAssets = [];
                let allSkippedAssets = [];
                let insertedInventories = [];
                let skippedInventories = [];
                // Group rows by invoiceNumber
                for (const row of enrichedData) {

                    const invoice = row?.invoiceNumber?.toString()?.trim();
                    if (!grouped[invoice]) grouped[invoice] = [];
                    grouped[invoice].push(row);
                }
                console.log(grouped, 'grouped');
                for (const invoiceNumber in grouped) {
                    const rowsForInvoice = grouped[invoiceNumber];
                    const firstRow = rowsForInvoice[0];

                    const inventory = {
                        vendor: firstRow.vendor,
                        warehouse: firstRow.warehouse,
                        purchaseDate: parseExcelDate(firstRow?.purchaseDate),
                        poNumber: firstRow.poNumber,
                        prNumber: firstRow.prNumber,
                        invoiceNumber: firstRow.invoiceNumber,
                        addedBy: user?._id,
                        updatedBy: user?._id,
                    };


                    const formattedData = {
                        action: action === 'Add' ? 'create' : 'update',
                        db: db,
                        bulkInsert: true,
                        data: [inventory],
                    };
                    const inventoryRes = await createUser(formattedData);

                    if (inventoryRes?.data?.data?.inserted?.length) {
                        insertedInventories.push(...inventoryRes.data.data.inserted);
                    }

                    if (inventoryRes?.data?.data?.skipped?.length) {
                        skippedInventories.push(...inventoryRes.data.data.skipped);
                    }

                    const inventoryId = inventoryRes?.data?.data?.inserted?.[0]?._id;
                    console.log(inventoryId, 'inventoryid');
                    const assetEntries = rowsForInvoice.map((row: any) => ({
                        serialNumber: row.serialNumber,
                        product: row.product,
                        warrantyStartDate: parseExcelDate(row?.warrantyStartDate),
                        warrantyEndDate: parseExcelDate(row?.warrantyEndDate),

                        inventory: inventoryId,
                        warehouse: row.warehouse,
                        specifications: JSON.parse(row?.specifications),
                        addedBy: user?._id,
                        updatedBy: user?._id,
                    }));

                    console.log(assetEntries, 'assetEntries');
                    const formattedData1 = {
                        action: action === 'Add' ? 'create' : 'update',
                        db: "ASSET_MASTER",
                        bulkInsert: true,
                        data: assetEntries,
                    };
                    const assetRes = inventoryId && await createUser(formattedData1);


                    if (assetRes?.data?.data?.inserted?.length) {
                        allInsertedAssets.push(...assetRes.data.data.inserted);
                        const insertedAssets = assetRes.data.data.inserted;

                        // If inserted contains full docs
                        const assetIds = insertedAssets.map((asset: any) => asset._id);
                        console.log(assetIds, 'assetids');
                        const inventory = {
                            assets: assetIds,
                        };


                        const formattedData = {
                            action: 'update',
                            db: db,
                            filter: { "_id": inventoryId },
                            data: inventory,
                        };
                        const inventoryRes = await createUser(formattedData);
                        console.log(inventoryRes, 'invetroryupdate')
                    }

                    if (assetRes?.data?.data?.skipped?.length) {
                        allSkippedAssets.push(...assetRes.data.data.skipped);
                    }
                }

                if (insertedInventories.length > 0) {
                    toast.success(`${insertedInventories.length} invoices added successfully.`);
                }
                if (skippedInventories.length > 0) {
                    toast.warning(`${skippedInventories.length} invoices were skipped.`);
                    exportToExcel(skippedInventories);
                }

                if (allInsertedAssets.length > 0) {
                    toast.success(`${allInsertedAssets.length} assets created successfully.`);
                }
                if (allSkippedAssets.length > 0) {
                    toast.warning(`${allSkippedAssets.length} assets were skipped.`);
                    exportToExcel(allSkippedAssets);
                }
                onFinish?.();

                return;
            }


            if (masterName === 'User') {
                enrichedData = finalData.map((item: any) => ({
                    ...item,
                    joiningDate: parseExcelDate(item?.joiningDate),
                }));
            };

            if (masterName === 'PrinterUsage') {
                enrichedData = finalData.map((item: any) => ({
                    ...item,
                    date: parseExcelDate(item?.date),
                }));
            };

            if (masterName === 'Team') {
                enrichedData = finalData.map((item: any) => ({
                    name: item?.name,
                    teamHead: [item?.teamHead],
                    department: item?.department,

                    addedBy: user?._id,
                    updatedBy: user?._id,
                }));
            };

            if (masterName === 'TeamMember') {
                enrichedData = finalData.map((item: any) => ({
                    user: item?.user,
                    teamRole: [item?.teamRole],
                    teamReportingTo: [item?.teamReportingTo],
                    team: item?.team,
                    addedBy: user?._id,
                    updatedBy: user?._id,
                }));
            };

            if (masterName === 'Category') {
                enrichedData = finalData.map((item: any) => ({
                    name: item?.name,
                    description: item?.description,
                    specsRequired: JSON.parse(item?.specsRequired),
                    addedBy: user?._id,
                    updatedBy: user?._id,
                }));
            };

            if (masterName === 'Vendor') {
                enrichedData = finalData.map((item: any) => ({
                    name: item?.name,
                    email: item?.email,
                    phone: item?.phone,
                    city: item?.city,
                    contactPersons: [{ name: item?.contactName, designation: item?.designation, email: item?.contactEmail, phone: item?.contactPhone }],
                    addedBy: user?._id,
                    updatedBy: user?._id,
                }));
            };

            const formattedData = {
                action: action === 'Add' ? 'create' : 'update',
                db: db,
                bulkInsert: true,
                data: enrichedData,
            };
            const response = await createUser(formattedData);

            if (response?.data?.data?.inserted.length > 0) {
                toast.success(`${response?.data?.data?.inserted.length} records imported successfully.`);
            }

            if (response?.data?.data?.skipped.length > 0) {
                exportToExcel(response?.data?.data?.skipped);
                toast.warning(`${response?.data?.data?.skipped.length} duplicates were skipped and exported to Excel.`);
            }

            onFinish?.();
        };
        reader.readAsBinaryString(file);
    };
    input.click();
};

function convertToCSV(data: any[]): string {
    if (!data.length) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(field => `${(row[field] ?? '').toString().replace(/\t/g, ' ')}`).join("\t")
    );
    return [headers.join("\t"), ...rows].join("\n");
}

interface BulkImportQuotationParams {
    roleData: any;
    continentData: any;
    regionData: any;
    countryData: any;
    quoteStatusData: any;
    teamMemberData: any;
    teamData: any;
    customerData: any;
    customerContactData: any;
    customerTypeData: any;
    sectorData: any;
    industryData: any;
    buildingData: any;
    stateData: any;
    approvalAuthorityData: any;
    projectTypeData: any;
    paintTypeData: any;
    currencyData: any;
    incotermData: any;
    quotationData: any;
    locationData: any;
    action: string;
    user: any;
    createUser: (data: any) => Promise<any>;
    db: string;
    masterName: string;
    onStart: () => void;
    onFinish: () => void;
}

export const bulkImportQuotation = async ({ roleData, continentData, regionData, countryData,
    quoteStatusData,
    teamMemberData,
    teamData,
    customerData,
    customerContactData,
    customerTypeData,
    sectorData,
    industryData,
    buildingData,
    stateData,
    approvalAuthorityData,
    projectTypeData,
    paintTypeData,
    currencyData,
    incotermData, quotationData, locationData, action, user, createUser, db, masterName, onFinish, onStart }: BulkImportQuotationParams) => {

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.onchange = async (event) => {
        onStart?.();
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (!file) {
            onFinish?.();
            return;
        };

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (!sheetData || sheetData.length === 0) {
                toast.error("The uploaded Excel sheet is empty.");
                onFinish?.();
                return;
            }

            const masterRequiredFields: Record<string, string[]> = {
                Quotation: ['Region', 'Area', 'Country', 'Year', 'Option', 'SO', 'RO', 'Quote Status', 'Date Received From Customer', 'Quote Rev', 'Sales Eng/Mng', 'Handle By', 'Status'],

                // Add other masters as needed
            };

            const requiredFields = masterRequiredFields[masterName] || [];
            const rowsWithMissingData = sheetData
                .map((row: any, index: number) => {
                    const missingFields = requiredFields.filter(field => {
                        const value = row[field];

                        return value === undefined || value === null || String(value).trim() === "";
                    });

                    return missingFields.length > 0 ? { index: index + 2, missingFields } : null; // +2 for Excel-like indexing
                })
                .filter(Boolean); // Remove nulls

            if (rowsWithMissingData.length > 0) {
                const rowNumbers = rowsWithMissingData.map((_, i) => i + 2).join(', '); // +2 to match Excel rows (header + 1-based index)
                const errorMessage = rowsWithMissingData
                    .map(({ index, missingFields }: any) => `Row ${index}: ${missingFields.join(", ")}`)
                    .join(" | ");

                toast.error(`Missing required fields - ${errorMessage}`);
                onFinish?.();
                return;
            }

            // Transform the sheet data based on the entity
            const formData = mapExcelToEntity(sheetData, masterName as keyof typeof entityFieldMappings);
            const successful: any[] = [];
            const skipped: any[] = [];
            // Transform the sheet data based on the entity

            const referenceData = {
                roleData: roleData?.data || [],
                continentData: continentData?.data || [],
                regionData: regionData?.data || [],
                countryData: countryData?.data || [],
                quoteStatusData: quoteStatusData?.data || [],
                teamMemberData: teamMemberData?.data || [],
                teamData: teamData?.data || [],
                customerData: customerData?.data || [],
                customerContactData: customerContactData?.data || [],
                customerTypeData: customerTypeData?.data || [],
                sectorData: sectorData?.data || [],
                industryData: industryData?.data || [],
                buildingData: buildingData?.data || [],
                stateData: stateData?.data || [],
                approvalAuthorityData: approvalAuthorityData?.data || [],
                projectTypeData: projectTypeData?.data || [],
                paintTypeData: paintTypeData?.data || [],
                currencyData: currencyData?.data || [],
                incotermData: incotermData?.data || []
            };
            const finalData = mapFieldsToIds(formData, masterName, referenceData);
            const enrichedData = finalData.map((item: any) => ({
                ...item,
                addedBy: user?._id,
                updatedBy: user?._id,
            }));


            // Send the transformed data for bulk insert
            try {
                const existingSet = new Set(
                    quotationData?.data?.map((record: { year: any; quoteNo: any; option: any; }) =>
                        `${record.year}-${record.quoteNo}-${record.option}`
                    )
                );
                const uniqueSet = new Set();

                const uniqueEnrichedData = enrichedData.filter((item: { year: any; quoteNo: any; option: any; }) => {
                    const key = `${item.year}-${item.quoteNo}-${item.option}`;
                    if (existingSet.has(key) || uniqueSet.has(key)) {
                        skipped.push(item); // Store duplicates
                        return false;
                    }
                    uniqueSet.add(key);

                    return true;
                });

                if (uniqueEnrichedData.length === 0) {
                    if (skipped.length > 0) {
                        exportToExcel(skipped);
                        toast.warning(`${skipped.length} duplicates were skipped and exported to excel.`);

                    } else {

                        toast.warning("No unique records found for import.");

                    }
                    onFinish?.();
                    return;
                }


                // Step 1: Insert ProposalRevision Entries (Bulk Insert)
                const revisionData = uniqueEnrichedData.map((item: { revNo: any; sentToEstimation: any; receivedFromEstimation: any; cycleTime: any; sentToCustomer: any; addedBy: any; updatedBy: any; }) => [
                    {
                        revNo: item.revNo,
                        sentToEstimation: item.sentToEstimation,
                        receivedFromEstimation: item.receivedFromEstimation,
                        cycleTime: item.cycleTime,
                        sentToCustomer: item.sentToCustomer,
                        addedBy: item.addedBy,
                        updatedBy: item.updatedBy,
                        changes: {}
                    },
                    {
                        revNo: item.revNo,
                        sentToEstimation: item.sentToEstimation,
                        receivedFromEstimation: item.receivedFromEstimation,
                        cycleTime: item.cycleTime,
                        sentToCustomer: item.sentToCustomer,
                        addedBy: item.addedBy,
                        updatedBy: item.updatedBy,
                        changes: {}
                    },
                ]).flat();

                const revisionResponse = await createUser({
                    action: "create",
                    db: "PROPOSAL_REVISION_MASTER",
                    bulkInsert: true,
                    data: revisionData,
                });

                if (revisionResponse.error) {
                    throw new Error(revisionResponse.error.data.message);
                }

                const insertedRevisions = revisionResponse?.data?.data?.inserted?.map((item: { _id: any; }) => item._id).filter(Boolean);
                if (insertedRevisions.length !== revisionData.length) {
                    onFinish?.();
                    throw new Error("Mismatch in inserted ProposalRevision records.");
                }

                // Step 2: Insert Proposal Entries
                const proposalData = uniqueEnrichedData.map((item: { addedBy: any; updatedBy: any; }, index: number) => [
                    {
                        revisions: [insertedRevisions[index * 2]], // ProposalOffer revision ID
                        type: "ProposalOffer",
                        addedBy: item.addedBy,
                        updatedBy: item.updatedBy,
                    },
                    {
                        revisions: [insertedRevisions[index * 2 + 1]], // ProposalDrawing revision ID
                        type: "ProposalDrawing",
                        addedBy: item.addedBy,
                        updatedBy: item.updatedBy,
                    },
                ]).flat();

                const proposalResponse = await createUser({
                    action: "create",
                    db: "PROPOSAL_MASTER",
                    bulkInsert: true,
                    data: proposalData,
                });

                if (proposalResponse.error) {
                    throw new Error(proposalResponse.error.data.message);
                }
                const insertedProposals = proposalResponse?.data?.data?.inserted?.map((item: { _id: any; }) => item._id).filter(Boolean);

                if (insertedProposals.length !== proposalData.length) {
                    throw new Error("Mismatch in inserted Proposal records.");
                }

                // Step 3: Insert Quotation Entries
                const quotationDataImport = uniqueEnrichedData.map((item: { country: any; year: any; option: any; revNo: any; quoteNo: any; quoteStatus: any; salesEngineer: any; salesSupportEngineer1: any; salesSupportEngineer2: any; salesSupportEngineer3: any; rcvdDateFromCustomer: any; sellingTeam: any; responsibleTeam: any; forecastMonth: string | number; status: any; handleBy: any; addedBy: any; updatedBy: any; }, index: number) => ({
                    ...item,
                    country: item.country,
                    year: item.year,
                    option: item.option,
                    proposals: [insertedProposals[index * 2], insertedProposals[index * 2 + 1]], // Proposal IDs
                    revNo: item.revNo,
                    quoteNo: item.quoteNo || '',
                    quoteStatus: item.quoteStatus,
                    salesEngineer: item.salesEngineer,
                    salesSupportEngineer: [item.salesSupportEngineer1, item.salesSupportEngineer2, item.salesSupportEngineer3].filter(Boolean),
                    rcvdDateFromCustomer: item.rcvdDateFromCustomer,
                    sellingTeam: item.sellingTeam,
                    responsibleTeam: item.responsibleTeam,
                    forecastMonth: monthMap[item?.forecastMonth as keyof typeof monthMap] ?? null,
                    status: item.status,
                    handleBy: item.handleBy,
                    addedBy: item.addedBy,
                    updatedBy: item.updatedBy,
                }));


                const formattedData = {
                    action: action === 'Add' ? 'create' : 'update',
                    db: db,
                    bulkInsert: true,
                    data: quotationDataImport,
                };
                const response = await createUser(formattedData);// Replace this with your actual insert logic

                if (response?.data?.data?.inserted.length > 0) {
                    toast.success(`${response?.data?.data?.inserted.length} records imported successfully.`);
                }

                if (skipped.length > 0) {
                    const combinedData = [...response?.data?.data?.skipped, ...skipped];
                    exportToExcel(combinedData);
                    toast.warning(`${combinedData.length} duplicates were skipped and exported to excel.`);

                }

                // if (response?.data?.data?.skipped.length > 0) {
                //     exportToExcel(response?.data?.data?.skipped);
                //     toast.warning(`${response?.data?.data?.skipped.length} duplicates were skipped and exported to Excel.`);
                // }

                onFinish?.();

            } catch (err) {
                onFinish?.();
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                toast.error(`Error during import: ${errorMessage}`);
            }
        };
        reader.readAsBinaryString(file);
    };
    input.click();
};

const fieldMappingConfig: { [key: string]: any } = {
    User: {
        role: { source: "roleData", key: "name", value: "_id" },
        department: { source: "departmentData", key: "name", value: "_id" },
        designation: { source: "designationData", key: "name", value: "_id" },
        employeeType: { source: "employeeTypeData", key: "name", value: "_id" },
        organisation: { source: "organisationData", key: "name", value: "_id" },
        activeLocation: { source: "locationData", key: "name", value: "_id" },
        reportingLocation: { source: "locationData", key: "name", value: "_id" },
        reportingTo: { source: "userData", key: "fullName", value: "_id" },

    },
    Designation: {
        department: { source: "departmentData", key: "name", value: "_id" },
    },
    Region: {
        continent: { source: "continentData", key: "name", value: "_id" },
    },
    Country: {
        region: { source: "regionData", key: "name", value: "_id" },
    },
    State: {
        country: { source: "countryData", key: "name", value: "_id" },
    },
    Quotation: {
        country: { source: "countryData", key: "name", value: "_id" },
        quoteStatus: { source: "quoteStatusData", key: "name", value: "_id" },
        salesEngineer: {
            source: "teamMemberData",
            key: "user.displayName", // Accessing displayName from the User table via TeamMember
            value: "_id",
            transform: (name: string, teamMemberData: any[]) => {
                if (!name || !Array.isArray(teamMemberData)) return null;
                const found = teamMemberData.find(member => {
                    return member.user?.displayName?.trim().toLowerCase() === name.trim().toLowerCase();
                });
                return found ? found._id : null;
            }
        },
        salesSupportEngineer1: {
            source: "teamMemberData",
            key: "user.displayName", // Accessing displayName from the User table via TeamMember
            value: "_id",
            transform: (name: string, teamMemberData: any[]) => {
                if (!name || !Array.isArray(teamMemberData)) return null;
                const found = teamMemberData.find(member => {
                    return member.user?.displayName?.trim().toLowerCase() === name.trim().toLowerCase();
                });
                return found ? found._id : null;
            }
        },
        salesSupportEngineer2: {
            source: "teamMemberData",
            key: "user.displayName", // Accessing displayName from the User table via TeamMember
            value: "_id",
            transform: (name: string, teamMemberData: any[]) => {
                if (!name || !Array.isArray(teamMemberData)) return null;
                const found = teamMemberData.find(member => {
                    return member.user?.displayName?.trim().toLowerCase() === name.trim().toLowerCase();
                });
                return found ? found._id : null;
            }
        },
        salesSupportEngineer3: {
            source: "teamMemberData",
            key: "user.displayName", // Accessing displayName from the User table via TeamMember
            value: "_id",
            transform: (name: string, teamMemberData: any[]) => {
                if (!name || !Array.isArray(teamMemberData)) return null;
                const found = teamMemberData.find(member => {
                    return member.user?.displayName?.trim().toLowerCase() === name.trim().toLowerCase();
                });
                return found ? found._id : null;
            }
        },
        sellingTeam: { source: "teamData", key: "name", value: "_id" },
        responsibleTeam: { source: "teamData", key: "name", value: "_id" },
        company: { source: "customerData", key: "name", value: "_id" },
        contact: { source: "customerContactData", key: "name", value: "_id" },
        customerType: { source: "customerTypeData", key: "name", value: "_id" },
        sector: { source: "sectorData", key: "name", value: "_id" },
        industryType: { source: "industryData", key: "name", value: "_id" },
        buildingType: { source: "buildingData", key: "name", value: "_id" },
        state: { source: "stateData", key: "name", value: "_id" },
        approvalAuthority: { source: "approvalAuthorityData", key: "name", value: "_id" },
        projectType: { source: "projectTypeData", key: "name", value: "_id" },
        paintType: { source: "paintTypeData", key: "name", value: "_id" },
        currency: { source: "currencyData", key: "name", value: "_id" },
        incoterm: { source: "incotermData", key: "name", value: "_id" },
        handleBy: {
            source: "teamMemberData",
            key: "user.displayName", // Accessing displayName from the User table via TeamMember
            value: "_id",
            transform: (name: string, teamMemberData: any[]) => {
                if (!name || !Array.isArray(teamMemberData)) return null;
                const found = teamMemberData.find(member => {
                    return member.user?.displayName?.trim().toLowerCase() === name.trim().toLowerCase();
                });
                return found ? found._id : null;
            }
        },
    },
    Warehouse: {
        location: { source: "locationData", key: "name", value: "_id" },
    },
    Vendor: {
        city: { source: "locationData", key: "name", value: "_id" },
    },
    Product: {
        category: { source: "categoryData", key: "name", value: "_id" },
    },
    Asset: {
        vendor: { source: "vendorData", key: "name", value: "_id" },
        product: { source: "productData", key: "model", value: "_id" },
        warehouse: { source: "warehouseData", key: "name", value: "_id" },
    },
    Customer: {
        customerType: { source: "customerTypeData", key: "name", value: "_id" },
    },
    CustomerContact: {
        customer: { source: "customerData", key: "name", value: "_id" },
    },
    Role: {
        role: { source: "roleData", key: "name", value: "_id" },
    },
    Team: {
        teamHead: { source: "userData", key: "displayName", value: "_id" },
        department: { source: "departmentData", key: "name", value: "_id" },
    },
    TeamMember: {
        user: { source: "userData", key: "displayName", value: "_id" },
        teamRole: { source: "roleData", key: "name", value: "_id" },
        teamReportingTo: { source: "userData", key: "displayName", value: "_id" },
        team: { source: "teamData", key: "name", value: "_id" },
    },
    Location: {
        state: { source: "locationData", key: "name", value: "_id" },

    },
    SmlSubGroup: {
        group: { source: "categoryData", key: "name", value: "_id" },
    },
    AccountMaster: {
        employee: { source: "userData", key: "displayName", value: "_id" },
        others: { source: "teamData", key: "name", value: "_id" },
        company: { source: "organisationData", key: "name", value: "_id" },
        provider: { source: "vendorData", key: "name", value: "_id" },
        package: { source: "productData", key: "name", value: "_id" },
    },
    PrinterUsage: {
        jobAccount: { source: "userData", key: "name", value: "_id" },
        printer: { source: "teamData", key: "name", value: "_id" },

    },
    JobAccount: {
        employee: { source: "userData", key: "displayName", value: "_id" },

    },


    // Add more entity mappings if needed
};

const entityFieldMappings = {
    User: {
        "Employee ID": "empId",
        "First Name": "firstName",
        "Last Name": "lastName",
        "Full Name": "fullName",
        "Email": "email",
        "Display Name": "displayName",
        "Department": "department",
        "Designation": "designation",
        "Employee Type": "employeeType",
        "Reporting To": "reportingTo",
        "Organisation": "organisation",
        "Reporting Location": "reportingLocation",
        "Active Location": "activeLocation",
        "Role": "role",
        "Extension": "extension",
        "Mobile": "mobile",
        "Joining Date": "joiningDate",
        "Personal Number": "personalNumber",
        // "Relieving Date": "relievingDate",
        // Add more mappings for users
    },
    Department: {
        "Department Id": "depId",
        "Department": "name",
        // Add more mappings for departments
    },
    Role: {
        "Role": "name",
        // Add more mappings for Role
    },

    EmployeeType: {
        "Employee Type": "name",

        // Add more mappings for EmployeeType
    },
    Designation: {
        "Designation": "name",
        "Department": "department",

        // Add more mappings for Designation
    },
    Continent: {
        "Continent": "name",

        // Add more mappings for Continent
    },
    Region: {
        "Region": "name",
        "Continent": "continent",

        // Add more mappings for Region
    },

    Country: {
        "Country Code": "countryCode",
        "Country": "name",
        "Region": "region",

        // Add more mappings for Country
    },

    State: {
        "City": "name",
        "Country": "country",

        // Add more mappings for State
    },
    Currency: {
        "Currency": "name",

        // Add more mappings for State
    },
    PaintType: {
        "Paint Type": "name",

        // Add more mappings for State
    },
    ProjectType: {
        "Project Type": "name",

        // Add more mappings for State
    },
    BuildingType: {
        "Building Type": "name",

        // Add more mappings for State
    },
    IndustryType: {
        "Industry Type": "name",

        // Add more mappings for State
    },
    QuoteStatus: {
        "Quote Status": "name",

        // Add more mappings for State
    },
    Quotation: {
        "Country": "country",
        "Year": "year",
        "Quote No": "quoteNo",
        "Option": "option",
        "SO": "sellingTeam",
        "RO": "responsibleTeam",
        "Quote Rev": "revNo",
        "Quote Status": "quoteStatus",
        "Date Received From Customer": "rcvdDateFromCustomer",
        "Sales Eng/Mng": "salesEngineer",
        "Sales Support 1": "salesSupportEngineer1",
        "Sales Support 2": "salesSupportEngineer2",
        "Sales Support 3": "salesSupportEngineer3",
        "Customer Name": "company",
        "Contact Name": "contact",
        "Customer Type": "customerType",
        "End Client": "endClient",
        "Project Management": "projectManagementOffice",
        "Consultant": "consultant",
        "Main Contractor": "mainContractor",
        "Erector": "erector",
        "Project Name": "projectName",
        "Sectors": "sector",
        "Industry Type": "industryType",
        "Other Industry": "otherIndustryType",
        "Building Type": "buildingType",
        "Other Building Type": "otherBuildingType",
        "Building Usage": "buildingUsage",
        "City": "state",
        "Approval Authority": "approvalAuthority",
        "Plot No": "plotNumber",
        "Date Sent To Estimation": "sentToEstimation",
        "Date Received From Estimation": "receivedFromEstimation",
        "Cycle Time (Days)": "cycleTime",
        "Date Sent To Customer": "sentToCustomer",
        "No Of Buildings": "noOfBuilding",
        "Project Type": "projectType",
        "Paint Type": "paintType",
        "Other Paint Type": "otherPaintType",
        "Projected Area (Sq. Mtr)": "projectArea",
        "Total Weight (Tons)": "totalWt",
        "Mezzanine Area (Sq. Mtr)": "mezzanineArea",
        "Mezzanine Weight (Tons)": "mezzanineWt",
        "Currency": "currency",
        "Total Estimated Price": "totalEstPrice",
        "Q22 Value (AED)": "q22Value",
        "Sp. BuyOut Price": "spBuyoutPrice",
        "Freight Price": "freightPrice",
        "Incoterm": "incoterm",
        "Incoterm Description": "incotermDescription",
        "Booking Probability": "bookingProbability",
        "Job No": "jobNo",
        "Job Date": "jobDate",
        "Forecast Month": "forecastMonth",
        "Payment Term": "paymentTerm",
        "Remarks": "remarks",
        "Lost To": "lostTo",
        "Lost To Others": "lostToOthers",
        "Lost Date": "lostDate",
        "Reason": "reason",
        "Initial Ship Date": "initialShipDate",
        "Final Ship Date": "finalShipDate",
        "Status": 'status',
        "Handle By": 'handleBy',
    },

    Warehouse: {
        "Name": "name",
        "Location": "location",
        "Contact Person": "contactPerson",
        "Contact Number": "contactNumber",
        // Add more mappings for Country
    },
    Vendor: {
        "Name": "name",
        "Email": "email",
        "Contact Number": "phone",
        "City": "city",
        "Contact Person": "contactName",
        "Designation": "designation",
        "Contact Email": "contactEmail",
        "Phone": "contactPhone",
        // Add more mappings for Country
    },
    Product: {
        "Name": "name",
        "Description": "description",
        "Category": "category",
        "Brand": "brand",
        "Model": "model",
        // Add more mappings for Country
    },
    Category: {
        "Name": "name",
        "Description": "description",
        "Required Specification": "specsRequired",
        // Add more mappings for Country
    },
    Asset: {
        'Vendor Name': 'vendor',
        'Invoice No': 'invoiceNumber',
        'PO Number': 'poNumber',
        'PR Number': 'prNumber',
        'Purchase Date': 'purchaseDate',
        'Warehouse': 'warehouse',

        'Serial Number': 'serialNumber',
        'Model': 'product',
        'Warranty Start Date': 'warrantyStartDate',
        'Warranty End Date': 'warrantyEndDate',
        'Specifications': 'specifications'
    },
    Customer: {
        "Name": "name",
        "Website": "website",
        "Email": "email",
        "Phone": "phone",
        "Address": "address",
        "Customer Type": "customerType",
        // Add more mappings for Country
    },
    CustomerContact: {
        "Name": "name",
        "Email": "email",
        "Phone": "phone",
        "Position": "position",
        "Customer Name": "customer",
        // Add more mappings for Country
    },
    ProductType: {
        "Product Type": "name",

    },
    Team: {
        "Team Name": "name",
        "Team Head": "teamHead",
        "Department": "department",

    },
    TeamRole: {
        "Name": "name",

    },
    TeamMember: {
        "Name": "user",
        "Team Role": "teamRole",
        "Reporting To": "teamReportingTo",
        "Team": "team",

    },
    CustomerType: {
        "Customer Type": "name",

    },
    Sector: {
        "Sector": "name",

    },
    Incoterm: {
        "Name": "name",
        "Description": "description",

    },
    Location: {
        "Location": "name",
        "Address": "address",
        "Pin Code": "pincode",
        "City": "state",

    },
    VisaType: {
        "Visa Type": "name"
    },
    SmlGroup: {
        "Group Name": "name"
    },
    SmlSubGroup: {
        "Sub Group Name": "name",
        "Group Name": "group"
    },
    PackageMaster: {
        "Package Name": "name",
        "Description": "description",
        "Amount": "amount",
    },
    AccountMaster: {
        "Account Number": "name",
        "Provider": "provider",
        "Employee": "employee",
        "Others": "others",
        "Company": "company",
        "Package Name": "package",
    },
    PrinterUsage: {
        "Account Id": "jobAccount",
        "Printer": "printer",
        "Date": "date",
        "Copy Color": "copyColor",
        "Copy BW": "copyBw",
        "Print Color": "printColor",
        "Print BW": "printBw",
    },
    JobAccount: {
        "Account Id": "name",
        "Employee": "employee",
       
    },
    PrinterMaster: {
        "Printer Name": "name",
        "Printer Location": "printerLocation",
       
    },


    // Add mappings for other entities
};


const mapFieldsToIds = (data: any[], entityType: string, referenceData: { [x: string]: any; roleData?: any; continentData?: any; regionData?: any; countryData?: any; quoteStatusData?: any; teamMemberData?: any; teamData?: any; customerData?: any; customerContactData?: any; customerTypeData?: any; sectorData?: any; industryData?: any; buildingData?: any; stateData?: any; approvalAuthorityData?: any; projectTypeData?: any; paintTypeData?: any; currencyData?: any; incotermData?: any; locationData?: any; }) => {

    const mappings = fieldMappingConfig[entityType as keyof typeof fieldMappingConfig];
    return data.map((item) => {
        const transformedItem = { ...item };
        if (mappings) {
            Object.entries(mappings).forEach(([field, mapping]) => {
                const { source, key, value, transform } = mapping as { source: string, key: string, value: string, transform?: Function };

                const referenceArray = referenceData[source]?.data || referenceData[source];

                if (!Array.isArray(referenceArray)) {
                    console.error(`Invalid reference data for source: ${source}`, referenceData[source]);
                    transformedItem[field] = undefined; // Default to empty if reference data is invalid
                    return;
                }

                if (transform) {
                    // Apply transform function if defined

                    transformedItem[field] = transform(item[field], referenceArray);
                } else {
                    // Default mapping lookup
                    const reference = referenceArray.find((ref) => ref[key]?.toLowerCase() === item[field]?.toLowerCase());
                    // const reference = referenceArray.find((ref) => {
                    //     const refValue = ref[key];

                    //     const itemValue = item[field];
                    //     return refValue?.toLowerCase() === itemValue?.toLowerCase();
                    // });
                    transformedItem[field] = reference ? reference[value] : undefined;
                }

                if (!transformedItem[field]) {
                    console.warn(`No reference found for field: ${field} with value: ${item[field]}`);
                }
            });
        }

        return transformedItem;
    });
};


const monthMap = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};
export const validate = {
    required: (value: string) => (value ? undefined : "Required"),
    text: (value: string) => {
        if (value.length < 3) return "Must be at least 3 characters";
        if (value.length > 100) return "Must be less than 100 characters";
        return undefined;
    },
    textSmall: (value: string) => {
        if (value.length < 2) return "Must be at least 2 characters";
        if (value.length > 50) return "Must be less than 50 characters";
        return undefined;
    },
    number: (value: string) => {
        if (isNaN(Number(value))) return "Invalid number";
        return undefined;
    },
    greaterThanZero: (value: string) => {
        if (isNaN(Number(value)) || Number(value) <= 0) return "Must be greater than 0";
        return undefined;
    },
    phone: (value: string) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(value) ? undefined : "Invalid phone number";
    },
    email: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Invalid email address";
        if (value.length < 5) return "Email must be at least 5 characters";
        if (value.length > 100) return "Email must be less than 100 characters";
        return undefined;
    },
    desription: (value: string) => {
        if (value && value.length > 500) return "Description must be less than 500 characters";
        return undefined;
    },
    specification: (value: Record<string, string>) => {
        if (Object.keys(value).length === 0) return "At least one specification is required";
        return undefined;
    },
    mixString: (value: string) => {
        if (!/^[A-Z0-9-]+$/.test(value)) {
            return "Must contain only uppercase letters, numbers, and hyphens";
        }
        if (value.length < 4) {
            return "Must be at least 4 characters";
        }
        if (value.length > 50) {
            return "Must be less than 50 characters";
        }
        return undefined;
    },
    notFutureDate: (value: string) => {
        const purchaseDate = new Date(value);
        if (purchaseDate > new Date()) {
            return "Dateate cannot be in the future";
        }
        return undefined;
    },
    locationSelected: (value: string) => {
        if (!value) return "Location must be selected";
        return undefined;
    }
}

export const generateTicketId = async () => {
    // Get today's date in format YYYYMMDD
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Get tickets from today to determine the sequence number
    const dbEngine = (await import('@/server/Engines/DbEngine')).dbEngine;
    const result = await dbEngine.mongooose.find('TICKET_MASTER', {
        filter: {
            ticketId: { $regex: `^TKT-${dateStr}` }
        },
        sort: { createdAt: 'asc' }
    });

    // Determine the next sequence number
    let sequence = 1;
    if (result.status === 'SUCCESS' && result.data.length > 0) {
        // Extract the sequence number from the last ticket ID
        const lastTicketId = result.data[0].ticketId;
        const lastSequence = parseInt(lastTicketId.split('-')[2]);
        sequence = lastSequence + 1;
    }

    // Format the sequence number with leading zeros
    const sequenceStr = String(sequence).padStart(3, '0');

    // Return the generated ticket ID
    return `TKT-${dateStr}-${sequenceStr}`;
};




const mapExcelToEntity = (excelData: any[], entityType: keyof typeof entityFieldMappings) => {

    const mappings = entityFieldMappings[entityType];
    console.log("mappings", mappings);
    return excelData.map((row) =>
        Object.keys(row).reduce((acc: Record<string, any>, key) => {
            const mappedKey = (mappings as Record<string, string>)[key];
            if (mappedKey) acc[mappedKey] = row[key];
            return acc;
        }, {} as Record<string, any>)
    );
};


function parseExcelDate(value: any): Date | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value; // Already a valid JS Date
    }

    if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 86400000);
    }

    if (typeof value === 'string') {
        // Try DD/MM/YYYY
        const parsed = moment(value, "DD/MM/YYYY", true);
        if (parsed.isValid()) {
            return parsed.toDate();
        }

        // Try MM/DD/YYYY as fallback
        const fallbackParsed = moment(value, "MM/DD/YYYY", true);
        if (fallbackParsed.isValid()) {
            return fallbackParsed.toDate();
        }
    }

    return null;
}







