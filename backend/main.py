from fastapi import FastAPI
from app.api.routes import router
from app.core import model_engine, explainer

app = FastAPI(title="FraudShield AI API", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def startup_event():
    model_engine.load_models()
    if model_engine.model is not None:
        explainer.init_explainer(model_engine.model)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8008, reload=True)