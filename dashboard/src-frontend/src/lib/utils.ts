// === Utility Functions ===

export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function truncate(str: string, len: number): string {
  if (!str || str.length <= len) return str || '';
  return str.substring(0, len) + '...';
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function timeAgo(iso: string | undefined): string {
  if (!iso) return '-';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  } catch {
    return iso;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
    case 'ok':
      return 'text-green-bright';
    case 'warning':
      return 'text-yellow-bright';
    case 'error':
    case 'offline':
      return 'text-red-bright';
    default:
      return 'text-fg4';
  }
}

export function getMemoryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    learning: 'text-yellow-bright',
    behavior: 'text-green-bright',
    preference: 'text-purple-bright',
    identity: 'text-orange-bright',
    user: 'text-yellow-bright',
    context: 'text-fg3',
    task: 'text-orange-bright',
    reminder: 'text-red-bright',
  };
  return colors[type] || 'text-fg3';
}

export function getQuestStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-green-bright';
    case 'pending':
      return 'text-yellow-bright';
    case 'cancelled':
      return 'text-red-bright';
    default:
      return 'text-fg4';
  }
}
