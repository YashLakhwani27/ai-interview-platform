import requests
import os

def generate_ai_feedback(answers):

    content = ""
    for i, a in enumerate(answers):
        content += f"""
        Question {i+1}: {a['question']}
        Answer: {a['answer']}
        Score: {a['score']}
        """

    prompt = f"""
    Analyze interview and return JSON:
    {{
        "strengths": "...",
        "weaknesses": "...",
        "communication": "...",
        "technical": "...",
        "final_feedback": "..."
    }}

    {content}
    """

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-3.5-turbo",  # FREE model
            "messages": [{"role": "user", "content": prompt}]
        }
    )

    result = response.json()

    return result["choices"][0]["message"]["content"]