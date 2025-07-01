"use client"

import React from 'react'
import DashboardLoader from '../ui/DashboardLoader';
import { Input } from "@/components/ui/inputSearch";
import { Button } from '../ui/button';
import { Check, Filter, FilterX, ListFilter } from 'lucide-react';
import { DataTable } from '../TableComponent/TableComponent';
import { useState } from 'react';
import { useEffect } from 'react';
import { ObjectId } from 'mongoose';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';

// Interface for individual Input and Select field configurations
interface FieldConfig {
    name: string;
    filterBy: string;
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

// Interface for Data Table configuration
interface DataTableConfig {
    columns: string[]; // Column names for the table
    data: Record<string, string | number | object | Date | ObjectId>[]; // Array of rows where each row is an object with column data
}

interface MasterComponentProps {
    config: any;
    loadingState: boolean;
    rowClassMap: any;
    handleExport: any;
}


const MasterComponentAQM: React.FC<MasterComponentProps> = ({ config, loadingState, rowClassMap, handleExport }) => {

    const [searchValues, setSearchValues] = useState<Record<string, string>>({});
    const [filterValues, setFilterValues] = useState<Record<string, string | null>>({});
    const [filteredData, setFilteredData] = useState(config?.dataTable?.data);

    const availableFilters: FieldConfig[] = [
        ...(config?.filterFields || []),
        { key: "status", label: 'status', type: "select" as const, options: config?.filterData?.statusNames, placeholder: 'Select Status', filterBy: "name", name: 'Status By Color' },
        { key: "quoteStatus", label: 'quoteStatus', type: "select" as const, options: config?.filterData?.quoteStatusNames, placeholder: 'Select Quote Status', filterBy: "id", name: 'Quote Status' },

    ];

    // Track active filters (default to config filters)
    const [activeFilters, setActiveFilters] = useState<FieldConfig[]>([]);
    const [openFilters, setOpenFilters] = useState<{ [key: string]: boolean }>({});

    const toggleFilterOpen = (key: string, isOpen: boolean) => {
        setOpenFilters((prev) => ({
            ...prev,
            [key]: isOpen, // Toggle only the clicked filter
        }));
    };


    useEffect(() => {

        setFilteredData(config?.dataTable?.data)
    }, [config, loadingState])

    // Handle input field change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const newSearchValues = { ...searchValues, [field]: e.target.value };

        setSearchValues(newSearchValues);
        // filterData(newSearchValues, filterValues); // Trigger filterData after search change
    };

    // Handle filter field change (select)
    const handleFilterChange = (value: string | null, field: string) => {
      
        const newFilterValues = { ...filterValues, [field]: value };
    
        // Check if the filter is already active
        setFilterValues(newFilterValues);
        // filterData(searchValues, newFilterValues); // Trigger filterData after filter change
    };

    // Toggle filters dynamically
    const toggleFilter = (filter: FieldConfig) => {
       
        setActiveFilters(prev => {
            if (prev.some(f => f.key === filter.key)) {
                // Remove filter
                setFilterValues(prev => {
                    const updatedFilters = { ...prev };
                    delete updatedFilters[filter.key];
                    return updatedFilters;
                });
                return prev.filter(f => f.key !== filter.key);
            } else {
                // Add filter
                return [...prev, filter];
            }
        });
    };

    useEffect(() => {

        filterData(searchValues, filterValues); // Trigger filtering after search/filter change
    }, [searchValues, filterValues]);
    const searchFields = ['jobNo', 'quoteNo', 'projectName', 'company']
    // Filter data based on search and filter criteria
    const filterData = (searchValues: any, filterValues: any) => {

        const filtered = config?.dataTable?.data?.filter((item: { [x: string]: string; }) => {
            // Check if item matches search criteria
            const matchesSearch = searchFields.some((field) => {

                const value: any = item[field];
                const searchQuery = searchValues['name'] || '';

                if (value) {
                    const fieldValue = typeof value === 'object' && value !== null && 'name' in value ? value.name : value;
                    return fieldValue.toString().toLowerCase().includes(searchQuery.toString().toLowerCase());
                }
                else {
                    if (searchQuery === '') return true;
                    return false;
                }
            });

            // Check if item matches filter criteria
            const matchesFilter = activeFilters.every((field) => {
                const key = field?.key;

                const filterValue = filterValues[key];
                if (filterValue === null) return true;

                // Use filterBy to determine comparison
                if (field?.filterBy === "id") {
                  
                    if (item[key] && typeof item[key] === "string") {
                        return typeof item[key] === "string" && item[key].toLowerCase() === filterValue?.toLowerCase(); // Compare Name for status

                    }
                    else {

                        return typeof item[key] === "object" && item[key] !== null && "name" in (item[key] as { name: string }) && (item[key] as { name: string }).name === filterValue;

                    }
                } else {
                    return typeof item[key] === "string" && item[key].toLowerCase() === filterValue?.toLowerCase(); // Compare Name for status
                }
            });

            return matchesSearch && matchesFilter;
        });

        setFilteredData(filtered); // Update filtered data state
      
    };


    const resetFilters = () => {
        setActiveFilters([]);
        setSearchValues({});
        setFilterValues({});
    };
    const [open, setOpen] = React.useState(false)
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    return (
        <>
            <DashboardLoader loading={loadingState}>
                <div className="flex flex-col gap-1 w-full h-full px-4 py-1">

                    {/* Filter Section */}
                    <div className="flex flex-row justify-between gap-2 pb-1">
                        <div className="flex flex-row items-center gap-2  w-full">



                            {/* Search Text Bar & Filters (Now filters start from here) */}
                            <div className="flex items-center gap-3  flex-grow">
                                {/* Search Fields */}
                                {config.searchFields?.map((field: FieldConfig, index: number) => (
                                    <div key={index} className="flex-1 max-w-[200px]">
                                        <Input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={searchValues[field.label] || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e, field.label)}
                                            className="w-full"
                                        />
                                    </div>
                                ))}


