export default function CampaignSummaryCard({ campaign }: { campaign: any }) {
  return (
    <div className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6">
      {campaign.image_url && <img src={campaign.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
      <div className="ml-3">
        <p className="text-[10px] text-gray-500 font-semibold">{campaign.is_zakat ? "Zakat untuk:" : "Mendonasikan untuk:"}</p>
        <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug">{campaign.title}</p>
      </div>
    </div>
  );
}
