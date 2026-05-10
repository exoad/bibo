// === Chat List ===
// Sidebar list of chats with search

import { useState } from 'react';
import { ChatCircle, Plus, MagnifyingGlass, Trash, PencilSimple } from '@phosphor-icons/react';
import type { Chat } from '../../types';
import { useChatStore } from '../../stores/chatStore';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export function ChatList({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onNewChat,
  isLoading 
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { deleteChat, updateChat } = useChatStore();

  const filteredChats = searchQuery
    ? chats.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      await deleteChat(id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await updateChat(id, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-bg2">
        <div className="flex items-center gap-2 mb-2">
          <ChatCircle className="w-4 h-4 text-green" weight="fill" />
          <span className="font-semibold text-sm text-fg1">Chats</span>
          <span className="text-xs text-fg4 ml-auto">{chats.length}</span>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 p-2 bg-green text-bg0-hard text-sm font-medium hover:bg-green/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-bg2">
        <div className="relative">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-fg4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-bg0 border border-bg2 pl-8 pr-2 py-1.5 text-sm text-fg1 placeholder:text-fg4 focus:outline-none focus:border-green"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-sm text-fg4">
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </div>
        ) : (
          <div className="divide-y divide-bg2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative p-3 cursor-pointer transition-colors ${
                  activeChatId === chat.id 
                    ? 'bg-bg1 border-l-2 border-l-green' 
                    : 'hover:bg-bg1 border-l-2 border-l-transparent'
                }`}
              >
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleSaveEdit(chat.id)}
                      autoFocus
                      className="flex-1 bg-bg0 border border-bg2 px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-fg1 truncate pr-6">
                          {chat.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-fg4">
                          <span>{chat.messageCount} messages</span>
                          <span>•</span>
                          <span>{formatDate(chat.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions - visible on hover */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => handleStartEdit(e, chat)}
                        className="p-1 text-fg4 hover:text-fg2 hover:bg-bg2"
                        title="Rename"
                      >
                        <PencilSimple className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, chat.id)}
                        className="p-1 text-fg4 hover:text-red hover:bg-bg2"
                        title="Delete"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
