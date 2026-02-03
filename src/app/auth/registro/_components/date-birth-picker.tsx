"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateBirthPickerProps {
    onChange: (date: string) => void;
    value?: string; // YYYY-MM-DD
    error?: string;
  }

export function DateBirthPicker({ onChange, value, error }: DateBirthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  React.useEffect(() => {
    if (value) {
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        setDate(parsed)
      }
    }
  }, [value])

  const handleDateChange = (date: Date | undefined) => {
    setDate(date)
    setOpen(false)
    
    if (date) {
        onChange(date.toISOString().split('T')[0]) // Formato YYYY-MM-DD
    }
  }

  return (
    <div className="flex flex-col gap-3">
     
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={`w-full pl-4 pr-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 relative justify-start ${error ? 'border-red-500' : 'border-gray-200'}`}
          >
            <span className="text-left flex-1 min-w-0">{date ? date.toLocaleDateString() : "Selecciona una fecha"}</span>
            <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
