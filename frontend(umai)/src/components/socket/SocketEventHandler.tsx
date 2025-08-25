import { useDispatch, useSelector } from 'react-redux';
import { useSocketEvent } from '../../contexts/SocketContext';
import { updateSiteStatus } from '../../store/slices/siteStatusSlice';
import type { RootState } from '../../store';
import type { SiteStatusUpdate } from '../../types/socket.types';
import type { Notification } from '../../types/notification.types';
import { receiveNotification } from '../../store/slices/notificationSlice';

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
    const message = data.status.isUp
      ? `🟢 ${site.url} is now UP`
      : `🔴 ${site.url} is DOWN`;
    console.log(message);
  });

  useSocketEvent<Notification>('notification', (notification) => {
    dispatch(receiveNotification(notification));
  });

  return null; // This component doesn't render anything
}; 