import OrderConfirmation from '@/components/box-office/OrderConfirmation';
import { Toaster } from 'react-hot-toast';

export default function ConfirmationPage({ params }: { params: { orderId: string } }) {
  return (
    <div>
      <Toaster position="top-right" />
      <OrderConfirmation orderId={params.orderId} />
    </div>
  );
}
