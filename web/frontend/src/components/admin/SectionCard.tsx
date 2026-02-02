export default function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-gray-800">
        {title}
      </h3>
      {children}
    </div>
  );
}
