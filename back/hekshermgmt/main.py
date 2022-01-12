from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware

from hekshermgmt.app import HeksherMgmtBackend
from hekshermgmt.api.v1 import router as v1_router

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

app = HeksherMgmtBackend(title="HeksherManagement", middleware=middleware)
app.include_router(v1_router)


@app.on_event("startup")
async def startup():
    await app.startup()


@app.on_event("shutdown")
async def shutdown():
    await app.shutdown()


def main():  # pragma: no cover
    import uvicorn

    uvicorn.run(app, debug=True, host="0.0.0.0", port=8000)


if __name__ == "__main__":  # pragma: no cover
    main()
