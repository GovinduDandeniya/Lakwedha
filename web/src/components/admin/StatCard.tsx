type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-green-800">
        {value}
      </p>
      <p className="mt-1 text-xs text-green-600">
        {subtitle}
      </p>
    </div>
  );
}
