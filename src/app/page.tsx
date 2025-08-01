import Layout from '@/components/Layout';
import { WorkflowProvider } from '@/contexts/WorkflowContext';

export default function Home() {
  return (
    <WorkflowProvider>
      <Layout />
    </WorkflowProvider>
  );
}
