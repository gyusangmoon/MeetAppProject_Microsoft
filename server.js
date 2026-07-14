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

// [신규] 장소 필터링 및 추천 API 엔드포인트
app.post('/api/recommend', async (req, res) => {
    try {
        const { places, preference, category } = req.body;

       
        const systemPrompt = `당신은 장소 추천 전문가입니다. 
        사용자의 가격대 성향('${preference}')에 맞춰 후보 장소들 중 가장 적합한 곳 3곳을 선정하세요.
        반드시 결과는 JSON 배열 형식으로만 응답하세요: 
        [{"name": "이름", "address": "주소", "reason": "추천 이유", "link": "카카오맵 링크"}]`;
    

        const userPrompt = `카테고리: ${category}, 후보 리스트: ${JSON.stringify(places)}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const result = await client.getChatCompletions(deploymentId, messages);
        const reply = result.choices[0].message.content;
        
        // JSON 부분만 파싱하여 반환 (혹시 모를 마크다운 텍스트 제거)
        const jsonReply = reply.replace(/```json|```/g, '').trim();
        res.json({ recommendations: JSON.parse(jsonReply) });

    } catch (error) {
        console.error("추천 에러:", error);
        res.status(500).json({ error: "AI 추천 처리 중 오류가 발생했습니다." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`로컬 서버 실행 중: http://localhost:${PORT}`));