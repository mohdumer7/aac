"use client"

import * as React from "react"
import { useState } from 'react'
import { Check, ChevronsUpDown, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"



export function Combobox({ field, formData, handleChange, placeholder, selectedRegion, setSelectedRegion, selectedArea, setSelectedArea, setSelectedYear, setSelectedMonth }: any) {
    const [open, setOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    return (
        <Popover modal={true} open={open} onOpenChange={setOpen} >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full bg-white px-2 py-2 flex items-center justify-between text-left ${(formData && field?.data?.find((data: { _id: any }) => data._id === formData[field.name])?.name ||
                            selectedValue ||
                            formData && field?.data?.find((data: { _id: any }) => data._id === formData?.[field.name])?.displayName)
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                >
                    <span className="text-sm truncate whitespace-nowrap overflow-hidden max-w-[calc(100%-1.5rem)]">
                        {
                           formData && field?.data?.find((data: { _id: any }) => data._id === formData?.[field.name])?.name ||
                           formData && field?.data?.find((data: { _id: any }) => data._id === formData?.[field.name])?.displayName ||
                            selectedValue ||
                            placeholder
                        }
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
                </Button>



            </PopoverTrigger>
            <PopoverContent className="w-full p-0 pointer-events-auto ">
                <Command className="bg-white">
                    <CommandInput className="pointer-events-auto" placeholder={`Search ${field?.label}`} />

                    <CommandList className="overflow-y-scroll">
                        <CommandEmpty>No {field?.label?.toLowerCase()} found.</CommandEmpty>
                        <CommandGroup>
                            {/* Add "All" option */}
                            <CommandItem
                                key="all"
                                value=""
                                onSelect={() => {
                                    setSelectedValue(null);
                                    handleChange(null, field.name, field?.format, field?.type, field?.data, field); // Set the value to null for "All"
                                    if (field?.key === "year") {
                                        setSelectedYear(0); // Update region
                                    }
                                    if (field?.key === "month") {
                                        setSelectedMonth(0); // Update region
                                    }
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        (formData?.[field.name] === null || selectedValue === null) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                All
                            </CommandItem>

                            {field?.data?.map((data: { _id: React.Key | null | undefined; name: string | undefined; displayName: any }) => (
                                <CommandItem
                                    className="cursor-pointer"
                                    key={data?._id}
                                    value={data.name}
                                    onSelect={(value) => {
                                        setSelectedValue(value);
                                        handleChange(data._id, field.name, field?.format, field?.type, field?.data, field);
                                        if (field?.key === "region") {
                                            setSelectedRegion(data._id); // Update region
                                        }
                                        if (field?.key === "area") {
                                            setSelectedArea(data._id); // Update region
                                        }
                                        if (field?.key === "year") {
                                            setSelectedYear(data._id); // Update region
                                        }
                                        if (field?.key === "month") {
                                            setSelectedMonth(data._id); // Update region
                                        }
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            (formData?.[field.name] === data._id || selectedValue === data._id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {data.name || data.displayName}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
