from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379/0"
    ollama_url: str = "http://ollama:11434"
    
    # Paths
    data_dir: str = "/app/data"
    results_dir: str = "/app/results"
    terminology_dir: str = "/app/terminology_omop"
    
    # Celery
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
