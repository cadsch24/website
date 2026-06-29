import asyncio
import uuid
from sqlalchemy import Column, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TestModel(Base):
    __tablename__ = "test"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column()

async def run():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        uid = uuid.uuid4()
        obj = TestModel(id=uid, name="test")
        session.add(obj)
        await session.commit()
        
        # Test query by UUID object
        result = await session.execute(select(TestModel).where(TestModel.id == uid))
        assert result.scalar_one().name == "test"
        print("Query by UUID object: SUCCESS")
        
        # Test query by string
        try:
            result = await session.execute(select(TestModel).where(TestModel.id == str(uid)))
            print(f"Query by string: {result.scalar_one().name}")
        except Exception as e:
            print(f"Query by string: FAILED ({e})")

if __name__ == "__main__":
    asyncio.run(run())
