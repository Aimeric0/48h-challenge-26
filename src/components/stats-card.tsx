export function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-3xl font-bold text-[#1F2937]">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}