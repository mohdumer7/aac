"use client"

import React from 'react'
import DashboardLoader from '../ui/DashboardLoader';
import { Input } from "@/components/ui/input";
import { Button } from '../ui/button';
import { ChevronsUpDown, Check, Currency } from 'lucide-react';

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
    action: (value: string, filteredData: any[]) => void; // Function to handle button click
    icon?: React.ElementType; // Icon for the button
    className?: string; // Optional CSS class for styling
}

interface MasterComponentProps {
    config: any;
    loadingState: boolean;
    rowClassMap: any;
    summary: boolean;
    selectedRegion: any;
    setSelectedRegion: any;
    selectedArea: any;
    setSelectedArea: any;
}

const ReportMasterComponent: React.FC<MasterComponentProps> = ({ config, loadingState, rowClassMap, summary, selectedRegion, setSelectedRegion, selectedArea, setSelectedArea }) => {
    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [selectedMonth, setSelectedMonth] = useState<number>(0);
    const [searchValues, setSearchValues] = useState<Record<string, string>>({});
    const [filterValues, setFilterValues] = useState<Record<string, string | null>>({});
    const [filteredData, setFilteredData] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [title, setTitle] = useState('');

    const [loading, setLoading] = useState(true);
    const formatQuotationData = (filterYear: number, filterMonth: number) => {

        const filteredData = config?.dataTable?.data?.filter((q: any) => {
            if (Number(filterYear) < 1) return true; // Skip if date is missing

            const receivedDate = new Date(q.rcvdDateFromCustomer);

            return (
                receivedDate.getFullYear() === filterYear &&
                (filterMonth === 0 || receivedDate.getMonth() + 1 === filterMonth) // If filterMonth is 0, include all months
            );
        });

        const groupedData = filteredData?.reduce(
            (acc: Record<
                string,
                {
                    region: string;
                    area: string;
                    country: string;
                    totalQuotes: number;
                    totalJobs: number;
                    totalQ22Value: number;
                    q22Count: number;
                    totalWeight: number;
                }
            >,
                q: { year: number; region?: string; area?: string; country?: string; jobNo?: any; q22Value?: number; totalWt?: number; quoteStatus?: any }) => {

                const region = q.region || "Unknown Region";
                const area = q.area || "Unknown Area";
                const country = q.country || "Unknown Country";

                const key = `${region}-${area}-${country}`;

                if (!acc[key]) {
                    acc[key] = {
                        region,
                        area,
                        country,
                        totalQuotes: 0,
                        totalJobs: 0,
                        totalQ22Value: 0,
                        q22Count: 0,
                        totalWeight: 0,
                    };
                }

                acc[key].totalQuotes += 1; // Count total quotes
                if (q?.quoteStatus?.name === 'J - Job') acc[key].totalJobs += 1; // Count total jobs
                if (q.q22Value) {
                    acc[key].totalQ22Value += q.q22Value;
                    acc[key].q22Count += 1;
                }
                if (q.totalWt) acc[key].totalWeight += q.totalWt;

                return acc;
            }, {});

        // Convert grouped object into an array and keep region, area, country
        return Object.values(groupedData || {})
            .map((group: any) => ({
                region: group.region,
                area: group.area,
                country: group.country,
                totalQuotes: group.totalQuotes,
                totalJobs: group.totalJobs,
                totalWeight: Math.round(group.totalWeight).toLocaleString(),
                avgQ22Value: group.q22Count > 0 ? Math.round(group.totalQ22Value / group.q22Count).toLocaleString() : 0,
            })).sort((a, b) =>
                a.region.localeCompare(b.region) ||
                a.area.localeCompare(b.area) ||
                a.country.localeCompare(b.country)
            );


    };

    const formatQuotationStatus = (filterYear: number, filterMonth: number) => {

        const filteredData = config?.dataTable?.data?.filter((q: any) => {
            if (Number(filterYear) < 1) return true; // Skip if date is missing

            const receivedDate = new Date(q.rcvdDateFromCustomer);

            return (
                receivedDate.getFullYear() === filterYear &&
                (filterMonth === 0 || receivedDate.getMonth() + 1 === filterMonth) // If filterMonth is 0, include all months
            );
        });
        const groupedData = filteredData?.reduce(
            (acc: Record<
                string,
                {
                    region: string;
                    area: string;
                    country: string;
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
                    quoteStatus: any;

                }
            >,
                q: { cancel: number; region?: string; area?: string; country?: string; active?: any; hold?: number; decline?: number; budgetary?: number; hotQuote?: number; jobShipped?: number; lost?: number; job?: number; total?: number; quoteStatus?: any }) => {

                const region = q.region || "Unknown Region";
                const area = q.area || "Unknown Area";
                const country = q.country || "Unknown Country";

                const key: string = `${region}-${area}-${country}`;

                if (!acc[key]) {
                    acc[key] = {
                        region,
                        area,
                        country,
                        active: 0,
                        hold: 0,
                        job: 0,
                        cancel: 0,
                        budgetary: 0,
                        decline: 0,
                        hotQuote: 0,
                        jobShipped: 0,
                        lost: 0,
                        total: 0,
                        quoteStatus: { name: q.quoteStatus?.name, id: q.quoteStatus?._id }
                    };
                }

                if (q.quoteStatus?.name === "A - Active") acc[key].active += 1; // Count total quotes
                if (q.quoteStatus?.name === "H - Hold") acc[key].hold += 1; // Count total jobs
                if (q.quoteStatus?.name === "J - Job") acc[key].job += 1;
                if (q.quoteStatus?.name === "C - Cancel") acc[key].cancel += 1;
                if (q.quoteStatus?.name === "B - Budgetary") acc[key].budgetary += 1;
                if (q.quoteStatus?.name === "D - Decline") acc[key].decline += 1;
                if (q.quoteStatus?.name === "HOT QUOTE") acc[key].hotQuote += 1;
                if (q.quoteStatus?.name === "JOB SHIPPED") acc[key].jobShipped += 1;
                if (q.quoteStatus?.name === "L - Lost") acc[key].lost += 1;

                acc[key].total =
                    acc[key].active +
                    acc[key].hold +
                    acc[key].job +
                    acc[key].cancel +
                    acc[key].budgetary +
                    acc[key].decline +
                    acc[key].hotQuote +
                    acc[key].jobShipped +
                    acc[key].lost;

                return acc;
            }, {});

        // Convert grouped object into an array and keep region, area, country
        return Object.values(groupedData || {})
            .map((group: any) => ({
                region: group.region,
                area: group.area,
                country: group.country,
                active: group.active,
                hold: group.hold,
                job: group.job,
                cancel: group.cancel,
                decline: group.decline,
                budgetary: group.budgetary,
                hotQuote: group.hotQuote,
                jobShipped: group.jobShipped,
                lost: group.lost,
                total: group.total,
            })).sort((a, b) =>
                a.region.localeCompare(b.region) ||
                a.area.localeCompare(b.area) ||
                a.country.localeCompare(b.country)
            );
    };

    const formatJobDetails = (filterYear: number, filterMonth: number) => {

        const filteredData = config?.dataTable?.data?.filter((q: any) => {
            if (Number(filterYear) < 1) return true; // Skip if date is missing

            const receivedDate = new Date(q.rcvdDateFromCustomer);

            return (
                receivedDate.getFullYear() === filterYear &&
                (filterMonth === 0 || receivedDate.getMonth() + 1 === filterMonth) // If filterMonth is 0, include all months
            );
        });

        return filteredData?.filter((q: any) => q.quoteStatus?.name === "J - Job");
    };

    const formatJobLost = (filterYear: number, filterMonth: number) => {

        const filteredData = config?.dataTable?.data?.filter((q: any) => {
            if (Number(filterYear) < 1) return true; // Skip if date is missing

            const receivedDate = new Date(q.rcvdDateFromCustomer);

            return (
                receivedDate.getFullYear() === filterYear &&
                (filterMonth === 0 || receivedDate.getMonth() + 1 === filterMonth) // If filterMonth is 0, include all months
            );
        });

        return filteredData?.filter((q: any) => q.quoteStatus?.name === "L - Lost");
    };

    const format3MonthSF = (filterYear: number, filterMonth: number) => {

        const filteredData = config?.dataTable?.data?.filter((q: any) => {
            if (Number(filterYear) < 1) return true; // Skip if date is missing

            const receivedDate = new Date(q.rcvdDateFromCustomer);

            return (
                receivedDate.getFullYear() === filterYear &&
                (filterMonth === 0 || receivedDate.getMonth() + 1 === filterMonth) // If filterMonth is 0, include all months
            );
        });


        return filteredData?.filter((q: any) => q.quoteStatus?.name === "J - Job");
    };

    useEffect(() => {

        let formattedData: any = [];
        let summaryTotal: any = [];
        setTitle(config?.title);
        switch (config?.title) {
            case "Quotation Details":

                formattedData = (formatQuotationData(selectedYear, selectedMonth));
                summaryTotal = formattedData?.reduce(
                    (acc: { totalQuotes: any; totalJobs: any; totalWeight: any; avgQ22Total: any; count: number; }, row: any) => {
                        acc.totalQuotes += row.totalQuotes;
                        acc.totalJobs += row.totalJobs;
                        acc.totalWeight += typeof row.totalWeight === 'string' ? Number(row.totalWeight.replace(/,/g, '')) : row.totalWeight || 0;
                        acc.avgQ22Total += typeof row.avgQ22Value === 'string' ? Number(row.avgQ22Value.replace(/,/g, '')) : row.avgQ22Value || 0;
                        acc.count += 1;
                        return acc;
                    },
                    { totalQuotes: 0, totalJobs: 0, totalWeight: 0, avgQ22Total: 0, count: 0 }
                );
                break;
            case "Quote Status":
                formattedData = (formatQuotationStatus(selectedYear, selectedMonth));
                summaryTotal = formattedData?.reduce(
                    (acc: { totalActive: any; totalBudgetary: any; totalCancel: any; totalDecline: any; totalHold: number; totalHotQuote: number; totalJob: number; totalJobShipped: number; totalLost: number; totalTotal: number; }, row: any) => {
                        acc.totalActive += row.active;
                        acc.totalBudgetary += row.budgetary;
                        acc.totalCancel += row.cancel;
                        acc.totalDecline += row.decline;
                        acc.totalHold += row.hold;
                        acc.totalHotQuote += row.hotQuote;
                        acc.totalJob += row.job;
                        acc.totalJobShipped += row.jobShipped;
                        acc.totalLost += row.lost;
                        acc.totalTotal += row.total;
                        return acc;

                    },
                    { totalActive: 0, totalBudgetary: 0, totalCancel: 0, totalDecline: 0, totalHold: 0, totalHotQuote: 0, totalJob: 0, totalJobShipped: 0, totalLost: 0, totalTotal: 0 }
                );
                break;
            case "Job Details":
                formattedData = (formatJobDetails(selectedYear, selectedMonth));
                formattedData = formattedData?.map((row: any) => {
                    return {
                        region: row.region,
                        area: row.area,
                        country: row.country,
                        jobNo: row.jobNo,
                        types: row.projectType?.name,
                        customer: row.customer,
                        q22Value: row.q22Value,
                        totalWt: row.totalWt,
                        currency: row.currency,
                        totalEstPrice: row.totalEstPrice,

                    };
                });

                summaryTotal = formattedData?.reduce(
                    (acc: { totalQ22Value: any; totalWeight: any; totalEstPrice: any; }, row: any) => {
                        acc.totalQ22Value += row.q22Value || 0;
                        acc.totalWeight += row.totalWt || 0;
                        acc.totalEstPrice += row.totalEstPrice || 0;

                        return acc;

                    },
                    { totalQ22Value: 0, totalWeight: 0, totalEstPrice: 0 }
                );

                break;
            case "Job Lost Report":
                formattedData = (formatJobLost(selectedYear, selectedMonth));
                formattedData = formattedData?.map((row: any) => {
                    return {
                        quoteNo: row.quoteNo,
                        customer: row.customer,
                        projectName: row.projectName,
                        totalWt: row.totalWt,
                        q22Value: row.q22Value,
                        totalEstPrice: row.totalEstPrice,
                        currency: row.currency,
                        lostTo: row.lostTo,
                        lostToOthers: row.lostToOthers,
                        lostDate: row.lostDate,
                        reason: row.reason
                    };
                });
                summaryTotal = formattedData?.reduce(
                    (acc: { totalQ22Value: any; totalWeight: any; totalEstPrice: any; }, row: any) => {
                        acc.totalQ22Value += row.q22Value || 0;
                        acc.totalWeight += row.totalWt || 0;
                        acc.totalEstPrice += row.totalEstPrice || 0;

                        return acc;

                    },
                    { totalQ22Value: 0, totalWeight: 0, totalEstPrice: 0 }
                );

                break;

            case "3 Month SF":
                formattedData = (format3MonthSF(selectedYear, selectedMonth));
                formattedData = formattedData?.map((row: any) => {
                    return {
                        forecastMonth: row.forecastMonth,
                        quoteNo: row.quoteNo,
                        jobNo: row.jobNo,
                        customer: row.customer,
                        projectName: row.projectName,
                        totalWt: row.totalWt,
                        remarks: row.remarks
                    };
                });
                summaryTotal = formattedData?.reduce(
                    (acc: { totalQ22Value: any; totalWeight: any; totalEstPrice: any; }, row: any) => {

                        acc.totalWeight += row.totalWt || 0;

                        return acc;

                    },
                    { totalWeight: 0 }
                );

                break;
            default:
                return;

        }

        setFilteredData(formattedData);
        setSummaryData(summaryTotal);
        setLoading(formattedData.length === 0);

    }, [config, loading]);

    // Handle input field change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const newSearchValues = { ...searchValues, [field]: e.target.value };

        setSearchValues(newSearchValues);
        // filterData(newSearchValues, filterValues); // Trigger filterData after search change
    };

    // Handle filter field change (select)
    const handleFilterChange = (value: any, field: string) => {
        if (field === "region") {
            setSelectedRegion(value);
        }
        if (field === "area") {
            setSelectedArea(value);
        }

        if (field === "year") {
            setSelectedYear(value);
        }

        if (field === "month") {
            setSelectedMonth(value);
        }

        const newFilterValues = { ...filterValues, [field]: value };

        setFilterValues(newFilterValues);

        // filterData(searchValues, newFilterValues); // Trigger filterData after filter change
    };

    useEffect(() => {

        filterData(searchValues, filterValues); // Trigger filtering after search/filter change
    }, [searchValues, filterValues, selectedYear, selectedMonth]);

    // Filter data based on search and filter criteria
    const filterData = (searchValues: any, filterValues: any) => {
        let formattedData: any = [];
        let summaryTotal: any = [];
        switch (title) {
            case "Quotation Details":

                formattedData = (formatQuotationData(selectedYear, selectedMonth));
                summaryTotal = formattedData?.reduce(
                    (acc: { totalQuotes: any; totalJobs: any; totalWeight: any; avgQ22Total: any; count: number; }, row: any) => {
                        acc.totalQuotes += row.totalQuotes;
                        acc.totalJobs += row.totalJobs;
                        acc.totalWeight += typeof row.totalWeight === 'string' ? Number(row.totalWeight.replace(/,/g, '')) : row.totalWeight || 0;
                        acc.avgQ22Total += typeof row.avgQ22Value === 'string' ? Number(row.avgQ22Value.replace(/,/g, '')) : row.avgQ22Value || 0;
                        acc.count += 1;
                        return acc;
                    },
                    { totalQuotes: 0, totalJobs: 0, totalWeight: 0, avgQ22Total: 0, count: 0 }
                );
                break;
            case "Quote Status":
                formattedData = (formatQuotationStatus(selectedYear, selectedMonth));
                summaryTotal = formattedData?.reduce(
                    (acc: { totalActive: any; totalBudgetary: any; totalCancel: any; totalDecline: any; totalHold: number; totalHotQuote: number; totalJob: number; totalJobShipped: number; totalLost: number; totalTotal: number; }, row: any) => {
                        acc.totalActive += row.active;
                        acc.totalBudgetary += row.budgetary;
                        acc.totalCancel += row.cancel;
                        acc.totalDecline += row.decline;
                        acc.totalHold += row.hold;
                        acc.totalHotQuote += row.hotQuote;
                        acc.totalJob += row.job;
                        acc.totalJobShipped += row.jobShipped;
                        acc.totalLost += row.lost;
                        acc.totalTotal += row.total;
                        return acc;

                    },
                    { totalActive: 0, totalBudgetary: 0, totalCancel: 0, totalDecline: 0, totalHold: 0, totalHotQuote: 0, totalJob: 0, totalJobShipped: 0, totalLost: 0, totalTotal: 0 }
                );
                break;

            case "Job Details":
                formattedData = (formatJobDetails(selectedYear, selectedMonth));

                break;
            default:
                return;

        };

        const filtered: any = formattedData?.filter((item: any) => {
            // Check if item matches search criteria
            const matchesSearch = Object.keys(searchValues).every((key) => {

                const searchQuery = searchValues[key]?.toLowerCase() || ''; // Get search query, default to empty string

                const value = item[key]?.toString().toLowerCase() || ''; // Convert the item value to string and make it lowercase

                return value.includes(searchQuery);
            });

            // Check if item matches filter criteria
            const matchesFilter = Object.keys(filterValues).every((key) => {
                if (key === "year" || key === "month") return true; // Skip year and month filters
                const filterValue = filterValues[key];

                // If no filter value, pass the filter
                if (filterValue === null) return true;


                return typeof item[key] === 'string' && item[key].toLowerCase() === filterValue?.toLowerCase();
            });

            return matchesSearch && matchesFilter;
        });

        setFilteredData(filtered); // Update filtered data state

        switch (title) {
            case "Quotation Details":
                summaryTotal = filtered?.reduce(
                    (acc: { totalQuotes: any; totalJobs: any; totalWeight: any; avgQ22Total: any; count: number; }, row: any) => {
                        acc.totalQuotes += row.totalQuotes;
                        acc.totalJobs += row.totalJobs;
                        acc.totalWeight += typeof row.totalWeight === 'string' ? Number(row.totalWeight.replace(/,/g, '')) : row.totalWeight || 0;
                        acc.avgQ22Total += typeof row.avgQ22Value === 'string' ? Number(row.avgQ22Value.replace(/,/g, '')) : row.avgQ22Value || 0;
                        acc.count += 1;
                        return acc;
                    },
                    { totalQuotes: 0, totalJobs: 0, totalWeight: 0, avgQ22Total: 0, count: 0 }
                );
                break;
            case "Quote Status":
                summaryTotal = filtered?.reduce(
                    (acc: { totalActive: any; totalBudgetary: any; totalCancel: any; totalDecline: any; totalHold: number; totalHotQuote: number; totalJob: number; totalJobShipped: number; totalLost: number; totalTotal: number; }, row: any) => {
                        acc.totalActive += row.active;
                        acc.totalBudgetary += row.budgetary;
                        acc.totalCancel += row.cancel;
                        acc.totalDecline += row.decline;
                        acc.totalHold += row.hold;
                        acc.totalHotQuote += row.hotQuote;
                        acc.totalJob += row.job;
                        acc.totalJobShipped += row.jobShipped;
                        acc.totalLost += row.lost;
                        acc.totalTotal += row.total;
                        return acc;

                    },
                    { totalActive: 0, totalBudgetary: 0, totalCancel: 0, totalDecline: 0, totalHold: 0, totalHotQuote: 0, totalJob: 0, totalJobShipped: 0, totalLost: 0, totalTotal: 0 }
                );
                break;
            case "Job Details":
                summaryTotal = filtered?.reduce(
                    (acc: { totalQ22Value: any; totalWeight: any; totalEstPrice: any; }, row: any) => {
                        acc.totalQ22Value += row.q22Value;
                        acc.totalWeight += row.totalWt;
                        acc.totalEstPrice += row.totalEstPrice;

                        return acc;

                    },
                    { totalQ22Value: 0, totalWeight: 0, totalEstPrice: 0 }
                );
                break;
            default:
                return;

        };
        setSummaryData(summaryTotal);
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
    };

    return (

        <>
            <DashboardLoader loading={loadingState}>
                <div className='flex flex-col gap-1 w-full h-full'>

                    {/* Filter Section */}
                    <div className='flex flex-row items-center justify-between py-1'>
                        <div className="flex flex-row items-center">
                            {/* Render search fields */}
                            <div className='flex items-center gap-1'>{config.searchFields?.map((field: FieldObject, index: React.Key | null | undefined) => (
                                <div key={index}>

                                    <Input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        value={searchValues[field.label] || ''}
                                        onChange={(e) => handleSearchChange(e, field.label)}
                                    />
                                </div>
                            ))}
                            </div>


                            <div className='flex items-center gap-1'>
                                {config.filterFields?.map((field: FieldObject, index: number) => {

                                    return (
                                        <Combobox
                                            key={field.key || index}
                                            field={field}
                                            formData={[]}
                                            handleChange={handleFilterChange}
                                            placeholder={field.placeholder || ""}
                                            selectedRegion={selectedRegion}  // Pass selectedRegion
                                            setSelectedRegion={setSelectedRegion} // Pass setter function
                                            selectedArea={selectedArea}  // Pass selectedRegion
                                            setSelectedArea={setSelectedArea} // Pass setter function
                                            setSelectedYear={setSelectedYear} // Pass setter function
                                            setSelectedMonth={setSelectedMonth} // Pass setter function
                                        />
                                    );
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
                                                button.action("Excel", (filteredData !== undefined && filteredData?.length > 0) ? filteredData : filteredData?.length === 0 ? [] : config?.dataTable?.data); // Call action with default arguments
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

                                                        option.action(option.value, (filteredData !== undefined && filteredData?.length > 0) ? filteredData : filteredData?.length === 0 ? [] : config?.dataTable?.data); // Execute the action for this dropdown option
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

                    <div className="h-[85%]">
                        {<DataTable data={(filteredData !== undefined && filteredData?.length > 0) ? filteredData : filteredData?.length === 0 ? [] : config?.dataTable?.data} columns={config?.dataTable?.columns || []}
                            rowClassMap={rowClassMap} summary={summary} summaryTotal={summaryData} title={title}
                        />}
                    </div>
                </div>

            </DashboardLoader>
        </>

    )
}

export default ReportMasterComponent