from sqlalchemy import Column , Integer, String , DateTime , Boolean
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer , primary_key=True , index=True)
    name = Column(String)
    email = Column(String , unique=True , index=True)
    password = Column(String)
    skills = Column(String , nullable=True)

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer , primary_key=True , index=True)
    role = Column(String)
    question_text = Column(String)
    user_id = Column(Integer)
    ideal_answer = Column(String)

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer , primary_key=True , index=True)
    question_id = Column(Integer)
    answer_text = Column(String)
    feedback = Column(String)
    score = Column(Integer)
    user_id = Column(Integer)
    interview_id = Column(Integer)
    strengths = Column(String)
    improvements = Column(String)

class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(Integer , primary_key=True , index=True)
    user_id = Column(Integer)
    role = Column(String)
    total_questions = Column(Integer)
    current_question = Column(Integer , default=0)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_completed = Column(Boolean , default=False)
