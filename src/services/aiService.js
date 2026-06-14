import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash";

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const aiService = {
  async summarizeConversation(messages) {
    const ai = getClient();
    const formattedMessages = messages
      .map(
        (m) =>
          `${m.senderId?.displayName || m.senderId?.username || "Người dùng cũ"}: ${m.content}`,
      )
      .join("\n");

    const prompt = `Bạn là một trợ lý AI phân tích đoạn hội thoại chat. 
                    Hãy tóm tắt ngắn gọn và súc tích đoạn hội thoại sau. 
                    Chỉ ra các chủ đề chính, quyết định đã đưa ra 
                    hoặc các vấn đề còn tồn đọng.\n\nĐoạn hội thoại:\n${formattedMessages}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text;
  },

  async generateGroupTitle(messages) {
    const ai = getClient();
    const formattedMessages = messages
      .map(
        (m) =>
          `${m.senderId?.displayName || m.senderId?.username || "Người dùng cũ"}: ${m.content}`,
      )
      .join("\n");

    const prompt = `Bạn là một trợ lý AI phân tích đoạn hội thoại chat. 
                    Dựa vào đoạn hội thoại sau, hãy đề xuất 1 tên nhóm chat ngắn gọn (dưới 30 ký tự) 
                    thể hiện đúng chủ đề nhất. Chỉ trả về đúng tên nhóm, 
                    không giải thích thêm.\n\nĐoạn hội thoại:\n${formattedMessages}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text.trim();
  },

  async extractActionItems(messages) {
    const ai = getClient();
    const formattedMessages = messages
      .map(
        (m) =>
          `${m.senderId?.displayName || m.senderId?.username || "Người dùng cũ"}: ${m.content}`,
      )
      .join("\n");

    const prompt = `Bạn là một trợ lý AI phân tích đoạn hội thoại chat. 
                    Hãy trích xuất danh sách các công việc cần làm (action items) từ đoạn hội thoại sau. 
                    Mỗi công việc bắt đầu bằng dấu gạch ngang (-). 
                    Nếu không có công việc nào, hãy trả về "Không có công việc 
                    nào được đề cập."\n\nĐoạn hội thoại:\n${formattedMessages}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text;
  },

  async improveMessage(draft, tone) {
    const ai = getClient();
    let tonePrompt;
    switch (tone) {
      case "professional":
        tonePrompt = "chuyên nghiệp và trang trọng";
        break;
      case "shorter":
        tonePrompt = "ngắn gọn và súc tích hơn";
        break;
      case "friendlier":
        tonePrompt = "thân thiện và cởi mở hơn";
        break;
      case "clearer":
        tonePrompt = "rõ ràng và dễ hiểu hơn";
        break;
      default:
        tonePrompt = "tốt hơn";
    }

    const prompt = `Viết lại tin nhắn sau sao cho ${tonePrompt}. 
                    Chỉ trả về nội dung đã viết lại, 
                    không giải thích gì thêm.\n\nTin nhắn gốc: "${draft}"`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text.trim();
  },

  async translateMessage(draft, targetLanguage) {
    const ai = getClient();
    const prompt = `Dịch tin nhắn sau sang ${targetLanguage}. Chỉ trả về nội dung đã dịch, không giải thích gì thêm.\n\nTin nhắn gốc: "${draft}"`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text.trim();
  },
};
