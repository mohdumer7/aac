"use client";

import React from 'react'
import { ArrowUpDown, Download } from "lucide-react"
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import ReportMasterComponent from '@/components/ReportMasterComponent/ReportMasterComponent';
import { useGetApplicationQuery } from '@/services/endpoints/applicationApi';
import ReportComponent from '@/components/ReportComponent/ReportComponent';
import { transformQuoteData } from '@/lib/utils';
import moment from 'moment';
import * as XLSX from "xlsx";

interface OriginalData {
    area: string;
    avgQ22Value: string;
    country: string;
    region: string;
    totalJobs: number;
    totalQuotes: number;
    totalWeight: string;
    active: number;
    budgetary: number; 
    cancel: number;
    decline: number;
    hold: number;
    hotQuote: number;
    job: number;
    jobShipped: number;
    lost: number;
    total: number;
    jobNo: string;
    types: string;
    customer: string;
    q22Value: string;
    totalWt: string;
    currency: string;
    totalEstPrice: string;
    quoteNo: string;
    projectName:string;
    lostTo: string;
    lotToOthers:string;
    lostDate:Date;
    reason:string;
    forecastMonth:string;
    remarks:string;
}

const page = () => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const { user, status, authenticated }: any = useUserAuthorised();
    const { data: quotationData = [], isLoading: quotationLoading }: any = useGetApplicationQuery({
        db: MONGO_MODELS.QUOTATION_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: teamMemberData = [], isLoading: teamMemberLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.TEAM_MEMBERS_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const uniqueRegions = [
        ...new Set(
            quotationData?.data
                ?.map((q: { country?: { region?: { continent?: { name?: string } } } }) =>
                    q.country?.region?.continent?.name
                )
                .filter(Boolean) // Remove undefined/null values
        )
    ].sort((a, b) => (a as string).localeCompare(b as string)).map((region) => ({
        _id: region,
        name: region
    }));

    const uniqueAreas = [
        ...new Set(
            quotationData?.data
                ?.filter((q: { country: { region: { continent: { name: string; }; }; }; }) => !selectedRegion || q.country?.region?.continent?.name === selectedRegion)
                .map((q: { country: { region: { name: any; }; }; }) => q.country?.region?.name)
                .filter(Boolean)
        ),
    ].sort().map((area) => ({
        _id: area,
        name: area
    }));

    const uniqueCountries = [
        ...new Set(
            quotationData?.data
                ?.filter((q: { country: { region: { continent: { name: string; }; }; }; }) => !selectedRegion || q.country?.region?.continent?.name === selectedRegion)
                ?.filter((q: { country: { region: { name: string; }; }; }) => !selectedArea || q.country?.region?.name === selectedArea).map((q: { country: { name: any; }; }) => q.country?.name)
                .filter(Boolean)
        ),
    ].sort().map((area) => ({
        _id: area,
        name: area
    }));

    const quotationDataNew = transformQuoteData(quotationData?.data, user, teamMemberData?.data);

    const monthData = [
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

    const transformedData = quotationDataNew?.map((q: any) => ({
        ...q, // Keep all existing fields
        country: q.country?.name,
        area: q.country?.region?.name,
        region: q.country?.region?.continent?.name,
        types: q.projectType?.name,
        customer: q.company?.name,
        currency: q.currency?.name,
        q22Value: q.q22Value || 0,
        totalWt: q.totalWt || 0,
        totalEstPrice: q.totalEstPrice || 0,
        quoteNo: q.quoteNo
            ? `${q.country?.countryCode || ''}-${q.year ? q.year.toString().slice(-2) : ''}-${q.quoteNo}`
            : '',
        lostDate: moment(q.lostDate).format("DD-MMM-YYYY"),
        forecastMonth: monthData.find((m: { _id: any; }) => m._id === q.forecastMonth)?.name,

    }));

    const loading: boolean = transformedData?.length === 0;
    const handleExport = (type: string, data: OriginalData[]) => {
        const keyMapping: Record<string, string> = {
            region: "Region",
            area: "Area",
            country: "Country",
            totalQuotes: "Total Quotes",
            totalJobs: "No Of Jobs",
            totalWeight: "Sum Of Total Weight",
            avgQ22Value: "Avg Q22 Value",
            active: "Active",
            budgetary: "Budgetary",
            cancel: "Cancel",
            decline: "Decline",
            hold: "Hold",
            hotQuote: "Hot Quote",
            job: "Job",
            jobShipped: "Job Shipped",
            lost: "Lost",
            total: "Total",
            jobNo: "Job No",
            types: "Types",
            customer: "Customer Name",
            q22Value: "Q22 Value (AED)",
            totalWt: "Total Weight (Tons)",
            currency: "Currency",
            totalEstPrice: "Total Estimated Price",
            quoteNo:"Quote No",
            projectName: "Project Name",
            lostTo: "Lost To",
            lostToOthers: "Lost To Others",
            lostDate: "Lost Date",
            reason:"Lost Reason",
            forecastMonth: "Forecast Month",
            remarks: "Remarks"
          };
          const transformedData = data.map((item) => {
            const transformedItem: Record<string, any> = {};
        
            for (const key in item) {
              if (Object.prototype.hasOwnProperty.call(item, key)) {
                const newKey = keyMapping[key] || key; // Rename key if mapping exists, else keep original
                const value = item[key as keyof OriginalData];
        
                // Convert numerical fields (handling strings with commas)
                if (typeof value === "string" && value.match(/^\d{1,3}(,\d{3})*(\.\d+)?$/)) {
                  transformedItem[newKey] = parseFloat(value.replace(/,/g, ""));
                } else {
                  transformedItem[newKey] = value; // Keep other fields unchanged
                }
              }
            }
        
            return transformedItem;
          });

        if (type === "excel") {
            exportToExcel(transformedData);
        }
    };



    const exportToExcel = (data: any[]) => {
        // Convert JSON data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        // Write the workbook and trigger a download
        XLSX.writeFile(workbook, 'exported_data.xlsx');
    };

    const generateColumns = (columns: { key: string; label: string }[], editUser?: (user: any) => void) => {
        return [
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
            ...columns.map(({ key, label }) => ({
                accessorKey: key,
                header: ({ column }: { column: any }) => (
                    <button
                        className="flex items-center space-x-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        <span>{label}</span>
                        <ArrowUpDown size={15} />
                    </button>
                ),
                cell: ({ row }: { row: any }) =>
                    key === "firstName" && editUser ? (
                        <div className="text-blue-500" onClick={() => editUser(row.original)}>
                            {row.getValue(key)}
                        </div>
                    ) : (
                        <div>{row.getValue(key)}</div>
                    ),
            })),
        ];
    };

    const quoteDetailsCol = generateColumns(
        [
            { key: "region", label: "Region" },
            { key: "area", label: "Area" },
            { key: "country", label: "Country" },
            { key: "totalQuotes", label: "No Of Quotes" },
            { key: "totalJobs", label: "No Of Jobs" },
            { key: "avgQ22Value", label: "Avg Of Q22 Value (AED)" },
            { key: "totalWeight", label: "Sum Of Total Weight (Tons)" },
        ],

    );

    const jobLostCol = generateColumns(
        [
            { key: "quoteNo", label: "Quote No" },
            { key: "customer", label: "Customer Name" },
            { key: "projectName", label: "Project Name" },
            { key: "totalWt", label: "Total Weight (Tons)" },
            { key: "q22Value", label: "Q22 Value (AED)" },
            { key: "totalEstPrice", label: "Contract Amount" },
            { key: "currency", label: "Currency" },
            { key: "lostTo", label: "Lost To" },
            { key: "lostToOthers", label: "Lost To Others" },
            { key: "lostDate", label: "Lost Date" },
            { key: "reason", label: "Lost Reason" },
        ],

    );

    const MonthSFCol = generateColumns(
        [
            { key: "forecastMonth", label: "Forecast Month" },
            { key: "quoteNo", label: "Quote No" },
            { key: "jobNo", label: "Job No" },
            { key: "customer", label: "Customer Name" },
            { key: "projectName", label: "Project Name" },
            { key: "totalWt", label: "Total Weight (Tons)" },
            { key: "remarks", label: "Remarks" },
        ],

    );

    const jobDetailsCol = generateColumns(
        [

            { key: "area", label: "Area" },
            { key: "country", label: "Country" },
            { key: "jobNo", label: "Job No" },
            { key: "types", label: "Types" },
            { key: "customer", label: "Customer Name" },
            { key: "q22Value", label: "Q22 Value (AED)" },
            { key: "totalWt", label: "Total Weight (Tons)" },
            { key: "currency", label: "Currency" },
            { key: "totalEstPrice", label: "Total Estimated Price" },
        ],

    );

    const quoteStatusCol = generateColumns(
        [

            { key: "area", label: "Area" },
            { key: "country", label: "Country" },
            { key: "active", label: "Active" },
            { key: "budgetary", label: "Budgetary" },
            { key: "cancel", label: "Cancel" },
            { key: "decline", label: "Decline" },
            { key: "hold", label: "Hold" },
            { key: "hotQuote", label: "HOT QUOTE" },
            { key: "job", label: "Job" },
            { key: "jobShipped", label: "Job Shipped" },
            { key: "lost", label: "Lost" },
            { key: "total", label: "Total" },
        ],

    );

    const years = [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (currentMonth === 12) {
        for (let year = 2020; year <= currentYear + 1; year++) {
            years.push(year);
        }
    }
    else {
        for (let year = 2020; year <= currentYear; year++) {
            years.push(year);
        }
    };

    const yearData = years.map((year) => ({
        _id: year,
        name: year
    }));


    const reportConfig = {
        tabs: [
            {
                title: "Quotation Details",
                searchFields: [

                ],
                filterFields: [

                    { key: "region", label: 'region', name: 'region', type: "select", data: uniqueRegions, placeholder: 'Filter by region' },
                    { key: "area", label: 'area', name: 'area', type: "select", data: uniqueAreas, placeholder: 'Filter by area' },
                    { key: "country", label: 'country', name: 'country', type: "select", data: uniqueCountries, placeholder: 'Filter by country' },
                    { key: "year", label: 'year', name: 'year', type: "select", data: yearData, placeholder: 'Filter by year' },
                    { key: "month", label: 'month', name: 'month', type: "select", data: monthData, placeholder: 'Filter by month' },

                ],
                dataTable: {
                    columns: quoteDetailsCol,
                    data: transformedData, // Dynamic user data
                },
                buttons: [
                    {
                        label: 'Export', action: (type: string, data: any) => handleExport(type, data), icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                            { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                        ]
                    },
                ],
            },
            {
                title: "Quote Status",

                filterFields: [

                    { key: "region", label: 'region', name: 'region', type: "select", data: uniqueRegions, placeholder: 'Filter by region' },
                    { key: "area", label: 'area', name: 'area', type: "select", data: uniqueAreas, placeholder: 'Filter by area' },
                    { key: "country", label: 'country', name: 'country', type: "select", data: uniqueCountries, placeholder: 'Filter by country' },
                    { key: "year", label: 'year', name: 'year', type: "select", data: yearData, placeholder: 'Filter by year' },
                    { key: "month", label: 'month', name: 'month', type: "select", data: monthData, placeholder: 'Filter by month' },

                ],
                dataTable: {
                    columns: quoteStatusCol,
                    data: transformedData, // Dynamic order data
                },
                buttons: [
                    {
                        label: 'Export', action: (type: string, data: any) => handleExport(type, data), icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                            { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                        ]
                    },
                ],
            },
            {
                title: "Job Details",
                searchFields: [

                ],
                filterFields: [

                    { key: "region", label: 'region', name: 'region', type: "select", data: uniqueRegions, placeholder: 'Filter by region' },
                    { key: "area", label: 'area', name: 'area', type: "select", data: uniqueAreas, placeholder: 'Filter by area' },
                    { key: "country", label: 'country', name: 'country', type: "select", data: uniqueCountries, placeholder: 'Filter by country' },
                    { key: "year", label: 'year', name: 'year', type: "select", data: yearData, placeholder: 'Filter by year' },
                    { key: "month", label: 'month', name: 'month', type: "select", data: monthData, placeholder: 'Filter by month' },

                ],
                dataTable: {
                    columns: jobDetailsCol,
                    data: transformedData, // Dynamic order data
                },
                buttons: [
                    {
                        label: 'Export', action: (type: string, data: any) => handleExport(type, data), icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                            { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                        ]
                    },
                ],
            },
            {
                title: "Job Lost Report",
                searchFields: [

                ],
                filterFields: [

                ],
                dataTable: {
                    columns: jobLostCol,
                    data: transformedData, // Dynamic order data
                },
                buttons: [
                    {
                        label: 'Export', action: (type: string, data: any) => handleExport(type, data), icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                            { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                        ]
                    },
                ],
            },
            {
                title: "3 Month OIF",
                searchFields: [

                ],
                filterFields: [

                ],
                dataTable: {

                },
            },
            {
                title: "3 Month SF",
                searchFields: [

                ],
                filterFields: [

                ],
                dataTable: {
                    columns: MonthSFCol,
                    data: transformedData, // Dynamic order data
                },
                buttons: [
                    {
                        label: 'Export', action: (type: string, data: any) => handleExport(type, data), icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                            { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                        ]
                    },
                ],
            },
            {
                title: "QSR",
                searchFields: [

                ],
                filterFields: [

                ],
                dataTable: {

                },
            },
        ],
    };

    return (
        <>
            <ReportComponent config={reportConfig} loadingState={loading} rowClassMap={undefined} summary={true} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} selectedArea={selectedArea} setSelectedArea={setSelectedArea} />

        </>

    )
}

export default page