import asyncio
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from groq import AsyncGroq

from config import TELEGRAM_BOT_TOKEN, GROQ_API_KEY, GROQ_MODEL
from prompts import POST_TYPES

router = Router()
groq_client = AsyncGroq(api_key=GROQ_API_KEY)


class PostGeneration(StatesGroup):
    waiting_for_topic = State()


def get_post_type_keyboard():
    buttons = [
        [InlineKeyboardButton(text="🛒 Продающий", callback_data="type_selling")],
        [InlineKeyboardButton(text="💬 Вовлекающий", callback_data="type_engaging")],
        [InlineKeyboardButton(text="📖 Сторителлинг", callback_data="type_storytelling")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_after_generation_keyboard():
    buttons = [
        [InlineKeyboardButton(text="🔄 Перегенерировать", callback_data="regenerate")],
        [InlineKeyboardButton(text="✍️ Новый пост", callback_data="new_post")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


@router.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "👋 Привет! Я бот-копирайтер для твоего канала.\n\n"
        "Я умею писать посты трёх типов:\n"
        "🛒 Продающие — с CTA и триггерами\n"
        "💬 Вовлекающие — для дискуссий\n"
        "📖 Сторителлинг — истории от первого лица\n\n"
        "Жми /post чтобы создать пост!"
    )


@router.message(Command("post"))
async def cmd_post(message: Message):
    await message.answer(
        "Выбери тип поста:",
        reply_markup=get_post_type_keyboard()
    )


@router.callback_query(F.data.startswith("type_"))
async def select_post_type(callback: CallbackQuery, state: FSMContext):
    post_type = callback.data.replace("type_", "")
    await state.update_data(post_type=post_type)
    await state.set_state(PostGeneration.waiting_for_topic)
    type_name = POST_TYPES[post_type]["name"]
    await callback.message.answer(f"✅ Тип: {type_name}\n\nТеперь напиши тему поста:")
    await callback.answer()


@router.message(PostGeneration.waiting_for_topic)
async def generate_post(message: Message, state: FSMContext):
    data = await state.get_data()
    post_type = data.get("post_type", "selling")
    topic = message.text

    await state.update_data(topic=topic)

    wait_msg = await message.answer("⏳ Генерирую пост...")

    system_prompt = POST_TYPES[post_type]["prompt"]
    user_prompt = f"Тема поста: {topic}"

    try:
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=2000,
        )
        generated_text = response.choices[0].message.content

        await wait_msg.delete()
        await message.answer(
            generated_text,
            reply_markup=get_after_generation_keyboard()
        )
    except Exception as e:
        await wait_msg.delete()
        await message.answer(f"❌ Ошибка генерации: {e}")

    await state.set_state(None)


@router.callback_query(F.data == "regenerate")
async def regenerate_post(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    post_type = data.get("post_type", "selling")
    topic = data.get("topic")

    if not topic:
        await callback.message.answer("Нет сохранённой темы. Используй /post для нового поста.")
        await callback.answer()
        return

    wait_msg = await callback.message.answer("🔄 Перегенерирую...")

    system_prompt = POST_TYPES[post_type]["prompt"]
    user_prompt = f"Тема поста: {topic}"

    try:
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.9,
            max_tokens=2000,
        )
        generated_text = response.choices[0].message.content

        await wait_msg.delete()
        await callback.message.answer(
            generated_text,
            reply_markup=get_after_generation_keyboard()
        )
    except Exception as e:
        await wait_msg.delete()
        await callback.message.answer(f"❌ Ошибка: {e}")

    await callback.answer()


@router.callback_query(F.data == "new_post")
async def new_post(callback: CallbackQuery):
    await callback.message.answer(
        "Выбери тип поста:",
        reply_markup=get_post_type_keyboard()
    )
    await callback.answer()


async def main():
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)

    print("🤖 Бот запущен!")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
