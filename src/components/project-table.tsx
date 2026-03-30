export function ProjectTable() {
  const projects = [
    { name: "Refonte site web", status: "En cours", progress: 65, date: "15 Avr 2026" },
    { name: "Application mobile", status: "En cours", progress: 40, date: "30 Mai 2026" },
    { name: "Migration base de données", status: "Planifié", progress: 10, date: "20 Juin 2026" },
  ];

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-6 py-3">Nom du projet</th>
            <th className="px-6 py-3">Statut</th>
            <th className="px-6 py-3">Progression</th>
            <th className="px-6 py-3">Échéance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{p.name}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.status}</span>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2 ">
                  <div className="bg-[#8B5CF6] h-2 rounded-full" style={{ width: `${p.progress}%` }}></div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}