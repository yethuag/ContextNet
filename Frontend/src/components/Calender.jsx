import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const Calendar = ({ onDateSelect, selectedDate, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState(
    selectedDate || null
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const getNextMonth = () => {
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    if (nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentDate(nextMonth);
    }
  };

  const handleDateClick = (day) => {
    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    if (selected <= today) {
      setInternalSelectedDate(selected);
      if (onDateSelect) onDateSelect(selected);
    }
  };

  const isSelected = (day) => {
    if (!internalSelectedDate) return false;
    return (
      internalSelectedDate.getDate() === day &&
      internalSelectedDate.getMonth() === currentDate.getMonth() &&
      internalSelectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const isFutureDate = (day) => {
    const checkDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return checkDate > today;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month's trailing days
    const prevMonthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );
    const prevMonthDays = prevMonthDate.getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <button
          key={`prev-${day}`}
          className="h-12 w-12 text-gray-500 rounded-lg flex items-center justify-center text-sm"
          disabled
        >
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isFuture = isFutureDate(day);
      days.push(
        <button
          key={day}
          onClick={() => !isFuture && handleDateClick(day)}
          disabled={isFuture}
          className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            isFuture
              ? "text-gray-500 cursor-not-allowed"
              : isSelected(day)
                ? "bg-red-500 text-white shadow-lg hover:scale-105"
                : isToday(day)
                  ? "bg-gray-600 text-white hover:scale-105"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105"
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);

    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <button
          key={`next-${day}`}
          className="h-12 w-12 text-gray-500 rounded-lg flex items-center justify-center text-sm"
          disabled
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const isNextMonthDisabled = () => {
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    return nextMonth > new Date(today.getFullYear(), today.getMonth(), 1);
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={getPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>

        <h2 className="text-lg font-semibold text-white">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div className="flex gap-1">
          <button
            onClick={getNextMonth}
            disabled={isNextMonthDisabled()}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isNextMonthDisabled()
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-gray-700 cursor-pointer"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ml-1 cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  );
};

export default Calendar;
