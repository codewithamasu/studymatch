import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

function cloneMessages(messages = []) {
  return messages.map((message) => ({
    ...message,
    reactions: [...(message.reactions || [])],
  }))
}

export const useChatStore = create(
  devtools((set) => ({
    conversations: [],
    messagesByConversation: {},
    isTypingByConversation: {},
    reactionPickerId: null,
    drafts: {},

    setConversations: (conversations) => set({ conversations }),

    hydrateConversation: (conversationId, messages = []) =>
      set((state) => {
        if (state.messagesByConversation[conversationId]?.length) {
          return state
        }

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: cloneMessages(messages),
          },
        }
      }),

    setTyping: (conversationId, isTyping) =>
      set((state) => ({
        isTypingByConversation: {
          ...state.isTypingByConversation,
          [conversationId]: isTyping,
        },
      })),

    setReactionPickerId: (id) => set({ reactionPickerId: id }),

    setDraft: (conversationId, text) =>
      set((state) => ({
        drafts: {
          ...state.drafts,
          [conversationId]: text,
        },
      })),

    sendMessage: (conversationId, text) =>
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            {
              id: `optimistic-${Date.now()}`,
              from: 'me',
              text,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              read: false,
              fresh: true,
              reactions: [],
              isOptimistic: true,
            },
          ],
        },
        drafts: {
          ...state.drafts,
          [conversationId]: '',
        },
      })),

    receiveMessage: (conversationId, text) =>
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            {
              id: Date.now() + 1,
              from: 'partner',
              text,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              read: false,
              fresh: true,
              reactions: [],
            },
          ],
        },
      })),

    addRealtimeMessage: (conversationId, message, currentUserId) =>
      set((state) => {
        const existing = state.messagesByConversation[conversationId] || []
        // Check if message already exists (by exact db id)
        if (existing.some((m) => m.id === message.id)) {
          return state
        }

        const isMe = message.sender_profile_id === currentUserId
        const normalized = {
          id: message.id,
          from: isMe ? 'me' : 'partner',
          text: message.body,
          time: new Intl.DateTimeFormat('en', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(message.sent_at)),
          read: false,
          fresh: true,
          reactions: message.metadata?.reactions || [],
        }

        // If it was sent by us, check for an existing optimistic message with the same text to replace
        if (isMe) {
          const optIndex = existing.findIndex(m => m.isOptimistic && m.text === message.body)
          if (optIndex !== -1) {
            const newList = [...existing]
            newList[optIndex] = normalized
            return {
              messagesByConversation: {
                ...state.messagesByConversation,
                [conversationId]: newList,
              },
            }
          }
        }

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...existing, normalized],
          },
        }
      }),

    addReaction: (conversationId, messageId, emoji) =>
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (state.messagesByConversation[conversationId] || []).map((message) => {
            if (message.id !== messageId) return message

            const reactions = message.reactions || []
            const hasReaction = reactions.includes(emoji)

            return {
              ...message,
              reactions: hasReaction
                ? reactions.filter((item) => item !== emoji)
                : [...reactions, emoji],
            }
          }),
        },
        reactionPickerId: null,
      })),

    clearChatUi: () =>
      set({
        reactionPickerId: null,
      }),
  }))
)
