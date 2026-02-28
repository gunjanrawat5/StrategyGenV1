from app.services.jobs import create_job_record, get_job_record
from app.models import JobCreateRequest, JobResponse
from fastapi import FastAPI, HTTPException

app = FastAPI(title="ggen-backend")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "FastAPI running"}


@app.post("/jobs", response_model=JobResponse)
def create_job(payload: JobCreateRequest) -> JobResponse:
    return create_job_record(payload)


@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str) -> JobResponse:
    job = get_job_record(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
