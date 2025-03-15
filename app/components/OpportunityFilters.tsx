'use client';

import { useState, useEffect } from 'react';
import { countries, Country } from '../lib/countries';

interface FilterProps {
  onFilterChange: (filters: {
    cause: string;
    location: Country | '';
    status: 'active' | 'inactive' | 'all';
  }) => void;
  causes: string[];
}

export default function OpportunityFilters({
  onFilterChange,
  causes,
}: FilterProps) {
  const [selectedCause, setSelectedCause] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Country | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<
    'active' | 'inactive' | 'all'
  >('all');

  useEffect(() => {
    onFilterChange({
      cause: selectedCause,
      location: selectedLocation,
      status: selectedStatus,
    });
  }, [selectedCause, selectedLocation, selectedStatus, onFilterChange]);

  return (
    <div className='flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm'>
      <h2 className='text-xl font-semibold mb-2'>Filter Opportunities</h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label
            htmlFor='cause'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Cause
          </label>
          <select
            id='cause'
            value={selectedCause}
            onChange={(e) => setSelectedCause(e.target.value)}
            className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
          >
            <option value=''>All Causes</option>
            {causes.map((cause) => (
              <option key={cause} value={cause}>
                {cause}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='location'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Location
          </label>
          <select
            id='location'
            value={selectedLocation}
            onChange={(e) =>
              setSelectedLocation(e.target.value as Country | '')
            }
            className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
          >
            <option value=''>All Locations</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='status'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Status
          </label>
          <select
            id='status'
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as 'active' | 'inactive' | 'all')
            }
            className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
          >
            <option value='all'>All</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
