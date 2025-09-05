// netlify/functions/save-to-notion.js
exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 환경 변수에서 API 키와 데이터베이스 ID 가져오기
    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const DATABASE_ID = process.env.DATABASE_ID;

    if (!NOTION_API_KEY || !DATABASE_ID) {
      throw new Error('API 키 또는 데이터베이스 ID가 설정되지 않았습니다');
    }

    // 클라이언트에서 보낸 데이터 파싱
    const data = JSON.parse(event.body);
    
    // 노션 API 요청 데이터 구성
    const notionData = {
      parent: { database_id: DATABASE_ID },
      properties: {
        '제목': { title: [{ text: { content: `${data.date}의 일기` } }] },
        '날짜': { date: { start: data.date } },
        '날씨': { rich_text: [{ text: { content: data.weather } }] },
        '기분': { rich_text: [{ text: { content: data.mood } }] },
        '답변1': { rich_text: [{ text: { content: data.answers[0] || "" } }] },
        '답변2': { rich_text: [{ text: { content: data.answers[1] || "" } }] },
        '답변3': { rich_text: [{ text: { content: data.answers[2] || "" } }] },
        '답변4': { rich_text: [{ text: { content: data.answers[3] || "" } }] },
        '자유노트': { rich_text: [{ text: { content: data.freeNote } }] }
      }
    };

    // 노션 API 호출
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`노션 API 오류: ${errorData.message}`);
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: '일기가 성공적으로 저장되었습니다!',
        pageId: result.id 
      })
    };

  } catch (error) {
    console.error('저장 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};
