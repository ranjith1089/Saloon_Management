import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export default function Placeholder({ title }: Props) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="card text-center py-16">
        <Construction className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Coming Soon</h2>
        <p className="text-sm text-gray-500 mt-2">
          This module is under development in the next phase.
        </p>
      </div>
    </div>
  );
}
