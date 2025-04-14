from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, create_engine, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Transcript(Base):
    __tablename__ = "transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    text = Column(String, nullable=False)
    audio_file_name = Column(String, nullable=True)
    duration = Column(Integer, default=0)  # in seconds
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    api_used = Column(String, nullable=False)  # 'whisper' or 'deepgram'
    model_used = Column(String, nullable=False)
    options = Column(JSON, nullable=False)

# Create the tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()