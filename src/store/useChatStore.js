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
              id: Date.now(),
              from: 'me',
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
