'use client';

import { useToast } from '@/components/Toast';


import { useRouter } from 'next/navigation';
import { deleteParty } from '@/actions/parties';
import { useState } from 'react';

export function DeletePartyButton({ partyId, partyName }: { partyId: string, partyName: string }) {
  const toast = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${partyName}? Their historical records will be preserved, but they will be hidden from all lists.`)) {
      setIsDeleting(true);
      try {
        await deleteParty(partyId);
        router.push('/more/people');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete person');
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
