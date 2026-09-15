import { requestJson } from "./campaignCreatorApi";

export function editCampaignPlayMessage(
  campaignId: string,
  messageId: string,
  content: string,
): Promise<{ message: { id: string; content: string } }> {
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/messages/${encodeURIComponent(messageId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ content }),
    },
  );
}

export function deleteCampaignPlayMessage(
  campaignId: string,
  messageId: string,
): Promise<{ ok: true; id: string }> {
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/messages/${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );
}
