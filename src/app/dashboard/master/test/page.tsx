"use client";
import React from "react";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";

const OPTIONS = [
  {
    _id: "67988f8feb5946e883ca0dfc",
    name: "Test",
    address: "Test, 123",
    pincode: "112021",
  },
  {
    _id: "6799e0dfc71a168f3f058926",
    name: "Test1",
    address: "Abu Dhabi",
    pincode: "1111",
  },
];

// Format options to match MultipleSelector expected structure
const formattedOptions = OPTIONS.map((option) => ({
  label: option.name, // Display name
  value: option._id, // Unique ID as value
}));

const MultipleSelectorControlled = () => {
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([]);

  // Handle selection change
  const handleChange = (selected: Option[]) => {
    setSelectedOptions(selected);

    // Format selection as { location: ["_id1", "_id2"] }
    const formattedSelection = {
      location: selected.map((item) => item.value),
    };

    console.log("Formatted Selection:", formattedSelection);
  };

  return (
    <div className="flex w-full flex-col gap-5 px-10">
      <p className="text-primary">
        Your selection: {JSON.stringify({ location: selectedOptions.map((opt) => opt.value) })}
      </p>
      <MultipleSelector
        value={selectedOptions} 
        onChange={handleChange} 
        defaultOptions={formattedOptions} 
        placeholder="Select locations..."
        emptyIndicator={
          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
            No results found.
          </p>
        }
      />
    </div>
  );
};

export default MultipleSelectorControlled;
