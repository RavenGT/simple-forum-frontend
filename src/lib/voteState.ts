export type VoteValue = "up" | "down";
export type VoteEntity = "post" | "comment";
export type VoteMap = Record<string, VoteValue>;

const key = (userId: string) => `simple-forum:votes:${userId}`;
const entityKey = (entity: VoteEntity, id: string) => `${entity}:${id}`;

function read(userId: string): VoteMap {
  const raw = localStorage.getItem(key(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as VoteMap) : {};
  } catch {
    return {};
  }
}

function write(userId: string, map: VoteMap): void {
  localStorage.setItem(key(userId), JSON.stringify(map));
}

export function getVote(userId: string, entity: VoteEntity, id: string): VoteValue | null {
  return read(userId)[entityKey(entity, id)] ?? null;
}

export function setVote(
  userId: string,
  entity: VoteEntity,
  id: string,
  value: VoteValue,
): void {
  const map = read(userId);
  map[entityKey(entity, id)] = value;
  write(userId, map);
}

export function getAllVotes(userId: string): VoteMap {
  return read(userId);
}

export function clearVotesForUser(userId: string): void {
  localStorage.removeItem(key(userId));
}
