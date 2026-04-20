from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, get_db
from app import models, auth, schemas
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
import os
import json
import PyPDF2
from ai_feedback import generate_ai_feedback

# 🔥 Load env
load_dotenv()

app = FastAPI()

# 🔥 Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 SAFE STARTUP EVENT (VERY IMPORTANT)
@app.on_event("startup")
def startup():
    try:
        print("🚀 Starting app...")

        db_url = os.getenv("DATABASE_URL")
        api_key = os.getenv("OPENROUTER_API_KEY")

        print("DATABASE_URL:", db_url)
        print("API KEY EXISTS:", bool(api_key))

        if not db_url:
            raise Exception("DATABASE_URL missing")

        models.Base.metadata.create_all(bind=engine)

        print("✅ Startup success")

    except Exception as e:
        print("❌ STARTUP ERROR:", e)
        raise e


@app.get("/")
def home():
    return {"message": "Backend + Database running"}

@app.post("/signup")
def signup(user : schemas.UserCreate , db : Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400 ,detail="Email already registered")
    
    hashed_password = auth.hash_password(user.password)

    new_user = models.User(
        name = user.name,
        email = user.email,
        password = hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


@app.post("/login")
def login(user : schemas.UserLogin , db : Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not auth.verify_password(user.password , db_user.password):
        raise HTTPException(status_code=400 , detail="Invalid credentials")
    
    token = auth.create_access_token({"sub" : db_user.email})

    return {"access_token": token}

@app.post("/start-interview")
def start_interview(data: schemas.QuestionCreate,
                    db: Session = Depends(get_db),
                    current_user = Depends(auth.get_current_user)):

    interview = models.Interview(
        user_id=current_user.id,
        role=data.role,
        total_questions=5,
        current_question=0,
        start_time=datetime.utcnow(),  # ✅ UTC
        end_time=datetime.utcnow() + timedelta(minutes=10),  # ✅ future
        is_completed=False
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "interview_id": interview.interview_id
    }

@app.post("/generate_questions")
def generate_questions(interview_id: int,
                       db: Session = Depends(get_db),
                       current_user = Depends(auth.get_current_user)):

    interview = db.query(models.Interview).filter(
        models.Interview.interview_id == interview_id,
        models.Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.current_question >= interview.total_questions:
        raise HTTPException(status_code=400, detail="Interview completed")

    answers_count = db.query(models.Answer).filter(
        models.Answer.interview_id == interview.interview_id
    ).count()

    if interview.current_question > answers_count:
    # auto-sync instead of error
        interview.current_question = answers_count
    db.commit()

    if datetime.utcnow() >= interview.end_time:
        raise HTTPException(status_code=400, detail="Time is up")
    
    question_end_time = datetime.utcnow() + timedelta(minutes=10)

    
    prompt = f"""
Generate one technical interview question.

Context:
{interview.role}

Rules:
- If context is a job role → ask general role-based question
- If context is a list of skills → ask question based on those skills
- Keep it practical and real-world
- Ask only ONE question
"""

    response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are an expert interviewer."},
                    {"role": "user", "content": prompt}
                ]
            }
        )

    result = response.json()

    question_text = result["choices"][0]["message"]["content"]

    new_question = models.Question(
        role=interview.role,
        question_text=question_text,
        user_id=current_user.id
    )

    db.add(new_question)

    interview.current_question += 1
    db.commit()
    db.refresh(new_question)

    return {
        "question_id": new_question.id,
        "question_text": new_question.question_text,
        "question_number": interview.current_question,
        "total_questions": interview.total_questions,
        "end_time": question_end_time.isoformat() + "Z"  # ✅ FIXED
    }

def calculate_score(answer : str):
    answer = answer.strip().lower()

    if not answer:
        return 0 , "No answer provided"
    
    if len(answer.split()) < 3:
        return 1 , "Answer too short, Try to explain more"
    
    weak_phrases = ["yes"  , "no" , "i don't know" , "not sure" , "maybe"]

    if any(phrase in weak_phrases for phrase in weak_phrases):
        return 0 , "Answer lacks clarity or depth"
    
    if len(answer.split()) < 15:
        return 5, "Decent answer but can be improved with more details"


    if len(answer.split()) < 40:
        return 7, "Good answer with proper explanation"

    # 🔥 Excellent
    return 9, "Excellent detailed answer"


