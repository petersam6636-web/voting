export const LEGACY_ELECTION_START_KEY = "votesphere_election_start_time";

export function getElectionStartStorageKey(projectId: string | number) {
  return `votesphere_election_start_time:${projectId}`;
}

export function getElectionDurationMs(
  durationValue: number | string | null | undefined,
  createdAtValue: string | number | null | undefined
) {
  const duration = Number(durationValue);
  const createdAt =
    typeof createdAtValue === "number"
      ? createdAtValue
      : Date.parse(createdAtValue ?? "");

  if (Number.isFinite(createdAt) && duration > createdAt) {
    return duration - createdAt;
  }

  return duration;
}
