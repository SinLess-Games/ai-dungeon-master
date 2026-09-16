import { SatelliteCampaignWorldMap } from "./SatelliteCampaignWorldMap";

export function CampaignWorldMap({ campaignId }: { campaignId: string }) {
  return (
    <div className="contents compact-world-map-legend">
      <style>{`
        .compact-world-map-legend .absolute.bottom-4.left-4 {
          transform: scale(0.78);
          transform-origin: bottom left;
        }
      `}</style>
      <SatelliteCampaignWorldMap campaignId={campaignId} />
    </div>
  );
}
