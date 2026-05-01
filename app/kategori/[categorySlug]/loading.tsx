import Header from "@/components/layout/Header";

export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/60 to-slate-50 relative pb-24 animate-pulse">
      <Header isSearching={true} title="Memuat Kategori..." subtitle="Sedang mengambil data" />
      
      <div className="px-5 pt-6 pb-6">
        <div className="h-6 w-48 bg-gray-200 rounded-md mb-6"></div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 h-32">
              <div className="w-24 h-full bg-gray-200 rounded-xl shrink-0"></div>
              <div className="flex-1 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