                                {/* Add Filter & Reset Buttons */}
                                <Popover>
                                    <PopoverTrigger asChild>

                                        <div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className='flex items-center gap-1 cursor-pointer text-slate-800 text-sm'>
                                                            <ListFilter size={17} className="text-red-700" /> Filters
                                                        </div>

                                                    </TooltipTrigger>
                                                    {/* <TooltipContent>
                                                        Add Filter
                                                    </TooltipContent> */}
                                                </Tooltip>
                                            </TooltipProvider>

                                        </div>
                                    </PopoverTrigger>
                                    {/* Popover Content */}
                                    <PopoverContent className="fixed top-1/2 w-[600px] mt-2 left-[-15] bg-white">

                                        <div className="flex items-center gap-2 flex-wrap ">
                                            {/* Render Filter Buttons */}
                                            {config?.filterFields?.map((filter: FieldConfig, index: React.Key | null | undefined) => (
                                                <React.Fragment key={index}>
                                                    <Button
                                                        variant={activeFilters.some((f) => f.key === filter.key) ? "default" : "outline"}
                                                        onClick={() => toggleFilter(filter)}
                                                        className="text-sm px-3 py-1"
                                                    >
                                                        {filter.name}
                                                    </Button>

                                                    {/* Render Separator if it's not the last button */}
                                                    {index !== config?.filterFields.length - 1 && (
                                                        <Separator className="h-7 w-0.5 bg-slate-200" orientation="vertical" />
                                                    )}
                                                </React.Fragment>
                                            ))}

                                        </div>
                                        <Separator className="my-3 bg-slate-200 h-0.5" />
                                        {/* Render Filter Dropdowns inside Popover */}
                                        <div className="px-0 space-y-2 max-h-80 overflow-y-auto overflow-x-hidden">

                                            {activeFilters.map((field, index) => (
                                                <div key={index} className="flex w-[250px] flex-col">
                                                    <span className="text-sm font-medium">{field.label}</span>

                                                    {/* Dropdown */}
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="w-full justify-between">
                                                                {filterValues[field.key] || "Select..."}
                                                                <Check className="ml-2 h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[200px] p-0">
                                                            <Command className='bg-white'>
                                                                <CommandInput placeholder={`Search ${field.label}`} />
                                                                <CommandList>
                                                                    <CommandEmpty>No {field.label} found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {field.options?.map((option: any) => (
                                                                            field.filterBy === 'id' ?
                                                                                <CommandItem
                                                                                    className={option?.color}
                                                                                    key={option?.id}
                                                                                    onSelect={() => {
                                                                                        handleFilterChange(option?.name, field.label);
                                                                                        toggleFilterOpen(field.key, false); // Close Popover
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            filterValues[field.label] === option.name ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {option.name}
                                                                                </CommandItem>
                                                                                :
                                                                                <CommandItem
                                                                                    className=''
                                                                                    key={option}
                                                                                    onSelect={() => {
                                                                                        handleFilterChange(option, field.label);
                                                                                        toggleFilterOpen(field.key, false); // Close Popover
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            filterValues[field.label] === option ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {option}
                                                                                </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                </div>

                                            ))}
                                            <div className='flex justify-end'>
                                                {activeFilters.length > 0 && (<Button
                                                    effect="expandIcon"
                                                    icon={FilterX}
                                                    iconPlacement="right"
                                                    className={`h-7 px-2 bg-red-600 hover:bg-red-700 duration-300`}
                                                    onClick={resetFilters}
                                                >
                                                    Reset
                                                </Button>)}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>


                        </div>

                        {/* Button Section */}
                        <div className="flex gap-1">
                            {config.buttons?.map((button: ButtonConfig & { dropdownOptions?: { label: string; value: string }[] }, index: number) => (
                                <div key={index} className="relative">
                                    <Button
                                        effect="expandIcon"
                                        icon={button.icon}
                                        iconPlacement="right"
                                        onClick={() => {
                                            if (button.dropdownOptions) {
                                                setActiveDropdown(index === activeDropdown ? null : index);
                                            } else {
                                                button.action();
                                            }
                                        }}
                                        className={`w-28 ${button.className}`}
                                    >
                                        {button.label}
                                    </Button>

                                    {/* Dropdown Options */}
                                    {button.dropdownOptions && activeDropdown === index && (
                                        <div className="absolute right-0 mt-2 p-2 bg-white shadow-lg border rounded-md w-40 z-50">
                                            {button.dropdownOptions.map((option, optionIndex) => (
                                                <div
                                                    key={optionIndex}
                                                    className="rounded-md cursor-pointer px-4 p-2 hover:bg-gray-100"
                                                    onClick={() => {
                                                        handleExport(option.value, filteredData?.length > 0 ? filteredData : filteredData ? [] : config?.dataTable?.data);
                                                        setActiveDropdown(null);
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

                    {/* Data Table */}
                    <div className="h-[85%]">
                        <DataTable
                            data={filteredData?.length > 0 ? filteredData : filteredData ? [] : config?.dataTable?.data}
                            columns={config?.dataTable?.columns || []}
                            rowClassMap={rowClassMap} summary={false} summaryTotal={undefined} title={''} />
                    </div>
                </div>
            </DashboardLoader>

        </>

    )
}

export default MasterComponentAQM