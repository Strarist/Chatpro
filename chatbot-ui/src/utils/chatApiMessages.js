export const getAssistantParentKey = (msg, index, sourceMessages) => {
  if (msg.role !== "assistant") return null;
  if (msg.parentId) return msg.parentId;

  for (let i = index - 1; i >= 0; i--) {
    if (sourceMessages[i]?.role === "user") {
      return sourceMessages[i].id ?? `__user_slot_${i}`;
    }
  }

  return null;
};

const getLastUserKey = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      return messages[i].id ?? `__user_slot_${i}`;
    }
  }
  return null;
};

const groupAssistantsByParent = (messages) => {
  const assistantsByParent = {};

  messages.forEach((msg, index) => {
    if (msg.role !== "assistant") return;

    const parentKey = getAssistantParentKey(msg, index, messages);
    if (!parentKey) return;

    if (!assistantsByParent[parentKey]) {
      assistantsByParent[parentKey] = [];
    }
    assistantsByParent[parentKey].push(msg);
  });

  return assistantsByParent;
};

const pickActiveAssistant = (siblings, activeVersionMap, parentKey) => {
  if (!siblings.length) return null;

  const activeId = activeVersionMap[parentKey];
  if (activeId) {
    const active = siblings.find((sibling) => sibling.id === activeId);
    if (active) return active;
  }

  return siblings[siblings.length - 1];
};

export const buildChatApiMessages = (messages, activeVersionMap = {}, options = {}) => {
  const { excludeLastAssistantTurn = false } = options;
  const lastUserKey = getLastUserKey(messages);
  const assistantsByParent = groupAssistantsByParent(messages);
  const emittedParents = new Set();
  const apiMessages = [];

  for (let index = 0; index < messages.length; index++) {
    const msg = messages[index];

    if (msg.role === "user") {
      const content = String(msg.content ?? "").trim();
      if (content) {
        apiMessages.push({ role: "user", content });
      }
      continue;
    }

    if (msg.role !== "assistant") continue;

    const parentKey = getAssistantParentKey(msg, index, messages);
    if (!parentKey || emittedParents.has(parentKey)) continue;

    if (excludeLastAssistantTurn && parentKey === lastUserKey) continue;

    const siblings = assistantsByParent[parentKey] || [];
    const chosen = pickActiveAssistant(siblings, activeVersionMap, parentKey);
    if (!chosen || msg.id !== chosen.id) continue;

    emittedParents.add(parentKey);
    const content = String(chosen.content ?? "").trim();
    if (content) {
      apiMessages.push({ role: "assistant", content });
    }
  }

  return apiMessages;
};
