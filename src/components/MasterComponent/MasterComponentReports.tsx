"use client"

import React from 'react'
import DashboardLoader from '../ui/DashboardLoader';
import { Input } from "@/components/ui/inputSearch";
import { Button } from '../ui/button';
import { ChevronsUpDown, Check, ListFilter } from 'lucide-react';

import { DataTable } from '../TableComponent/TableComponent';
import { useState } from 'react';
import { useEffect } from 'react';
import { ObjectId } from 'mongoose';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import * as XLSX from "xlsx";
import { Combobox } from '../ui/ComboBoxWrapper';
import { DatePicker } from '../ui/date-picker';
import { set } from 'lodash';

// Interface for individual Input and Select field configurations
interface FieldConfig {
    key: string
    label: string; // The label for the field
    type: 'text' | 'email' | 'select'; // Type of the field (input or select)
    placeholder?: string; // Placeholder for input fields (optional)
    options?: string[]; // Options for select fields (optional)
}

// Interface for Button configuration
interface ButtonConfig {
    label: string; // The label for the button
    action: () => void; // Function to handle button click
    icon?: React.ElementType; // Icon for the button
    className?: string; // Optional CSS class for styling
}

interface MasterComponentProps {
    config: any;
    loadingState: boolean;
    rowClassMap: any;
    summary: boolean;
    onchangeData: (data: any) => void; // Optional callback for data changes
}




