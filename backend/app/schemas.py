from pydantic import BaseModel , EmailStr

class UserCreate(BaseModel):
    name : str
    email : EmailStr
    password : str

class UserLogin(BaseModel):
    email : EmailStr
    password : str

class QuestionCreate(BaseModel):
    role : str


class QuestionModel(BaseModel):
    id : int
    role : str
    question_text : str

    class Config:
        from_attributes = True

class AnswerCreate(BaseModel):
    question_id : int
    answer : str
    interview_id : int

class AnswerResponse(BaseModel):
    id : int
    question_id : int
    answer_text : str
    score : int
    feedback : str

    class Config:
        from_attributes = True