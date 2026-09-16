import { ProgressiveSatelliteEnhancements } from "./ProgressiveSatelliteEnhancements";
import { SatelliteCampaignWorldMap } from "./SatelliteCampaignWorldMap";

export function CampaignWorldMap({ campaignId }: { campaignId: string }) {
  const rootId = `campaign-world-map-${campaignId}`;
  return (
    <div id={rootId} className="contents compact-world-map-legend enhanced-world-map">
      <style>{`
        .compact-world-map-legend .absolute.bottom-4.left-4 {
          transform: scale(0.78);
          transform-origin: bottom left;
        }

        .enhanced-world-map .absolute.left-4.top-4:has(> .relative.grid.h-16.w-16) {
          width: 92px;
          height: 92px;
          padding: 0;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid rgba(218, 178, 102, 0.86);
          background:
            radial-gradient(circle at 42% 36%, rgba(255, 236, 178, 0.98), rgba(192, 151, 80, 0.94) 48%, rgba(69, 45, 25, 0.98) 73%, rgba(20, 18, 14, 0.98));
          box-shadow:
            0 9px 28px rgba(0, 0, 0, 0.48),
            inset 0 0 0 3px rgba(55, 34, 18, 0.62),
            inset 0 0 18px rgba(255, 221, 143, 0.2);
          backdrop-filter: blur(3px);
        }

        .enhanced-world-map .absolute.left-4.top-4:has(> .relative.grid.h-16.w-16) > .relative.grid.h-16.w-16 {
          opacity: 0;
        }

        .enhanced-world-map .absolute.left-4.top-4:has(> .relative.grid.h-16.w-16)::before {
          content: "";
          position: absolute;
          inset: 6px;
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%2351301d' stroke-width='2.5'/%3E%3Ccircle cx='50' cy='50' r='38' fill='none' stroke='%23b27c37' stroke-width='1.4' stroke-dasharray='2 3'/%3E%3Cg fill='%23512f1d' stroke='%23f2d58b' stroke-width='0.9'%3E%3Cpath d='M50 7 L57 42 L50 50 L43 42 Z'/%3E%3Cpath d='M93 50 L58 57 L50 50 L58 43 Z'/%3E%3Cpath d='M50 93 L43 58 L50 50 L57 58 Z'/%3E%3Cpath d='M7 50 L42 43 L50 50 L42 57 Z'/%3E%3C/g%3E%3Cg fill='%23a26d32' opacity='0.95'%3E%3Cpath d='M20 20 L45 45 L50 50 L39 42 Z'/%3E%3Cpath d='M80 20 L55 45 L50 50 L61 42 Z'/%3E%3Cpath d='M80 80 L55 55 L50 50 L61 58 Z'/%3E%3Cpath d='M20 80 L45 55 L50 50 L39 58 Z'/%3E%3C/g%3E%3Ccircle cx='50' cy='50' r='8' fill='%23261a12' stroke='%23e6c777' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23f6dfa0'/%3E%3Cg font-family='Georgia,serif' font-size='10' font-weight='700' fill='%23331f15' text-anchor='middle'%3E%3Ctext x='50' y='11'%3EN%3C/text%3E%3Ctext x='89' y='54'%3EE%3C/text%3E%3Ctext x='50' y='96'%3ES%3C/text%3E%3Ctext x='11' y='54'%3EW%3C/text%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <SatelliteCampaignWorldMap campaignId={campaignId} />
      <ProgressiveSatelliteEnhancements campaignId={campaignId} rootId={rootId} />
    </div>
  );
}
