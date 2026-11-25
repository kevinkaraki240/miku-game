import MockGateway from '@/components/MockGateway';

export const metadata = { title: 'Cổng thanh toán giả lập' };

export default async function MockPayPage({ params }) {
  const { ref } = await params;
  return <MockGateway providerRef={ref} />;
}