const MasterComponent: React.FC<MasterComponentProps> = ({ config, loadingState, rowClassMap, summary, onchangeData }) => {

    const [searchValues, setSearchValues] = useState<Record<string, string>>({});
    const [filterValues, setFilterValues] = useState<Record<string, string | null>>({});
    const [filteredData, setFilteredData] = useState(config?.dataTable?.data);
    const [summaryData, setSummaryData] = useState([]);
    const [title, setTitle] = useState(config?.title || "");

    useEffect(() => {
        let summary: any = {};
        console.log("Config:", config);
        setFilteredData(config?.dataTable?.data);
        console.log(config?.title, "Config Title");
        switch (config?.title) {
            case "Usage Details":
                summary = config?.dataTable?.data?.reduce(
                    (acc: any, item: any) => {
                        const packageAmount = item?.account?.package?.amount || 0;
                        const gross = item?.grossBillAmount || 0;
                        const vat = item?.vat || 0;
                        const oneTime = item?.oneTimeCharge || 0;
                        const net = item?.netBillAmount || 0;

                        acc.totalPackageAmount += packageAmount;
                        acc.totalGrossBillAmount += gross;
                        acc.totalVAT += vat;
                        acc.totalOneTimeCharges += oneTime;
                        acc.totalNetBillAmount += net;

                        return acc;
                    },
                    {
                        totalPackageAmount: 0,
                        totalGrossBillAmount: 0,
                        totalVAT: 0,
                        totalOneTimeCharges: 0,
                        totalNetBillAmount: 0
                    }
                );
                break;
            case "Deduction Reports":
                summary = config?.dataTable?.data?.reduce(
                    (acc: any, item: any) => {
                        const packageAmount = item?.account?.package?.amount || 0;
                        const gross = item?.grossBillAmount || 0;
                        const waivedAmount = item?.waivedAmount || 0;
                        const deductionAmount = item?.finalDeduction || 0;

                        acc.totalPackageAmount += packageAmount;
                        acc.totalGrossBillAmount += gross;
                        acc.totalWaivedAMount += waivedAmount;
                        acc.totalDeductionAmount += deductionAmount;


                        return acc;
                    },
                    {
                        totalPackageAmount: 0,
                        totalGrossBillAmount: 0,
                        totalWaivedAMount: 0,
                        totalDeductionAmount: 0

                    }
                );
                break;

            case "Deduction Summary":
                summary = config?.dataTable?.data?.reduce(
                    (acc: any, item: any) => {
                        const packageAmount = item?.account?.package?.amount || 0;
                        const gross = item?.grossBillAmount || 0;
                        const waivedAmount = item?.waivedAmount || 0;
                        const deductionAmount = item?.finalDeduction || 0;

                        acc.totalPackageAmount += packageAmount;
                        acc.totalGrossBillAmount += gross;
                        acc.totalWaivedAMount += waivedAmount;
                        acc.totalDeductionAmount += deductionAmount;


                        return acc;
                    },
                    {
                        totalPackageAmount: 0,
                        totalGrossBillAmount: 0,
                        totalWaivedAMount: 0,
                        totalDeductionAmount: 0

                    }
                );
                break;

            default:
                return;


        }


        console.log(summary);
        setSummaryData(summary);
        setTitle(config?.title || "");
    }, [config, loadingState])

    // Handle input field change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {

        let value: any = "";

        value = e?.target?.value;

        const newSearchValues = { ...searchValues, [field]: value };

        if (value === '') {
            delete newSearchValues[field]; // Remove field if empty
        } else {
            newSearchValues[field] = value;
        }

        setSearchValues(newSearchValues);
        // filterData(newSearchValues, filterValues); // Trigger filterData after search change
    };

    // Handle filter field change (select)
    const handleFilterChange = (value: string | null, field: string) => {
        if (field === 'currentMonth' || field === 'currentYear' ) {
            onchangeData({ id: value, fieldName: field });
            return;
        }
        const newFilterValues = { ...filterValues, [field]: value };

        setFilterValues(newFilterValues);
        // filterData(searchValues, newFilterValues); // Trigger filterData after filter change
    };

    useEffect(() => {
        console.log(searchValues, filterValues)
        filterData(searchValues, filterValues); // Trigger filtering after search/filter change
    }, [searchValues, filterValues]);

    // Filter data based on search and filter criteria
    const filterData = (searchValues: any, filterValues: any) => {

        const filtered = config?.dataTable?.data?.filter((item: { [x: string]: any; }) => {
            // Check if item matches search criteria

            const matchesSearch = Object.keys(searchValues).every((key) => {

                if (key === 'month') {
                    console.log('month search triggered');
                    return true; // Skip date filtering for now
                }

                if (key === 'billingPeriodStart') {
                    const searchQuery: any = searchValues[key]
                        ? new Date(searchValues?.[key]).toLocaleDateString("en-GB")
                        : null;

                    const value = item[key]
                        ? new Date(item[key]).toLocaleDateString("en-GB")
                        : null;
                    if (!searchQuery) return true;
                    return value && value?.includes(searchQuery);
                }
                else {
                    console.log("Search Key:", key);
                    console.log("Search Value:", searchValues);
                    const rawSearch = searchValues?.[key];
                    const searchQuery = typeof rawSearch === 'string' ? rawSearch.toLowerCase() : '';

                    const value = item?.[key]?.toString().toLowerCase() || ''; // Convert the item value to string and make it lowercase

                    return value.includes(searchQuery);
                }

            });

            // Check if item matches filter criteria

            const matchesFilter = Object.keys(filterValues).every((key) => {

                const filterValue = filterValues[key];

                // If no filter value, pass the filter
                if (filterValue === null) return true;

                return typeof item[key] === 'string' && item[key].toLowerCase() === filterValue?.toLowerCase();
            });

            return matchesSearch && matchesFilter;
        });
        setFilteredData(filtered); // Update filtered data state
        switch (config?.title) {
            case "Usage Details":
                summary = filtered?.reduce(
                    (acc: any, item: any) => {
                        const packageAmount = item?.account?.package?.amount || 0;
                        const gross = item?.grossBillAmount || 0;
                        const vat = item?.vat || 0;
                        const oneTime = item?.oneTimeCharge || 0;
                        const net = item?.netBillAmount || 0;

                        acc.totalPackageAmount += packageAmount;
                        acc.totalGrossBillAmount += gross;
                        acc.totalVAT += vat;
                        acc.totalOneTimeCharges += oneTime;
                        acc.totalNetBillAmount += net;

                        return acc;
                    },
                    {
                        totalPackageAmount: 0,
                        totalGrossBillAmount: 0,
                        totalVAT: 0,
                        totalOneTimeCharges: 0,
                        totalNetBillAmount: 0
                    }
                );
                break;
            case "Deduction Reports":
                summary = filtered?.reduce(
                    (acc: any, item: any) => {
                        const packageAmount = item?.account?.package?.amount || 0;
                        const gross = item?.grossBillAmount || 0;
                        const waivedAmount = item?.waivedAmount || 0;
                        const deductionAmount = item?.finalDeduction || 0;

                        acc.totalPackageAmount += packageAmount;
                        acc.totalGrossBillAmount += gross;
                        acc.totalWaivedAMount += waivedAmount;
                        acc.totalDeductionAmount += deductionAmount;


                        return acc;
                    },
                    {
                        totalPackageAmount: 0,
                        totalGrossBillAmount: 0,
                        totalWaivedAMount: 0,
                        totalDeductionAmount: 0

                    }
                );
                break;

            default:
                return;


        }



        setSummaryData(summary);
        setTitle(config?.title || "");
    };


    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Exported Data", 10, 10);
        // Add table or other content
        doc.save("table_data.pdf");
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(config.dataTable.userData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, "table_data.xlsx");
    };

    const [open, setOpen] = React.useState(false)
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    interface FieldObject {
        options: any;
        key: string;
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

    return (
        <>
            <DashboardLoader loading={loadingState}>
                <div className='flex flex-col gap-2 w-full h-full px-4 py-1 pt-4'>

                    {/* Filter Section */}
                    <div className='flex flex-row items-center justify-between gap-2'>
                        <div className="flex items-center gap-1 w-full">
                            {/* Render search fields */}
                            <div className='flex items-center '>{config.searchFields?.map((field: FieldObject, index: React.Key | null | undefined) => {

                                if (field?.type === 'date') {
                                    return (
                                        <div key={index} className='w-full'>

                                            <DatePicker
                                                currentDate={undefined}
                                                handleChange={(e) => handleSearchChange(e, field.label)}

                                                placeholder={field.placeholder}
                                            />

                                        </div>
                                    )
                                }
                                else {
                                    return (

                                        <div key={index} className='w-full'>

                                            <Input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                value={searchValues[field.label] || ''}
                                                onChange={(e) => handleSearchChange(e, field.label)}
                                            />
                                        </div>
                                    )
                                }

                            })}
                            </div>


                            <div className='flex items-center gap-1'>
                                {config.filterFields?.map((field: FieldObject, index: number) => {

                                    if (field?.type === 'date') {
                                        return (
                                            <div key={index} className='w-full'>

                                                <DatePicker
                                                    currentDate={undefined}
                                                    handleChange={handleFilterChange}

                                                    placeholder={field.placeholder}
                                                />

                                            </div>
                                        )
                                    }
                                    else {
                                        return (

                                            <div key={index} className='w-full'>

                                                <Combobox
                                                    key={field.key || index}
                                                    field={field}
                                                    formData={[]}
                                                    handleChange={handleFilterChange}
                                                    placeholder={field.placeholder || ""}

                                                />
                                            </div>
                                        );
                                    }

                                })}
                            </div>
                        </div>

                        <div className='flex gap-1'>
                            {/* Button Section */}
                            {config.buttons?.map((button: ButtonConfig & { dropdownOptions?: { label: string; value: any; action: (value: any) => void; }[] }, index: number) => (
                                <div key={index} className="relative">
                                    {/* Button */}
                                    <Button
                                        effect="expandIcon"
                                        icon={button.icon}
                                        iconPlacement="right"
                                        onClick={() => {
                                            if (button.dropdownOptions) {
                                                // Toggle dropdown visibility for this button
                                                setActiveDropdown(index === activeDropdown ? null : index);
                                            } else {
                                                button.action(); // Call action directly if no dropdown
                                            }
                                        }}
                                        className={`w-28 ${button.className}`}
                                    >
                                        {button.label}
                                    </Button>

                                    {/* Dropdown (only if dropdownOptions are provided and active) */}
                                    {button.dropdownOptions && activeDropdown === index && (
                                        <div className="absolute right-0 mt-2 p-2 bg-white shadow-lg border rounded-md w-40 z-50">
                                            {button.dropdownOptions.map((option: any, optionIndex) => (
                                                <div
                                                    key={optionIndex}
                                                    className="rounded-md cursor-pointer px-4 p-2 hover:bg-gray-100"
                                                    onClick={() => {
                                                        console.log(option)
                                                        option.action(option.value, (filteredData && filteredData?.length > 0) ? filteredData : (filteredData ? [] : config?.dataTable?.data)); // Execute the action for this dropdown option
                                                        setActiveDropdown(null); // Close the dropdown after selection
                                                    }}
                                                >
                                                    {option.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="h-[86%]">
                        {<DataTable data={filteredData && filteredData?.length > 0 ? filteredData : filteredData ? [] : config?.dataTable?.data} columns={config?.dataTable?.columns || []}
                            rowClassMap={rowClassMap} summary={summary} summaryTotal={summaryData} title={title} />}
                    </div>
                </div>

            </DashboardLoader>
        </>

    )
}

export default MasterComponent