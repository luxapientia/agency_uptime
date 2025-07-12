import { useDispatch, useSelector } from 'react-redux';
import { useSocketEvent } from '../../contexts/SocketContext';
import { updateSiteStatus } from '../../store/slices/siteStatusSlice';
import type { SiteStatus } from '../../types/site.types';
import type { RootState } from '../../store';

interface SiteStatusUpdate extends SiteStatus {
  siteId: string;
}

export const SocketEventHandler = () => {
  const dispatch = useDispatch();
  const sites = useSelector((state: RootState) => state.sites.sites);

  useSocketEvent<SiteStatusUpdate>('site_status_update', (data) => {
    // Update Redux store
    dispatch(updateSiteStatus(data));

    // Find site name
    const site = sites.find(s => s.id === data.siteId);
    if (!site) return;

    // Show notification based on status change
    const message = data.isUp
      ? `🟢 ${site.url} is now UP`
      : `🔴 ${site.url} is DOWN`;
    
    // Use console.log for now, we'll add proper notifications later
    console.log(message);
  });

  return null; // This component doesn't render anything
}; 