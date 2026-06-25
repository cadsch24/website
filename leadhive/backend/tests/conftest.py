import pytest
import asyncio
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from database import Base, get_async_session
from main import app
import os

# Use a separate test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_maker_test = async_sessionmaker(engine_test, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup after all tests
    if os.path.exists("./test.db"):
        os.remove("./test.db")

@pytest_asyncio.fixture
async def db_session():
    async with async_session_maker_test() as session:
        yield session
        await session.rollback()

# Override the dependency
async def override_get_async_session():
    async with async_session_maker_test() as session:
        yield session

app.dependency_overrides[get_async_session] = override_get_async_session
