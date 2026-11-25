import { notFound } from 'next/navigation';
import CheckoutView from '@/components/CheckoutView';

export const metadata = { title: 'Thanh toán' };

export default async function CheckoutPage({ params }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) notFound();
  return <CheckoutView orderId={orderId} />;
}