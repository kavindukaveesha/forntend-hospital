'use client';

import toast from "react-hot-toast";


export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
      },
    });
  },

  info: (message: string) => {
    toast.custom(
      (t: any) => (
        <div
          className={`px-6 py-4 bg-blue-500 text-white rounded shadow-md ${
            t.visible ? 'animate-enter' : 'animate-leave'
          }`}
        >
          <span>{message}</span>
        </div>
      ),
      { duration: 3000, position: 'top-right' }
    );
  },
};