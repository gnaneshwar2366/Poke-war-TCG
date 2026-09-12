import BattleRoom from "@/components/BattleRoom";

export default async function BattleRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <BattleRoom roomId={roomId} />;
}