@app.post("/submit-answer")
def submit_answer(data : schemas.AnswerCreate , db : Session = Depends(get_db) , current_user = Depends(auth.get_current_user)):


    interview = db.query(models.Interview).filter(models.Interview.interview_id == data.interview_id,
                                                  models.Interview.user_id == current_user.id).first()
    
    if not interview :
         raise HTTPException(status_code=404 , detail="Interview not found")
    
    if datetime.utcnow() > interview.end_time:
         raise HTTPException(status_code=400 , detail="Time is up")

    #  Get a question
    question = db.query(models.Question).filter(models.Question.id == data.question_id).first()

    if not question:
        raise HTTPException(status_code=404 , detail="Question not found")
    
    answer_text = data.answer.strip()

    if not answer_text:
        score = 0
        feedback = "No answer provided"
        ideal_answer = "You should attempt the question"

    elif len(answer_text.split()) < 3:
        score = 1
        feedback = "Answer too short. Try to explain more"
        ideal_answer = "Provide a detailed explanation with examples"

    else:
        # 🤖 AI Evaluation
        prompt = f"""
        Evaluate this answer:

        Question: {question.question_text}
        Answer: {answer_text}

        Return JSON:
        {{
            "score": number (0-10),
            "feedback": "...",
            "ideal_answer": "..."
        }}
        """

        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "openai/gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}]
                }
            )

            result = response.json()
            ai_output = result["choices"][0]["message"]["content"]

            import json
            parsed = json.loads(ai_output)

            score = parsed.get("score", 5)
            feedback = parsed.get("feedback", "")
            ideal_answer = parsed.get("ideal_answer", "")

        except Exception as e:
            print("AI ERROR:", e)
            score = 5
            feedback = "Could not evaluate properly."
            ideal_answer = "Try to improve your answer."

        score , feedback = calculate_score(data.answer)
    new_answer = models.Answer(
        question_id = data.question_id,
        answer_text = answer_text,
        feedback = feedback,
        score = score,
        user_id = current_user.id,
        interview_id = data.interview_id
    )

    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)

    return {
         "score" : score,
         "feedback" : feedback,
         "ideal_answer": ideal_answer
    }

@app.get("/dashboard")
def get_dashboard(db : Session = Depends(get_db) , current_user = Depends(auth.get_current_user)):
     
     # Total questions
     total_questions = db.query(models.Question).filter(models.Question.user_id == current_user.id).count()

     # Total answers
     total_answers = db.query(models.Answer).filter(models.Answer.user_id == current_user.id).count()

     # Average score

     answers = db.query(models.Answer).filter(models.Answer.user_id == current_user.id).all()

     if answers:
          avg_score = sum(a.score for a in answers) / len(answers)
        
     else:
          avg_score = 0
    
    # Recent answers
    
     recent_answers = db.query(models.Answer)\
    .filter(models.Answer.user_id == current_user.id)\
    .order_by(models.Answer.id.desc())\
    .limit(5)\
    .all()

     recent_answers_data = [
        {
            "id": a.id,
            "answer_text": a.answer_text,
            "score": a.score
        }
        for a in recent_answers
    ]
     return {
          "user_name": current_user.name,
          "total_questions" : total_questions,
          "total_answers" : total_answers,
          "average_score" : avg_score,
           "recent_answers" : recent_answers_data
     }
         
# @app.post("/start-interview")
# def start_interview(
#      role : str ,  db : Session = Depends(get_db),
#      current_user = Depends(auth.get_current_user)
#      ):
#      total_questions = 5
#      duration_minutes = 10

#      interview = models.Interview(
#           user_id = current_user.id,
#           role = role,
#           total_questions = total_questions,
#           start_time = datetime.utcnow(),
#           end_time = datetime.utcnow() + timedelta(minutes=duration_minutes)
#      )

#      db.add(interview)
#      db.commit()
#      db.refresh(interview)

#      return {
#           "interview_id" : interview.interview_id,
#           "message" : "Interview started",
#           "total_questions": total_questions,
#           "end_time" : interview.end_time
#      }

@app.post("/end-interview/{interview_id}")
def end_interview(interview_id : int , db : Session = Depends(get_db) , current_user = Depends(auth.get_current_user)):
     
     interview = db.query(models.Interview).filter(models.Interview.interview_id == interview_id ,
                                                   models.Interview.user_id == current_user.id).first()
     
     if not interview:
          raise HTTPException(status_code=404 , detail="Interview not found")
     
     answers = db.query(models.Answer).filter(models.Answer.interview_id == interview_id,
                                              models.Answer.score != None).all()

     if not answers:
          return {"message" : "No answers submitted",
                  "average_score" : None
                  }
     
     avg_score = sum(a.score for a in answers) / len(answers)

     interview.is_completed = True
     db.commit()

     return {
          "interview_id" : interview_id,
          "total_questions" : interview.total_questions,
          "average_score" : avg_score,
          "status": "completed"
     }
import json

from fastapi import HTTPException
import json

