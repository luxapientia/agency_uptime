import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, Error, Info, Warning, Close } from '@mui/icons-material';

interface ToastStyle {
  style: {
    [key: string]: string | number;
  };
  icon?: () => ReactNode;
}

interface ToastStyles {
  base: ToastStyle;
  success: ToastStyle;
  error: ToastStyle;
  warning: ToastStyle;
  info: ToastStyle;
  loading: ToastStyle;
}

// Custom toast styles
const toastStyles: ToastStyles = {
  base: {
    style: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '380px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'custom-enter 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      position: 'relative',
    },
  },
  success: {
    style: {
      backgroundColor: '#E8F5E9',
      color: '#1B5E20',
      border: '1px solid #81C784',
    },
    icon: () => <CheckCircle style={{ color: '#2E7D32', width: 20, height: 20 }} />,
  },
  error: {
    style: {
      backgroundColor: '#FFEBEE',
      color: '#B71C1C',
      border: '1px solid #E57373',
    },
    icon: () => <Error style={{ color: '#C62828', width: 20, height: 20 }} />,
  },
  warning: {
    style: {
      backgroundColor: '#FFF3E0',
      color: '#E65100',
      border: '1px solid #FFB74D',
    },
    icon: () => <Warning style={{ color: '#EF6C00', width: 20, height: 20 }} />,
  },
  info: {
    style: {
      backgroundColor: '#E3F2FD',
      color: '#0D47A1',
      border: '1px solid #64B5F6',
    },
    icon: () => <Info style={{ color: '#1976D2', width: 20, height: 20 }} />,
  },
  loading: {
    style: {
      backgroundColor: '#F3F6F9',
      color: '#1A2027',
      border: '1px solid #B0BEC5',
    },
  },
};

// Close button component
const CloseButton = ({ onClose }: { onClose: () => void }): ReactNode => (
  <button
    onClick={onClose}
    style={{
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.6,
      transition: 'opacity 0.2s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
  >
    <Close style={{ width: 16, height: 16, color: 'inherit' }} />
  </button>
);

// Custom toast options
const defaultOptions = {
  duration: 5000,
  position: 'top-right' as const,
};

// Add custom styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes custom-enter {
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export const showToast = {
  success: (message: string, duration?: number) => {
    console.log('success', message);
    return toast.custom(
      (t) => (
        <div style={{ ...toastStyles.base.style, ...toastStyles.success.style }}>
          {toastStyles.success.icon?.()}
          <span style={{ flex: 1, paddingRight: '24px' }}>{message}</span>
          <CloseButton onClose={() => toast.dismiss(t.id)} />
        </div>
      ),
      {
        ...defaultOptions,
        duration: duration || defaultOptions.duration,
      }
    );
  },

  error: (message: string, duration?: number) => {
    return toast.custom(
      (t) => (
        <div style={{ ...toastStyles.base.style, ...toastStyles.error.style }}>
          {toastStyles.error.icon?.()}
          <span style={{ flex: 1, paddingRight: '24px' }}>{message}</span>
          <CloseButton onClose={() => toast.dismiss(t.id)} />
        </div>
      ),
      {
        ...defaultOptions,
        duration: duration || defaultOptions.duration,
      }
    );
  },

  warning: (message: string, duration?: number) => {
    return toast.custom(
      (t) => (
        <div style={{ ...toastStyles.base.style, ...toastStyles.warning.style }}>
          {toastStyles.warning.icon?.()}
          <span style={{ flex: 1, paddingRight: '24px' }}>{message}</span>
          <CloseButton onClose={() => toast.dismiss(t.id)} />
        </div>
      ),
      {
        ...defaultOptions,
        duration: duration || defaultOptions.duration,
      }
    );
  },

  info: (message: string, duration?: number) => {
    return toast.custom(
      (t) => (
        <div style={{ ...toastStyles.base.style, ...toastStyles.info.style }}>
          {toastStyles.info.icon?.()}
          <span style={{ flex: 1, paddingRight: '24px' }}>{message}</span>
          <CloseButton onClose={() => toast.dismiss(t.id)} />
        </div>
      ),
      {
        ...defaultOptions,
        duration: duration || defaultOptions.duration,
      }
    );
  },

  loading: (message: string, duration?: number) => {
    return toast.custom(
      (t) => (
        <div style={{ ...toastStyles.base.style, ...toastStyles.loading.style }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid #B0BEC5',
              borderTopColor: '#1976D2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ flex: 1, paddingRight: '24px' }}>{message}</span>
          <CloseButton onClose={() => toast.dismiss(t.id)} />
        </div>
      ),
      {
        ...defaultOptions,
        duration: duration || defaultOptions.duration,
      }
    );
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
}; 