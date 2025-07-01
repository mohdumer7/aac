"use client"
 
import * as React from "react"
import { format, getMonth, getYear, setMonth, setYear, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
 
interface DatePickerProps {
  currentDate?: any;
  startYear?: number;
  endYear?: number;
  handleChange?: any;
  placeholder?: string;
}
export function DatePicker({
  currentDate,
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  handleChange,
  placeholder
}: DatePickerProps) {
 
  const [date, setDate]:any = React.useState<Date | undefined>(currentDate);
 
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );
 
  const handleMonthChange = (month: string) => {
    const newDate = setMonth(date, months.indexOf(month));
    const customChange = handleChange(newDate,setDate)
    if(!customChange){
      setDate(newDate);
    }
  }
 
  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    const customChange = handleChange(newDate,setDate)
    if(!customChange){
      setDate(newDate);
    }
 
  }
 
  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      const now = new Date();
      const newDate = setHours(setMinutes(selectedData, now.getMinutes()), now.getHours()); // Set default time
      const customChange = handleChange(newDate,setDate)
      if(!customChange){
        setDate(newDate);
      }
    }
  }
 
  return (
    <>
      <div className="relative w-full">
      <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full flex justify-start  font-normal",
                !date && "text-muted-foreground bg-white text-gray-400"
              )}
            >
              <CalendarIcon className=" h-4 w-4" />
              {date ? format(date, "PPP") : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 pointer-events-auto bg-white">
            <div className="w-full flex p-2">
              <Select
                onValueChange={handleMonthChange}
                value={months[getMonth(date)]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={handleYearChange}
                value={getYear(date).toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
 
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              month={date}
              onMonthChange={setDate}
            />
          </PopoverContent>
        </Popover>
        <div className="absolute top-[-18] cursor-pointer text-xs font-medium text-white  right-0 w-4 h-4 rounded-full bg-red-500 flex justify-center" onClick={() => {setDate(undefined); handleChange(undefined)}}>
       
          X
       
        </div>
      </div>
       
     
 
    </>
 
  )
}