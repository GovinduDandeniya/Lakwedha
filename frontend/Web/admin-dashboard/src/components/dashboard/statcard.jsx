export default function StatCard({
  title,
  value,
  change,
  icon,
  iconBg = "bg-green-100",
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-800 mt-1">
          {value}
        </h3>
        <p className="text-sm text-green-600 mt-1">
          {change}
        </p>
      </div>

      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
    </div>
  );
}
