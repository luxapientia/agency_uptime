import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      id: message,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      id: message,
    });
  },
  loading: (message: string) => {
    toast.loading(message, {
      id: message,
    });
  },
  dismiss: (message: string) => {
    toast.dismiss(message);
  },
}; 