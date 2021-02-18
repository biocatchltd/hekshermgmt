from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.responses import JSONResponse

from hekshermgmt._version import __version__
from hekshermgmt.api.v1 import router as v1_router
from hekshermgmt.app import HeksherManagement

middleware = []
if __debug__:
    middleware.append(
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
    )
app = HeksherManagement(
    title="HeksherManagement", version=__version__ or "0.0.1", middleware=middleware
)

app.include_router(v1_router)


@app.on_event("startup")
async def startup():
    await app.startup()


@app.on_event("shutdown")
async def shutdown():
    await app.shutdown()


@app.get("/api/health")
async def health_check():
    """
    Check the health of the connections to the service
    """
    is_healthy = await app.is_healthy()
    if not is_healthy:
        return JSONResponse({"version": __version__}, status_code=500)
    return {"version": __version__}


def main(): # pragma: no cover
    import uvicorn

    uvicorn.run(app, debug=True, host="0.0.0.0", port=8888)


if __name__ == "__main__":  # pragma: no cover
    main()
