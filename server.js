import express from 'express';
import cors from 'cors'; 
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); 

// HTML/JS 정적 파일 서빙
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// Azure 환경 변수 로드
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME; // 예: gpt-4o

const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

// 단순 채팅 API 엔드포인트
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const messages = [
            { role: "system", content: "당신은 친절하고 유용한 AI 어시스턴트입니다." },
            { role: "user", content: message }
        ];

        // Azure OpenAI 인스턴스에 호출 수행
        const result = await client.getChatCompletions(deploymentId, messages);
        
        // AI의 답변 추출 후 프론트엔드로 반환
        const reply = result.choices[0].message.content;
        res.json({ reply });

    } catch (error) {
        console.error("서버 에러:", error);
        res.status(500).json({ error: "AI 답변을 가져오는 중 오류가 발생했습니다." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`로컬 서버 실행 중: http://localhost:${PORT}`));
