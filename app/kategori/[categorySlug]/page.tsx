import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
import CampaignCard from "@/components/CampaignCard";
import Header from "@/components/layout/Header";

async function getCategoryCampaigns(categorySlug: string) {
  const decodedSlug = decodeURIComponent(categorySlug);
  const cacheKey = `api:campaigns:category:${decodedSlug.toLowerCase()}`;
  let campaignsData = await redis.get(cacheKey);
  
  if (!campaignsData) {
    let text = `
      SELECT c.*, 
             cat.name as category_name,
             COALESCE(cs.collected_amount, 0) as collected, 
             COALESCE(cs.donor_count, 0) as donors
      FROM campaigns c
      JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
      WHERE c.status = 'ACTIVE' AND cat.name = $1
      ORDER BY c.sort ASC, c.created_at DESC
    `;
    const rawCampaigns = await query(text, [decodedSlug]);
    
    const processed = rawCampaigns.map(c => {
      let daysLeft = 0;
      if (c.end_date) {
        const diff = new Date(c.end_date).getTime() - new Date().getTime();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
      }
      return {
        ...c,
        daysLeft,
        progress: c.has_no_target ? 0 : Math.min(100, Math.round(((Number(c.collected) || 0) / (Number(c.target_amount) || 1)) * 100))
      };
    });
    const payload = { data: processed };
    await redis.set(cacheKey, JSON.stringify(payload), { ex: 60 });
    campaignsData = payload as any;
  } else if (typeof campaignsData === 'string') {
    campaignsData = JSON.parse(campaignsData) as any;
  }
  // Fetch configs
  const cacheKeyConf = `ngo:configs:global_v3`;
  let configsData: any = await redis.get(cacheKeyConf);
  if (!configsData) {
    const confRes = await query('SELECT * FROM ngo_configs LIMIT 1');
    if (confRes.length > 0) {
      configsData = confRes[0];
      await redis.set(cacheKeyConf, JSON.stringify(configsData), { ex: 3600 });
    } else {
      configsData = {};
    }
  } else if (typeof configsData === 'string') {
    configsData = JSON.parse(configsData);
  }
  
  return { 
    campaigns: (campaignsData as any).data || [], 
    categoryName: decodedSlug,
    configs: configsData 
  };
}

export default async function CategoryPage(props: { params: Promise<{ categorySlug: string }> }) {
  const params = await props.params;
  const { campaigns, categoryName, configs } = await getCategoryCampaigns(params.categorySlug);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/60 to-slate-50 relative pb-24">
      {/* Header */}
      <Header 
        isSearching={true} 
        logoUrl={configs?.logo_url}
        ngoName={configs?.ngo_name}
      />

      {/* Campaign List */}
      <div className="px-5 pt-6 pb-6">
        <div className="mb-5">
          <h2 className="font-bold text-gray-800 text-xl tracking-tight">
            Kategori: {categoryName}
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">{campaigns.length} Program Tersedia</p>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Belum ada kampanye aktif di kategori ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {campaigns.map((camp: any) => (
              <CampaignCard key={camp.id} camp={camp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