@app.get("/result-interview/{interview_id}")
def get_result(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    try:
        results = db.query(models.Answer, models.Question).join(
            models.Question,
            models.Answer.question_id == models.Question.id
        ).filter(
            models.Answer.interview_id == interview_id,
            models.Answer.user_id == current_user.id
        ).all()

        if not results:
            return {
                "average_score": 0,
                "total_questions": 0,
                "ai_feedback": {},
                "breakdown": []
            }

        # 🔥 Extract data
        answer_data = []
        scores = []

        for answer, question in results:
            answer_data.append({
                "question": question.question_text,
                "answer": answer.answer_text,
                "score": answer.score
            })
            scores.append(answer.score)

        avg = sum(scores) / len(scores)

        # 🤖 SAFE AI CALL
        try:
            ai_feedback_raw = generate_ai_feedback(answer_data)

            try:
                ai_feedback = json.loads(ai_feedback_raw)
            except:
                ai_feedback = {
                    "strengths": "",
                    "weaknesses": "",
                    "communication": "",
                    "technical": "",
                    "final_feedback": ai_feedback_raw
                }

        except Exception as e:
            print("AI ERROR:", e)

            ai_feedback = {
                "strengths": "AI unavailable",
                "weaknesses": "AI unavailable",
                "communication": "AI unavailable",
                "technical": "AI unavailable",
                "final_feedback": "AI service failed, but your results are shown."
            }

        return {
            "average_score": round(avg, 2),
            "total_questions": len(answer_data),
            "ai_feedback": ai_feedback,
            "breakdown": answer_data
        }

    except Exception as e:
        print("SERVER ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/interview-history")
def get_history(db : Session = Depends(get_db),
                current_user = Depends(auth.get_current_user)):
    
    interviews = db.query(models.Interview).filter(models.Interview.user_id == current_user.id).order_by(models.Interview.interview_id.desc()).all()

    history = []

    for interview in interviews:
        answers = db.query(models.Answer).filter(models.Answer.interview_id == interview.interview_id).all()

        if answers:
            avg_score = sum(a.score for a in answers) / len(answers)

        else:
            avg_score = 0
    
        history.append({
            "interview_id": interview.interview_id,
            "role": interview.role,
            "score" : round(avg_score , 1),
            "total_questions": interview.total_questions,
            "date": interview.start_time.strftime("%d %b %Y")
        })
    return history

@app.post("/quit-interview/{interview_id}")
def quit_interview(interview_id : int,
                   db : Session = Depends(get_db),
                   current_user = Depends(auth.get_current_user)):
    
    interview = db.query(models.Interview).filter(models.Interview.interview_id == interview_id,
                                                  models.Interview.user_id == current_user.id).first()
    
    if not interview:
        raise HTTPException(status_code=404 , detail="Interview not found")
    
    answered_count = db.query(models.Answer).filter(models.Answer.interview_id == interview_id).count()

    remaining = interview.total_questions - answered_count

    for i in range(remaining):
        dummy_answer = models.Answer(
            interview_id = interview_id,
            user_id = current_user.id,
            question_id = None,
            answer_text = "Not Answered",
            score = 0
        )
        db.add(dummy_answer)
    interview.is_completed = True

    db.commit()

    return {"message": "Interview quit successfully"}

import requests
import os

def extract_skills_ai(text: str):
    try:
        prompt = f"""
        Extract the top 5-8 technical skills from this resume.

        Resume:
        {text}

        Rules:
        - Only return skills
        - Comma separated
        - No explanation
        - Example: Python, React, SQL
        """

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-3.5-turbo",  # or try mistral / mixtral
                "messages": [
                    {"role": "system", "content": "You are an expert resume analyzer."},
                    {"role": "user", "content": prompt}
                ]
            }
        )

        result = response.json()

        skills = result["choices"][0]["message"]["content"].strip()

        return skills

    except Exception as e:
        print("AI SKILL ERROR:", e)
        return None

def extract_skills_fallback(text: str):
    skills_list = [
        "Python", "Java", "C++", "JavaScript", "React", "Node", "Django",
        "Flask", "Spring", "Angular", "Vue", "SQL", "MongoDB",
        "AWS", "Docker", "Kubernetes", "Git", "Linux"
    ]

    found = []

    for skill in skills_list:
        if skill.lower() in text.lower():
            found.append(skill)

    return ", ".join(found) if found else "General"


from datetime import datetime, timedelta

@app.post("/upload-resume")
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    text = ""

    try:
        pdf_reader = PyPDF2.PdfReader(file.file)
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid pdf")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found")

    # 🔥 Extract skills
    skills = extract_skills_ai(text)

    if not skills:
        skills = extract_skills_fallback(text)

    # 🔥 Save skills
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.skills = skills

    # 🔥 CREATE INTERVIEW AUTOMATICALLY
    interview = models.Interview(
        user_id=current_user.id,
        role=skills,  # 💡 using skills instead of role
        total_questions=5,
        current_question=0,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(minutes=10),
        is_completed=False
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "message": "Resume uploaded & interview started",
        "skills": skills,
        "interview_id": interview.interview_id
    }