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
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
    case 'offline':
      return 'text-error';
    default:
      return 'text-text-muted';
  }
}

export function getMemoryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    learning: 'text-accent',
    behavior: 'text-success',
    preference: 'text-purple',
    identity: 'text-warning',
    user: 'text-accent',
    context: 'text-text-secondary',
    task: 'text-warning',
    reminder: 'text-error',
  };
  return colors[type] || 'text-text-secondary';
}

export function getQuestStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-success';
    case 'pending':
      return 'text-accent';
    case 'cancelled':
      return 'text-error';
    default:
      return 'text-text-muted';
  }
}
