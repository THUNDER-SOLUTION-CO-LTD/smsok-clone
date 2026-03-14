"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-10 text-xs",
              !value?.from && "text-[var(--text-muted)]",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {value?.from ? (
          value.to ? (
            <>
              {format(value.from, "d MMM yy", { locale: th })}
              {" — "}
              {format(value.to, "d MMM yy", { locale: th })}
            </>
          ) : (
            format(value.from, "d MMM yy", { locale: th })
          )
        ) : (
          placeholder
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={(range) => {
            onChange(range);
            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
