type Props = {
  title: string;
  value: number;
};

export default function PatientStatCard({ title, value }: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-green-800">
        {value}
      </p>
    </div>
  );
}
